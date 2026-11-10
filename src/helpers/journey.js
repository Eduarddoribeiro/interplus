import { CONTACT_STATUS } from "../constants/contactStatus";
import { getDaysSince, getLastActivity } from "./contactTabs";
import { addDaysISO, CONFIRM_DAYS, toLocalISO } from "./dashboardSummary";
import { formatShortDate, formatTime } from "./experimentalDates";

/*
 * Etapas da Jornada das famílias, montadas a partir dos status atuais
 * do contato (sem mudar o banco). Matriculados e encerrados acumulam,
 * então só entram os dos últimos RECENT_DAYS dias.
 */
export const RECENT_DAYS = 30;

const NEW_CONTACT_WAIT_DAYS = 2;
const RESULT_WAIT_DAYS = 3;

export const JOURNEY_STAGES = [
  {
    key: "new",
    label: "Novo contato",
    hint: "Ainda sem aula marcada",
    statuses: [CONTACT_STATUS.NEW_CONTACT],
  },
  {
    key: "scheduled",
    label: "Aula marcada",
    hint: "A confirmar ou confirmada",
    statuses: [CONTACT_STATUS.PENDING_CONFIRMATION, CONTACT_STATUS.CONFIRMED],
  },
  {
    key: "attended",
    label: "Fez a aula",
    hint: "Esperando o resultado",
    statuses: [CONTACT_STATUS.ATTENDED],
  },
  {
    key: "no_show",
    label: "Faltou",
    hint: "Remarcar, retornar ou encerrar",
    statuses: [CONTACT_STATUS.NO_SHOW],
  },
  {
    key: "follow_up",
    label: "Em retorno",
    hint: "Novo contato com a família",
    statuses: [CONTACT_STATUS.FOLLOW_UP],
  },
  {
    key: "waiting",
    label: "Lista de interesse",
    hint: "Esperando vaga ou turma",
    statuses: [CONTACT_STATUS.WAITING_LIST],
  },
  {
    key: "enrolled",
    label: "Matriculado",
    hint: "Matrículas recentes",
    statuses: [CONTACT_STATUS.ENROLLED],
    recentOnly: true,
    moreTo: "/admin/contacts?aba=enrolled",
  },
  {
    key: "closed",
    label: "Encerrado",
    hint: "Não vão seguir",
    statuses: [CONTACT_STATUS.LOST, CONTACT_STATUS.CANCELLED],
    recentOnly: true,
    moreTo: "/admin/contacts?aba=closed",
  },
];

function sessionLabel(contact) {
  if (!contact.experimental_date) return null;

  const time = contact.experimental_time ? ` às ${formatTime(contact.experimental_time)}` : "";
  return `Aula ${formatShortDate(contact.experimental_date)}${time}`;
}

/*
 * O que o cartão mostra e se pede ação hoje (faixa amarela).
 * Só pede ação o que tem algo a fazer; tempo parado sem ação é texto cinza.
 */
export function describeJourneyCard(contact, today = toLocalISO()) {
  const days = getDaysSince(getLastActivity(contact)) ?? 0;

  switch (contact.status) {
    case CONTACT_STATUS.NEW_CONTACT:
      return { detail: null, waiting: days >= NEW_CONTACT_WAIT_DAYS ? "marcar a aula" : null };

    case CONTACT_STATUS.PENDING_CONFIRMATION: {
      const soon = contact.experimental_date && contact.experimental_date <= addDaysISO(today, CONFIRM_DAYS);
      return { detail: sessionLabel(contact), waiting: soon ? "confirmar a aula" : null };
    }

    case CONTACT_STATUS.CONFIRMED:
      return { detail: sessionLabel(contact), waiting: null };

    case CONTACT_STATUS.ATTENDED:
      return { detail: sessionLabel(contact), waiting: days >= RESULT_WAIT_DAYS ? "falta o resultado" : null };

    case CONTACT_STATUS.NO_SHOW:
      return { detail: sessionLabel(contact), waiting: "decidir o próximo passo" };

    case CONTACT_STATUS.FOLLOW_UP:
      return {
        detail: contact.follow_up_date ? `Retorno ${formatShortDate(contact.follow_up_date)}` : null,
        waiting: contact.follow_up_date && contact.follow_up_date <= today ? "retorno para fazer" : null,
      };

    default:
      return { detail: null, waiting: null };
  }
}

function stageDate(contact, stage) {
  if (stage.key === "enrolled") return contact.enrolled_at || getLastActivity(contact);
  return getLastActivity(contact);
}

export function buildJourney(contacts, today = toLocalISO()) {
  return JOURNEY_STAGES.map((stage) => {
    const items = contacts
      .filter((contact) => stage.statuses.includes(contact.status))
      .filter((contact) => !stage.recentOnly || (getDaysSince(stageDate(contact, stage)) ?? Infinity) <= RECENT_DAYS)
      .map((contact) => ({ contact, ...describeJourneyCard(contact, today) }))
      // Quem pede ação primeiro; depois quem está parado há mais tempo
      .sort((a, b) => {
        // Matrículas e encerramentos: os mais recentes primeiro
        if (stage.recentOnly) return String(stageDate(b.contact, stage)).localeCompare(String(stageDate(a.contact, stage)));
        if (Boolean(a.waiting) !== Boolean(b.waiting)) return a.waiting ? -1 : 1;
        return String(getLastActivity(a.contact)).localeCompare(String(getLastActivity(b.contact)));
      });

    return { ...stage, items };
  });
}
