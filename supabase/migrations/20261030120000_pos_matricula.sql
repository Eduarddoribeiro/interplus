-- Pós-matrícula: alunos, responsáveis, matrículas por temporada,
-- pendências, saúde e eventos (Taça Gaúcha, rodadas, passeios).
--
-- ADITIVO: só cria tabelas e uma função novas. Nenhuma tabela que
-- já existe é alterada. Reversão: 20261030120000_pos_matricula_reverter.sql
-- (no scratchpad; apaga só o que este script cria).
--
-- Acesso: só a equipe (is_staff()). O site público (anon) não lê
-- nem grava nada daqui. A saúde fica numa tabela separada para,
-- quando houver outros perfis, liberar só para a coordenação.
--
-- Tudo numa transação: se um comando falhar, nada é aplicado.
begin;

/* ---------------------------------------------------------
 * ALUNO
 * -------------------------------------------------------*/
create table public.students (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid unique references public.contacts(id) on delete set null,
  name            text not null check (length(trim(name)) > 0),
  birth_date      date,
  gender          text,
  cpf             text,
  rg              text,
  phone           text,
  school          text,
  school_type     text,
  field_position  text,
  club_team       text,
  favorite_player text,
  idol            text,
  how_found       text,
  photo_url       text,
  sogni_id        text,
  status          text not null default 'active' check (status in ('active', 'left')),
  left_at         date,
  left_reason     text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index students_status_idx on public.students (status);

/* ---------------------------------------------------------
 * RESPONSÁVEL (um responsável pode ter vários alunos: irmãos)
 * -------------------------------------------------------*/
create table public.guardians (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) > 0),
  phone        text,
  email        text,
  gender       text,
  cpf          text,
  rg           text,
  profession   text,
  zip_code     text,
  address      text,
  complement   text,
  neighborhood text,
  city         text,
  state        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.student_guardians (
  student_id   uuid not null references public.students(id) on delete cascade,
  guardian_id  uuid not null references public.guardians(id) on delete cascade,
  position     smallint not null default 1,  -- 1 = principal, 2 = segundo
  relationship text,
  primary key (student_id, guardian_id)
);

create index student_guardians_guardian_idx on public.student_guardians (guardian_id);

/* ---------------------------------------------------------
 * MATRÍCULA (uma por aluno e temporada; rematrícula = linha nova)
 * Mensalidade e cadastro oficial são do Sogni: aqui fica só o
 * que a escola controla fora dele.
 * -------------------------------------------------------*/
create table public.enrollments (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.students(id) on delete cascade,
  season            smallint not null check (season between 2020 and 2100),
  category_id       bigint references public.categories(id) on delete set null,
  training_group_id bigint references public.training_groups(id) on delete set null,
  start_date        date not null default current_date,
  uniform_size      text,
  payment_method    text check (payment_method is null or payment_method in ('pix', 'card', 'boleto')),
  due_day           smallint check (due_day is null or due_day between 1 and 31),
  next_action       text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (student_id, season)
);

create index enrollments_category_idx on public.enrollments (category_id);

/* ---------------------------------------------------------
 * PENDÊNCIAS DA MATRÍCULA (criadas junto com a matrícula)
 * -------------------------------------------------------*/
create table public.enrollment_tasks (
  id            uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  kind          text not null check (kind in (
                  'sogni', 'contract_signed', 'enrollment_fee', 'first_payment', 'uniform',
                  'community')),
  status        text not null default 'pending' check (status in ('pending', 'done', 'exempt')),
  due_date      date,
  done_at       timestamptz,
  updated_at    timestamptz not null default now(),
  unique (enrollment_id, kind)
);

create index enrollment_tasks_open_idx on public.enrollment_tasks (due_date) where status = 'pending';

/* ---------------------------------------------------------
 * SAÚDE (dado sensível, LGPD art. 11): tabela separada
 * -------------------------------------------------------*/
create table public.student_health (
  student_id           uuid primary key references public.students(id) on delete cascade,
  blood_type           text,
  health_plan          text,
  first_aid_medication text,
  physical_activity    text,
  injuries             text,
  surgeries            text,
  diseases             text,
  medications          text,
  drug_allergies       text,
  medical_notes        text,
  updated_at           timestamptz not null default now()
);

/* ---------------------------------------------------------
 * EVENTOS: campeonato (com rodadas como eventos filhos),
 * passeios e copas. Participação = situação de cada aluno.
 * -------------------------------------------------------*/
