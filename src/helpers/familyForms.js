/*
 * Fichas da família: em que pé está o link de cada aluno ativo.
 * Vale só o link mais recente; os anteriores foram substituídos.
 */

// Situação de um link
export function inviteStatus(invite, now = new Date()) {
  if (!invite) return "none";
  if (invite.used_at) return "used";
  if (invite.revoked_at) return "replaced";
  if (new Date(invite.expires_at) < now) return "expired";
  return "open";
}

export function latestInvite(invites) {
  return [...(invites ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
}

// Grupo da ficha: conferir, vencido, aguardando, conferida (ou null)
export function familyFormGroup(invite, now = new Date()) {
  const status = inviteStatus(invite, now);

  if (status === "used") return invite.reviewed_at ? "conferida" : "conferir";
  if (status === "expired") return "vencido";
  if (status === "open") return "aguardando";
  return null;
}

/*
 * Alunos ativos com link enviado, separados por grupo.
 * Quem saiu da escola fica de fora: não há o que fazer.
 */
export function familyFormGroups(students, now = new Date()) {
  const groups = { conferir: [], vencido: [], aguardando: [], conferida: [] };

  students
    .filter((student) => student.status === "active")
    .forEach((student) => {
      const invite = latestInvite(student.enrollment_invites);
      const group = familyFormGroup(invite, now);
      if (group) groups[group].push({ student, invite });
    });

  return groups;
}
