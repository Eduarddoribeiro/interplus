import { getContacts, getExperimentals } from "./contacts";
import { getOpenTrialOptionsByCategory } from "./administration/trialSlots";
import { getStudentPendingCounts } from "./students";
import { getFamilyForms } from "./enrollmentForms";
import { getTasks } from "./tasks";

import { CONTACT_STATUS } from "../constants/contactStatus";
import { getInterestCategory } from "../helpers/waitingListRules";
import { buildDashboard, toLocalISO } from "../helpers/dashboardSummary";
import { familyFormGroups } from "../helpers/familyForms";
import { taskCounts } from "../helpers/taskBoard";

/**
 * Visão geral: pendências do dia, agenda, retornos e resultado do mês.
 *
 * Busca experimentais e contatos uma vez e calcula tudo em
 * helpers/dashboardSummary.js (sem SQL novo).
 */
export async function getDashboardData() {
  const [sessions, contacts, students, familyForms, tasks] = await Promise.all([
    getExperimentals(),
    getContacts(),
    getStudentPendingCounts(),
    getFamilyForms(),
    // Sem as tarefas, o resto da Visão geral continua funcionando
    getTasks().catch((err) => {
      console.error("Erro ao carregar tarefas da Visão geral:", err);
      return [];
    }),
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

  // Tarefas da equipe: mesma conta do quadro (helpers/taskBoard.js)
  const taskTotals = taskCounts(tasks, toLocalISO());
  dashboard.pending.tasksOverdue = taskTotals.overdue;
  dashboard.pending.tasksToday = taskTotals.today;

  return dashboard;
}
