/*
 * Importação da planilha de matrículas (Google Forms + colunas de
 * controle). Funções puras: leem o CSV e montam o que a função
 * create_student_enrollment recebe, sem acessar o banco.
 *
 * As colunas são reconhecidas pelo cabeçalho, sem acento, maiúscula
 * ou pontuação. Cabeçalhos repetidos ("Sexo", "CPF", "RG" aparecem
 * para o 1º responsável, o 2º e o aluno) são numerados pela ordem:
 * "sexo", "sexo#2", "sexo#3".
 */

import { normalizePhone } from "./contactPresentation";

export function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/* =========================================================
 * ARQUIVO
 * =======================================================*/

// O Google exporta em UTF-8; o Excel às vezes em Windows-1252
export function decodeFile(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

function detectDelimiter(text) {
  const firstLine = text.slice(0, text.indexOf("\n") === -1 ? undefined : text.indexOf("\n"));
  const counts = [",", ";", "\t"].map((char) => [char, firstLine.split(char).length]);

  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

// CSV com aspas, quebras de linha dentro de campos e "" escapado
export function parseCsv(text) {
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim()));
}

export function headerKeys(headers) {
  const seen = {};

  return headers.map((header) => {
    const key = normalizeText(header);
    seen[key] = (seen[key] ?? 0) + 1;
    return seen[key] > 1 ? `${key}#${seen[key]}` : key;
  });
}

/* =========================================================
 * COLUNAS → CAMPOS
 * =======================================================*/

// Cabeçalho exato → campo. "g1"/"g2" = 1º e 2º responsável
const EXACT = {
  ativo: "active",
  "carimbo de data hora": "enrollment.start_date",
  "e mail": "g1.email",
  "endereco de e mail": "g1.email_fallback",
  "nome do aluno": "student.name",
  categoria: "category",
  "experiencia colorada": "event.experience",
  pagamento: "event.experience_payment",
  "copa colorado": "event.cup",
  comunidade: "task.community",
  "participa da taca gaucha": "taca.participates",
  inscricao: "taca.entry",
  "contrato assinado": "task.contract_signed",
  "nome do responsavel": "g1.name",
  matricula: "fee.enrollment_fee",
  "tel celular": "g1.phone",
  "tel celular#2": "g2.phone",
  uniforme: "fee.uniform",
  "proxima acao": "enrollment.next_action",
  metodo: "enrollment.payment_method",
  "data de nascimento": "student.birth_date",
  "nome do segundo responsavel": "g2.name",
  "escolha o tamanho ideal": "enrollment.uniform_size",
  "qual posicao que atua": "student.field_position",
  "foto do aluno 3x4": "student.photo_url",
  sexo: "g1.gender",
  "sexo#2": "g2.gender",
  "sexo#3": "student.gender",
  "sexo 2": "student.gender",
  cpf: "g1.cpf",
  "cpf#2": "g2.cpf",
  "cpf 2": "g2.cpf",
  rg: "g1.rg",
  "rg#2": "g2.rg",
  "rg 2": "g2.rg",
  cep: "g1.zip_code",
  endereco: "g1.address",
  complemento: "g1.complement",
  bairro: "g1.neighborhood",
  cidade: "g1.city",
  uf: "g1.state",
  profissao: "g1.profession",
  "e mail do segundo responsavel": "g2.email",
  "celular do aluno": "student.phone",
  "rg do aluno": "student.rg",
  "cpf do aluno": "student.cpf",
  "como nos conheceu": "student.how_found",
  "escola onde estuda": "student.school",
  instituicao: "student.school_type",
  "qual time": "student.club_team",
  "qual jogador atual preferido": "student.favorite_player",
  "qual idolo": "student.idol",
  "melhor dia de vencimento": "enrollment.due_day",
  "tipo sanguineo": "health.blood_type",
};

