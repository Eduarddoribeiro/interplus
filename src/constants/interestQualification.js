// src/constants/interestQualification.js

/* =========================================================
 * QUALIFICAÇÃO DO INTERESSE
 * =======================================================*/

export const INTEREST_QUALIFICATION = {
  COMPLETE: "complete",
  INCOMPLETE: "incomplete",
  NEEDS_CONFIRMATION: "needs_confirmation",
};

/* =========================================================
 * LABELS
 * =======================================================*/

export const INTEREST_QUALIFICATION_LABELS = {
  [INTEREST_QUALIFICATION.COMPLETE]:
    "Cadastro qualificado",

  [INTEREST_QUALIFICATION.INCOMPLETE]:
    "Cadastro incompleto",

  [INTEREST_QUALIFICATION.NEEDS_CONFIRMATION]:
    "Precisa confirmar",
};

/* =========================================================
 * OPÇÕES
 * =======================================================*/

export const INTEREST_QUALIFICATION_OPTIONS =
  Object.entries(
    INTEREST_QUALIFICATION_LABELS,
  ).map(([value, label]) => ({
    value,
    label,
  }));