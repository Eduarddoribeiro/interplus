import {
  PREFERRED_SHIFT,
} from "../constants/preferredShift";

import {
  WAITING_LIST_REASON,
} from "../constants/waitingListReasons";

import {
  getWaitingListQualification,
} from "./waitingListRules";

export const WAITING_LIST_GROUPS = {
  READY: {
    key: "ready",
    title: "Prontos para contato",
    description:
      "Famílias com cadastro completo e aptas para abordagem.",
    order: 1,
  },

  MORNING: {
    key: "morning",
    title: "Nova turma da manhã",
    description:
      "Famílias interessadas em uma nova turma no turno da manhã.",
    order: 2,
  },

  VACANCY: {
    key: "vacancy",
    title: "Aguardando vaga",
    description:
      "Interesse confirmado, aguardando disponibilidade.",
    order: 3,
  },

  INCOMPLETE: {
    key: "incomplete",
    title: "Cadastro incompleto",
    description:
      "Ainda faltam informações importantes.",
    order: 4,
  },

  FUTURE: {
    key: "future",
    title: "Leads futuros",
    description:
      "Ainda não possuem idade para ingresso.",
    order: 5,
  },
};

export function getWaitingListPriority(item) {
  const qualification = getWaitingListQualification(item);

  /*
   * Lead aguardando idade/categoria.
   */
  if (
    item.waiting_list_reason ===
    WAITING_LIST_REASON.AGE_CATEGORY
  ) {
    return WAITING_LIST_GROUPS.FUTURE;
  }

  /*
   * Cadastro ainda não está pronto.
   */
  if (!qualification.isComplete) {
    return WAITING_LIST_GROUPS.INCOMPLETE;
  }

  /*
   * Interesse confirmado no turno da manhã.
   */
  if (
    item.preferred_shift === PREFERRED_SHIFT.MORNING
  ) {
  return WAITING_LIST_GROUPS.MORNING;
}

  /*
   * Família aguardando vaga na turma.
   */
  if (
    item.waiting_list_reason ===
    WAITING_LIST_REASON.NO_VACANCY
  ) {
    return WAITING_LIST_GROUPS.VACANCY;
  }

  /*
   * Demais contatos qualificados.
   */
  return WAITING_LIST_GROUPS.READY;
}
