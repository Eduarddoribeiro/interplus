// src/helpers/waitingListFilters.js

import {
  WAITING_LIST_FILTER,
} from "../constants/waitingListFilters";

import {
  getWaitingListQualification,
} from "./waitingListRules";

/* =========================================================
 * FILTRAGEM
 * =======================================================*/

export function filterWaitingList(
  waitingList = [],
  filters,
) {
  if (!filters) {
    return waitingList;
  }

  return waitingList.filter((contact) => {
    const qualification =
      getWaitingListQualification(contact);

    /* CATEGORIA */

    if (
      filters.categoryId !==
        WAITING_LIST_FILTER.ALL &&
      String(qualification.categoryId) !==
        String(filters.categoryId)
    ) {
      return false;
    }

    /* TURNO */

    if (
      filters.preferredShift !==
        WAITING_LIST_FILTER.ALL &&
      qualification.preferredShift !==
        filters.preferredShift
    ) {
      return false;
    }

    /* DIA PREFERIDO */

    if (
      filters.preferredDay !==
        WAITING_LIST_FILTER.ALL &&
      !contact.preferred_days?.includes(
        filters.preferredDay,
      )
    ) {
      return false;
    }

    /* QUALIFICAÇÃO */

    if (
      filters.qualification !==
        WAITING_LIST_FILTER.ALL &&
      qualification.status !==
        filters.qualification
    ) {
      return false;
    }

    return true;
  });
}