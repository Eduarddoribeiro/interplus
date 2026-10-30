/*
 * Dados fictícios da demonstração.
 *
 * Nomes, telefones e locais são inventados. Os telefones usam o DDD
 * 00, que não existe, para nenhum link de WhatsApp cair numa pessoa
 * real. As datas são calculadas a partir de hoje, então a demo sempre
 * tem aulas nesta semana, retornos atrasados e matrículas no mês.
 *
 * O gerador é determinístico: todo visitante vê os mesmos dados.
 */

import { STUDENT_TASKS } from "../constants/studentTasks";

const STUDENT_TASK_DAYS = STUDENT_TASKS.map((task) => [task.kind, task.days]);

function random(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const KID_NAMES = [
  "Miguel", "Arthur", "Heitor", "Theo", "Davi", "Gabriel", "Bernardo", "Samuel", "Lucas", "Pedro",
  "Gael", "Rafael", "Enzo", "Lorenzo", "Benjamin", "Matheus", "Nicolas", "Guilherme", "Gustavo", "Bento",
  "Joaquim", "Henrique", "Murilo", "Isaac", "Lucca", "Leonardo", "Vicente", "Felipe", "Caio", "Vitor",
  "Helena", "Alice", "Laura", "Valentina", "Sophia", "Manuela", "Júlia", "Luiza", "Cecília", "Maitê",
];

const ADULT_NAMES = [
  "Ana", "Fernanda", "Juliana", "Patrícia", "Aline", "Camila", "Daniela", "Priscila", "Tatiane", "Vanessa",
  "Carlos", "Rodrigo", "Marcelo", "Anderson", "Fábio", "Leandro", "Diego", "Thiago", "Roberto", "Sandro",
];

const SURNAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Pereira", "Lima", "Carvalho", "Ferreira", "Rodrigues", "Almeida",
  "Costa", "Gomes", "Martins", "Araújo", "Ribeiro", "Barbosa", "Rocha", "Dias", "Moreira", "Nunes",
];

const NEIGHBORHOODS = ["Centro", "Jardim das Flores", "Vila Nova", "Parque Alegre", "Santa Cecília", "Bela Vista"];
const SOURCES = ["instagram", "instagram", "instagram", "referral", "referral", "google", "facebook", "whatsapp", "presential"];
const LOST_REASONS = ["no_response", "no_response", "no_response", "price", "schedule", "distance", "other_school", "child_not_interested"];
const WAITING_REASONS = ["no_vacancy", "future_class", "schedule", "age_category", "no_vacancy", "future_class"];

