// src/helpers/waitingListBoard.js

import { WAITING_LIST_REASON } from "../constants/waitingListReasons";
import { WEEKDAYS } from "../constants/weekdays";
import { SCHOOL } from "../constants/school";

import { getInterestCategory, getMissingContactFields } from "./waitingListRules";

/*
 * Lista de interesse organizada por OPORTUNIDADE:
 *
 *   - quadro de demanda (categoria x local)
 *   - grupos: pode agendar agora / aguardando / incompleto / futuros
 *   - mensagens prontas para o WhatsApp
 *
 * "Vaga" = turma ABERTA da categoria com vaga na próxima data
 * (mesma regra do formulário público, via public_trial_options).
 */

export const ANY_LOCATION = "any";

export const BOARD_GROUPS = [
  {
    key: "now",
    title: "Pode agendar agora",
    description: "Tem turma aberta com vaga para a idade e o local que a família quer.",
  },
  {
    key: "waiting",
    title: "Aguardando vaga ou turma",
    description: "Ainda não há turma aberta com vaga para essa idade ou local.",
  },
  {
    key: "incomplete",
    title: "Cadastro incompleto",
    description: "Falta data de nascimento, nome ou telefone para saber a categoria.",
  },
  {
    key: "future",
    title: "Futuros",
    description: "Ainda sem idade para começar.",
  },
];

const WEEKDAY_SHORT = Object.fromEntries(
  WEEKDAYS.map((weekday) => [weekday.value, weekday.short]),
);

// "19:00:00" -> "19h", "18:30:00" -> "18h30"
function formatHour(time) {
  const [hour, minute] = time.split(":");
  return minute === "00" ? `${Number(hour)}h` : `${Number(hour)}h${minute}`;
}

export function getLocationKey(contact) {
  return contact.location_id ? String(contact.location_id) : ANY_LOCATION;
}

/**
 * Opções com vaga de uma categoria, filtradas pelo local de
 * preferência (sem preferência = qualquer local).
 */
export function getOpenOptions(contact, availability) {
  const category = getInterestCategory(contact);

  if (!category?.id) return [];

  const options = availability[category.id] ?? [];
  const locationKey = getLocationKey(contact);

  return options.filter(
    (option) =>
      option.spots_left !== 0 &&
      (locationKey === ANY_LOCATION || String(option.location_id) === locationKey),
  );
}

export function getBoardGroupKey(contact, availability) {
  if (contact.waiting_list_reason === WAITING_LIST_REASON.AGE_CATEGORY) {
    return "future";
  }

  if (getMissingContactFields(contact).length > 0 || !getInterestCategory(contact)?.id) {
    return "incomplete";
  }

  return getOpenOptions(contact, availability).length > 0 ? "now" : "waiting";
}

export function getWaitingDays(contact) {
  if (!contact.waiting_list_at) return null;

  const start = new Date(contact.waiting_list_at);
  const diff = Date.now() - start.getTime();

  return Math.max(Math.floor(diff / 86400000), 0);
}

/**
 * Quadro de demanda: linhas = categorias, colunas = locais + "qualquer".
 */
export function buildDemandMatrix(contacts, locations, availability) {
  const rows = new Map();

  contacts.forEach((contact) => {
    const category = getInterestCategory(contact);
    const rowKey = category?.id ? String(category.id) : "none";

    if (!rows.has(rowKey)) {
      rows.set(rowKey, {
        key: rowKey,
        name: category?.name ?? "Sem categoria",
        categoryId: category?.id ?? null,
        cells: {},
        total: 0,
      });
    }

    const row = rows.get(rowKey);
    const columnKey = getLocationKey(contact);

    row.cells[columnKey] = (row.cells[columnKey] ?? 0) + 1;
    row.total += 1;
  });

  const columns = [
    ...locations.map((location) => ({ key: String(location.id), name: location.name })),
    { key: ANY_LOCATION, name: "Qualquer local" },
  ];

  const sortedRows = [...rows.values()]
    .sort((a, b) => {
      if (a.key === "none") return 1;
      if (b.key === "none") return -1;
      return a.name.localeCompare(b.name, "pt-BR");
    })
    .map((row) => {
      const options = row.categoryId ? availability[row.categoryId] ?? [] : [];
      const free = options.filter((option) => option.spots_left !== 0);

      return {
        ...row,
        // Coluna com turma aberta e vaga agora
        hasVacancy: Object.fromEntries(
          columns.map((column) => [
            column.key,
            column.key === ANY_LOCATION
              ? free.length > 0
              : free.some((option) => String(option.location_id) === column.key),
          ]),
        ),
      };
    });

  return { columns, rows: sortedRows };
}

/**
 * Resumo dos horários com vaga: "Ginásio do Krahe: Ter 19h e Sáb 9h".
 */
export function describeOptions(options) {
  const byLocation = new Map();

  options.forEach((option) => {
    if (!byLocation.has(option.location_name)) {
      byLocation.set(option.location_name, []);
    }

    byLocation
      .get(option.location_name)
      .push(`${WEEKDAY_SHORT[option.weekday]} ${formatHour(option.start_time)}`);
  });

  return [...byLocation.entries()]
    .map(([location, times]) => {
      const list = times.length > 1
        ? `${times.slice(0, -1).join(", ")} e ${times.at(-1)}`
        : times[0];

      return `${location}: ${list}`;
    })
    .join("; ");
}

function firstName(name) {
  return name?.trim().split(" ")[0] || "";
}

/**
 * Mensagem pronta para o WhatsApp.
 * Com vaga: convida para a experimental. Sem vaga: confirma o interesse.
 */
export function buildWaitingListMessage(contact, availability) {
  const category = getInterestCategory(contact);
  const responsible = firstName(contact.responsible_name);
  const child = firstName(contact.child_name);
  const greeting = responsible ? `Olá, ${responsible}!` : "Olá!";
  const athlete = child || "seu filho(a)";

  const options = getOpenOptions(contact, availability);

  if (options.length > 0) {
    return [
      `${greeting} Aqui é da ${SCHOOL.name}.`,
      `Abriu vaga para o ${category?.name ?? "a categoria"} 🎉`,
      `${describeOptions(options)}.`,
      `Quer agendar a aula experimental de ${athlete}? É só responder aqui.`,
    ].join("\n");
  }

  return [
    `${greeting} Aqui é da ${SCHOOL.name}.`,
    `${child ? `${child} continua` : "Vocês continuam"} na nossa lista de interesse${
      category?.name ? ` para o ${category.name}` : ""
    }.`,
    "Ainda tem interesse? Assim que abrir vaga, avisamos por aqui.",
  ].join("\n");
}
