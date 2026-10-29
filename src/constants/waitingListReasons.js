export const WAITING_LIST_REASONS = [
  {
    value: "no_vacancy",
    label: "Turma sem vaga",
    cardLabel: "Vaga na turma",
  },
  {
    value: "future_class",
    label: "Aguardando abertura de turma",
    cardLabel: "Abertura de turma",
  },
  {
    value: "schedule",
    label: "Aguardando outro horário",
    cardLabel: "Outro horário",
  },
  {
    value: "age_category",
    label: "Aguardando idade/categoria",
    cardLabel: "Idade/categoria",
  },
  {
    value: "location",
    label: "Aguardando questão de localização",
    cardLabel: "Localização",
  },
  {
    value: "financial",
    label: "Aguardando organização financeira",
    cardLabel: "Organização financeira",
  },
  {
    value: "family_decision",
    label: "Aguardando decisão da família",
    cardLabel: "Decisão da família",
  },
  {
    value: "future_interest",
    label: "Interesse futuro",
    cardLabel: "Interesse futuro",
  },
  {
    value: "other",
    label: "Outro",
    cardLabel: "Outro",
  },
];

export const WAITING_LIST_REASON = Object.freeze(
  Object.fromEntries(
    WAITING_LIST_REASONS.map(({ value }) => [
      value.toUpperCase(),
      value,
    ]),
  ),
);

export const WAITING_REASON_LABELS = {
  waiting_age: "Aguardando idade/categoria",
  waiting_schedule: "Aguardando outro horário",
  ...Object.fromEntries(
    WAITING_LIST_REASONS.map((item) => [item.value, item.label])
  ),
};

// Valores antigos gravados por cadastros anteriores
const LEGACY_REASON_LABELS = {
  waiting_age: "Idade/categoria",
  waiting_schedule: "Outro horário",
};

export const WAITING_REASON_CARD_LABELS = {
  ...LEGACY_REASON_LABELS,
  ...Object.fromEntries(
    WAITING_LIST_REASONS.map((item) => [item.value, item.cardLabel])
  ),
};
