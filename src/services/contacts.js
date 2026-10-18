import { supabase } from "../lib/supabase";

import { CONTACT_STATUS } from "../constants/contactStatus";
import { LOST_REASON } from "../constants/lostReasons";
import { ENROLLMENT_STATUS } from "../constants/enrollmentStatus";
import { EXPERIMENTAL_STATUS } from "../constants/experimentalStatus";

import {
  appendInternalNote,
  cleanOptionalText,
  ensureUpdated,
  nowISO,
} from "../helpers/contactHelpers";

import {
  withUpdatedAt,
  clearFollowUpFields,
  clearWaitingListFields,
  clearLostFields,
} from "../helpers/contactUpdates";

import {
  buildEnrollmentUpdate,
  buildCancellationUpdate,
  buildReactivationUpdate,
  buildFollowUpUpdate,
  buildWaitingListUpdate,
  buildLostUpdate,
} from "../builders/contactBuilders";

import { getFollowUpState } from "../helpers/followUpRules";
/* =========================================================
 * SELECTS
 * =======================================================*/

/*
 * Categoria relacionada diretamente ao contato.
 */
const CONTACT_CATEGORY_SELECT = `
  category:categories!contacts_category_id_fkey (
    id,
    name,
    weekday,
    start_time,
    end_time,
    trial_status,
    experimental_limit
  )
`;

/*
 * Categoria de interesse comercial do contato.
 */
const INTEREST_CATEGORY_SELECT = `
  interest_category:categories!contacts_interest_category_id_fkey (
    id,
    name,
    weekday,
    start_time,
    end_time,
    trial_status,
    experimental_limit
  )
`;

/*
 * Categoria relacionada diretamente à sessão experimental.
 *
 * Aqui não usamos contacts_category_id_fkey porque a tabela
 * raiz da consulta é experimental_sessions.
 */
const SESSION_CATEGORY_SELECT = `
  category:categories (
    id,
    name,
    weekday,
    start_time,
    end_time,
    trial_status,
    experimental_limit
  )
`;

/*
 * Local do contato (preferência na lista de interesse ou local
 * da experimental marcada).
 */
const CONTACT_LOCATION_SELECT = `
  location:locations (
    id,
    name,
    address
  )
`;

/*
 * Horário da experimental: turma, local e modalidade.
 */
const SESSION_SCHEDULE_SELECT = `
  schedule:training_group_schedules (
    id,
    weekday,
    start_time,
    end_time,
    training_group:training_groups (
      id,
      name,
      location:locations ( id, name, address ),
      modality:modalities ( id, name )
    )
  )
`;

/* =========================================================
 * CONTATO + CATEGORIAS
 * =======================================================*/

const CONTACT_WITH_CATEGORY = `
  *,
  ${CONTACT_CATEGORY_SELECT},
  ${INTEREST_CATEGORY_SELECT},
  ${CONTACT_LOCATION_SELECT}
`;

/* =========================================================
 * SESSÃO + CATEGORIA
 * =======================================================*/

const SESSION_WITH_CATEGORY = `
  *,
  ${SESSION_CATEGORY_SELECT},
  ${SESSION_SCHEDULE_SELECT}
`;

/* =========================================================
 * SESSÃO + CATEGORIA + CONTATO
 * =======================================================*/

const SESSION_WITH_CONTACT = `
  *,
  ${SESSION_CATEGORY_SELECT},
  ${SESSION_SCHEDULE_SELECT},
  contact:contacts (
    id,
    child_name,
    birth_date,
    responsible_name,
    phone,
    email,
    source,
    neighborhood,
    trained_elsewhere,
    previous_club,
    observations,
    internal_notes,
    status,
    category_id,
    interest_category_id,
    location_id,
    preferred_shift,
    preferred_days,
    qualification_status,
    follow_up_date,
    follow_up_started_at,
    follow_up_attempts,
    last_follow_up_at,
    enrolled_at,
    enrollment_status,
    left_at,
    left_reason,
    experimental_date,
    experimental_time,
    experimental_result,
    lost_reason,
    waiting_list_reason,
    waiting_list_notes,
    waiting_list_at,
    entry_channel,
    first_contact_at,
    created_at,
    updated_at
  )
`;

/* =========================================================
 * CONSTANTES
 * =======================================================*/

