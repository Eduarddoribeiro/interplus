// src/constants/followUpActions.js

/* =========================================================
 * AÇÕES DO FOLLOW UP
 * =======================================================*/

export const FOLLOW_UP_ACTION = {
  ENROLL: "enroll",
  RESCHEDULE: "reschedule",
  LOSE: "lose",
  SCHEDULE_EXPERIMENTAL: "schedule_experimental",
  CLOSE_WAITING_LIST: "close_waiting_list",

  QUALIFY: "qualify",
};
/* =========================================================
 * GRUPOS DE AÇÕES
 * =======================================================*/

/**
 * Ações que encerram uma oportunidade comercial.
 */
export const FOLLOW_UP_CLOSING_ACTIONS = [
  FOLLOW_UP_ACTION.LOSE,
  FOLLOW_UP_ACTION.CLOSE_WAITING_LIST,
];




/**
 * Verifica se a ação exige um motivo de encerramento.
 */
export function isFollowUpClosingAction(action) {
  return FOLLOW_UP_CLOSING_ACTIONS.includes(action);
}