/*
 * Cliente de demonstração: imita o pedaço do supabase-js que o
 * painel usa (from/select/filtros/insert/update/delete, rpc e auth)
 * sobre tabelas guardadas na memória do navegador.
 *
 * Nada aqui fala com a internet. Os dados vêm de seed.js e as
 * alterações ficam na sessionStorage da aba (somem ao fechar).
 */

import { buildSeed } from "./seed";
import { STUDENT_TASKS } from "../constants/studentTasks";
import { toLocalISO } from "../helpers/dashboardSummary";
import { nextDueDate } from "../helpers/taskBoard";

// v2: alunos, responsáveis, matrículas e eventos
const STORAGE_KEY = "demo-db-v7";
const AUTH_KEY = "demo-signed-out";

/* =========================================================
 * BANCO EM MEMÓRIA
 * =======================================================*/

function loadDb() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // sem storage: segue com os dados iniciais
  }

  return buildSeed();
}

// Carregado só quando o cliente de demonstração é criado, para o
// site real não levar os dados fictícios junto
let db = null;

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // sem storage: as mudanças valem só até recarregar a página
  }
}

export function resetDemoData() {
  db = buildSeed();
  persist();
}

function table(name) {
  if (!db) db = loadDb();
  if (!db[name]) db[name] = [];
  return db[name];
}

// Colunas conhecidas de uma tabela (união das chaves das linhas)
function columnsOf(name) {
  const columns = new Set();
  table(name).forEach((row) => Object.keys(row).forEach((key) => columns.add(key)));
  return columns;
}

const UUID_TABLES = new Set([
  "contacts",
  "experimental_sessions",
  "students",
  "guardians",
  "enrollments",
  "enrollment_tasks",
  "events",
  "enrollment_invites",
  "enrollment_consents",
  "staff_tasks",
]);

function nextId(name) {
  if (UUID_TABLES.has(name)) return crypto.randomUUID();

  return table(name).reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
}

const now = () => new Date().toISOString();

/* =========================================================
 * SELECT: "*, alias:tabela!fk(col, sub:tabela(...))"
 * =======================================================*/

function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let current = "";

  for (const char of text) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;

    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  parts.push(current);

  return parts.map((part) => part.trim()).filter(Boolean);
}

function parseSelect(text = "*") {
  return splitTopLevel(text.replace(/\s+/g, " ")).map((item) => {
    const open = item.indexOf("(");

    if (open === -1) return { kind: "column", name: item };

    const head = item.slice(0, open).trim();
    const inner = item.slice(open + 1, item.lastIndexOf(")"));
    const [aliasPart, rest] = head.includes(":") ? head.split(":") : [null, head];
    const [target, hint] = rest.split("!");

    return {
      kind: "relation",
      alias: (aliasPart ?? target).trim(),
      table: target.trim(),
      hint: hint?.trim(),
      children: inner.trim() === "count" ? "count" : parseSelect(inner),
    };
  });
}

function singular(name) {
  if (name.endsWith("ies")) return `${name.slice(0, -3)}y`;
  if (name.endsWith("ches")) return name.slice(0, -2);
  if (name.endsWith("s")) return name.slice(0, -1);
  return name;
}

// Ligações que não seguem o nome padrão da coluna
const RELATION_OVERRIDES = {
  "experimental_sessions>training_group_schedules": { type: "one", column: "training_group_schedule_id" },
  "training_group_schedules>training_group_schedule_coaches": { type: "many", column: "schedule_id" },
};

function resolveRelation(from, relation) {
  const override = RELATION_OVERRIDES[`${from}>${relation.table}`];
  if (override) return override;

  if (relation.hint) {
    // ex.: contacts_interest_category_id_fkey -> interest_category_id
    const column = relation.hint.replace(/_fkey$/, "").replace(/^[a-z]+_/, "");
    return { type: "one", column };
  }

  const columns = columnsOf(from);

  if (columns.has(`${relation.alias}_id`)) return { type: "one", column: `${relation.alias}_id` };
  if (columns.has(`${singular(relation.table)}_id`)) {
    return { type: "one", column: `${singular(relation.table)}_id` };
  }

  return { type: "many", column: `${singular(from)}_id` };
}

function sameValue(a, b) {
  if (a == null || b == null) return a == null && b == null;
  return String(a) === String(b);
}

