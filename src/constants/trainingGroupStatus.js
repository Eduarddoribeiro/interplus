/*
 * Situação da turma.
 *
 * open     -> aparece no formulário público e aceita experimental.
 * closed   -> só os alunos atuais; não aparece no formulário.
 * inactive -> turma encerrada.
 */
export const TRAINING_GROUP_STATUS = Object.freeze({
  OPEN: "open",
  CLOSED: "closed",
  INACTIVE: "inactive",
});

export const TRAINING_GROUP_STATUS_OPTIONS = [
  {
    value: TRAINING_GROUP_STATUS.OPEN,
    label: "Aberta",
    description: "Aparece no formulário e aceita aula experimental.",
    badge: "bg-green-100 text-green-700",
  },
  {
    value: TRAINING_GROUP_STATUS.CLOSED,
    label: "Fechada",
    description: "Só alunos atuais. Não aparece no formulário.",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    value: TRAINING_GROUP_STATUS.INACTIVE,
    label: "Inativa",
    description: "Turma encerrada.",
    badge: "bg-neutral-200 text-neutral-600",
  },
];

export const TRAINING_GROUP_STATUS_BY_VALUE = Object.fromEntries(
  TRAINING_GROUP_STATUS_OPTIONS.map((option) => [option.value, option]),
);
