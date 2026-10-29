// src/helpers/whatsappMessages.js

import { SCHOOL } from "../constants/school";
import { WEEKDAY_LABELS } from "../constants/weekdays";
import { mapsUrl } from "../utils/calendar";
import { createWhatsAppUrl } from "./contactPresentation";

/*
 * Mensagens prontas para o WhatsApp da família, a partir de uma
 * experimental (substitui o lembrete automático da Evolution).
 *
 * Cada mensagem abre o WhatsApp do atendente com o texto já
 * escrito; nada é enviado sozinho.
 */

function firstName(name) {
  return name?.trim().split(" ")[0] || "";
}

function formatDay(iso) {
  if (!iso) return "";

  const date = new Date(`${iso}T12:00:00`);
  const weekday = WEEKDAY_LABELS[date.getDay() || 7]?.toLowerCase();
  const [, month, day] = iso.split("-");

  return `${weekday}, ${day}/${month}`;
}

function formatHour(time) {
  return time ? time.slice(0, 5).replace(":", "h") : "";
}

function whatToBring(modalityName = "") {
  return /futsal/i.test(modalityName)
    ? "roupa confortável, tênis de futsal (ou tênis comum) e garrafinha de água"
    : "roupa confortável, chuteira society (ou tênis) e garrafinha de água";
}

function context(session) {
  const contact = session.contact || {};
  const group = session.schedule?.training_group;
  const location = group?.location;

  return {
    responsible: firstName(contact.responsible_name),
    child: firstName(contact.child_name) || "seu filho(a)",
    day: formatDay(session.experimental_date),
    time: formatHour(session.experimental_time || session.schedule?.start_time),
    category: session.category?.name ?? "",
    locationName: location?.name ?? "",
    address: location?.address ?? "",
    maps: location ? mapsUrl(location.name, location.address) : "",
    bring: whatToBring(group?.modality?.name),
  };
}

const TEMPLATES = {
  confirm: {
    label: "Confirmar aula",
    build: (c) =>
      [
        `Olá${c.responsible ? `, ${c.responsible}` : ""}! Aqui é da ${SCHOOL.name} ⚽`,
        `Recebemos o agendamento da aula experimental de ${c.child}${c.category ? ` (${c.category})` : ""}:`,
        `📅 ${c.day} às ${c.time}`,
        c.locationName && `📍 ${c.locationName}${c.address ? ` — ${c.address}` : ""}`,
        "Podemos confirmar a presença? É só responder com um *sim* 😊",
      ],
  },
  reminder: {
    label: "Lembrete de véspera",
    build: (c) =>
      [
        `Olá${c.responsible ? `, ${c.responsible}` : ""}! Passando para lembrar da aula experimental de ${c.child} amanhã 🙌`,
        `📅 ${c.day} às ${c.time}`,
        c.locationName && `📍 ${c.locationName}${c.address ? ` — ${c.address}` : ""}`,
        c.maps && `Como chegar: ${c.maps}`,
        `Leve ${c.bring}. Chegue uns 10 minutos antes.`,
        "Qualquer imprevisto, é só avisar por aqui.",
      ],
  },
  after: {
    label: "Pós-aula",
    build: (c) =>
      [
        `Olá${c.responsible ? `, ${c.responsible}` : ""}! Obrigado por trazer ${c.child} na aula experimental 💪`,
        `O que ${c.child} achou do treino?`,
        "Se quiserem, já te passo horários, uniforme e como funciona a matrícula.",
      ],
  },
  missed: {
    label: "Remarcar (faltou)",
    build: (c) =>
      [
        `Olá${c.responsible ? `, ${c.responsible}` : ""}! Sentimos falta de ${c.child} na aula experimental${c.day ? ` de ${c.day}` : ""}.`,
        "Tudo bem por aí? Quer que eu reagende para outro dia?",
      ],
  },
};

/**
 * Mensagens que fazem sentido para o status da experimental.
 */
export function getSessionMessages(session) {
  const keys = {
    pending_confirmation: ["confirm", "reminder"],
    confirmed: ["reminder", "confirm"],
    attended: ["after"],
    no_show: ["missed"],
  }[session.status] ?? [];

  const base = createWhatsAppUrl(session.contact?.phone);

  if (!base) return [];

  const data = context(session);

  return keys.map((key) => ({
    key,
    label: TEMPLATES[key].label,
    url: `${base}?text=${encodeURIComponent(
      TEMPLATES[key].build(data).filter(Boolean).join("\n"),
    )}`,
  }));
}
