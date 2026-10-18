import { supabase } from "../../lib/supabase";

import { EXPERIMENTAL_STATUS } from "../../constants/experimentalStatus";

/**
 * Horários disponíveis para marcar experimental pelo painel.
 *
 * Diferente do formulário público, a equipe vê também as turmas
 * FECHADAS (pode abrir exceção combinada com o professor), mas
 * nunca as inativas.
 *
 * Retorna as turmas da categoria, cada uma com seus horários e as
 * próximas datas de cada horário, já com as vagas restantes.
 */

const OCCUPYING_STATUSES = [
  EXPERIMENTAL_STATUS.PENDING_CONFIRMATION,
  EXPERIMENTAL_STATUS.CONFIRMED,
];

function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Próximas `count` datas (a partir de hoje) para o dia da semana (1 = segunda)
function nextDates(weekday, count) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isoToday = today.getDay() || 7;
  const first = new Date(today);
  first.setDate(today.getDate() + ((weekday - isoToday + 7) % 7));

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index * 7);
    return toISO(date);
  });
}

/**
 * Turmas ABERTAS com a próxima data e vagas, por categoria
 * (mesma regra do formulário público). Usado na lista de
 * interesse para saber quem já pode ser chamado.
 *
 * Retorna { [categoryId]: opções de public_trial_options }.
 */
export async function getOpenTrialOptionsByCategory(categoryIds) {
  const ids = [...new Set(categoryIds.filter(Boolean))];

  const results = await Promise.all(
    ids.map(async (categoryId) => {
      const { data, error } = await supabase.rpc("public_trial_options", {
        p_category_id: categoryId,
        p_unit_id: null,
      });

      if (error) throw error;

      return [categoryId, data ?? []];
    }),
  );

  return Object.fromEntries(results);
}

export async function getTrialSlots(categoryId, { weeks = 4 } = {}) {
  if (!categoryId) return [];

  const { data: links, error: linksError } = await supabase
    .from("training_group_categories")
    .select("training_group_id")
    .eq("category_id", categoryId);

  if (linksError) throw linksError;

  const groupIds = (links ?? []).map((link) => link.training_group_id);

  if (!groupIds.length) return [];

  const { data: schedules, error: schedulesError } = await supabase
    .from("training_group_schedules")
    .select(`
      id,
      weekday,
      start_time,
      end_time,
      experimental_limit,
      training_group:training_groups (
        id,
        name,
        status,
        featured,
        location:locations ( id, name, address ),
        modality:modalities ( id, name )
      )
    `)
    .in("training_group_id", groupIds)
    .eq("active", true)
    .order("weekday")
    .order("start_time");

  if (schedulesError) throw schedulesError;

  const usable = (schedules ?? []).filter(
    (schedule) => schedule.training_group && schedule.training_group.status !== "inactive",
  );

  if (!usable.length) return [];

  const withDates = usable.map((schedule) => ({
    ...schedule,
    dates: nextDates(schedule.weekday, weeks),
  }));

  const allDates = withDates.flatMap((schedule) => schedule.dates).sort();

  const { data: sessions, error: sessionsError } = await supabase
    .from("experimental_sessions")
    .select("training_group_schedule_id, experimental_date")
    .in("training_group_schedule_id", withDates.map((schedule) => schedule.id))
    .gte("experimental_date", allDates[0])
    .lte("experimental_date", allDates.at(-1))
    .in("status", OCCUPYING_STATUSES);

  if (sessionsError) throw sessionsError;

  const occupied = new Map();

  (sessions ?? []).forEach((session) => {
    const key = `${session.training_group_schedule_id}|${session.experimental_date}`;
    occupied.set(key, (occupied.get(key) ?? 0) + 1);
  });

  // Agrupa por turma: abertas primeiro, depois por local
  const groups = new Map();

  withDates.forEach((schedule) => {
    const group = schedule.training_group;

    if (!groups.has(group.id)) {
      groups.set(group.id, { ...group, schedules: [] });
    }

    const limit = schedule.experimental_limit ?? 0;

    groups.get(group.id).schedules.push({
      id: schedule.id,
      weekday: schedule.weekday,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      experimental_limit: limit,
      dates: schedule.dates.map((date) => {
        const taken = occupied.get(`${schedule.id}|${date}`) ?? 0;

        return {
          date,
          taken,
          // null = sem limite
          spotsLeft: limit > 0 ? Math.max(limit - taken, 0) : null,
        };
      }),
    });
  });

  return [...groups.values()].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return (a.location?.name ?? "").localeCompare(b.location?.name ?? "");
  });
}
