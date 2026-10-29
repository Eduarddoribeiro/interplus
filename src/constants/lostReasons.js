/*
 * Motivos de encerramento (contato que não virou aluno).
 * Uma lista só para todas as telas que encerram oportunidades.
 */
export const LOST_REASON = {
  PRICE: "price",
  SCHEDULE: "schedule",
  DISTANCE: "distance",
  AGE_CATEGORY: "age_category",
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
  [LOST_REASON.AGE_CATEGORY]: "Idade ou categoria",
  [LOST_REASON.OTHER_SCHOOL]: "Escolheu outra escola",
  [LOST_REASON.CHILD_NOT_INTERESTED]: "Criança não quis continuar",
  [LOST_REASON.NO_RESPONSE]: "Família não respondeu",
  [LOST_REASON.NO_VACANCY]: "Sem vaga disponível",
  [LOST_REASON.OTHER]: "Outro",
};

export const LOST_REASON_OPTIONS = Object.entries(LOST_REASON_LABEL).map(
  ([value, label]) => ({ value, label }),
);

// Códigos antigos que ainda existem no banco, gravados por telas
// que usavam listas próprias. Só para exibir; não aparecem nas opções.
const LEGACY_LOST_REASON_LABEL = {
  financial: "Valor",
  location: "Distância",
  no_interest: "Criança não quis continuar",
  chose_competitor: "Escolheu outra escola",
};

export function getLostReasonLabel(value) {
  if (!value) return null;

  return LOST_REASON_LABEL[value] ?? LEGACY_LOST_REASON_LABEL[value] ?? "Outro";
}