const EXPERIMENTAL_STATUSES = [
  EXPERIMENTAL_STATUS.PENDING_CONFIRMATION,
  EXPERIMENTAL_STATUS.CONFIRMED,
  EXPERIMENTAL_STATUS.ATTENDED,
  EXPERIMENTAL_STATUS.NO_SHOW,
  EXPERIMENTAL_STATUS.CANCELLED,
];

const PROTECTED_COMMERCIAL_STATUSES = [
  CONTACT_STATUS.ENROLLED,
  CONTACT_STATUS.FOLLOW_UP,
  CONTACT_STATUS.WAITING_LIST,
  CONTACT_STATUS.LOST,
];
/* =========================================================
 * VAGAS PARA EXPERIMENTAL
 * =======================================================*/

async function ensureExperimentalAvailability(trainingGroupScheduleId, experimentalDate) {
  if (!trainingGroupScheduleId || !experimentalDate) {
    return null;
  }

  const { data: schedule, error: scheduleError } = await supabase
    .from("training_group_schedules")
    .select(
      `
      id,
      training_group_id,
      weekday,
      start_time,
      experimental_limit,
      training_group:training_groups (
        id,
        location_id,
        unit_id,
        modality_id
      )
    `,
    )
    .eq("id", trainingGroupScheduleId)
    .single();

  if (scheduleError) {
    throw scheduleError;
  }

  // weekday: 1 = segunda ... 7 = domingo
  const isoWeekday = new Date(`${experimentalDate}T12:00:00`).getDay() || 7;

  if (isoWeekday !== schedule.weekday) {
    throw new Error("A data escolhida não corresponde ao dia da semana do horário.");
  }

  const { count, error: countError } = await supabase
    .from("experimental_sessions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("training_group_schedule_id", trainingGroupScheduleId)
    .eq("experimental_date", experimentalDate)
    .in("status", [
      EXPERIMENTAL_STATUS.PENDING_CONFIRMATION,
      EXPERIMENTAL_STATUS.CONFIRMED,
    ]);

  if (countError) {
    throw countError;
  }

  const limit = schedule.experimental_limit ?? 0;

  if (limit > 0 && count >= limit) {
    throw new Error(
      "Este horário não possui mais vagas para aula experimental nesta data.",
    );
  }

  return schedule;
}

/*
 * Turma, local, unidade e modalidade do contato a partir do
 * horário da experimental (mesmo que o formulário público grava).
 */
function scheduleContactFields(schedule) {
  return {
    training_group_id: schedule.training_group?.id ?? schedule.training_group_id,
    location_id: schedule.training_group?.location_id ?? null,
    unit_id: schedule.training_group?.unit_id ?? null,
    modality_id: schedule.training_group?.modality_id ?? null,
  };
}
/* =========================================================
 * EXPERIMENTAIS
 * =======================================================*/

async function createExperimentalSession({
  contactId,
  categoryId,
  trainingGroupScheduleId = null,
  experimentalDate,
  experimentalTime = null,
  status = EXPERIMENTAL_STATUS.PENDING_CONFIRMATION,
  notes = null,
  coachNotes = null,
  preferredPosition = null,
}) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  if (!categoryId) {
    throw new Error("Categoria não informada.");
  }

  if (!experimentalDate) {
    throw new Error("Data da experimental não informada.");
  }

  if (!EXPERIMENTAL_STATUSES.includes(status)) {
    throw new Error("Status da experimental inválido.");
  }

  const { data, error } = await supabase
    .from("experimental_sessions")
    .insert({
      contact_id: contactId,
      category_id: categoryId,
      training_group_schedule_id: trainingGroupScheduleId,
      experimental_date: experimentalDate,
      experimental_time: experimentalTime,
      status,
      notes: cleanOptionalText(notes),
      coach_notes: cleanOptionalText(coachNotes),
      preferred_position: cleanOptionalText(preferredPosition),
    })
    .select(SESSION_WITH_CONTACT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getLatestExperimentalSession(contactId) {
  const { data, error } = await supabase
    .from("experimental_sessions")
    .select(
      `
      id,
      contact_id,
      category_id,
      experimental_date,
      experimental_time,
      status,
      notes,
      created_at,
      updated_at
    `,
    )
    .eq("contact_id", contactId)
    .order("experimental_date", {
      ascending: false,
    })
    .order("experimental_time", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}
/* =========================================================
 * CONSULTAS
 * =======================================================*/

export async function getContacts() {
  const { data, error } = await supabase
    .from("contacts")
    .select(CONTACT_WITH_CATEGORY)
    .order("first_contact_at", {
      ascending: false,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getContactById(contactId) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  const { data, error } = await supabase
    .from("contacts")
    .select(CONTACT_WITH_CATEGORY)
    .eq("id", contactId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getExperimentals() {
  const { data, error } = await supabase
    .from("experimental_sessions")
    .select(SESSION_WITH_CONTACT)
    .order("experimental_date", {
      ascending: true,
    })
    .order("experimental_time", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getExperimentalSession(sessionId) {
  if (!sessionId) {
    throw new Error("Experimental não informada.");
  }

  const { data, error } = await supabase
    .from("experimental_sessions")
    .select(SESSION_WITH_CONTACT)
    .eq("id", sessionId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getContactExperimentalSessions(contactId) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  const { data, error } = await supabase
    .from("experimental_sessions")
    .select(SESSION_WITH_CATEGORY)
    .eq("contact_id", contactId)
    .order("experimental_date", {
      ascending: false,
    })
    .order("experimental_time", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
 * ATUALIZAÇÃO DE CONTATOS
 * =======================================================*/

export async function updateContact(contactId, updates) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    throw new Error("Dados inválidos.");
  }

  const allowedFields = [
    "child_name",
    "birth_date",
    "responsible_name",
    "phone",
    "email",
    "source",
    "entry_channel",
    "neighborhood",
    "trained_elsewhere",
    "previous_club",

    "category_id",
    "interest_category_id",
    "preferred_shift",
    "preferred_days",
    "qualification_status",

    "observations",
    "internal_notes",
    "first_contact_at",
  ];

  const payload = {};

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      payload[field] = updates[field];
    }
  });

  if (!Object.keys(payload).length) {
    throw new Error("Nenhum dado para atualizar.");
  }

  const { data, error } = await supabase
    .from("contacts")
    .update({
      ...payload,
      ...withUpdatedAt(),
    })
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

export async function addContactInternalNote(contactId, note) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  const current = await getContactById(contactId);

  const internalNotes = appendInternalNote(current.internal_notes, note);

  const { data, error } = await supabase
    .from("contacts")
    .update({
      internal_notes: internalNotes,
      ...withUpdatedAt(),
    })
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

export async function updateContactStatus(contactId, status) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  const validStatuses = Object.values(CONTACT_STATUS);

  if (!validStatuses.includes(status)) {
    throw new Error("Status do contato inválido.");
  }

  const { data, error } = await supabase
    .from("contacts")
    .update({
      status,
      ...withUpdatedAt(),
    })
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

/* =========================================================
 * EXPERIMENTAIS
 * =======================================================*/

export async function updateExperimentalCoachNotes(sessionId, coachNotes = "") {
  if (!sessionId) {
    throw new Error("Experimental não informada.");
  }

  const { data, error } = await supabase
    .from("experimental_sessions")
    .update({
      coach_notes: cleanOptionalText(coachNotes),
      ...withUpdatedAt(),
    })
    .eq("id", sessionId)
    .select(SESSION_WITH_CONTACT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateExperimentalSessionStatus(
  sessionId,
  status,
  correctionReason = "",
) {
  if (!sessionId) {
    throw new Error("Experimental não informada.");
  }

  if (!EXPERIMENTAL_STATUSES.includes(status)) {
    throw new Error("Status da experimental inválido.");
  }

  const currentSession = await getExperimentalSession(sessionId);

  const currentContact = await getContactById(currentSession.contact_id);

  let sessionNotes = currentSession.notes || null;

  if (correctionReason.trim() && currentSession.status !== status) {
    sessionNotes = appendInternalNote(
      sessionNotes,
      `Correção: ${currentSession.status} → ${status}. ${correctionReason}`,
    );
  }

  const { data: updatedSession, error } = await supabase
    .from("experimental_sessions")
    .update({
      status,
      notes: sessionNotes,
      ...withUpdatedAt(),
    })
    .eq("id", sessionId)
    .select(SESSION_WITH_CONTACT)
    .single();

  if (error) {
    throw error;
  }

  const latest = await getLatestExperimentalSession(currentContact.id);

  const isLatestSession = latest?.id === sessionId;

  const hasProtectedCommercialStatus = PROTECTED_COMMERCIAL_STATUSES.includes(
    currentContact.status,
  );

  if (isLatestSession && !hasProtectedCommercialStatus) {
    const { error: contactError } = await supabase
      .from("contacts")
      .update({
        status,
        category_id: updatedSession.category_id,
        experimental_date: updatedSession.experimental_date,
        experimental_time: updatedSession.experimental_time,
        ...withUpdatedAt(),
      })
      .eq("id", currentContact.id);

    if (contactError) {
      throw contactError;
    }
  }

  return updatedSession;
}

export async function deleteExperimentalSession(sessionId) {
  if (!sessionId) {
    throw new Error("Experimental não informada.");
  }

  const session = await getExperimentalSession(sessionId);

  const contact = await getContactById(session.contact_id);

  const { error: deleteError } = await supabase
    .from("experimental_sessions")
    .delete()
    .eq("id", sessionId);

  if (deleteError) {
    throw deleteError;
  }

  const latest = await getLatestExperimentalSession(contact.id);

  const hasProtectedCommercialStatus = PROTECTED_COMMERCIAL_STATUSES.includes(
    contact.status,
  );

  /*
   * Se o contato já avançou comercialmente,
   * excluir uma experimental do histórico
   * não deve alterar seu status atual.
   */
  if (hasProtectedCommercialStatus) {
    return true;
  }

  if (latest) {
    const { error: contactError } = await supabase
      .from("contacts")
      .update({
        status: latest.status,
        category_id: latest.category_id,
        experimental_date: latest.experimental_date,
        experimental_time: latest.experimental_time,
        ...withUpdatedAt(),
      })
      .eq("id", contact.id);

    if (contactError) {
      throw contactError;
    }

    return true;
  }

  const { error: contactError } = await supabase
    .from("contacts")
    .update({
      status: CONTACT_STATUS.NEW_CONTACT,
      category_id: null,
      experimental_date: null,
      experimental_time: null,
      experimental_result: null,
      ...withUpdatedAt(),
    })
    .eq("id", contact.id);

  if (contactError) {
    throw contactError;
  }

  return true;
}

/* =========================================================
 * CRIAÇÃO DE CONTATO
 * =======================================================*/

export async function createContact(contact) {
  if (!contact || typeof contact !== "object") {
    throw new Error("Dados do contato inválidos.");
  }

  let schedule = null;

  const isWaitingList = contact.status === CONTACT_STATUS.WAITING_LIST;

  /*
   * Só validamos disponibilidade quando o contato
   * realmente será criado com uma experimental.
   *
   * Lista de interesse não ocupa vaga de experimental.
   *
   * A disponibilidade é controlada por
   * training_group_schedule_id + experimental_date, contando
   * experimental_sessions — o mesmo limite do formulário público.
   */
  if (!isWaitingList && contact.experimental_date) {
    if (!contact.training_group_schedule_id) {
      throw new Error("Escolha a turma e o horário da experimental.");
    }

    schedule = await ensureExperimentalAvailability(
      contact.training_group_schedule_id,
      contact.experimental_date,
    );
  }
  /*
   * Esses campos pertencem à experimental e não à
   * tabela contacts.
   */
  const {
  coach_notes: initialCoachNotes = null,
  preferred_position: initialPreferredPosition = null,

  // Campos usados apenas pelo fluxo de agendamento
  training_group_id: _trainingGroupId,
  training_group_schedule_id: trainingGroupScheduleId,

  ...contactPayload
} = contact;

  if (schedule) {
    Object.assign(contactPayload, scheduleContactFields(schedule), {
      experimental_time: schedule.start_time,
    });
  }

  /*
   * Registra automaticamente quando o contato
   * entrou na lista de interesse.
   */
  if (
    contactPayload.status === CONTACT_STATUS.WAITING_LIST &&
    !contactPayload.waiting_list_at
  ) {
    contactPayload.waiting_list_at = nowISO();
  }

  if (
    !Array.isArray(contactPayload.preferred_days) ||
    contactPayload.preferred_days.length === 0
  ) {
    contactPayload.preferred_days = null;
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert(contactPayload)
    .select(CONTACT_WITH_CATEGORY)
    .single();

  if (error) {
    throw error;
  }

  const shouldCreateExperimental =
    data.status !== CONTACT_STATUS.WAITING_LIST &&
    data.category_id &&
    data.experimental_date;

  if (!shouldCreateExperimental) {
    return data;
  }

  const experimentalStatus =
    data.status === CONTACT_STATUS.CONFIRMED
      ? EXPERIMENTAL_STATUS.CONFIRMED
      : EXPERIMENTAL_STATUS.PENDING_CONFIRMATION;

   try {
    await createExperimentalSession({
  contactId: data.id,
  categoryId: data.category_id,
  trainingGroupScheduleId,
  experimentalDate: data.experimental_date,
  experimentalTime:
    data.experimental_time || schedule?.start_time || null,
  status: experimentalStatus,
  notes: "Primeira experimental do contato.",
  coachNotes: initialCoachNotes,
  preferredPosition: initialPreferredPosition,
});
  } catch (err) {
    /*
     * Rollback manual:
     * se a experimental não puder ser criada,
     * removemos o contato recém-criado.
     */
    const { error: rollbackError } = await supabase
      .from("contacts")
      .delete()
      .eq("id", data.id);

    if (rollbackError) {
      console.error("Erro ao desfazer criação do contato:", rollbackError);
    }

    throw err;
  }

  return data;
}

/* =========================================================
 * RESULTADO COMERCIAL
 * =======================================================*/

export async function saveExperimentalResult(
  contactId,
  { result, followUpDate = null, notes = "", lostReason = null },
) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  const allowedResults = [
    CONTACT_STATUS.ENROLLED,
    CONTACT_STATUS.FOLLOW_UP,
    CONTACT_STATUS.LOST,
  ];

  if (!allowedResults.includes(result)) {
    throw new Error("Resultado inválido.");
  }

  const current = await getContactById(contactId);

  let updates;

  switch (result) {
    case CONTACT_STATUS.ENROLLED: {
      updates = buildEnrollmentUpdate(current, {
        enrolledAt: nowISO(),
        notes,
      });

      break;
    }

    case CONTACT_STATUS.FOLLOW_UP: {
      if (!followUpDate) {
        throw new Error("Informe a data do retorno.");
      }

      updates = buildFollowUpUpdate(current, {
        followUpDate,
        notes,
        firstTime: true,
      });

      /*
       * Esta função registra o resultado comercial
       * da aula experimental.
       */
      updates.experimental_result = CONTACT_STATUS.FOLLOW_UP;

      break;
    }

    case CONTACT_STATUS.LOST: {
      if (!lostReason) {
        throw new Error("Informe o motivo da não conversão.");
      }

      updates = buildLostUpdate(current, {
        lostReason,
        notes,
        attended: true,
      });

      break;
    }

    default:
      throw new Error("Resultado inválido.");
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

/* =========================================================
 * MATRÍCULA
 * =======================================================*/

export async function enrollContact(
  contactId,
  { notes = "", enrolledAt = null } = {},
) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  const current = await getContactById(contactId);

  let enrollmentDate = nowISO();

  if (enrolledAt) {
    enrollmentDate = /^\d{4}-\d{2}-\d{2}$/.test(enrolledAt)
      ? `${enrolledAt}T12:00:00`
      : enrolledAt;
  }

  const updates = buildEnrollmentUpdate(current, {
    enrolledAt: enrollmentDate,
    notes,
  });

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

export async function enrollFromFollowUp(contactId, notes = "") {
  return enrollContact(contactId, {
    notes,
  });
}

/* =========================================================
 * CANCELAMENTO DE MATRÍCULA
 * =======================================================*/

export async function cancelEnrollment(
  contactId,
  { reason, notes = "", leftAt = null } = {},
) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  if (!reason?.trim()) {
    throw new Error("Informe o motivo do cancelamento.");
  }

  const current = await getContactById(contactId);

  if (
    current.status !== CONTACT_STATUS.ENROLLED ||
    current.enrollment_status !== ENROLLMENT_STATUS.ACTIVE
  ) {
    throw new Error("Contato não possui matrícula ativa.");
  }

  let departure = nowISO();

  if (leftAt) {
    departure = /^\d{4}-\d{2}-\d{2}$/.test(leftAt)
      ? `${leftAt}T12:00:00`
      : leftAt;
  }

  const updates = buildCancellationUpdate(current, {
    reason,
    leftAt: departure,
    notes,
  });

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

/* =========================================================
 * REATIVAÇÃO DE MATRÍCULA
 * =======================================================*/

export async function reactivateEnrollment(contactId, { notes = "" } = {}) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  const current = await getContactById(contactId);

  if (current.enrollment_status !== ENROLLMENT_STATUS.CANCELLED) {
    throw new Error("A matrícula não está cancelada.");
  }

  const updates = buildReactivationUpdate(current, notes);

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

/* =========================================================
 * FOLLOW UP
 * =======================================================*/

export async function getFollowUps() {
  const { data, error } = await supabase
    .from("contacts")
    .select(CONTACT_WITH_CATEGORY)
    .eq("status", CONTACT_STATUS.FOLLOW_UP)
    .not("follow_up_date", "is", null)
    .order("follow_up_date", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function scheduleFollowUp(contactId, followUpDate, notes = "") {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  if (!followUpDate) {
    throw new Error("Informe a data do próximo retorno.");
  }

  const current = await getContactById(contactId);

  const isAlreadyInFollowUp =
    current.status === CONTACT_STATUS.FOLLOW_UP &&
    Boolean(current.follow_up_started_at);

  /*
   * O limite só é verificado quando o contato
   * já está dentro de um ciclo de acompanhamento.
   *
   * O primeiro agendamento apenas inicia o ciclo
   * e não conta como tentativa.
   */
  if (isAlreadyInFollowUp) {
    const followUpState = getFollowUpState(current);

    if (!followUpState.canReschedule) {
      throw new Error(
        "Este acompanhamento atingiu o limite. Encerre a oportunidade ou matricule o atleta.",
      );
    }
  }

  const updates = buildFollowUpUpdate(current, {
    followUpDate,
    notes,
    firstTime: !isAlreadyInFollowUp,
  });

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

export async function loseFromFollowUp(contactId, lostReason, notes = "") {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  if (!lostReason) {
    throw new Error("Informe o motivo da não conversão.");
  }

  return closeOpportunity(contactId, {
    lostReason,
    notes,
  });
}

/* =========================================================
 * LISTA DE INTERESSE
 * =======================================================*/

export async function getWaitingList() {
  const { data, error } = await supabase
    .from("contacts")
    .select(CONTACT_WITH_CATEGORY)
    .eq("status", CONTACT_STATUS.WAITING_LIST)
    .order("waiting_list_at", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}
export async function addToWaitingList(
  contactId,
  {
    reason,
    notes = "",

    categoryId = null,
    preferredShift = null,
    preferredDays = [],
  },
) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  if (!reason) {
    throw new Error("Informe o motivo da lista de interesse.");
  }

  const current = await getContactById(contactId);

 const updates = {
    ...buildWaitingListUpdate(current,{
        reason,
        notes,

        interestCategoryId: categoryId,
        preferredShift,
        preferredDays,
    }),

    interest_category_id:
        categoryId || null,

    preferred_shift:
        preferredShift || null,

    preferred_days:
        preferredDays?.length
            ? preferredDays
            : null,
};

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}
/* =========================================================
 * REAGENDAMENTO DE EXPERIMENTAL
 * =======================================================*/

export async function rescheduleExperimental(
  contactId,
  {
    categoryId,
    trainingGroupScheduleId,
    experimentalDate,
    notes = "",
    coachNotes = "",
  },
) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  if (!categoryId) {
    throw new Error("Selecione uma categoria.");
  }

  if (!trainingGroupScheduleId || !experimentalDate) {
    throw new Error("Escolha a turma, o horário e a data da experimental.");
  }

  const active = await getLatestExperimentalSession(contactId);

  const hasActiveExperimental =
    active &&
    [
      EXPERIMENTAL_STATUS.PENDING_CONFIRMATION,
      EXPERIMENTAL_STATUS.CONFIRMED,
    ].includes(active.status);

  const schedule = await ensureExperimentalAvailability(
    trainingGroupScheduleId,
    experimentalDate,
  );

  const time = schedule.start_time;

  /*
   * Remarcar uma aula ainda ativa: a antiga vira "cancelada"
   * (fica no histórico) e libera a vaga daquela data.
   */
  if (hasActiveExperimental) {
    const { error: cancelError } = await supabase
      .from("experimental_sessions")
      .update({
        status: EXPERIMENTAL_STATUS.CANCELLED,
        notes: appendInternalNote(
          active.notes,
          `Remarcada para ${experimentalDate.split("-").reverse().join("/")}.`,
        ),
        ...withUpdatedAt(),
      })
      .eq("id", active.id);

    if (cancelError) {
      throw cancelError;
    }
  }

  let session;

  try {
    session = await createExperimentalSession({
      contactId,
      categoryId,
      trainingGroupScheduleId,
      experimentalDate,
      experimentalTime: time,

      status: EXPERIMENTAL_STATUS.PENDING_CONFIRMATION,

      notes: notes || "Experimental reagendada.",

      coachNotes,
    });
  } catch (err) {
    // Não conseguiu criar a nova: devolve a antiga como estava
    if (hasActiveExperimental) {
      await supabase
        .from("experimental_sessions")
        .update({ status: active.status, notes: active.notes })
        .eq("id", active.id);
    }

    throw err;
  }

  const updates = {
    status: CONTACT_STATUS.PENDING_CONFIRMATION,

    category_id: categoryId,

    ...scheduleContactFields(schedule),

    experimental_date: experimentalDate,

    experimental_time: time,

    experimental_result: null,

    ...clearFollowUpFields(),
    ...clearWaitingListFields(),
    ...clearLostFields(),

    ...withUpdatedAt(),
  };

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    const { error: rollbackError } = await supabase
      .from("experimental_sessions")
      .delete()
      .eq("id", session.id);

    if (rollbackError) {
      console.error("Erro ao desfazer criação da experimental:", rollbackError);
    }

    if (hasActiveExperimental) {
      await supabase
        .from("experimental_sessions")
        .update({ status: active.status, notes: active.notes })
        .eq("id", active.id);
    }

    throw error;
  }

  return {
    contact: ensureUpdated(data),
    session,
  };
}

/* =========================================================
 * CENTRAL DE ACOMPANHAMENTO
 * =======================================================*/

export async function getFollowUpCenter() {
  const [followUpsResult, waitingListResult] = await Promise.all([
    supabase
      .from("contacts")
      .select(CONTACT_WITH_CATEGORY)
      .eq("status", CONTACT_STATUS.FOLLOW_UP)
      .not("follow_up_date", "is", null)
      .order("follow_up_date", {
        ascending: true,
      }),

    supabase
      .from("contacts")
      .select(CONTACT_WITH_CATEGORY)
      .eq("status", CONTACT_STATUS.WAITING_LIST)
      .order("waiting_list_at", {
        ascending: true,
        nullsFirst: false,
      }),
  ]);

  if (followUpsResult.error) {
    throw followUpsResult.error;
  }

  if (waitingListResult.error) {
    throw waitingListResult.error;
  }

  return {
    followUps: followUpsResult.data || [],

    waitingList: waitingListResult.data || [],
  };
}

/* =========================================================
 * ENCERRAMENTO
 * =======================================================*/

export async function closeOpportunity(contactId, { lostReason, notes = "" }) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  if (!lostReason) {
    throw new Error("Informe o motivo da não conversão.");
  }

  const current = await getContactById(contactId);

  const sessions = await getContactExperimentalSessions(contactId);

  const attended = sessions.some(
    (session) => session.status === EXPERIMENTAL_STATUS.ATTENDED,
  );

  const updates = buildLostUpdate(current, {
    lostReason,
    notes,
    attended,
  });

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

export async function closeWaitingListContact(
  contactId,
  { lostReason = LOST_REASON.OTHER, notes = "" } = {},
) {
  return closeOpportunity(contactId, {
    lostReason,
    notes,
  });
}

export async function closeNoShowOpportunity(
  contactId,
  { lostReason, notes = "" },
) {
  return closeOpportunity(contactId, {
    lostReason,
    notes,
  });
}

