import { getLostReasonLabel } from "../constants/lostReasons";
import { getSourceLabel } from "../constants/school";
import { formatShortDate, formatTime } from "./experimentalDates";

/*
 * Linha do tempo do contato, montada do que já está salvo: datas do
 * contato, experimentais e as linhas "[dd/mm/aaaa] texto" das
 * observações internas. Não há tabela de eventos; por isso o que não
 * tem data salva (ex.: dia exato do encerramento) usa a última
 * atualização do contato.
 *
 * Cada item: { key, at (YYYY-MM-DD ou ISO), title, detail, tone, upcoming }
 * tone: "ok" | "alert" | undefined
 */

const NOTE_LINE = /^\[(\d{2})\/(\d{2})\/(\d{4})\]\s*(.+)$/;

function sessionWhen(session) {
  const time = session.experimental_time ? ` às ${formatTime(session.experimental_time)}` : "";
  return `${formatShortDate(session.experimental_date)}${time}`;
}

function dayOf(value) {
  return value ? String(value).slice(0, 10) : "";
}

export function parseNoteLines(notes) {
  if (!notes) return [];

  return String(notes)
    .split(/\r?\n/)
    .map((line) => line.trim().match(NOTE_LINE))
    .filter(Boolean)
    .map(([, day, month, year, text]) => ({ at: `${year}-${month}-${day}`, text: text.trim() }));
}

export function buildContactTimeline(contact, sessions = [], today) {
  if (!contact) return [];

  const events = [];
  const push = (event) => event.at && events.push(event);

  push({
    key: "first",
    at: contact.first_contact_at || contact.created_at,
    title: "Primeiro contato",
    detail: contact.source ? `Conheceu por ${getSourceLabel(contact.source) ?? contact.source}` : null,
  });

  sessions.forEach((session) => {
    const remarcada = session.status === "cancelled";

    push({
      key: `marcada-${session.id}`,
      at: session.created_at || session.experimental_date,
      title: `Experimental marcada para ${sessionWhen(session)}`,
      detail: remarcada ? "Remarcada depois para outra data" : session.category?.name ?? null,
    });

    if (session.status === "attended") {
      push({ key: `veio-${session.id}`, at: session.experimental_date, title: "Veio à experimental", tone: "ok" });
    }

    if (session.status === "no_show") {
      push({ key: `faltou-${session.id}`, at: session.experimental_date, title: "Faltou à experimental", tone: "alert" });
    }

    if (["pending_confirmation", "confirmed"].includes(session.status) && session.experimental_date >= today) {
      push({
        key: `proxima-${session.id}`,
        at: session.experimental_date,
        title: `Experimental ${session.status === "confirmed" ? "confirmada" : "a confirmar"}`,
        detail: sessionWhen(session),
        upcoming: true,
      });
    }
  });

  push({ key: "retornos", at: contact.follow_up_started_at, title: "Entrou em Retornos" });

  if (contact.status === "follow_up" && contact.follow_up_date) {
    push({
      key: "proximo-retorno",
      at: contact.follow_up_date,
      title: "Retorno programado",
      detail: formatShortDate(contact.follow_up_date),
      upcoming: dayOf(contact.follow_up_date) >= today,
    });
  }

  if (contact.status === "waiting_list") {
    push({ key: "lista", at: contact.waiting_list_at, title: "Entrou na lista de interesse" });
  }

  push({ key: "matricula", at: contact.enrolled_at, title: "Matrícula", tone: "ok" });

  if (contact.status === "lost") {
    push({
      key: "encerrado",
      at: contact.updated_at,
      title: "Encerrado",
      detail: getLostReasonLabel(contact.lost_reason) || null,
    });
  }

  parseNoteLines(contact.internal_notes).forEach((note, index) => {
    push({ key: `nota-${index}`, at: note.at, title: note.text, note: true });
  });

  // Próximos em cima; depois do mais recente para o mais antigo
  return events.sort((a, b) => {
    if (Boolean(a.upcoming) !== Boolean(b.upcoming)) return a.upcoming ? -1 : 1;
    return String(b.at).localeCompare(String(a.at));
  });
}
