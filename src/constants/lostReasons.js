export const LOST_REASON = {
  PRICE: "price",
  SCHEDULE: "schedule",
  DISTANCE: "distance",
  OTHER_SCHOOL: "other_school",
  CHILD_NOT_INTERESTED: "child_not_interested",
  NO_RESPONSE: "no_response",
  NO_VACANCY: "no_vacancy",
  OTHER: "other",
};

export const LOST_REASON_LABEL = {
  [LOST_REASON.PRICE]: "Valor",
  [LOST_REASON.SCHEDULE]: "Horário",
  [LOST_REASON.DISTANCE]: "Distância",
  [LOST_REASON.OTHER_SCHOOL]: "Escolheu outra escola",
  [LOST_REASON.CHILD_NOT_INTERESTED]:
    "Criança não quis continuar",
  [LOST_REASON.NO_RESPONSE]:
    "Família não respondeu",
  [LOST_REASON.NO_VACANCY]:
    "Sem vaga disponível",
  [LOST_REASON.OTHER]: "Outro",
};

export const LOST_REASON_OPTIONS = Object.entries(
  LOST_REASON_LABEL
).map(([value, label]) => ({
  value,
  label,
}));