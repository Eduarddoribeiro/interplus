// src/helpers/dashboardSummary.js

import { CONTACT_STATUS } from "../constants/contactStatus";
import { EXPERIMENTAL_STATUS } from "../constants/experimentalStatus";
import { getSourceLabel } from "../constants/school";

import { WHATSAPP_AUTO_STATUS, isTriage } from "./contactTabs";
import { getBoardGroupKey } from "./waitingListBoard";
import { isAwaitingResult } from "./experimentalRules";

/*
 * Visão geral calculada a partir das experimentais e contatos.
 * Arquivados e os automáticos do WhatsApp não triados ficam fora.
 */

const OPEN_SESSION = [
  EXPERIMENTAL_STATUS.PENDING_CONFIRMATION,
  EXPERIMENTAL_STATUS.CONFIRMED,
];

const AGENDA_SESSION = [
  ...OPEN_SESSION,
  EXPERIMENTAL_STATUS.ATTENDED,
  EXPERIMENTAL_STATUS.NO_SHOW,
];

// Dias à frente para "confirmar experimentais" e "próximos retornos"
const CONFIRM_DAYS = 2;
const UPCOMING_FOLLOW_UP_DAYS = 7;

export function toLocalISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addDaysISO(iso, days) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalISO(date);
}

// Data (YYYY-MM-DD) local de um campo que pode ser data ou timestamp
function localDateOf(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : toLocalISO(date);
}

function monthKey(iso) {
  return iso?.slice(0, 7) ?? null;
}

function previousMonthKey(key) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 2, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getSessionLocationName(session) {
  return session.schedule?.training_group?.location?.name ?? "Sem local definido";
}

function sessionTime(session) {
  return session.experimental_time || session.schedule?.start_time || "";
}

/* =========================================================
 * RESULTADO DO MÊS
 * =======================================================*/

function buildMonth(key, { leads, sessions, contacts }) {
  const monthLeads = leads.filter(
    (contact) => monthKey(localDateOf(contact.first_contact_at || contact.created_at)) === key,
  );

  const monthSessions = sessions.filter(
    (session) =>
      monthKey(session.experimental_date) === key &&
      session.status !== EXPERIMENTAL_STATUS.CANCELLED,
  );

  const attended = monthSessions.filter(
    (session) => session.status === EXPERIMENTAL_STATUS.ATTENDED,
  ).length;

  const enrolled = contacts.filter(
    (contact) =>
      !contact.archived_at &&
      contact.status === CONTACT_STATUS.ENROLLED &&
      monthKey(localDateOf(contact.enrolled_at)) === key,
  ).length;

  const sources = new Map();

  monthLeads.forEach((contact) => {
    const label = getSourceLabel(contact.source) ?? "Não informada";
    sources.set(label, (sources.get(label) ?? 0) + 1);
  });

  return {
    key,
    leads: monthLeads.length,
    scheduled: monthSessions.length,
    attended,
    enrolled,
    conversion: attended ? Math.round((enrolled / attended) * 100) : null,
    sources: [...sources.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/* =========================================================
 * MONTAGEM
 * =======================================================*/

export function buildDashboard({ sessions, contacts, availability }) {
  const today = toLocalISO();
  const confirmUntil = addDaysISO(today, CONFIRM_DAYS);
  const upcomingUntil = addDaysISO(today, UPCOMING_FOLLOW_UP_DAYS);

  const liveSessions = sessions.filter((session) => !session.contact?.archived_at);
  const liveContacts = contacts.filter((contact) => !contact.archived_at);

  // Pendências
  const overdue = liveSessions.filter(
    (session) => session.experimental_date < today && OPEN_SESSION.includes(session.status),
  );

  const toConfirm = liveSessions.filter(
    (session) =>
      session.status === EXPERIMENTAL_STATUS.PENDING_CONFIRMATION &&
      session.experimental_date >= today &&
      session.experimental_date <= confirmUntil,
  );

  const followUps = liveContacts
    .filter((contact) => contact.status === CONTACT_STATUS.FOLLOW_UP && contact.follow_up_date)
    .sort((a, b) => String(a.follow_up_date).localeCompare(String(b.follow_up_date)));

  const followUpsDue = followUps.filter(
    (contact) => localDateOf(contact.follow_up_date) <= today,
  );

  const followUpsUpcoming = followUps.filter((contact) => {
    const date = localDateOf(contact.follow_up_date);
    return date > today && date <= upcomingUntil;
  });

  const waitingNow = liveContacts.filter(
    (contact) =>
      contact.status === CONTACT_STATUS.WAITING_LIST &&
      getBoardGroupKey(contact, availability) === "now",
  ).length;

  const triage = contacts.filter(isTriage).length;

  // Vieram na experimental e a família ainda não decidiu
  const awaitingResult = liveSessions.filter(isAwaitingResult).length;

  // Agenda: hoje + próximo dia com experimental
  const agendaSessions = liveSessions.filter(
    (session) => session.experimental_date >= today && AGENDA_SESSION.includes(session.status),
  );

  const nextDay = agendaSessions
    .map((session) => session.experimental_date)
    .filter((date) => date > today)
    .sort()[0];

  const agenda = [today, nextDay].filter(Boolean).map((date) => {
    const daySessions = agendaSessions
      .filter((session) => session.experimental_date === date)
      .sort((a, b) => sessionTime(a).localeCompare(sessionTime(b)));

    const byLocation = new Map();

    daySessions.forEach((session) => {
      const name = getSessionLocationName(session);
      if (!byLocation.has(name)) byLocation.set(name, []);
      byLocation.get(name).push(session);
    });

    return {
      date,
      isToday: date === today,
      total: daySessions.length,
      locations: [...byLocation.entries()]
        .map(([name, items]) => ({ name, items }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  });

  // Resultado do mês (sem os automáticos do WhatsApp ainda não triados)
  const leads = liveContacts.filter((contact) => contact.status !== WHATSAPP_AUTO_STATUS);
  const currentKey = monthKey(today);

  const month = buildMonth(currentKey, { leads, sessions: liveSessions, contacts });
  const previousMonth = buildMonth(previousMonthKey(currentKey), {
    leads,
    sessions: liveSessions,
    contacts,
  });

  return {
    today,
    pending: {
      overdue: overdue.length,
      toConfirm: toConfirm.length,
      followUpsDue: followUpsDue.length,
      waitingNow,
      triage,
      awaitingResult,
    },
    agenda,
    followUpsDue,
    followUpsUpcoming: followUpsUpcoming.length,
    month,
    previousMonth,
  };
}
