import { supabase } from "../lib/supabase";

import { toLocalISO } from "../helpers/dashboardSummary";
import { STUDENT_TASK_LABEL } from "../constants/studentTasks";

/**
 * Alunos matriculados e o pós-matrícula: responsáveis, matrícula
 * por temporada, pendências e saúde.
 *
 * Aluno, responsáveis e matrícula nascem juntos pela função
 * create_student_enrollment (uma transação). A saúde é lida só
 * quando a coordenação abre o bloco na ficha.
 */

const LIST_SELECT = `
  id, name, birth_date, phone, status, left_at, contact_id, created_at,
  student_guardians(position, guardians(id, name, phone)),
  enrollments(id, season, start_date, category_id, categories(id, name),
    enrollment_tasks(id, kind, status, due_date))
`;

const DETAIL_SELECT = `
  *,
  student_guardians(position, relationship, guardians(*)),
  enrollments(*, categories(id, name), training_groups(id, name),
    enrollment_tasks(id, kind, status, due_date, done_at))
`;

const stamp = () => new Date().toISOString();

// Matrícula mais recente (temporada maior)
export function currentEnrollment(student) {
  return [...(student?.enrollments ?? [])].sort((a, b) => b.season - a.season)[0] ?? null;
}

// Responsáveis na ordem (principal primeiro)
export function guardiansOf(student) {
  return [...(student?.student_guardians ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((link) => ({ ...link.guardians, position: link.position, relationship: link.relationship }))
    .filter((guardian) => guardian.id);
}

export async function getStudents() {
  const { data, error } = await supabase.from("students").select(LIST_SELECT).order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getStudent(id) {
  const { data, error } = await supabase.from("students").select(DETAIL_SELECT).eq("id", id).single();

  if (error) throw error;

  return data;
}

export async function getStudentByContact(contactId) {
  const { data, error } = await supabase
    .from("students")
    .select("id, name")
    .eq("contact_id", contactId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Cria aluno + responsáveis + matrícula + pendências (+ saúde e
 * eventos, na importação). Ver create_student_enrollment.
 */
export async function createStudentEnrollment(payload) {
  const { data, error } = await supabase.rpc("create_student_enrollment", { p: payload });

  if (error) throw error;

  return data;
}

/**
 * Ficha de aluno a partir de um contato matriculado. Não faz nada
 * se o contato já tiver ficha.
 */
export async function ensureStudentForContact(contact) {
  const existing = await getStudentByContact(contact.id);
  if (existing) return existing.id;

  const startDate = contact.enrolled_at ? toLocalISO(new Date(contact.enrolled_at)) : toLocalISO();

  return createStudentEnrollment({
    contact_id: contact.id,
    student: {
      name: contact.child_name,
      birth_date: contact.birth_date,
    },
    guardians: contact.responsible_name
      ? [{ name: contact.responsible_name, phone: contact.phone, email: contact.email }]
      : [],
    enrollment: {
      start_date: startDate,
      category_id: contact.category_id ?? contact.interest_category_id ?? null,
      training_group_id: contact.training_group_id ?? null,
    },
  });
}

export async function updateStudent(id, values) {
  const { error } = await supabase
    .from("students")
    .update({ ...values, updated_at: stamp() })
    .eq("id", id);

  if (error) throw error;
}

export async function updateGuardian(id, values) {
  const { error } = await supabase
    .from("guardians")
    .update({ ...values, updated_at: stamp() })
    .eq("id", id);

  if (error) throw error;
}

export async function addGuardian(studentId, values, position, relationship = null) {
  const { data, error } = await supabase.from("guardians").insert(values).select("id").single();

  if (error) throw error;

  const { error: linkError } = await supabase
    .from("student_guardians")
    .insert({ student_id: studentId, guardian_id: data.id, position, relationship });

  if (linkError) throw linkError;
}

export async function updateGuardianRelationship(studentId, guardianId, relationship) {
  const { error } = await supabase
    .from("student_guardians")
    .update({ relationship })
    .eq("student_id", studentId)
    .eq("guardian_id", guardianId);

  if (error) throw error;
}

export async function updateEnrollment(id, values) {
  const { error } = await supabase
    .from("enrollments")
    .update({ ...values, updated_at: stamp() })
    .eq("id", id);

  if (error) throw error;
}

export async function setTaskStatus(taskId, status) {
  const { error } = await supabase
    .from("enrollment_tasks")
    .update({ status, done_at: status === "done" ? stamp() : null, updated_at: stamp() })
    .eq("id", taskId);

  if (error) throw error;
}

/* =========================================================
 * SAÚDE (só ao abrir o bloco)
 * =======================================================*/

export async function getStudentHealth(studentId) {
  const { data, error } = await supabase
    .from("student_health")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function saveStudentHealth(studentId, values) {
  const { data, error } = await supabase
    .from("student_health")
    .update({ ...values, updated_at: stamp() })
    .eq("student_id", studentId)
    .select("student_id");

  if (error) throw error;
  if (data?.length) return;

  const { error: insertError } = await supabase
    .from("student_health")
    .insert({ ...values, student_id: studentId });

  if (insertError) throw insertError;
}

/* =========================================================
 * PENDÊNCIAS (Visão geral e menu)
 * =======================================================*/

/**
 * Pendências da matrícula atual de cada aluno ativo.
 * today: "AAAA-MM-DD".
 */
export function studentTaskSummary(student, today = toLocalISO()) {
  const enrollment = currentEnrollment(student);
  const open = (enrollment?.enrollment_tasks ?? []).filter(
    (task) => task.status === "pending" && STUDENT_TASK_LABEL[task.kind],
  );
  const overdue = open.filter((task) => task.due_date && task.due_date < today);

  return { open, overdue };
}

/**
 * Quantos alunos ativos têm pendência atrasada. Antes da tabela
 * existir (SQL ainda não aplicado) devolve 0, para não quebrar a
 * Visão geral.
 */
export async function getStudentPendingCounts() {
  const { data, error } = await supabase
    .from("students")
    .select("id, status, enrollments(season, enrollment_tasks(kind, status, due_date))")
    .eq("status", "active");

  if (error) {
    console.error("Pendências de alunos indisponíveis:", error);
    return { overdue: 0 };
  }

  const today = toLocalISO();

  return {
    overdue: (data ?? []).filter((student) => studentTaskSummary(student, today).overdue.length > 0).length,
  };
}