function project(row, fields, from) {
  const result = {};

  fields.forEach((field) => {
    if (field.kind === "column") {
      if (field.name === "*") Object.assign(result, row);
      else result[field.name] = row[field.name] ?? null;
      return;
    }

    const link = resolveRelation(from, field);

    if (link.type === "one") {
      const target = table(field.table).find((other) => sameValue(other.id, row[link.column]));
      result[field.alias] = target ? project(target, field.children, field.table) : null;
      return;
    }

    const children = table(field.table).filter((other) => sameValue(other[link.column], row.id));

    result[field.alias] =
      field.children === "count"
        ? [{ count: children.length }]
        : children.map((child) => project(child, field.children, field.table));
  });

  return result;
}

/* =========================================================
 * CONSULTA
 * =======================================================*/

function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR");
}

class Query {
  constructor(tableName) {
    this.tableName = tableName;
    this.operation = "select";
    this.fields = "*";
    this.returning = null;
    this.filters = [];
    this.orders = [];
    this.limitCount = null;
    this.mode = null;
    this.countOnly = false;
  }

  select(fields = "*", options = {}) {
    if (this.operation === "select") {
      this.fields = fields;
      this.countOnly = Boolean(options.head);
    } else {
      this.returning = fields;
    }

    return this;
  }

  insert(values) {
    this.operation = "insert";
    this.values = Array.isArray(values) ? values : [values];
    return this;
  }

  update(values) {
    this.operation = "update";
    this.values = values;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => sameValue(row[column], value));
    return this;
  }

  neq(column, value) {
    this.filters.push((row) => !sameValue(row[column], value));
    return this;
  }

  in(column, values) {
    this.filters.push((row) => values.some((value) => sameValue(row[column], value)));
    return this;
  }

  is(column, value) {
    this.filters.push((row) => (value === null ? row[column] == null : row[column] === value));
    return this;
  }

  not(column, operator, value) {
    if (operator === "is" && value === null) this.filters.push((row) => row[column] != null);
    return this;
  }

  gte(column, value) {
    this.filters.push((row) => row[column] != null && compare(row[column], value) >= 0);
    return this;
  }

  lte(column, value) {
    this.filters.push((row) => row[column] != null && compare(row[column], value) <= 0);
    return this;
  }

  order(column, { ascending = true, nullsFirst } = {}) {
    this.orders.push({ column, ascending, nullsFirst });
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.mode = "single";
    return this;
  }

  maybeSingle() {
    this.mode = "maybe";
    return this;
  }

  matching() {
    return table(this.tableName).filter((row) => this.filters.every((test) => test(row)));
  }

  run() {
    const name = this.tableName;
    let rows;

    if (this.operation === "insert") {
      rows = this.values.map((values) => ({
        id: nextId(name),
        created_at: now(),
        updated_at: now(),
        ...(name === "coach_links" ? { token: crypto.randomUUID().replace(/-/g, "") } : {}),
        ...(name === "enrollment_invites"
          ? { expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), used_at: null, revoked_at: null, reviewed_at: null }
          : {}),
        ...(name === "staff_tasks"
          ? { status: "todo", repeat: "none", next_created: false, done_at: null, created_by: DEMO_USER.id }
          : {}),
        ...values,
      }));
      table(name).push(...rows);
      persist();
    } else if (this.operation === "update") {
      rows = this.matching();
      rows.forEach((row) =>
        name === "staff_tasks" ? updateStaffTask(row, this.values) : Object.assign(row, this.values),
      );
      persist();
    } else if (this.operation === "delete") {
      rows = this.matching();
      const kept = table(name).filter((row) => !rows.includes(row));
      db[name] = kept;
      persist();
    } else {
      rows = this.matching();
    }

    if (this.operation === "select") {
      if (this.countOnly) return { data: null, count: rows.length, error: null };

      rows = [...rows].sort((a, b) => {
        for (const { column, ascending, nullsFirst } of this.orders) {
          if (a[column] == null || b[column] == null) {
            if (a[column] == null && b[column] == null) continue;
            const nullFirst = nullsFirst ?? !ascending;
            return (a[column] == null) === nullFirst ? -1 : 1;
          }
          const result = compare(a[column], b[column]);
          if (result) return ascending ? result : -result;
        }
        return 0;
      });

      if (this.limitCount != null) rows = rows.slice(0, this.limitCount);
    }

    const fields = this.operation === "select" ? this.fields : this.returning;

    if (this.operation !== "select" && fields == null) return { data: null, error: null };

    const parsed = parseSelect(fields ?? "*");
    const data = rows.map((row) => project(row, parsed, name));

    if (this.mode === "single") {
      if (data.length !== 1) {
        return { data: null, error: { code: "PGRST116", message: "Registro não encontrado." } };
      }
      return { data: data[0], error: null };
    }

    if (this.mode === "maybe") return { data: data[0] ?? null, error: null };

    return { data, error: null };
  }

  then(resolve, reject) {
    try {
      return Promise.resolve(this.run()).then(resolve, reject);
    } catch (err) {
      return Promise.resolve({ data: null, error: { message: err.message } }).then(resolve, reject);
    }
  }
}

