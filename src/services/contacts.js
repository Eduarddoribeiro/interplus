import { supabase } from "../lib/supabase";

/* =========================================================
 * SELECTS
 * =======================================================*/

const CONTACT_WITH_CATEGORY = `
  *,
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

const SESSION_WITH_CATEGORY = `
  *,
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

const SESSION_WITH_CONTACT = `
  *,
  category:categories (
    id,
    name,
    weekday,
    start_time,
    end_time,
    trial_status,
    experimental_limit
  ),
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
    follow_up_date,
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
  "pending_confirmation",
  "confirmed",
  "attended",
  "no_show",
  "cancelled",
];

const PROTECTED_COMMERCIAL_STATUSES = [
  "enrolled",
  "follow_up",
  "waiting_list",
  "lost",
];

/* =========================================================
 * HELPERS
 * =======================================================*/

function ensureUpdated(data) {
  if (!data || data.length === 0) {
    throw new Error(
      "O Supabase não atualizou nenhuma linha."
    );
  }

  return data[0];
}

function cleanOptionalText(value) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const text = value.trim();

  return text || null;
}

function appendInternalNote(currentNotes, note) {
  const cleanNote = cleanOptionalText(note);

  if (!cleanNote) {
    return currentNotes || null;
  }

  const date = new Intl.DateTimeFormat("pt-BR").format(
    new Date()
  );

  const line = `[${date}] ${cleanNote}`;

  if (!currentNotes?.trim()) {
    return line;
  }

  return `${currentNotes.trim()}\n\n${line}`;
}

/* =========================================================
 * VAGAS PARA EXPERIMENTAL
 * =======================================================*/

async function ensureExperimentalAvailability(
  categoryId,
  experimentalDate
) {
  if (!categoryId || !experimentalDate) {
    return null;
  }

  const { data: category, error: categoryError } =
    await supabase
      .from("categories")
      .select(`
        id,
        name,
        start_time,
        experimental_limit
      `)
      .eq("id", categoryId)
      .single();

  if (categoryError) {
    throw categoryError;
  }

  const { count, error: countError } =
    await supabase
      .from("experimental_sessions")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("category_id", categoryId)
      .eq("experimental_date", experimentalDate)
      .in("status", [
        "pending_confirmation",
        "confirmed",
      ]);

  if (countError) {
    throw countError;
  }

  const limit = category.experimental_limit ?? 0;

  if (limit > 0 && count >= limit) {
    throw new Error(
      "Esta data não possui mais vagas para aula experimental."
    );
  }

  return category;
}

/* =========================================================
 * EXPERIMENTAIS
 * =======================================================*/

async function createExperimentalSession({
  contactId,
  categoryId,
  experimentalDate,
  experimentalTime = null,
  status = "pending_confirmation",
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
      experimental_date: experimentalDate,
      experimental_time: experimentalTime,
      status,
      notes: cleanOptionalText(notes),
      coach_notes: cleanOptionalText(coachNotes),
      preferred_position: cleanOptionalText(
        preferredPosition
      ),
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
    .select(`
      id,
      contact_id,
      category_id,
      experimental_date,
      experimental_time,
      status,
      created_at,
      updated_at
    `)
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
    .order("experimental_date")
    .order("experimental_time");

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getExperimentalSession(sessionId) {
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

export async function getContactExperimentalSessions(
  contactId
) {
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

  if (!updates || typeof updates !== "object") {
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

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("contacts")
    .update(payload)
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

export async function addContactInternalNote(contactId, note) {
  const current = await getContactById(contactId);

  const internalNotes = appendInternalNote(
    current.internal_notes,
    note
  );

  const { data, error } = await supabase
    .from("contacts")
    .update({
      internal_notes: internalNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

export async function updateContactStatus(contactId, status) {
  const { data, error } = await supabase
    .from("contacts")
    .update({
      status,
      updated_at: new Date().toISOString(),
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

export async function updateExperimentalCoachNotes(
  sessionId,
  coachNotes = ""
) {
  const { data, error } = await supabase
    .from("experimental_sessions")
    .update({
      coach_notes: cleanOptionalText(coachNotes),
      updated_at: new Date().toISOString(),
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
  correctionReason = ""
) {
  if (!EXPERIMENTAL_STATUSES.includes(status)) {
    throw new Error("Status inválido.");
  }

  const currentSession = await getExperimentalSession(
    sessionId
  );

  const currentContact = await getContactById(
    currentSession.contact_id
  );

  let sessionNotes = currentSession.notes || null;

  if (
    correctionReason.trim() &&
    currentSession.status !== status
  ) {
    sessionNotes = appendInternalNote(
      sessionNotes,
      `Correção: ${currentSession.status} → ${status}. ${correctionReason}`
    );
  }

  const { data: updatedSession, error } = await supabase
    .from("experimental_sessions")
    .update({
      status,
      notes: sessionNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select(SESSION_WITH_CONTACT)
    .single();

  if (error) {
    throw error;
  }

  const latest =
    await getLatestExperimentalSession(
      currentContact.id
    );

  const shouldSync =
    latest?.id === sessionId &&
    !PROTECTED_COMMERCIAL_STATUSES.includes(
      currentContact.status
    );

  if (shouldSync) {
    await supabase
      .from("contacts")
      .update({
        status,
        category_id: updatedSession.category_id,
        experimental_date:
          updatedSession.experimental_date,
        experimental_time:
          updatedSession.experimental_time,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentContact.id);
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

  if (latest) {
    // Ainda existem experimentais.
    if (
      !PROTECTED_COMMERCIAL_STATUSES.includes(contact.status)
    ) {
      await supabase
        .from("contacts")
        .update({
          status: latest.status,
          category_id: latest.category_id,
          experimental_date: latest.experimental_date,
          experimental_time: latest.experimental_time,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contact.id);
    }
  } else {
    // Não existe mais nenhuma experimental.
    if (
      !PROTECTED_COMMERCIAL_STATUSES.includes(contact.status)
    ) {
      await supabase
        .from("contacts")
        .update({
          status: "new",
          category_id: null,
          experimental_date: null,
          experimental_time: null,
          experimental_result: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contact.id);
    }
  }

  return true;
}

/* =========================================================
 * CRIAÇÃO DE CONTATO
 * =======================================================*/

export async function createContact(contact) {
  let category = null;

  if (
    contact.status !== "waiting_list" &&
    contact.category_id &&
    contact.experimental_date
  ) {
    category =
      await ensureExperimentalAvailability(
        contact.category_id,
        contact.experimental_date
      );
  }

  const {
    coach_notes: initialCoachNotes = null,
    preferred_position:
      initialPreferredPosition = null,
    ...contactPayload
  } = contact;

  if (
    contactPayload.status === "waiting_list" &&
    !contactPayload.waiting_list_at
  ) {
    contactPayload.waiting_list_at =
      new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert(contactPayload)
    .select(CONTACT_WITH_CATEGORY)
    .single();

  if (error) {
    throw error;
  }

  if (
    data.status !== "waiting_list" &&
    data.category_id &&
    data.experimental_date
  ) {
    try {
      await createExperimentalSession({
        contactId: data.id,
        categoryId: data.category_id,
        experimentalDate:
          data.experimental_date,
        experimentalTime:
          data.experimental_time ||
          category?.start_time ||
          null,
        status:
          data.status === "confirmed"
            ? "confirmed"
            : "pending_confirmation",
        notes:
          "Primeira experimental do contato.",
        coachNotes: initialCoachNotes,
        preferredPosition:
          initialPreferredPosition,
      });
    } catch (err) {
      await supabase
        .from("contacts")
        .delete()
        .eq("id", data.id);

      throw err;
    }
  }

  return data;
}

/* =========================================================
 * RESULTADO COMERCIAL
 * =======================================================*/

export async function saveExperimentalResult(
  contactId,
  {
    result,
    followUpDate = null,
    notes = "",
    lostReason = null,
  }
) {
  const allowed = [
    "enrolled",
    "follow_up",
    "lost",
  ];

  if (!allowed.includes(result)) {
    throw new Error("Resultado inválido.");
  }

  const current = await getContactById(contactId);

  const updates = {
    status: result,
    experimental_result: result,

    follow_up_date: null,
    lost_reason: null,

    waiting_list_reason: null,
    waiting_list_notes: null,
    waiting_list_at: null,

    updated_at: new Date().toISOString(),
  };

  if (result === "follow_up") {
    if (!followUpDate) {
      throw new Error(
        "Informe a data do retorno."
      );
    }

    updates.follow_up_date = followUpDate;
  }

  if (result === "lost") {
    if (!lostReason) {
      throw new Error(
        "Informe o motivo."
      );
    }

    updates.lost_reason = lostReason;
  }

  if (result === "enrolled") {
    updates.enrolled_at =
      new Date().toISOString();

    updates.enrollment_status = "active";
    updates.left_at = null;
    updates.left_reason = null;
  }

  if (notes.trim()) {
    updates.internal_notes =
      appendInternalNote(
        current.internal_notes,
        notes
      );
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
  {
    notes = "",
    enrolledAt = null,
  } = {}
) {
  const current =
    await getContactById(contactId);

  let enrollmentDate =
    new Date().toISOString();

  if (enrolledAt) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(enrolledAt)) {
      enrollmentDate =
        `${enrolledAt}T12:00:00`;
    } else {
      enrollmentDate = enrolledAt;
    }
  }

  const updates = {
    status: "enrolled",

    experimental_result:
      "enrolled",

    enrolled_at:
      enrollmentDate,

    enrollment_status:
      "active",

    left_at: null,
    left_reason: null,

    follow_up_date: null,
    lost_reason: null,

    waiting_list_reason: null,
    waiting_list_notes: null,
    waiting_list_at: null,

    updated_at:
      new Date().toISOString(),
  };

  if (notes.trim()) {
    updates.internal_notes =
      appendInternalNote(
        current.internal_notes,
        notes
      );
  }

  const { data, error } =
    await supabase
      .from("contacts")
      .update(updates)
      .eq("id", contactId)
      .select(CONTACT_WITH_CATEGORY);

  if (error) {
    throw error;
  }

  return ensureUpdated(data);
}

export async function enrollFromFollowUp(
  contactId,
  notes = ""
) {
  return enrollContact(contactId, {
    notes,
  });
}

/* =========================================================
 * CANCELAMENTO DE MATRÍCULA
 * =======================================================*/

export async function cancelEnrollment(
  contactId,
  {
    reason,
    notes = "",
    leftAt = null,
  } = {}
) {
  const current =
    await getContactById(contactId);

  if (current.status !== "enrolled") {
    throw new Error(
      "Contato não possui matrícula."
    );
  }

  let departure =
    new Date().toISOString();

  if (leftAt) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(leftAt)) {
      departure =
        `${leftAt}T12:00:00`;
    } else {
      departure = leftAt;
    }
  }

  const updates = {
    enrollment_status:
      "cancelled",

    left_at: departure,

    left_reason:
      cleanOptionalText(reason),

    internal_notes:
      appendInternalNote(
        current.internal_notes,
        notes
          ? `Matrícula encerrada. Motivo: ${reason}. ${notes}`
          : `Matrícula encerrada. Motivo: ${reason}.`
      ),

    updated_at:
      new Date().toISOString(),
  };

  const { data, error } =
    await supabase
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
 * REATIVAÇÃO
 * =======================================================*/

export async function reactivateEnrollment(
  contactId,
  {
    notes = "",
  } = {}
) {
  const current =
    await getContactById(contactId);

  if (
    current.enrollment_status !==
    "cancelled"
  ) {
    throw new Error(
      "A matrícula não está cancelada."
    );
  }

  const updates = {
    enrollment_status:
      "active",

    left_at: null,
    left_reason: null,

    internal_notes:
      appendInternalNote(
        current.internal_notes,
        notes
          ? `Matrícula reativada. ${notes}`
          : "Matrícula reativada."
      ),

    updated_at:
      new Date().toISOString(),
  };

  const { data, error } =
    await supabase
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
    .eq("status", "follow_up")
    .not("follow_up_date", "is", null)
    .order("follow_up_date", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}

export async function scheduleFollowUp(
  contactId,
  followUpDate,
  notes = ""
) {
  const current = await getContactById(contactId);

  const updates = {
    status: "follow_up",

    follow_up_date: followUpDate,

    lost_reason: null,

    waiting_list_reason: null,
    waiting_list_notes: null,
    waiting_list_at: null,

    updated_at: new Date().toISOString(),
  };

  if (notes.trim()) {
    updates.internal_notes = appendInternalNote(
      current.internal_notes,
      notes
    );
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) throw error;

  return ensureUpdated(data);
}

export async function loseFromFollowUp(
  contactId,
  lostReason,
  notes = ""
) {
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
    .eq("status", "waiting_list")
    .order("waiting_list_at");

  if (error) throw error;

  return data || [];
}

export async function addToWaitingList(
  contactId,
  {
    reason,
    notes = "",
  }
) {
  const current = await getContactById(contactId);

  const updates = {
    status: "waiting_list",

    waiting_list_reason: reason,
    waiting_list_notes: cleanOptionalText(notes),
    waiting_list_at: new Date().toISOString(),

    follow_up_date: null,
    lost_reason: null,

    updated_at: new Date().toISOString(),
  };

  if (notes.trim()) {
    updates.internal_notes = appendInternalNote(
      current.internal_notes,
      `Lista de interesse: ${notes}`
    );
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) throw error;

  return ensureUpdated(data);
}

/* =========================================================
 * REAGENDAMENTO DE EXPERIMENTAL
 * =======================================================*/

export async function rescheduleExperimental(
  contactId,
  {
    categoryId,
    experimentalDate,
    experimentalTime = null,
    notes = "",
    coachNotes = "",
  }
) {
  const active =
    await getLatestExperimentalSession(contactId);

  if (
    active &&
    ["pending_confirmation", "confirmed"].includes(
      active.status
    )
  ) {
    throw new Error(
      "Este contato já possui uma aula experimental agendada."
    );
  }

  const category =
    await ensureExperimentalAvailability(
      categoryId,
      experimentalDate
    );

  const time =
    experimentalTime ||
    category?.start_time ||
    null;

  const session =
    await createExperimentalSession({
      contactId,
      categoryId,
      experimentalDate,
      experimentalTime: time,

      status: "pending_confirmation",

      notes:
        notes ||
        "Experimental reagendada.",

      coachNotes,
    });

  const { data, error } = await supabase
    .from("contacts")
    .update({
      status: "pending_confirmation",

      category_id: categoryId,

      experimental_date:
        experimentalDate,

      experimental_time: time,

      experimental_result: null,

      follow_up_date: null,

      waiting_list_reason: null,
      waiting_list_notes: null,
      waiting_list_at: null,

      lost_reason: null,

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    await supabase
      .from("experimental_sessions")
      .delete()
      .eq("id", session.id);

    throw error;
  }

  return {
    contact: ensureUpdated(data),
    session,
  };
}

export async function getFollowUpCenter() {
  const [followUpsResult, waitingListResult] =
    await Promise.all([
      supabase
        .from("contacts")
        .select(CONTACT_WITH_CATEGORY)
        .eq("status", "follow_up")
        .not("follow_up_date", "is", null)
        .order("follow_up_date", {
          ascending: true,
        }),

      supabase
        .from("contacts")
        .select(CONTACT_WITH_CATEGORY)
        .eq("status", "waiting_list")
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

export async function scheduleExperimentalFromWaitingList(
  contactId,
  {
    categoryId,
    experimentalDate,
    experimentalTime = null,
    coachNotes = "",
  }
) {
  if (!contactId) {
    throw new Error("Contato não informado.");
  }

  if (!categoryId) {
    throw new Error("Selecione uma categoria.");
  }

  if (!experimentalDate) {
    throw new Error("Informe a data da experimental.");
  }

  const category =
    await ensureExperimentalAvailability(
      categoryId,
      experimentalDate
    );

  const time =
    experimentalTime ||
    category?.start_time ||
    null;

  const session =
    await createExperimentalSession({
      contactId,
      categoryId,
      experimentalDate,
      experimentalTime: time,
      status: "pending_confirmation",
      notes:
        "Experimental agendada a partir da lista de interesse.",
      coachNotes,
    });

  const { data, error } = await supabase
    .from("contacts")
    .update({
      status: "pending_confirmation",

      category_id: categoryId,

      experimental_date: experimentalDate,
      experimental_time: time,

      experimental_result: null,

      waiting_list_reason: null,
      waiting_list_notes: null,
      waiting_list_at: null,

      follow_up_date: null,
      lost_reason: null,

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", contactId)
    .select(CONTACT_WITH_CATEGORY);

  if (error) {
    await supabase
      .from("experimental_sessions")
      .delete()
      .eq("id", session.id);

    throw error;
  }

  return {
    contact: ensureUpdated(data),
    session,
  };
}

/* =========================================================
 * ENCERRAMENTO
 * =======================================================*/

export async function closeOpportunity(
  contactId,
  {
    lostReason,
    notes = "",
  }
) {
  const current =
    await getContactById(contactId);

  const sessions =
    await getContactExperimentalSessions(
      contactId
    );

  const attended =
    sessions.some(
      (s) => s.status === "attended"
    );

  const updates = {
    status: "lost",

    lost_reason: lostReason,

    follow_up_date: null,

    waiting_list_reason: null,
    waiting_list_notes: null,
    waiting_list_at: null,

    updated_at:
      new Date().toISOString(),
  };

  if (attended) {
    updates.experimental_result = "lost";
  }

  if (notes.trim()) {
    updates.internal_notes =
      appendInternalNote(
        current.internal_notes,
        `Oportunidade encerrada: ${notes}`
      );
  }

  const { data, error } =
    await supabase
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
  {
    lostReason = "other",
    notes = "",
  } = {}
) {
  return closeOpportunity(contactId, {
    lostReason,
    notes,
  });
}

export async function closeNoShowOpportunity(
  contactId,
  {
    lostReason,
    notes = "",
  }
) {
  return closeOpportunity(contactId, {
    lostReason,
    notes,
  });
}