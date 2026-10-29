/*
 * Motivos para arquivar um contato.
 *
 * Arquivado sai das listas, relatórios e da taxa de conversão,
 * mas continua no banco e pode ser restaurado. "Já é aluno" NÃO
 * vira matrícula, para não inflar a conversão.
 */
export const ARCHIVE_REASON = Object.freeze({
  CURRENT_STUDENT: "current_student",
  NOT_LEAD: "not_lead",
  DUPLICATE: "duplicate",
  OTHER: "other",
});

export const ARCHIVE_REASON_LABEL = {
  [ARCHIVE_REASON.CURRENT_STUDENT]: "Já é aluno",
  [ARCHIVE_REASON.NOT_LEAD]: "Não é interessado",
  [ARCHIVE_REASON.DUPLICATE]: "Duplicado",
  [ARCHIVE_REASON.OTHER]: "Outro",
};