/* =========================================================
 * FUNÇÕES (rpc) — mesmas regras das funções do banco real
 * =======================================================*/

function todayISO() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isoWeekday(iso) {
  const day = new Date(`${iso}T12:00:00`).getDay();
  return day === 0 ? 7 : day;
}

function byId(name, id) {
  return table(name).find((row) => sameValue(row.id, id));
}

function trialOptions({ p_category_id: categoryId, p_unit_id: unitId }) {
  const today = todayISO();
  const nowTime = new Date().toTimeString().slice(0, 8);

  const groupIds = new Set(
    table("training_group_categories")
      .filter((link) => sameValue(link.category_id, categoryId))
      .map((link) => String(link.training_group_id)),
  );

  return table("training_group_schedules")
    .filter((schedule) => schedule.active && schedule.allow_trial && groupIds.has(String(schedule.training_group_id)))
    .map((schedule) => {
      const group = byId("training_groups", schedule.training_group_id);
      if (!group || group.status !== "open") return null;

      const location = byId("locations", group.location_id);
      const unit = location && byId("units", location.unit_id);
      if (!location || !unit || (unitId && !sameValue(unit.id, unitId))) return null;

      const modality = byId("modalities", group.modality_id);
      let nextDate = addDays(today, (schedule.weekday - isoWeekday(today) + 7) % 7);
      if (nextDate === today && schedule.start_time <= nowTime) nextDate = addDays(nextDate, 7);

      const taken = table("experimental_sessions").filter(
        (session) =>
          sameValue(session.training_group_schedule_id, schedule.id) &&
          session.experimental_date === nextDate &&
          ["pending_confirmation", "confirmed"].includes(session.status),
      ).length;

      const coachNames = table("training_group_schedule_coaches")
        .filter((link) => sameValue(link.schedule_id, schedule.id))
        .map((link) => byId("coaches", link.coach_id)?.name)
        .filter(Boolean)
        .sort();

      return {
        schedule_id: schedule.id,
        training_group_id: group.id,
        group_name: group.name,
        featured: group.featured,
        modality_id: modality?.id ?? null,
        modality_name: modality?.name ?? null,
        location_id: location.id,
        location_name: location.name,
        location_address: location.address,
        unit_id: unit.id,
        unit_name: unit.name,
        weekday: schedule.weekday,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        next_date: nextDate,
        spots_left: schedule.experimental_limit ? Math.max(schedule.experimental_limit - taken, 0) : null,
        coach_names: coachNames.length ? coachNames : null,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        compare(a.location_name, b.location_name) ||
        a.weekday - b.weekday ||
        compare(a.start_time, b.start_time),
    );
}

function categoryLocations({ p_category_id: categoryId }) {
  const seen = new Map();

  table("training_group_categories")
    .filter((link) => sameValue(link.category_id, categoryId))
    .forEach((link) => {
      const group = byId("training_groups", link.training_group_id);
      if (!group || !["open", "closed"].includes(group.status)) return;

      const location = byId("locations", group.location_id);
      if (location && location.active !== false) {
        seen.set(location.id, { id: location.id, name: location.name, unit_id: location.unit_id });
      }
    });

  return [...seen.values()].sort((a, b) => compare(a.name, b.name));
}

function publicRegister({ p }) {
  if (!p.consent) throw new Error("É preciso autorizar o contato pelo WhatsApp para concluir.");

  const base = {
    id: nextId("contacts"),
    child_name: p.child_name,
    birth_date: p.birth_date,
    responsible_name: p.responsible_name,
    phone: p.phone,
    email: p.email || null,
    neighborhood: p.neighborhood || null,
    entry_channel: "public_form",
    source: p.source || null,
    first_contact_at: now(),
    created_at: now(),
    updated_at: now(),
    archived_at: null,
  };

  if (p.waiting_list_reason) {
    table("contacts").push({
      ...base,
      status: "waiting_list",
      waiting_list_reason: p.waiting_list_reason,
      waiting_list_at: now(),
      interest_category_id: p.category_id ?? null,
      location_id: p.location_id ?? null,
      preferred_shift: p.preferred_shift || "any",
    });
    persist();
    return { type: "waiting_list" };
  }

  const schedule = byId("training_group_schedules", p.training_group_schedule_id);
  if (!schedule) throw new Error("Horário indisponível para aula experimental.");

  const group = byId("training_groups", schedule.training_group_id);

  table("contacts").push({
    ...base,
    status: "pending_confirmation",
    category_id: p.category_id,
    location_id: group?.location_id ?? null,
    training_group_id: group?.id ?? null,
    experimental_date: p.experimental_date,
    experimental_time: schedule.start_time,
    trained_elsewhere: Boolean(p.trained_elsewhere),
    previous_club: p.previous_club || null,
  });

  table("experimental_sessions").push({
    id: nextId("experimental_sessions"),
    contact_id: base.id,
    category_id: p.category_id,
    training_group_schedule_id: schedule.id,
    experimental_date: p.experimental_date,
    experimental_time: schedule.start_time,
    status: "pending_confirmation",
    notes: null,
    coach_notes: p.coach_notes || null,
    created_at: now(),
    updated_at: now(),
  });

  persist();
  return { type: "scheduled" };
}

// Mesmos campos e regras de coach_session_list no banco real
function coachSessionList({ p_token: token }) {
  const link = table("coach_links").find((row) => row.token === token);
  const today = todayISO();

  if (!link || today > addDays(link.session_date, 1)) {
    throw new Error("Link inválido ou expirado.");
  }

  const ageOn = (birth, date) => {
    if (!birth) return null;
    const [by, bm, bd] = birth.split("-").map(Number);
    const [y, m, d] = date.split("-").map(Number);
    return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
  };

  return table("experimental_sessions")
    .filter(
      (session) =>
        session.experimental_date === link.session_date &&
        ["pending_confirmation", "confirmed", "attended", "no_show"].includes(session.status),
    )
    .map((session) => {
      const contact = byId("contacts", session.contact_id) ?? {};
      const schedule = byId("training_group_schedules", session.training_group_schedule_id);
      const group = schedule && byId("training_groups", schedule.training_group_id);
      const location = group && byId("locations", group.location_id);

      return {
        contact,
        location,
        row: {
          session_id: session.id,
          session_date: session.experimental_date,
          experimental_time: session.experimental_time ?? schedule?.start_time ?? null,
          child_label: (contact.child_name ?? "").trim().replace(/\s+/g, " "),
          age: ageOn(contact.birth_date, session.experimental_date),
          category_name: byId("categories", session.category_id)?.name ?? null,
          group_name: group?.name ?? null,
          location_name: location?.name ?? null,
          coach_notes: session.coach_notes ?? null,
          status: session.status,
          coach_feedback: session.coach_feedback ?? null,
          can_mark: today >= session.experimental_date,
        },
      };
    })
    .filter(({ contact, location }) =>
      !contact.archived_at && (!link.location_id || sameValue(location?.id, link.location_id)),
    )
    .map(({ row }) => row)
    .sort((a, b) => compare(a.experimental_time, b.experimental_time) || compare(a.child_label, b.child_label));
}

function coachMarkAttendance({ p_session_id: sessionId, p_attended: attended, p_feedback: feedback }) {
  const session = byId("experimental_sessions", sessionId);
  if (!session) throw new Error("Aula não encontrada.");

  if (attended !== null) session.status = attended ? "attended" : "no_show";
  if (feedback != null) session.coach_feedback = feedback;
  session.updated_at = now();
  persist();

  return { status: session.status };
}

// Mesmas regras de create_student_enrollment no banco real
function createStudentEnrollment({ p }) {
  const name = p?.student?.name?.trim();
  if (!name) throw new Error("Informe o nome do aluno.");

  if (p.contact_id && table("students").some((row) => sameValue(row.contact_id, p.contact_id))) {
    throw new Error("Este contato já tem ficha de aluno.");
  }

  const start = p.enrollment?.start_date || todayISO();
  const studentId = nextId("students");

  table("students").push({
    status: "active",
    left_at: null,
    left_reason: null,
    ...p.student,
    id: studentId,
    name,
    contact_id: p.contact_id ?? null,
    created_at: now(),
    updated_at: now(),
  });

  (p.guardians ?? [])
    .filter((guardian) => guardian.name?.trim())
    .forEach(({ relationship = null, ...guardian }, index) => {
      const guardianId = nextId("guardians");
      table("guardians").push({ ...guardian, id: guardianId, created_at: now(), updated_at: now() });
      table("student_guardians").push({ student_id: studentId, guardian_id: guardianId, position: index + 1, relationship });
    });

  const enrollmentId = nextId("enrollments");
  table("enrollments").push({
    ...p.enrollment,
    id: enrollmentId,
    student_id: studentId,
    season: p.enrollment?.season ?? Number(start.slice(0, 4)),
    start_date: start,
    created_at: now(),
    updated_at: now(),
  });

  STUDENT_TASKS.forEach(({ kind, days }) => {
    const status = p.tasks?.[kind] ?? "pending";
    table("enrollment_tasks").push({
      id: nextId("enrollment_tasks"),
      enrollment_id: enrollmentId,
      kind,
      status,
      due_date: addDays(start, days),
      done_at: status === "done" ? now() : null,
      updated_at: now(),
    });
  });

  if (p.health && Object.keys(p.health).length) {
    table("student_health").push({ ...p.health, student_id: studentId, updated_at: now() });
  }

  (p.events ?? []).forEach((item) => {
    table("event_participants").push({
      event_id: item.event_id,
      student_id: studentId,
      status: item.status ?? "confirmed",
      notes: null,
      updated_at: now(),
    });
  });

  persist();
  return studentId;
}

/* Formulário de matrícula: mesmas regras de public_enrollment_form
 * e public_enrollment_submit no banco real */
async function findInvite(token) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token ?? ""));
  const hash = [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return table("enrollment_invites").find((row) => row.token_hash === hash) ?? null;
}

