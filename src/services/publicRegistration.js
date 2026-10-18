import { supabase } from "../lib/supabase";

/**
 * Serviço dedicado ao fluxo público de agendamento de aula
 * experimental.
 *
 *   Unidade (cidade) -> Local (ginásio/arena) -> Turma -> Horário
 *
 * O site público não lê as tabelas de contatos nem de sessões:
 * tudo passa pelas funções public_trial_options e public_register.
 */

/**
 * Opções de aula experimental para uma categoria: um item por
 * horário de turma ABERTA, já com local, endereço, próxima data e
 * vagas restantes (null = sem limite).
 *
 * Turmas em destaque vêm primeiro.
 */
export async function getTrialOptions(categoryId, unitId = null) {
  if (!categoryId) return [];

  const { data, error } = await supabase.rpc("public_trial_options", {
    p_category_id: categoryId,
    p_unit_id: unitId,
  });

  if (error) throw error;

  return data ?? [];
}

/**
 * Locais com turma (aberta ou fechada) da categoria, para a
 * preferência na lista de interesse.
 */
export async function getCategoryLocations(categoryId) {
  if (!categoryId) return [];

  const { data, error } = await supabase.rpc("public_category_locations", {
    p_category_id: categoryId,
  });

  if (error) throw error;

  return data ?? [];
}

/**
 * Agrupa as opções por turma, mantendo a ordem devolvida pelo
 * banco (destaque primeiro).
 */
export function groupTrialOptions(options) {
  const groups = new Map();

  options.forEach((option) => {
    if (!groups.has(option.training_group_id)) {
      groups.set(option.training_group_id, {
        id: option.training_group_id,
        name: option.group_name,
        featured: option.featured,
        modality: { id: option.modality_id, name: option.modality_name },
        location: {
          id: option.location_id,
          name: option.location_name,
          address: option.location_address,
        },
        unit: { id: option.unit_id, name: option.unit_name },
        schedules: [],
      });
    }

    groups.get(option.training_group_id).schedules.push(option);
  });

  return [...groups.values()];
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