// Perguntas longas de saúde: basta o começo
const PREFIX = [
  ["plano de saude", "health.health_plan"],
  ["o professor pode prestar os primeiros socorros", "health.first_aid_medication"],
  ["pratica de atividade fisica", "health.physical_activity"],
  ["fraturas e ou lesoes", "health.injuries"],
  ["cirurgias", "health.surgeries"],
  ["doencas pessoais", "health.diseases"],
  ["utiliza algum medicamento", "health.medications"],
  ["alergia a medicamentos", "health.drug_allergies"],
  ["indicacoes medicas", "health.medical_notes"],
];

export function fieldOf(key) {
  if (EXACT[key]) return EXACT[key];

  const round = key.match(/^rodada 0*(\d{1,2})$/);
  if (round) return `taca.round.${Number(round[1])}`;

  return PREFIX.find(([prefix]) => key.startsWith(prefix))?.[1] ?? null;
}

/* =========================================================
 * VALORES
 * =======================================================*/

const clean = (value) => {
  const text = String(value ?? "").trim();
  // "—" e "-" na planilha = vazio
  return normalizeText(text) ? text : "";
};

// "31/12/2016", "31/12/2016 10:20:00" ou "2016-12-31"
export function parseDate(value) {
  const text = clean(value);
  let match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);

  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return match[0];

  // Data salva pelo Excel como número de dias desde 30/12/1899
  const serial = Number(text.replace(",", "."));
  if (serial > 20000 && serial < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000).toISOString().slice(0, 10);
  }

  return null;
}

const YES = new Set(["sim", "s", "x", "ok", "pago", "paga", "feito"]);

// Colunas sim/não do contrato e da comunidade: vazio = pendente
export function checklistStatus(value) {
  return YES.has(normalizeText(value)) ? "done" : "pending";
}

// Colunas de pagamento: vazio ou "—" = não se aplica
export function feeStatus(value) {
  const text = normalizeText(value);

  if (!text) return "exempt";
  if (YES.has(text) || text.startsWith("pago") || text.startsWith("paga")) return "done";
  if (text.startsWith("isent")) return "exempt";
  return "pending";
}

export function eventStatus(value) {
  const text = normalizeText(value);

  if (!text || text === "nao") return null;
  if (text.startsWith("pag")) return "paid";
  if (text.startsWith("isent")) return "exempt";
  if (text.startsWith("nao partic")) return "absent";
  if (text.startsWith("pendent")) return "pending";
  if (text.startsWith("devolv")) return "refund";
  if (text.startsWith("interess")) return "interested";
  return "confirmed";
}

export function paymentMethod(value) {
  const text = normalizeText(value);

  if (text.startsWith("pix")) return "pix";
  if (text.startsWith("cart")) return "card";
  if (text.startsWith("bolet")) return "boleto";
  return null;
}

function dueDay(value) {
  const day = Number(normalizeText(value).match(/\d{1,2}/)?.[0]);
  return day >= 1 && day <= 31 ? day : null;
}

/* =========================================================
 * LINHA → MATRÍCULA
 * =======================================================*/

// "Não tem", "Nenhum" no nome do 2º responsável = não há
const NO_GUARDIAN = /^(nao|nenhum|nenhuma|nao tem|nao possui|nao ha)$/;

/*
 * Monta um registro por linha da planilha.
 * categories: [{ id, name }] para achar "Sub-11".
 */