function inviteProblem(invite) {
  if (!invite) return "invalid";
  if (invite.revoked_at) return "replaced";
  if (invite.used_at) return "used";
  if (invite.expires_at < now()) return "expired";
  return null;
}

const guardiansOfStudent = (studentId) =>
  table("student_guardians")
    .filter((link) => sameValue(link.student_id, studentId))
    .sort((a, b) => a.position - b.position)
    .map((link) => ({ link, guardian: table("guardians").find((row) => sameValue(row.id, link.guardian_id)) }));

const latestEnrollment = (studentId) =>
  table("enrollments")
    .filter((row) => sameValue(row.student_id, studentId))
    .sort((a, b) => b.season - a.season)[0];

const keep = (values) =>
  Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
      .filter(([, value]) => value !== "" && value != null),
  );

async function publicEnrollmentForm({ p_token: token }) {
  const invite = await findInvite(token);
  const problem = inviteProblem(invite);
  if (problem) return { status: problem };

  const student = table("students").find((row) => sameValue(row.id, invite.student_id));
  if (student?.status !== "active") return { status: "invalid" };

  const guardians = guardiansOfStudent(student.id).map(({ guardian }) => guardian ?? {});
  const enrollment = latestEnrollment(student.id);

  return {
    status: "ok",
    expires_at: invite.expires_at,
    category: table("categories").find((row) => sameValue(row.id, enrollment?.category_id))?.name ?? null,
    student: { name: student.name, birth_date: student.birth_date },
    guardians: [0, 1].map((index) => ({
      name: guardians[index]?.name ?? null,
      phone: guardians[index]?.phone ?? null,
      email: guardians[index]?.email ?? null,
    })),
  };
}

