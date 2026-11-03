import { supabase } from "../lib/supabase";

/**
 * Eventos que o Sogni não controla: Taça Gaúcha (com as rodadas
 * como eventos filhos), passeios e copas, e a situação de cada
 * aluno em cada um (pago, pendente, isento...).
 */

const PARTICIPANT_SELECT = `
  event_id, student_id, status, notes,
  students(id, name, birth_date, status, shirt_number,
    enrollments(season, categories(id, name)))
`;

export async function getEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*, event_participants(status, students(status))")
    .order("season", { ascending: false })
    .order("position")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

/**
 * Evento com as rodadas (filhos) e a situação de cada aluno em
 * todos eles, para a tabela aluno x rodada.
 */
export async function getEvent(id) {
  const [{ data: event, error }, { data: children, error: childrenError }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).single(),
    supabase.from("events").select("*").eq("parent_id", id).order("position").order("event_date"),
  ]);

  if (error) throw error;
  if (childrenError) throw childrenError;

  const ids = [id, ...(children ?? []).map((child) => child.id)];

  const { data: participants, error: participantsError } = await supabase
    .from("event_participants")
    .select(PARTICIPANT_SELECT)
    .in("event_id", ids);

  if (participantsError) throw participantsError;

  return { event, rounds: children ?? [], participants: participants ?? [] };
}

export async function getStudentEvents(studentId) {
  const { data, error } = await supabase
    .from("event_participants")
    .select("event_id, status, events(id, name, season, parent_id, event_date, position)")
    .eq("student_id", studentId);

  if (error) throw error;

  return data ?? [];
}

export async function createEvent(values) {
  const { data, error } = await supabase.from("events").insert(values).select("*").single();

  if (error) throw error;

  return data;
}

export async function updateEvent(id, values) {
  const { error } = await supabase.from("events").update(values).eq("id", id);

  if (error) throw error;
}

export async function deleteEvent(id) {
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) throw error;
}

/**
 * Grava a situação do aluno no evento (cria a participação se
 * ainda não existir). status null = tira o aluno do evento.
 */
export async function setParticipantStatus(eventId, studentId, status) {
  if (!status) {
    const { error } = await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("student_id", studentId);

    if (error) throw error;
    return;
  }

  const { data, error } = await supabase
    .from("event_participants")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("student_id", studentId)
    .select("event_id");

  if (error) throw error;
  if (data?.length) return;

  const { error: insertError } = await supabase
    .from("event_participants")
    .insert({ event_id: eventId, student_id: studentId, status });

  if (insertError) throw insertError;
}

export async function addParticipants(eventId, studentIds, status = "confirmed") {
  if (!studentIds.length) return;

  const { error } = await supabase
    .from("event_participants")
    .insert(studentIds.map((studentId) => ({ event_id: eventId, student_id: studentId, status })));

  if (error) throw error;
}

/**
 * Acha o evento pelo nome e temporada ou cria (importação).
 */
export async function findOrCreateEvent({ name, season, parent_id = null, position = 0 }) {
  let query = supabase.from("events").select("*").eq("name", name).eq("season", season);
  query = parent_id ? query.eq("parent_id", parent_id) : query.is("parent_id", null);

  const { data, error } = await query.limit(1);

  if (error) throw error;
  if (data?.[0]) return data[0];

  return createEvent({ name, season, parent_id, position });
}
