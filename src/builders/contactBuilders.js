// src/builders/contactBuilders.js

import { CONTACT_STATUS } from "../constants/contactStatus";
import { ENROLLMENT_STATUS } from "../constants/enrollmentStatus";

import {
  nowISO,
  cleanOptionalText,
  appendInternalNote,
} from "../helpers/contactHelpers";

import { withUpdatedAt } from "../helpers/contactUpdates";

/* =========================================================
 * FOLLOW UP
 * =======================================================*/

export function buildFollowUpUpdate(
  current,
  {
    followUpDate,
    notes = "",
    firstTime = false,
  }
) {
  const updates = {
    status: CONTACT_STATUS.FOLLOW_UP,

    follow_up_date: followUpDate,

    lost_reason: null,

    waiting_list_reason: null,
    waiting_list_notes: null,
    waiting_list_at: null,

    ...withUpdatedAt(),
  };

  if (firstTime) {
    updates.follow_up_started_at = nowISO();
    updates.follow_up_attempts = 0;
    updates.last_follow_up_at = null;
  } else {
    updates.follow_up_attempts =
      (current.follow_up_attempts || 0) + 1;

    updates.last_follow_up_at = nowISO();
  }

  if (notes.trim()) {
    updates.internal_notes = appendInternalNote(
      current.internal_notes,
      notes
    );
  }

  return updates;
}

/* =========================================================
 * MATRÍCULA
 * =======================================================*/

export function buildEnrollmentUpdate(
  current,
  {
    enrolledAt,
    notes = "",
  }
) {
  const updates = {
    status: CONTACT_STATUS.ENROLLED,

    experimental_result: CONTACT_STATUS.ENROLLED,

    enrolled_at: enrolledAt,

    enrollment_status: ENROLLMENT_STATUS.ACTIVE,

    left_at: null,
    left_reason: null,

    follow_up_date: null,

    follow_up_started_at: null,
    follow_up_attempts: 0,
    last_follow_up_at: null,

    lost_reason: null,

    waiting_list_reason: null,
    waiting_list_notes: null,
    waiting_list_at: null,

    ...withUpdatedAt(),
  };

  if (notes.trim()) {
    updates.internal_notes = appendInternalNote(
      current.internal_notes,
      notes
    );
  }

  return updates;
}

/* =========================================================
 * LISTA DE INTERESSE
 * =======================================================*/

export function buildWaitingListUpdate(
  current,
  {
    reason,
    notes = "",
  }
) {
  const updates = {
    status: CONTACT_STATUS.WAITING_LIST,

    waiting_list_reason: reason,
    waiting_list_notes: cleanOptionalText(notes),
    waiting_list_at: nowISO(),

    follow_up_date: null,

    follow_up_started_at: null,
    follow_up_attempts: 0,
    last_follow_up_at: null,

    lost_reason: null,

    ...withUpdatedAt(),
  };

  if (notes.trim()) {
    updates.internal_notes = appendInternalNote(
      current.internal_notes,
      `Lista de interesse: ${notes}`
    );
  }

  return updates;
}

/* =========================================================
 * OPORTUNIDADE PERDIDA
 * =======================================================*/

export function buildLostUpdate(
  current,
  {
    lostReason,
    notes = "",
    attended = false,
  }
) {
  const updates = {
    status: CONTACT_STATUS.LOST,

    lost_reason: lostReason,

    follow_up_date: null,

    follow_up_started_at: null,
    follow_up_attempts: 0,
    last_follow_up_at: null,

    waiting_list_reason: null,
    waiting_list_notes: null,
    waiting_list_at: null,

    ...withUpdatedAt(),
  };

  if (attended) {
    updates.experimental_result = CONTACT_STATUS.LOST;
  }

  if (notes.trim()) {
    updates.internal_notes = appendInternalNote(
      current.internal_notes,
      `Oportunidade encerrada: ${notes}`
    );
  }

  return updates;
}

/* =========================================================
 * CANCELAMENTO
 * =======================================================*/

export function buildCancellationUpdate(
  current,
  {
    reason,
    leftAt,
    notes = "",
  }
) {
  return {
    enrollment_status: ENROLLMENT_STATUS.CANCELLED,

    left_at: leftAt,

    left_reason: cleanOptionalText(reason),

    internal_notes: appendInternalNote(
      current.internal_notes,
      notes
        ? `Matrícula encerrada. Motivo: ${reason}. ${notes}`
        : `Matrícula encerrada. Motivo: ${reason}.`
    ),

    ...withUpdatedAt(),
  };
}

/* =========================================================
 * REATIVAÇÃO
 * =======================================================*/

export function buildReactivationUpdate(
  current,
  notes = ""
) {
  return {
    enrollment_status: ENROLLMENT_STATUS.ACTIVE,

    left_at: null,
    left_reason: null,

    internal_notes: appendInternalNote(
      current.internal_notes,
      notes
        ? `Matrícula reativada. ${notes}`
        : "Matrícula reativada."
    ),

    ...withUpdatedAt(),
  };
}