import { nowISO } from "./contactHelpers";

/* =========================================================
 * LIMPEZA DE CAMPOS
 * =======================================================*/

export function clearFollowUpFields() {
  return {
    follow_up_date: null,
  };
}

export function clearWaitingListFields() {
  return {
    waiting_list_reason: null,
    waiting_list_notes: null,
    waiting_list_at: null,
  };
}

export function clearLostFields() {
  return {
    lost_reason: null,
  };
}

export function clearEnrollmentFields() {
  return {
    enrolled_at: null,
    enrollment_status: null,
    left_at: null,
    left_reason: null,
  };
}

export function clearExperimentalResult() {
  return {
    experimental_result: null,
  };
}

/* =========================================================
 * METADADOS
 * =======================================================*/

export function withUpdatedAt(data = {}) {
  return {
    ...data,
    updated_at: nowISO(),
  };
}