export function buildSeed() {
  const rand = random(20261027);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const between = (min, max) => min + Math.floor(rand() * (max - min + 1));

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const iso = (date) => date.toISOString().slice(0, 10);
  const daysFromToday = (days) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date;
  };
  const stamp = (days, hour = 10) => {
    const date = daysFromToday(days);
    date.setHours(hour, between(0, 59), 0, 0);
    return date.toISOString();
  };
  // Data que cai no dia da semana (1 = segunda): para frente quando a
  // aula é futura, para trás quando já passou (nunca cruza o hoje)
  const onWeekday = (fromDays, weekday) => {
    const step = fromDays < 0 ? -1 : 1;
    for (let offset = 0; offset < 7; offset += 1) {
      const date = daysFromToday(fromDays + offset * step);
      const day = date.getDay() === 0 ? 7 : date.getDay();
      if (day === weekday) return { date: iso(date), days: fromDays + offset * step };
    }
    return { date: iso(daysFromToday(fromDays)), days: fromDays };
  };

  /* -------------------- cadastros -------------------- */

  const units = [{ id: 1, name: "Viamão", city: "Viamão", active: true }];

  const locations = [
    { id: 1, name: "Ginásio Municipal", address: "Rua das Acácias, 120, Centro", unit_id: 1, active: true },
    { id: 2, name: "Arena Society Centro", address: "Av. Brasil, 845, Vila Nova", unit_id: 1, active: true },
  ];

  const modalities = [
    { id: 1, name: "Futsal", active: true },
    { id: 2, name: "Society", active: true },
  ];

  const categories = [
    [1, "Sub-05", 4, 5],
    [2, "Sub-07", 6, 7],
    [3, "Sub-09", 8, 9],
    [4, "Sub-11", 10, 11],
    [5, "Sub-13", 12, 13],
    [6, "Sub-15", 14, 15],
    [7, "Sub-17", 16, 17],
  ].map(([id, name, min_age, max_age]) => ({
    id,
    name,
    min_age,
    max_age,
    order_index: id,
    active: true,
    weekday: null,
    start_time: null,
    end_time: null,
    trial_status: null,
    experimental_limit: null,
  }));

  const coaches = [
    { id: 1, name: "Bruno Almeida", phone: "(00) 90000-1001", active: true },
    { id: 2, name: "Carla Mendes", phone: "(00) 90000-1002", active: true },
    { id: 3, name: "Diego Souza", phone: "(00) 90000-1003", active: true },
    { id: 4, name: "Rafael Costa", phone: "(00) 90000-1004", active: true },
  ];

  const groupDefs = [
    { id: 1, name: "Sub-05, 07 e 09 Futsal", status: "open", featured: true, location_id: 1, modality_id: 1, categories: [1, 2, 3], coach: 1,
      schedules: [[4, "19:00", "20:00", 10], [5, "18:00", "19:00", 10]] },
    { id: 2, name: "Sub-09 Futsal", status: "closed", featured: false, location_id: 1, modality_id: 1, categories: [3], coach: 2,
      schedules: [[2, "18:00", "19:00", 4], [4, "18:00", "19:00", 4]] },
    { id: 3, name: "Sub-11 Futsal", status: "open", featured: true, location_id: 1, modality_id: 1, categories: [4], coach: 2,
      schedules: [[2, "19:00", "20:00", 8], [5, "19:00", "20:00", 8]] },
    { id: 4, name: "Sub-13 Society", status: "closed", featured: false, location_id: 2, modality_id: 2, categories: [5], coach: 3,
      schedules: [[1, "18:00", "19:00", 4], [4, "18:00", "19:00", 4]] },
    { id: 5, name: "Sub-15/17 Society", status: "open", featured: false, location_id: 2, modality_id: 2, categories: [6, 7], coach: 4,
      schedules: [[3, "18:00", "19:00", 5], [5, "18:00", "19:00", 5]] },
    { id: 6, name: "Sub-11 Society Manhã", status: "inactive", featured: false, location_id: 2, modality_id: 2, categories: [4], coach: 3,
      schedules: [[6, "10:00", "11:00", 4]] },
  ];

  const training_groups = groupDefs.map((group) => ({
    id: group.id,
    name: group.name,
    status: group.status,
    featured: group.featured,
    unit_id: 1,
    location_id: group.location_id,
    modality_id: group.modality_id,
    category_id: group.categories[0],
    coach_id: group.coach,
    created_at: stamp(-170),
    updated_at: stamp(-20),
  }));

  const training_group_categories = [];
  const training_group_schedules = [];
  const training_group_schedule_coaches = [];

  groupDefs.forEach((group) => {
    group.categories.forEach((categoryId) =>
      training_group_categories.push({
        id: training_group_categories.length + 1,
        training_group_id: group.id,
        category_id: categoryId,
      }),
    );

    group.schedules.forEach(([weekday, start, end, limit]) => {
      const id = training_group_schedules.length + 1;
      training_group_schedules.push({
        id,
        training_group_id: group.id,
        weekday,
        start_time: `${start}:00`,
        end_time: `${end}:00`,
        experimental_limit: limit,
        allow_trial: group.status === "open",
        active: group.status !== "inactive",
      });
      training_group_schedule_coaches.push({
        id: training_group_schedule_coaches.length + 1,
        schedule_id: id,
        coach_id: group.coach,
      });
    });
  });

  // Horário de uma categoria (turmas em uso), para as experimentais
  const scheduleForCategory = (categoryId) => {
    const groupIds = training_group_categories
      .filter((link) => link.category_id === categoryId)
      .map((link) => link.training_group_id)
      .filter((groupId) => groupDefs.find((group) => group.id === groupId).status !== "inactive");
    const options = training_group_schedules.filter((schedule) => groupIds.includes(schedule.training_group_id));
    return pick(options);
  };

  /* -------------------- contatos -------------------- */

  const contacts = [];
  const experimental_sessions = [];
  let phoneCounter = 2000;
  let sessionCounter = 0;

  function person(categoryId) {
    const category = categories.find((item) => item.id === categoryId);
    const age = between(category.min_age, category.max_age);
    const birth = daysFromToday(-(age * 365 + between(10, 330)));
    const surname = pick(SURNAMES);
    const childFirst = pick(KID_NAMES);
    const second = pick(SURNAMES);

    phoneCounter += between(1, 37);

    return {
      child_name: `${childFirst} ${second} ${surname}`,
      birth_date: iso(birth),
      responsible_name: `${pick(ADULT_NAMES)} ${surname}`,
      phone: `(00) 9${String(10000 + phoneCounter).slice(1, 5)}-${String(phoneCounter).padStart(4, "0").slice(-4)}`,
    };
  }

  function contact(fields) {
    const categoryId = fields.category_id ?? fields.interest_category_id ?? pick([2, 3, 3, 3, 4, 4, 4, 5, 6]);
    const created = fields._createdDays ?? -between(5, 150);
    const row = {
      id: crypto.randomUUID(),
      ...person(categoryId),
      email: null,
      source: pick(SOURCES),
      neighborhood: pick(NEIGHBORHOODS),
      trained_elsewhere: rand() < 0.25,
      previous_club: null,
      observations: null,
      internal_notes: null,
      status: "new_contact",
      category_id: categoryId,
      interest_category_id: null,
      location_id: null,
      unit_id: 1,
      modality_id: null,
      training_group_id: null,
      preferred_shift: null,
      preferred_days: null,
      qualification_status: null,
      follow_up_date: null,
      follow_up_started_at: null,
      follow_up_attempts: 0,
      last_follow_up_at: null,
      enrolled_at: null,
      enrollment_status: null,
      left_at: null,
      left_reason: null,
      experimental_date: null,
      experimental_time: null,
      experimental_result: null,
      lost_reason: null,
      waiting_list_reason: null,
      waiting_list_notes: null,
      waiting_list_at: null,
      waiting_list_contacted_at: null,
      archived_at: null,
      archive_reason: null,
      whatsapp_push_name: null,
      entry_channel: pick(["public_form", "public_form", "whatsapp", "admin"]),
      first_contact_at: stamp(created),
      created_at: stamp(created),
      updated_at: stamp(fields._updatedDays ?? Math.min(created + between(0, 10), 0)),
      ...fields,
    };

    delete row._createdDays;
    delete row._updatedDays;
    row.previous_club = row.trained_elsewhere ? pick(["Escolinha do Bairro", "Clube Atlético Local", "Projeto Social"]) : null;
    contacts.push(row);
    return row;
  }

  // Horário de turma em uso que cai exatamente no dia pedido (ou null)
  function scheduleOnDay(days) {
    const date = daysFromToday(days);
    const weekday = date.getDay() === 0 ? 7 : date.getDay();
    const options = training_group_schedules.filter((schedule) => {
      const group = groupDefs.find((g) => g.id === schedule.training_group_id);
      return schedule.weekday === weekday && group.status !== "inactive";
    });
    return options.length ? pick(options) : null;
  }

  function session(row, days, status, extra = {}, exactDay = false) {
    let schedule = exactDay ? scheduleOnDay(days) : null;

    if (schedule) {
      const group = groupDefs.find((g) => g.id === schedule.training_group_id);
      row.category_id = pick(group.categories);
      Object.assign(row, person(row.category_id), { id: row.id });
    } else {
      schedule = scheduleForCategory(row.category_id);
    }

    const slot = onWeekday(days, schedule.weekday);
    sessionCounter += 1;

    const item = {
      id: crypto.randomUUID(),
      contact_id: row.id,
      category_id: row.category_id,
      training_group_schedule_id: schedule.id,
      experimental_date: slot.date,
      experimental_time: schedule.start_time,
      status,
      notes: null,
      coach_notes: null,
      coach_feedback: null,
      preferred_position: null,
      created_at: stamp(Math.min(slot.days - 5, -1)),
      updated_at: stamp(Math.min(slot.days, 0)),
      ...extra,
    };

    experimental_sessions.push(item);
    const group = groupDefs.find((g) => g.id === schedule.training_group_id);
    Object.assign(row, {
      experimental_date: item.experimental_date,
      experimental_time: item.experimental_time,
      location_id: group.location_id,
      training_group_id: group.id,
    });
    return item;
  }

  // Matriculados ao longo dos últimos meses (dão o resultado do mês)
  for (let index = 0; index < 42; index += 1) {
    const enrolledDays = -between(1, 160);
    const row = contact({ status: "enrolled", enrollment_status: "active", _createdDays: enrolledDays - between(10, 25) });
    session(row, enrolledDays - between(3, 9), "attended");
    row.enrolled_at = iso(daysFromToday(enrolledDays));
    row.experimental_result = "enrolled";
    row.updated_at = stamp(enrolledDays);
  }

  // Experimentais desta semana e da próxima: a confirmar e confirmadas
  // As primeiras caem hoje, amanhã e depois: "aulas para confirmar"
  for (let index = 0; index < 10; index += 1) {
    const row = contact({ status: "pending_confirmation", _createdDays: -between(1, 6), _updatedDays: -between(0, 2) });
    session(row, index < 6 ? index % 3 : between(3, 8), "pending_confirmation", {}, index < 6);
  }
  for (let index = 0; index < 5; index += 1) {
    const row = contact({ status: "confirmed", _createdDays: -between(2, 8), _updatedDays: -1 });
    session(row, index < 2 ? index : between(2, 6), "confirmed", {}, index < 2);
  }

  // Presença sem baixa (aula que já passou e ninguém marcou)
  {
    const row = contact({ status: "confirmed", _createdDays: -12, _updatedDays: -4 });
    session(row, -6, "confirmed");
  }

  // Vieram e a família ainda não decidiu
  for (let index = 0; index < 4; index += 1) {
    const row = contact({ status: "attended", _createdDays: -between(8, 15), _updatedDays: -between(1, 4) });
    session(row, -between(2, 6), "attended", {
      coach_feedback: pick(["Boa movimentação, se enturmou rápido.", "Chute forte, precisa trabalhar o passe.", "Muito participativo, gostou do treino."]),
    });
  }

  // Faltaram
  for (let index = 0; index < 3; index += 1) {
    const row = contact({ status: "no_show", _createdDays: -between(8, 20), _updatedDays: -between(2, 6) });
    session(row, -between(3, 8), "no_show");
  }

  // Retornos: atrasados, de hoje e próximos
  const followUpDays = [-9, -5, -3, -1, -1, 0, 0, 2, 3, 5, 6, 9, 12, 14];
  followUpDays.forEach((days, index) => {
    const started = Math.min(days, 0) - between(2, 10);
    const row = contact({
      status: "follow_up",
      experimental_result: "follow_up",
      follow_up_date: iso(daysFromToday(days)),
      follow_up_started_at: stamp(started),
      follow_up_attempts: index % 4 === 0 ? 2 : 1,
      last_follow_up_at: stamp(started),
      _createdDays: started - between(5, 15),
      _updatedDays: started,
    });
    session(row, started - between(1, 4), "attended");
  });

  // Novos contatos (alguns parados há mais de 60 dias)
  for (let index = 0; index < 12; index += 1) {
    const stale = index < 4;
    const created = stale ? -between(70, 120) : -between(1, 20);
    contact({ status: "new_contact", _createdDays: created, _updatedDays: stale ? created : -between(0, 3) });
  }

  // Lista de interesse
  for (let index = 0; index < 24; index += 1) {
    const interest = pick([1, 2, 3, 3, 4, 4, 5, 6, 7]);
    const waitingDays = -between(3, 110);
    contact({
      status: "waiting_list",
      interest_category_id: interest,
      category_id: interest,
      location_id: rand() < 0.6 ? pick([1, 2]) : null,
      waiting_list_reason: pick(WAITING_REASONS),
      waiting_list_at: stamp(waitingDays),
      preferred_shift: pick(["evening", "evening", "afternoon", "any"]),
      qualification_status: pick(["complete", "incomplete", "needs_confirmation"]),
      waiting_list_contacted_at: rand() < 0.25 ? stamp(waitingDays + 2) : null,
      _createdDays: waitingDays - between(0, 5),
      _updatedDays: waitingDays,
    });
  }

  // Encerrados
  for (let index = 0; index < 16; index += 1) {
    const closed = -between(5, 140);
    const row = contact({
      status: "lost",
      lost_reason: pick(LOST_REASONS),
      experimental_result: "lost",
      _createdDays: closed - between(10, 30),
      _updatedDays: closed,
    });
    if (rand() < 0.6) session(row, closed - between(3, 8), rand() < 0.7 ? "attended" : "no_show");
  }

  // Triagem: chegaram sozinhos pelo WhatsApp
  for (let index = 0; index < 5; index += 1) {
    const row = contact({ status: "new", entry_channel: "whatsapp", source: "whatsapp", _createdDays: -between(0, 6) });
    row.whatsapp_push_name = row.responsible_name.split(" ")[0];
    if (index < 3) row.child_name = null;
  }

  // Arquivados
  ["current_student", "not_lead", "duplicate"].forEach((reason) => {
    contact({ status: "new_contact", archived_at: stamp(-between(3, 30)), archive_reason: reason });
  });

  // Um possível cadastro duplicado (mesmo telefone e mesmo nome)
  {
    const original = contacts.find((row) => row.status === "new_contact" && !row.archived_at && row.child_name);
    contact({
      ...original,
      id: crypto.randomUUID(),
      responsible_name: original.responsible_name,
      _createdDays: -2,
      _updatedDays: -2,
    });
  }

  const coach_links = [];

  /* -------------------- alunos (pós-matrícula) -------------------- */

  const students = [];
  const guardians = [];
  const student_guardians = [];
  const enrollments = [];
  const enrollment_tasks = [];
  const student_health = [];
  const season = today.getFullYear();

  const HEALTH = {
    blood_type: ["O+", "A+", "O+", "B+", "A-", null],
    health_plan: ["Não", "Não", "Sim, plano da empresa", "Sim, convênio municipal"],
    drug_allergies: ["Não", "Não", "Não", "Dipirona", "Penicilina"],
    medications: ["Não", "Não", "Não", "Bombinha para asma quando precisa"],
    injuries: ["Não", "Não", "Torceu o tornozelo no ano passado"],
  };

  function addStudent({ contactRow = null, startDays, left = false }) {
    const base = contactRow ?? person(pick([2, 3, 3, 4, 4, 5, 6]));
    const categoryId = contactRow?.category_id ?? pick([2, 3, 3, 4, 4, 5, 6]);
    const id = crypto.randomUUID();
    const start = iso(daysFromToday(startDays));
    const surname = base.child_name.split(" ").pop();

    students.push({
      id,
      contact_id: contactRow?.id ?? null,
      name: base.child_name,
      birth_date: base.birth_date,
      gender: pick(["Masculino", "Masculino", "Masculino", "Feminino"]),
      cpf: null,
      rg: null,
      phone: null,
      school: pick(["Escola Estadual Centro", "Colégio Bela Vista", "Escola Municipal Parque Alegre"]),
      school_type: pick(["Pública", "Privada"]),
      field_position: pick(["Atacante", "Meio-campo", "Zagueiro", "Goleiro", "Lateral"]),
      club_team: "Internacional",
      favorite_player: null,
      idol: null,
      how_found: pick(["Instagram", "Indicação de amigo", "Passou em frente"]),
      photo_url: null,
      sogni_id: null,
      status: left ? "left" : "active",
      left_at: left ? iso(daysFromToday(-between(5, 60))) : null,
      left_reason: left ? pick(["Mudou de cidade", "Horário da escola mudou", "Foi para outro esporte"]) : null,
      notes: null,
      created_at: stamp(startDays),
      updated_at: stamp(startDays),
    });

    const guardianId = crypto.randomUUID();
    guardians.push({
      id: guardianId,
      name: base.responsible_name ?? `${pick(ADULT_NAMES)} ${surname}`,
      phone: base.phone,
      email: null,
      gender: null,
      cpf: null,
      rg: null,
      profession: pick(["Professora", "Motorista", "Enfermeira", "Comerciante", "Autônomo"]),
      zip_code: null,
      address: null,
      complement: null,
      neighborhood: pick(NEIGHBORHOODS),
      city: "Viamão",
      state: "RS",
      created_at: stamp(startDays),
      updated_at: stamp(startDays),
    });
    student_guardians.push({
      student_id: id,
      guardian_id: guardianId,
      position: 1,
      relationship: pick(["Mãe", "Mãe", "Pai", "Avó"]),
    });

    const enrollmentId = crypto.randomUUID();
    enrollments.push({
      id: enrollmentId,
      student_id: id,
      season,
      category_id: categoryId,
      training_group_id: contactRow?.training_group_id ?? null,
      start_date: start,
      uniform_size: pick(["Tamanho 10", "Tamanho 12", "Tamanho 14", "P", "M"]),
      payment_method: pick(["pix", "pix", "card", "boleto"]),
      due_day: pick([5, 7, 7, 7, 10]),
      next_action: null,
      notes: null,
      created_at: stamp(startDays),
      updated_at: stamp(startDays),
    });

    // Matrícula antiga: quase tudo feito. Recente: metade ainda aberta
    const old = startDays < -40;
    STUDENT_TASK_DAYS.forEach(([kind, days]) => {
      const fee = ["enrollment_fee", "first_payment", "uniform"].includes(kind);
      const roll = rand();
      let status = roll < 0.5 ? "done" : "pending";
      if (old) status = roll < 0.96 ? "done" : fee && roll < 0.98 ? "exempt" : "pending";

      enrollment_tasks.push({
        id: crypto.randomUUID(),
        enrollment_id: enrollmentId,
        kind,
        status,
        due_date: iso(daysFromToday(startDays + days)),
        done_at: status === "done" ? stamp(Math.min(startDays + days, 0)) : null,
        updated_at: stamp(startDays),
      });
    });

    if (rand() < 0.8) {
      student_health.push({
        student_id: id,
        ...Object.fromEntries(Object.entries(HEALTH).map(([field, options]) => [field, pick(options)])),
        surgeries: "Não",
        diseases: "Não",
        first_aid_medication: pick(["Sim, dipirona", "Não"]),
        physical_activity: pick(["Não", "Natação"]),
        medical_notes: null,
        updated_at: stamp(startDays),
      });
    }
  }

  contacts
    .filter((row) => row.status === "enrolled")
    .forEach((row) => {
      const enrolledDays = Math.round((new Date(`${row.enrolled_at}T12:00:00`) - today) / 86400000);
      addStudent({ contactRow: row, startDays: enrolledDays });
    });

  // Matriculados antes do CRM (vieram da planilha)
  for (let index = 0; index < 30; index += 1) {
    addStudent({ startDays: -between(90, 280), left: index < 5 });
  }

  // Taça Gaúcha com rodadas e um passeio
  const events = [];
  const event_participants = [];
  const tacaId = crypto.randomUUID();
  events.push({ id: tacaId, parent_id: null, name: "Taça Gaúcha", season, event_date: null, fee: 80, position: 0, created_at: stamp(-120) });

  const rounds = [1, 2, 3, 4].map((round) => {
    const id = crypto.randomUUID();
    const days = -100 + round * 21;
    events.push({
      id,
      parent_id: tacaId,
      name: `Rodada ${round}`,
      season,
      event_date: iso(daysFromToday(days)),
      fee: 25,
      position: round,
      created_at: stamp(-120),
    });
    return { id, played: days < 0 };
  });

  const tripId = crypto.randomUUID();
  events.push({
    id: tripId,
    parent_id: null,
    name: "Experiência Colorada",
    season,
    event_date: iso(daysFromToday(18)),
    fee: 60,
    position: 0,
    created_at: stamp(-20),
  });

  const activeStudents = students.filter((student) => student.status === "active");

  activeStudents.slice(0, 22).forEach((student) => {
    event_participants.push({
      event_id: tacaId,
      student_id: student.id,
      status: pick(["paid", "paid", "paid", "paid", "pending", "exempt"]),
      notes: null,
      updated_at: stamp(-90),
    });
    rounds.forEach(({ id, played }) => {
      event_participants.push({
        event_id: id,
        student_id: student.id,
        status: played ? pick(["paid", "paid", "paid", "paid", "paid", "absent", "exempt", "refund"]) : pick(["confirmed", "pending", "paid"]),
        notes: null,
        updated_at: stamp(-30),
      });
    });
  });

  activeStudents.slice(10, 24).forEach((student) => {
    event_participants.push({
      event_id: tripId,
      student_id: student.id,
      status: pick(["interested", "paid", "paid", "pending"]),
      notes: null,
      updated_at: stamp(-5),
    });
  });

  return {
    units,
    locations,
    modalities,
    categories,
    coaches,
    training_groups,
    training_group_categories,
    training_group_schedules,
    training_group_schedule_coaches,
    contacts,
    experimental_sessions,
    coach_links,
    students,
    guardians,
    student_guardians,
    enrollments,
    enrollment_tasks,
    student_health,
    events,
    event_participants,
  };
}
