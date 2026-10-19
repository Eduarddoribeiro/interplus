// src/helpers/experimentalRules.js

import { EXPERIMENTAL_STATUS } from "../constants/experimentalStatus";

const DECIDED = ["enrolled", "follow_up", "lost", "waiting_list"];

/*
 * A criança veio na experimental, mas a família ainda não tem
 * decisão registrada (matrícula, retorno, perda ou lista).
 * Mesma regra do card de Experimentais ("Registrar resultado").
 */
export function isAwaitingResult(session) {
  const contact = session.contact || {};

  return (
    session.status === EXPERIMENTAL_STATUS.ATTENDED &&
    !contact.archived_at &&
    !DECIDED.includes(contact.experimental_result) &&
    !DECIDED.includes(contact.status)
  );
}
