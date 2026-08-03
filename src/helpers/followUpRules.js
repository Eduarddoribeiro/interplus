import {
  FOLLOW_UP_RULES,
  FOLLOW_UP_LIMIT_REASON,
} from "../constants/followUpRules";

/* =========================================================
 * HELPERS INTERNOS
 * =======================================================*/

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfDay(date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

/* =========================================================
 * TENTATIVAS
 * =======================================================*/

export function getFollowUpAttempts(contact) {
  const attempts = Number(
    contact?.follow_up_attempts ?? 0,
  );

  if (
    !Number.isFinite(attempts) ||
    attempts < 0
  ) {
    return 0;
  }

  return attempts;
}

export function getRemainingFollowUpAttempts(
  contact,
) {
  const attempts =
    getFollowUpAttempts(contact);

  return Math.max(
    FOLLOW_UP_RULES.MAX_ATTEMPTS - attempts,
    0,
  );
}

export function hasReachedFollowUpAttemptLimit(
  contact,
) {
  return (
    getFollowUpAttempts(contact) >=
    FOLLOW_UP_RULES.MAX_ATTEMPTS
  );
}

/* =========================================================
 * TEMPO DO CICLO
 * =======================================================*/

export function getFollowUpDays(
  contact,
  referenceDate = new Date(),
) {
  const startedAt = parseDate(
    contact?.follow_up_started_at,
  );

  const reference =
    parseDate(referenceDate);

  if (!startedAt || !reference) {
    return 0;
  }

  const start =
    startOfDay(startedAt);

  const end =
    startOfDay(reference);

  if (end < start) {
    return 0;
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return Math.floor(
    (end.getTime() - start.getTime()) /
      millisecondsPerDay,
  );
}

export function getRemainingFollowUpDays(
  contact,
  referenceDate = new Date(),
) {
  const elapsedDays =
    getFollowUpDays(
      contact,
      referenceDate,
    );

  return Math.max(
    FOLLOW_UP_RULES.MAX_CYCLE_DAYS -
      elapsedDays,
    0,
  );
}

export function hasReachedFollowUpTimeLimit(
  contact,
  referenceDate = new Date(),
) {
  /*
   * Se ainda não existe início do ciclo,
   * não podemos considerar o prazo expirado.
   */
  if (!contact?.follow_up_started_at) {
    return false;
  }

  return (
    getFollowUpDays(
      contact,
      referenceDate,
    ) >= FOLLOW_UP_RULES.MAX_CYCLE_DAYS
  );
}

/* =========================================================
 * LIMITE DO ACOMPANHAMENTO
 * =======================================================*/

export function getFollowUpLimitReason(
  contact,
  referenceDate = new Date(),
) {
  if (
    hasReachedFollowUpAttemptLimit(contact)
  ) {
    return FOLLOW_UP_LIMIT_REASON.MAX_ATTEMPTS;
  }

  if (
    hasReachedFollowUpTimeLimit(
      contact,
      referenceDate,
    )
  ) {
    return FOLLOW_UP_LIMIT_REASON.MAX_CYCLE_DAYS;
  }

  return null;
}

export function hasReachedFollowUpLimit(
  contact,
  referenceDate = new Date(),
) {
  return Boolean(
    getFollowUpLimitReason(
      contact,
      referenceDate,
    ),
  );
}

/* =========================================================
 * PERMISSÕES
 * =======================================================*/

export function canRescheduleFollowUp(
  contact,
  referenceDate = new Date(),
) {
  return !hasReachedFollowUpLimit(
    contact,
    referenceDate,
  );
}

/* =========================================================
 * ESTADO DO ACOMPANHAMENTO
 * =======================================================*/

export function getFollowUpState(
  contact,
  referenceDate = new Date(),
) {
  const attempts =
    getFollowUpAttempts(contact);

  const remainingAttempts =
    getRemainingFollowUpAttempts(contact);

  const elapsedDays =
    getFollowUpDays(
      contact,
      referenceDate,
    );

  const remainingDays =
    getRemainingFollowUpDays(
      contact,
      referenceDate,
    );

  const limitReason =
    getFollowUpLimitReason(
      contact,
      referenceDate,
    );

  return {
    attempts,
    maxAttempts:
      FOLLOW_UP_RULES.MAX_ATTEMPTS,

    remainingAttempts,

    elapsedDays,
    maxCycleDays:
      FOLLOW_UP_RULES.MAX_CYCLE_DAYS,

    remainingDays,

    limitReached:
      Boolean(limitReason),

    limitReason,

    canReschedule:
      !limitReason,
  };
}