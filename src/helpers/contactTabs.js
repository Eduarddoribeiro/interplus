// src/helpers/contactTabs.js

import { CONTACT_STATUS } from "../constants/contactStatus";

/*
 * Em que "aba" cada contato está (tela de Contatos e Visão geral).
 */

// Status criado automaticamente pelo servidor do WhatsApp (fora do funil)
export const WHATSAPP_AUTO_STATUS = "new";

// Sem atividade há mais que isso = lead parado
export const STALE_DAYS = 60;

export const ACTIVE_STATUSES = [
  CONTACT_STATUS.NEW_CONTACT,
  CONTACT_STATUS.PENDING_CONFIRMATION,
  CONTACT_STATUS.CONFIRMED,
  CONTACT_STATUS.ATTENDED,
  CONTACT_STATUS.NO_SHOW,
  CONTACT_STATUS.FOLLOW_UP,
];

export const CLOSED_STATUSES = [CONTACT_STATUS.LOST, CONTACT_STATUS.CANCELLED];

export function isBlank(value) {
  return !value || !String(value).trim();
}

/*
 * Triagem: entrou sozinho pelo WhatsApp ou foi cadastrado sem o
 * nome do atleta. Precisa de alguém decidir se é lead.
 */
export function isTriage(contact) {
  if (contact.archived_at) return false;
  if (contact.status === WHATSAPP_AUTO_STATUS) return true;

  return (
    [CONTACT_STATUS.NEW_CONTACT, CONTACT_STATUS.WAITING_LIST].includes(contact.status) &&
    isBlank(contact.child_name)
  );
}

export function getLastActivity(contact) {
  return contact.updated_at || contact.first_contact_at || contact.created_at;
}

export function getDaysSince(value) {
  if (!value) return null;

  return Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 86400000), 0);
}

export function getContactTab(contact) {
  if (contact.archived_at) return "archived";
  if (isTriage(contact)) return "triage";
  if (contact.status === CONTACT_STATUS.WAITING_LIST) return "waiting";
  if (contact.status === CONTACT_STATUS.ENROLLED) return "enrolled";
  if (CLOSED_STATUSES.includes(contact.status)) return "closed";
  if (ACTIVE_STATUSES.includes(contact.status)) return "active";

  return "other";
}

export function isStale(contact) {
  return (
    getContactTab(contact) === "active" &&
    getDaysSince(getLastActivity(contact)) >= STALE_DAYS
  );
}
