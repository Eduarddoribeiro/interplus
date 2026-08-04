// src/helpers/waitingListRules.js

import {
  INTEREST_QUALIFICATION,
} from "../constants/interestQualification";

/* =========================================================
 * CAMPOS DE QUALIFICAÇÃO
 * =======================================================*/

const REQUIRED_CONTACT_FIELDS = [
  {
    key: "child_name",
    label: "Nome da criança",
  },
  {
    key: "responsible_name",
    label: "Responsável",
  },
  {
    key: "phone",
    label: "WhatsApp",
  },
  {
    key: "birth_date",
    label: "Data de nascimento",
  },
];

/* =========================================================
 * DADOS FALTANTES
 * =======================================================*/

export function getMissingContactFields(contact) {
  if (!contact) {
    return REQUIRED_CONTACT_FIELDS.map(
      (field) => field.label,
    );
  }

  return REQUIRED_CONTACT_FIELDS
    .filter(({ key }) => {
      const value = contact[key];

      if (value === null || value === undefined) {
        return true;
      }

      if (
        typeof value === "string" &&
        !value.trim()
      ) {
        return true;
      }

      return false;
    })
    .map((field) => field.label);
}

/* =========================================================
 * CATEGORIA DE INTERESSE
 * =======================================================*/

export function getInterestCategory(contact) {
  if (!contact) {
    return null;
  }

  return (
    contact.interest_category ||
    contact.category ||
    null
  );
}

export function getInterestCategoryId(contact) {
  if (!contact) {
    return null;
  }

  return (
    contact.interest_category_id ||
    contact.category_id ||
    null
  );
}

/* =========================================================
 * QUALIFICAÇÃO
 * =======================================================*/

export function getContactQualification(contact) {
  if (!contact) {
    return INTEREST_QUALIFICATION.INCOMPLETE;
  }

  /*
   * Se existe uma classificação manual salva,
   * ela tem prioridade.
   */
  if (contact.qualification_status) {
    return contact.qualification_status;
  }

  const missingFields =
    getMissingContactFields(contact);

  const categoryId =
    getInterestCategoryId(contact);

  /*
   * Cadastro incompleto:
   * faltam dados básicos ou categoria.
   */
  if (
    missingFields.length > 0 ||
    !categoryId
  ) {
    return INTEREST_QUALIFICATION.INCOMPLETE;
  }

  return INTEREST_QUALIFICATION.COMPLETE;
}

/* =========================================================
 * ESTADO COMPLETO DA QUALIFICAÇÃO
 * =======================================================*/

export function getWaitingListQualification(contact) {
  const missingFields =
    getMissingContactFields(contact);

  const category =
    getInterestCategory(contact);

  const categoryId =
    getInterestCategoryId(contact);

  const status =
    getContactQualification(contact);

  return {
    status,

    category,
    categoryId,

    preferredShift:
      contact?.preferred_shift || null,

    missingFields,

    hasMissingFields:
      missingFields.length > 0,

    hasCategory:
      Boolean(categoryId),

    isComplete:
      status ===
      INTEREST_QUALIFICATION.COMPLETE,

    needsConfirmation:
      status ===
      INTEREST_QUALIFICATION.NEEDS_CONFIRMATION,
  };
}