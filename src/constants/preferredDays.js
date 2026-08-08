// src/constants/preferredDays.js

/* =========================================================
 * DIAS PREFERIDOS
 * =======================================================*/

export const PREFERRED_DAY = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
};

/* =========================================================
 * LABELS
 * =======================================================*/

export const PREFERRED_DAY_LABELS = {
  [PREFERRED_DAY.MONDAY]: "Segunda-feira",
  [PREFERRED_DAY.TUESDAY]: "Terça-feira",
  [PREFERRED_DAY.WEDNESDAY]: "Quarta-feira",
  [PREFERRED_DAY.THURSDAY]: "Quinta-feira",
  [PREFERRED_DAY.FRIDAY]: "Sexta-feira",
  [PREFERRED_DAY.SATURDAY]: "Sábado",
  [PREFERRED_DAY.SUNDAY]: "Domingo",
};

/* =========================================================
 * LABELS CURTAS
 * =======================================================*/

export const PREFERRED_DAY_SHORT_LABELS = {
  [PREFERRED_DAY.MONDAY]: "Seg",
  [PREFERRED_DAY.TUESDAY]: "Ter",
  [PREFERRED_DAY.WEDNESDAY]: "Qua",
  [PREFERRED_DAY.THURSDAY]: "Qui",
  [PREFERRED_DAY.FRIDAY]: "Sex",
  [PREFERRED_DAY.SATURDAY]: "Sáb",
  [PREFERRED_DAY.SUNDAY]: "Dom",
};

/* =========================================================
 * OPÇÕES
 * =======================================================*/

export const PREFERRED_DAY_OPTIONS = Object.entries(
  PREFERRED_DAY_LABELS,
).map(([value, label]) => ({
  value,
  label,
})); 