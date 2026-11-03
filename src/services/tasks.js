import { supabase } from "../lib/supabase";

/**
 * Tarefas da equipe (staff_tasks). O banco carimba done_at e
 * updated_at e cria a próxima tarefa repetida (gatilho
 * staff_tasks_before_update); aqui só se lê e grava.
 */

const SELECT = "id, title, notes, area, status, due_date, assigned_to, repeat, next_created, done_at, created_at";

const clean = (values) => ({
  title: values.title.trim(),
  notes: values.notes?.trim() || null,
  area: values.area || null,
  due_date: values.due_date || null,
  assigned_to: values.assigned_to || null,
  repeat: values.repeat || "none",
});

// Todas as tarefas: são poucas (dezenas por mês). O quadro esconde as
// feitas há mais de DONE_VISIBLE_DAYS dias (helpers/taskBoard.js)
export async function getTasks() {
  const { data, error } = await supabase.from("staff_tasks").select(SELECT).order("created_at");
  if (error) throw error;

  return data ?? [];
}

export async function createTask(values) {
  const { data, error } = await supabase.from("staff_tasks").insert(clean(values)).select(SELECT).single();
  if (error) throw error;

  return data;
}

export async function updateTask(id, values) {
  const { data, error } = await supabase.from("staff_tasks").update(clean(values)).eq("id", id).select(SELECT).single();
  if (error) throw error;

  return data;
}

export async function moveTask(id, status) {
  const { data, error } = await supabase.from("staff_tasks").update({ status }).eq("id", id).select(SELECT).single();
  if (error) throw error;

  return data;
}

export async function deleteTask(id) {
  const { error } = await supabase.from("staff_tasks").delete().eq("id", id);
  if (error) throw error;
}

// Pessoas da equipe para escolher o responsável: [{ user_id, name }]
export async function getStaffMembers() {
  const { data, error } = await supabase.rpc("staff_members");
  if (error) throw error;

  return data ?? [];
}