async function publicEnrollmentSubmit({ p_token: token, p }) {
  const invite = await findInvite(token);
  const problem = inviteProblem(invite);
  if (problem === "used") throw new Error("Este formulário já foi enviado.");
  if (problem === "expired") throw new Error("Este link venceu. Peça um novo à escola.");
  if (problem) throw new Error("Este link não vale mais. Peça um novo à escola.");

  const consent = p?.consent ?? {};
  if (consent.accepted !== true || !consent.version || !consent.purpose_text || !consent.accepted_by?.trim()) {
    throw new Error("Confirme a autorização para enviar.");
  }
  if (!p.student?.name?.trim()) throw new Error("Informe o nome do aluno.");

  const student = table("students").find((row) => sameValue(row.id, invite.student_id));
  Object.assign(student, keep(p.student), { updated_at: now() });

  const existing = guardiansOfStudent(student.id);
  (p.guardians ?? []).slice(0, 2).forEach((values, index) => {
    if (!values?.name?.trim()) return;
    const position = index + 1;
    let guardian = existing.find(({ link }) => link.position === position)?.guardian;

    if (!guardian) {
      guardian = { id: nextId("guardians"), created_at: now() };
      table("guardians").push(guardian);
      table("student_guardians").push({ student_id: student.id, guardian_id: guardian.id, position, relationship: null });
    }

    Object.assign(guardian, keep(values), { updated_at: now() });
  });

  const enrollment = latestEnrollment(student.id);
  if (enrollment) {
    Object.assign(enrollment, keep(p.enrollment ?? {}), {
      next_action: enrollment.next_action ?? "Conferir o formulário preenchido pela família",
      updated_at: now(),
    });
  }

  if (consent.health === true) {
    const values = keep(p.health ?? {});
    const health = table("student_health").find((row) => sameValue(row.student_id, student.id));
    if (health) Object.assign(health, values, { updated_at: now() });
    else table("student_health").push({ ...values, student_id: student.id, updated_at: now() });
  }

  table("enrollment_consents").push({
    id: nextId("enrollment_consents"),
    student_id: student.id,
    invite_id: invite.id,
    version: consent.version,
    purpose_text: consent.purpose_text,
    health_consent: consent.health === true,
    health_text: consent.health === true ? consent.health_text : null,
    accepted_by: consent.accepted_by.trim(),
    accepted_at: now(),
  });

  invite.used_at = now();
  persist();
  return null;
}

