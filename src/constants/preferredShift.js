// src/constants/preferredShift.js

/* =========================================================
 * TURNOS DE INTERESSE
 * =======================================================*/

export const PREFERRED_SHIFT = {
  MORNING: "morning",
  AFTERNOON: "afternoon",
  EVENING: "evening",
  ANY: "any",
};

/* =========================================================
 * LABELS
 * =======================================================*/

export const PREFERRED_SHIFT_LABELS = {
  [PREFERRED_SHIFT.MORNING]: "Manhã",
  [PREFERRED_SHIFT.AFTERNOON]: "Tarde",
  [PREFERRED_SHIFT.EVENING]: "Noite",
  [PREFERRED_SHIFT.ANY]: "Indiferente",
};

/* =========================================================
 * OPÇÕES
 * =======================================================*/

export const PREFERRED_SHIFT_OPTIONS = Object.entries(
  PREFERRED_SHIFT_LABELS,
).map(([value, label]) => ({
  value,
  label,
}));