create table public.events (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid references public.events(id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  season     smallint not null check (season between 2020 and 2100),
  event_date date,
  fee        numeric(10, 2) check (fee is null or fee >= 0),
  position   smallint not null default 0,  -- ordem das rodadas
  created_at timestamptz not null default now()
);

create index events_parent_idx on public.events (parent_id);

create table public.event_participants (
  event_id   uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status     text not null default 'confirmed' check (status in (
               'interested', 'confirmed', 'pending', 'paid', 'exempt', 'absent', 'refund')),
  notes      text,
  updated_at timestamptz not null default now(),
  primary key (event_id, student_id)
);

create index event_participants_student_idx on public.event_participants (student_id);

/* ---------------------------------------------------------
 * ACESSO: só a equipe; o público não vê nada
 * -------------------------------------------------------*/
alter table public.students           enable row level security;
alter table public.guardians          enable row level security;
alter table public.student_guardians  enable row level security;
alter table public.enrollments        enable row level security;
alter table public.enrollment_tasks   enable row level security;
alter table public.student_health     enable row level security;
alter table public.events             enable row level security;
alter table public.event_participants enable row level security;

create policy staff_all on public.students           for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all on public.guardians          for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all on public.student_guardians  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all on public.enrollments        for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all on public.enrollment_tasks   for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all on public.student_health     for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all on public.events             for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_all on public.event_participants for all to authenticated using (public.is_staff()) with check (public.is_staff());

revoke all on public.students, public.guardians, public.student_guardians, public.enrollments,
              public.enrollment_tasks, public.student_health, public.events, public.event_participants
  from anon, public;

grant select, insert, update, delete
  on public.students, public.guardians, public.student_guardians, public.enrollments,
     public.enrollment_tasks, public.student_health, public.events, public.event_participants
  to authenticated;

/* ---------------------------------------------------------
 * create_student_enrollment(p): cria aluno, responsáveis,
 * matrícula, pendências, saúde e participações numa transação.
 * Usada pelo painel (matrícula de um contato, aluno novo e
 * importação da planilha). Roda com as permissões de quem chama
 * (security invoker), então vale o RLS da equipe.
 *
 * p = {
 *   contact_id, student: {...}, guardians: [{...}, {...}],
 *   enrollment: {...}, tasks: { kind: status }, health: {...},
 *   events: [{ event_id, status }]
 * }
 * Prazos das pendências: dias depois do início (iguais a
 * src/constants/studentTasks.js).
 * -------------------------------------------------------*/
create or replace function public.create_student_enrollment(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_student    uuid;
  v_guardian   uuid;
  v_enrollment uuid;
  v_start      date;
  v_position   smallint := 0;
  v_item       jsonb;
  v_task       record;
begin
  if not public.is_staff() then
    raise exception 'Sem permissão para cadastrar alunos.';
  end if;

  if coalesce(trim(p -> 'student' ->> 'name'), '') = '' then
    raise exception 'Informe o nome do aluno.';
  end if;

  if p ->> 'contact_id' is not null
     and exists (select 1 from public.students where contact_id = (p ->> 'contact_id')::uuid) then
    raise exception 'Este contato já tem ficha de aluno.';
  end if;

  v_start := coalesce(nullif(p -> 'enrollment' ->> 'start_date', '')::date, current_date);

  insert into public.students (
    contact_id, name, birth_date, gender, cpf, rg, phone, school, school_type, field_position,
    club_team, favorite_player, idol, how_found, photo_url, sogni_id, status, left_at, notes
  )
  select
    (p ->> 'contact_id')::uuid, trim(s.name), s.birth_date, s.gender, s.cpf, s.rg, s.phone, s.school,
    s.school_type, s.field_position, s.club_team, s.favorite_player, s.idol, s.how_found, s.photo_url,
    s.sogni_id, coalesce(s.status, 'active'), s.left_at, s.notes
  from jsonb_populate_record(null::public.students, p -> 'student') s
  returning id into v_student;

  for v_item in select * from jsonb_array_elements(coalesce(p -> 'guardians', '[]'::jsonb)) loop
    continue when coalesce(trim(v_item ->> 'name'), '') = '';
    v_position := v_position + 1;

    insert into public.guardians (
      name, phone, email, gender, cpf, rg, profession, zip_code, address, complement,
      neighborhood, city, state
    )
    select
      trim(g.name), g.phone, g.email, g.gender, g.cpf, g.rg, g.profession, g.zip_code, g.address,
      g.complement, g.neighborhood, g.city, g.state
    from jsonb_populate_record(null::public.guardians, v_item) g
    returning id into v_guardian;

    insert into public.student_guardians (student_id, guardian_id, position, relationship)
    values (v_student, v_guardian, v_position, nullif(v_item ->> 'relationship', ''));
  end loop;

  insert into public.enrollments (
    student_id, season, category_id, training_group_id, start_date, uniform_size,
    payment_method, due_day, next_action, notes
  )
  select
    v_student, coalesce(e.season, extract(year from v_start)::smallint), e.category_id,
    e.training_group_id, v_start, e.uniform_size, e.payment_method, e.due_day, e.next_action, e.notes
  from jsonb_populate_record(null::public.enrollments, coalesce(p -> 'enrollment', '{}'::jsonb)) e
  returning id into v_enrollment;

  for v_task in
    select * from (values
      ('sogni', 3), ('contract_signed', 7), ('enrollment_fee', 7), ('first_payment', 10),
      ('uniform', 15), ('community', 3)
    ) as t(kind, days)
  loop
    insert into public.enrollment_tasks (enrollment_id, kind, status, due_date, done_at)
    values (
      v_enrollment,
      v_task.kind,
      coalesce(p -> 'tasks' ->> v_task.kind, 'pending'),
      v_start + v_task.days,
      case when p -> 'tasks' ->> v_task.kind = 'done' then now() end
    );
  end loop;

  if jsonb_typeof(p -> 'health') = 'object' and p -> 'health' <> '{}'::jsonb then
    insert into public.student_health (
      student_id, blood_type, health_plan, first_aid_medication, physical_activity, injuries,
      surgeries, diseases, medications, drug_allergies, medical_notes
    )
    select
      v_student, h.blood_type, h.health_plan, h.first_aid_medication, h.physical_activity, h.injuries,
      h.surgeries, h.diseases, h.medications, h.drug_allergies, h.medical_notes
    from jsonb_populate_record(null::public.student_health, p -> 'health') h;
  end if;

  insert into public.event_participants (event_id, student_id, status)
  select (item ->> 'event_id')::uuid, v_student, coalesce(item ->> 'status', 'confirmed')
  from jsonb_array_elements(coalesce(p -> 'events', '[]'::jsonb)) item;

  return v_student;
end;
$$;

revoke all on function public.create_student_enrollment(jsonb) from public, anon;
grant execute on function public.create_student_enrollment(jsonb) to authenticated;

commit;