export function rowToRecord(keys, cells, { categories = [] } = {}) {
  const student = {};
  const guardians = [{}, {}];
  const enrollment = {};
  const tasks = {};
  const health = {};
  const taca = { participates: false, entry: null, rounds: {} };
  const events = { experience: null, cup: null };
  const issues = [];
  let active = true;
  let category = "";

  keys.forEach((key, index) => {
    const field = fieldOf(key);
    const raw = cells[index] ?? "";
    const value = clean(raw);

    if (!field) return;

    const [group, name, extra] = field.split(".");

    switch (group) {
      case "active":
        if (value) active = normalizeText(value) !== "nao";
        break;
      case "student":
        if (name === "birth_date") student.birth_date = parseDate(value);
        else if (value) student[name] = value;
        break;
      case "g1":
      case "g2": {
        const guardian = guardians[group === "g1" ? 0 : 1];
        if (name === "email_fallback") {
          if (value && !guardian.email) guardian.email = value;
        } else if (value) {
          guardian[name] = value;
        }
        break;
      }
      case "enrollment":
        if (name === "start_date") enrollment.start_date = parseDate(value);
        else if (name === "payment_method") enrollment.payment_method = paymentMethod(value);
        else if (name === "due_day") enrollment.due_day = dueDay(value);
        else if (value) enrollment[name] = value;
        break;
      case "category":
        category = value;
        break;
      case "task":
        tasks[name] = checklistStatus(value);
        break;
      case "fee":
        tasks[name] = feeStatus(value);
        break;
      case "health":
        // "Não" também é resposta: guarda como veio
        if (value) health[name] = value;
        break;
      case "taca":
        if (name === "participates") taca.participates = normalizeText(value) === "sim";
        else if (name === "entry") taca.entry = eventStatus(value);
        else if (name === "round") {
          const status = eventStatus(value);
          if (status) taca.rounds[Number(extra)] = status;
        }
        break;
      case "event":
        if (name === "experience" && eventStatus(value)) {
          events.experience = events.experience ?? eventStatus(value);
        } else if (name === "experience_payment" && eventStatus(value) === "paid") {
          events.experience = "paid";
        } else if (name === "cup" && normalizeText(value) === "sim") {
          events.cup = "confirmed";
        }
        break;
      default:
        break;
    }
  });

  if (!student.name) issues.push("Sem nome do aluno");

  const categoryKey = normalizeText(category);
  const match = categories.find((item) => normalizeText(item.name) === categoryKey);

  if (match) enrollment.category_id = match.id;
  else if (category) issues.push(`Categoria "${category}" não existe no CRM`);

  if (!active) {
    student.status = "left";
  }

  // Quem não participa da Taça não leva inscrição nem rodadas
  const tacaStatus = taca.participates ? taca.entry ?? "confirmed" : null;

  return {
    student,
    guardians: guardians.filter((guardian) => guardian.name && !NO_GUARDIAN.test(normalizeText(guardian.name))),
    enrollment,
    tasks,
    health,
    taca: taca.participates ? { entry: tacaStatus, rounds: taca.rounds } : null,
    events,
    category,
    active,
    issues,
  };
}

export function readSpreadsheet(text, options) {
  const [headers = [], ...rows] = parseCsv(text);
  const keys = headerKeys(headers);

  const ignored = headers.filter((header, index) => header.trim() && !fieldOf(keys[index]));

  return {
    records: rows.map((cells, index) => ({ line: index + 2, ...rowToRecord(keys, cells, options) })),
    ignored,
  };
}

/* =========================================================
 * QUEM JÁ ESTÁ NO CRM
 * =======================================================*/

const lastDigits = (phone) => normalizePhone(phone).slice(-8);
const firstName = (name) => normalizeText(name).split(" ")[0] ?? "";

/*
 * Mesmo critério do aviso de duplicado dos contatos: telefone e
 * primeiro nome da criança iguais. Também casa nome completo +
 * data de nascimento (telefone trocado).
 */
export function sameChild(record, { name, birthDate, phones }) {
  const recordName = normalizeText(record.student.name);
  if (!recordName || !name) return false;

  if (recordName === normalizeText(name) && record.student.birth_date && record.student.birth_date === birthDate) {
    return true;
  }

  if (firstName(record.student.name) !== firstName(name)) return false;

  const recordPhones = [record.student.phone, ...record.guardians.map((guardian) => guardian.phone)]
    .map(lastDigits)
    .filter((digits) => digits.length === 8);

  return phones.map(lastDigits).some((digits) => digits.length === 8 && recordPhones.includes(digits));
}

export function findContact(record, contacts) {
  return (
    contacts.find((contact) =>
      sameChild(record, {
        name: contact.child_name,
        birthDate: contact.birth_date,
        phones: [contact.phone],
      }),
    ) ?? null
  );
}

export function findStudent(record, students) {
  return (
    students.find((student) =>
      sameChild(record, {
        name: student.name,
        birthDate: student.birth_date,
        phones: [student.phone, ...(student.guardianPhones ?? [])],
      }),
    ) ?? null
  );
}
