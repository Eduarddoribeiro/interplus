import { getContacts, getExperimentals } from "./contacts";
import { getOpenTrialOptionsByCategory } from "./administration/trialSlots";

import { CONTACT_STATUS } from "../constants/contactStatus";
import { getInterestCategory } from "../helpers/waitingListRules";
import { buildDashboard } from "../helpers/dashboardSummary";

/**
 * Visão geral: pendências do dia, agenda, retornos e resultado do mês.
 *
 * Busca experimentais e contatos uma vez e calcula tudo em
 * helpers/dashboardSummary.js (sem SQL novo).
 */
export async function getDashboardData() {
  const [sessions, contacts] = await Promise.all([
    getExperimentals(),
    getContacts(),
  ]);

  // Vagas abertas por categoria, para "lista: podem agendar agora"
  const waitingCategoryIds = contacts
    .filter(
      (contact) =>
        !contact.archived_at && contact.status === CONTACT_STATUS.WAITING_LIST,
    )
    .map((contact) => getInterestCategory(contact)?.id);

  const availability = await getOpenTrialOptionsByCategory(waitingCategoryIds);

  return buildDashboard({ sessions, contacts, availability });
}
