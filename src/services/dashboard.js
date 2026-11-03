import { getContacts, getExperimentals } from "./contacts";
import { getOpenTrialOptionsByCategory } from "./administration/trialSlots";
import { getStudentPendingCounts } from "./students";
import { getFamilyForms } from "./enrollmentForms";

import { CONTACT_STATUS } from "../constants/contactStatus";
import { getInterestCategory } from "../helpers/waitingListRules";
import { buildDashboard } from "../helpers/dashboardSummary";
import { familyFormGroups } from "../helpers/familyForms";

/**
 * Visão geral: pendências do dia, agenda, retornos e resultado do mês.
 *
 * Busca experimentais e contatos uma vez e calcula tudo em
 * helpers/dashboardSummary.js (sem SQL novo).
 */
export async function getDashboardData() {
  const [sessions, contacts, students, familyForms] = await Promise.all([
    getExperimentals(),
    getContacts(),
    getStudentPendingCounts(),
    getFamilyForms(),
  ]);

  // Vagas abertas por categoria, para "lista: podem agendar agora"
  const waitingCategoryIds = contacts
    .filter(
      (contact) =>
        !contact.archived_at && contact.status === CONTACT_STATUS.WAITING_LIST,
    )
    .map((contact) => getInterestCategory(contact)?.id);

  const availability = await getOpenTrialOptionsByCategory(waitingCategoryIds);

  const dashboard = buildDashboard({ sessions, contacts, availability });

  // Pós-matrícula: alunos com pendência atrasada (contrato, pagamento...)
  dashboard.pending.studentsOverdue = students.overdue;

  // Fichas da família: preenchidas para conferir, links vencidos, aguardando
  const forms = familyFormGroups(familyForms);
  dashboard.pending.formsToReview = forms.conferir.length;
  dashboard.pending.formsExpired = forms.vencido.length;
  dashboard.pending.formsWaiting = forms.aguardando.length;

  return dashboard;
}
