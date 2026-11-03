import { supabase } from "../lib/supabase";

/**
 * Formulário de matrícula por link individual.
 *
 * O link leva um código aleatório; o banco guarda só o hash dele.
 * Por isso o link aparece uma vez, ao ser criado: para mandar de
 * novo, cria-se outro (o anterior deixa de valer).
 */

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(text) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const enrollmentFormUrl = (token) => `${window.location.origin}/matricula/${token}`;

// Cria o link de um aluno e invalida os anteriores que não foram usados
export async function createEnrollmentInvite(studentId) {
  const { error: revokeError } = await supabase
    .from("enrollment_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .is("used_at", null)
    .is("revoked_at", null);

  if (revokeError) throw revokeError;

  const token = randomToken();
  const { data, error } = await supabase
    .from("enrollment_invites")
    .insert({ student_id: studentId, token_hash: await sha256Hex(token) })
    .select("id, created_at, expires_at")
    .single();

  if (error) throw error;

  return { ...data, url: enrollmentFormUrl(token) };
}

// Público: o que o formulário mostra ao abrir
export async function getEnrollmentForm(token) {
  const { data, error } = await supabase.rpc("public_enrollment_form", { p_token: token });

  if (error) throw error;

  return data;
}

// Público: envia o formulário preenchido
export async function submitEnrollmentForm(token, payload) {
  const { error } = await supabase.rpc("public_enrollment_submit", { p_token: token, p: payload });

  if (error) {
    // Mensagens da função (link vencido, já enviado) vêm em português
    if (error.code === "P0001" && error.message) throw new Error(error.message);
    throw error;
  }
}

// Situação do último link de um aluno
export function inviteStatus(invite, now = new Date()) {
  if (!invite) return "none";
  if (invite.used_at) return "used";
  if (invite.revoked_at) return "replaced";
  if (new Date(invite.expires_at) < now) return "expired";
  return "open";
}
