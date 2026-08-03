export const ENROLLMENT_STATUS = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
};

export const ENROLLMENT_STATUS_LABEL = {
  [ENROLLMENT_STATUS.ACTIVE]: "Ativa",
  [ENROLLMENT_STATUS.CANCELLED]: "Cancelada",
};

export const ENROLLMENT_STATUS_OPTIONS = Object.entries(
  ENROLLMENT_STATUS_LABEL
).map(([value, label]) => ({
  value,
  label,
}));