/* =========================================================
 * TAREFAS DA EQUIPE: o mesmo que o gatilho staff_tasks_before_update
 * =======================================================*/
function updateStaffTask(row, values) {
  const before = { ...row };
  Object.assign(row, values, { updated_at: now() });

  if (row.status === "done" && before.status !== "done") {
    row.done_at = row.done_at ?? now();

    if (row.repeat !== "none" && !before.next_created) {
      table("staff_tasks").push({
        id: nextId("staff_tasks"),
        title: row.title,
        notes: row.notes,
        area: row.area,
        status: "todo",
        due_date: nextDueDate(row.due_date, row.repeat, toLocalISO()),
        assigned_to: row.assigned_to,
        repeat: row.repeat,
        next_created: false,
        done_at: null,
        created_by: DEMO_USER.id,
        created_at: now(),
        updated_at: now(),
      });
      row.next_created = true;
    }
  } else if (row.status !== "done") {
    row.done_at = null;
  }
}

const DEMO_STAFF = [
  { user_id: "demo-user", name: "Visitante" },
  { user_id: "demo-secretaria", name: "Camila" },
];

const RPC = {
  staff_members: () => DEMO_STAFF,
  create_student_enrollment: createStudentEnrollment,
  public_enrollment_form: publicEnrollmentForm,
  public_enrollment_submit: publicEnrollmentSubmit,
  public_trial_options: trialOptions,
  public_category_locations: categoryLocations,
  public_register: publicRegister,
  coach_session_list: coachSessionList,
  coach_mark_attendance: coachMarkAttendance,
};

/* =========================================================
 * LOGIN DE DEMONSTRAÇÃO (sem senha)
 * =======================================================*/

const DEMO_USER = { id: "demo-user", email: "demonstracao@exemplo.com" };
const listeners = new Set();

function isSignedOut() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

function currentSession() {
  return isSignedOut() ? null : { user: DEMO_USER, access_token: "demo" };
}

function setSignedOut(value) {
  try {
    if (value) sessionStorage.setItem(AUTH_KEY, "1");
    else sessionStorage.removeItem(AUTH_KEY);
  } catch {
    // sem storage: fica sempre logado
  }

  const session = currentSession();
  listeners.forEach((listener) => listener(value ? "SIGNED_OUT" : "SIGNED_IN", session));
}

const auth = {
  async getSession() {
    return { data: { session: currentSession() }, error: null };
  },
  async getUser() {
    return { data: { user: currentSession()?.user ?? null }, error: null };
  },
  async signInWithPassword() {
    setSignedOut(false);
    return { data: { session: currentSession(), user: DEMO_USER }, error: null };
  },
  async signOut() {
    setSignedOut(true);
    return { error: null };
  },
  onAuthStateChange(listener) {
    listeners.add(listener);
    return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
  },
};

export function createDemoClient() {
  return {
    from: (name) => new Query(name),
    async rpc(name, params = {}) {
      try {
        const handler = RPC[name];
        if (!handler) return { data: null, error: { message: `Função ${name} indisponível na demonstração.` } };
        return { data: await handler(params), error: null };
      } catch (err) {
        return { data: null, error: { message: err.message } };
      }
    },
    auth,
  };
}
