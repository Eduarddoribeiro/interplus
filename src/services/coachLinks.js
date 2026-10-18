import { supabase } from "../lib/supabase";

/**
 * Link da aula para os professores (sem login).
 *
 * Um link por dia + local, válido até o fim do dia seguinte. O
 * professor só vê primeiro nome, idade, categoria e a observação
 * para o professor, e só consegue marcar presença/falta e deixar
 * a avaliação (interna) — tudo pelas funções coach_session_list e
 * coach_mark_attendance.
 */

/**
 * Painel: devolve o link do dia/local, criando se ainda não existir.
 * locationId nulo = todos os locais.
 */
export async function getOrCreateCoachLink(sessionDate, locationId = null) {
  let query = supabase
    .from("coach_links")
    .select("token")
    .eq("session_date", sessionDate);

  query = locationId ? query.eq("location_id", locationId) : query.is("location_id", null);

  const { data: existing, error: findError } = await query.maybeSingle();

  if (findError) throw findError;

  if (existing) return existing.token;

  const { data, error } = await supabase
    .from("coach_links")
    .insert({ session_date: sessionDate, location_id: locationId })
    .select("token")
    .single();

  if (error) throw error;

  return data.token;
}

export function buildCoachLinkUrl(token) {
  return `${window.location.origin}/aula/${token}`;
}

/**
 * Página pública: experimentais do link.
 */
export async function getCoachSessionList(token) {
  const { data, error } = await supabase.rpc("coach_session_list", {
    p_token: token,
  });

  if (error) throw error;

  return data ?? [];
}

/**
 * Página pública: marca presença (true), falta (false) ou só salva
 * a avaliação (attended = null).
 */
export async function markCoachAttendance(token, sessionId, attended, feedback = null) {
  const { data, error } = await supabase.rpc("coach_mark_attendance", {
    p_token: token,
    p_session_id: sessionId,
    p_attended: attended,
    p_feedback: feedback,
  });

  if (error) throw error;

  return data?.status;
}
