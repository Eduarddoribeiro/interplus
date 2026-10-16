import { supabase } from "../lib/supabase";
import { getNextOccurrence } from "../utils/generateAvailableDates";

/**
 * Serviço dedicado ao fluxo público de agendamento de aula
 * experimental.
 *
 * Segue a nova arquitetura de Turmas:
 *
 *   Modalidade -> Categoria -> Unidade -> Turma (training_groups) -> Horário (training_group_schedules)
 *
 * Não consulta mais categories.weekday / start_time / end_time /
 * experimental_limit / trial_status.
 *
 * A disponibilidade de vagas NÃO depende mais de
 * training_group_schedules.current_experimentals — é calculada em
 * tempo real contando experimental_sessions para
 * (training_group_schedule_id + experimental_date).
 */

/**
 * Busca as turmas (training_groups) ativas para uma combinação de
 * modalidade + categoria, já trazendo a unidade e o professor.
 *
 * Usado para montar as etapas de Unidade e Turma do formulário
 * público.
 */
export async function getTrainingGroupsForPublic(modalityId, categoryId) {
  if (!modalityId || !categoryId) return [];

  const { data, error } = await supabase
    .from("training_groups")
    .select(
      `
      id,
      name,
      active,
      unit:units (
        id,
        name
      ),
      coach:coaches (
        id,
        name
      )
    `,
    )
    .eq("modality_id", modalityId)
    .eq("category_id", categoryId)
    .eq("active", true)
    .order("name");

  if (error) throw error;

  return data ?? [];
}

/**
 * Busca os horários com vaga disponível para aula experimental de
 * uma turma específica.
 *
 * Para cada horário ativo (active + allow_trial), calcula a
 * próxima ocorrência (next_date) e verifica a ocupação real em
 * experimental_sessions para essa data, comparando com
 * experimental_limit.
 *
 * Horários sem vaga na próxima data não são retornados.
 */
export async function getAvailableSchedules(trainingGroupId) {
  if (!trainingGroupId) return [];

  const { data: scheduleRows, error } = await supabase
    .from("training_group_schedules")
    .select("*")
    .eq("training_group_id", trainingGroupId)
    .eq("active", true)
    .eq("allow_trial", true)
    .order("weekday")
    .order("start_time");

  if (error) throw error;

  const schedules = scheduleRows ?? [];

  const withAvailability = await Promise.all(
    schedules.map(async (scheduleRow) => {
      const next = getNextOccurrence(scheduleRow.weekday);

      if (!next) return null;

      // O site público não lê experimental_sessions: a função
      // devolve só a quantidade de vagas ocupadas.
      const { data: count, error: countError } = await supabase.rpc(
        "public_trial_occupancy",
        {
          p_schedule_id: scheduleRow.id,
          p_date: next.iso,
        },
      );

      if (countError) throw countError;

      const limit = scheduleRow.experimental_limit ?? 0;
      const occupied = count ?? 0;

      if (limit > 0 && occupied >= limit) return null;

      return {
        ...scheduleRow,
        next_date: next.iso,
      };
    }),
  );

  return withAvailability.filter(Boolean);
}

/**
 * Envia o cadastro público (aula experimental ou lista de
 * interesse) para a função public_register, que valida os dados,
 * confere a vaga e grava contato + experimental numa única
 * transação.
 *
 * Retorna "scheduled" ou "waiting_list".
 */
export async function submitPublicRegistration(payload) {
  const { data, error } = await supabase.rpc("public_register", {
    p: payload,
  });

  if (error) throw error;

  return data?.type;
}