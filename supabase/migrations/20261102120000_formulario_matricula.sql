-- Formulário de matrícula por link individual (fase 3 do pós-matrícula).
--
-- A coordenação gera, na ficha do aluno, um link que vale 7 dias e
-- serve uma vez só. A família abre o link sem login, completa a ficha
-- (aluno, responsáveis, uniforme, vencimento e saúde) e aceita a
-- autorização de uso dos dados. O aceite fica registrado com o texto,
-- a versão e a data (LGPD, arts. 7, 11 e 14).
--
-- O banco guarda só o hash (SHA-256) do link, nunca o link em si.
-- O público (anon) não lê nenhuma tabela: só chama as duas funções
-- abaixo, que conferem o link antes de qualquer coisa.
--
-- ADITIVO: cria 2 tabelas e 3 funções. Nada que já existe é alterado.
-- Tudo numa transação: se um comando falhar, nada é aplicado.
begin;

/* ---------------------------------------------------------
 * LINKS ENVIADOS
 * -------------------------------------------------------*/
create table public.enrollment_invites (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at    timestamptz,
  revoked_at timestamptz  -- substituído por um link mais novo
);

create index enrollment_invites_student_idx on public.enrollment_invites (student_id);

/* ---------------------------------------------------------
 * AUTORIZAÇÕES ACEITAS (não se editam)
 * -------------------------------------------------------*/
create table public.enrollment_consents (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students(id) on delete cascade,
  invite_id      uuid references public.enrollment_invites(id) on delete set null,
  version        text not null,
  purpose_text   text not null,
  health_consent boolean not null,
  health_text    text,
  accepted_by    text not null,
  accepted_at    timestamptz not null default now()
);

create index enrollment_consents_student_idx on public.enrollment_consents (student_id);

alter table public.enrollment_invites  enable row level security;
alter table public.enrollment_consents enable row level security;

create policy staff_all  on public.enrollment_invites  for all    to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_read on public.enrollment_consents for select to authenticated using (public.is_staff());

revoke all on public.enrollment_invites, public.enrollment_consents from anon, public;
grant select, insert, update on public.enrollment_invites to authenticated;
grant select on public.enrollment_consents to authenticated;

/* ---------------------------------------------------------
 * Texto do formulário: sem espaços nas pontas, vazio = null,
 * com limite de tamanho. Uso interno das funções abaixo.
 * -------------------------------------------------------*/
create or replace function public.form_text(p_value text, p_max integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(nullif(trim(p_value), ''), p_max);
$$;

revoke all on function public.form_text(text, integer) from public, anon, authenticated;

/* ---------------------------------------------------------
 * public_enrollment_form(token): o que o formulário mostra ao abrir.
 * Devolve { status: ok | invalid | replaced | used | expired } e,
 * se ok, só o básico que o CRM já sabe (nada de CPF nem saúde).
 * -------------------------------------------------------*/
create or replace function public.public_enrollment_form(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_invite   public.enrollment_invites;
  v_student  public.students;
  v_first    public.guardians;
  v_second   public.guardians;
  v_category text;
begin
  if length(coalesce(p_token, '')) < 32 then
    return jsonb_build_object('status', 'invalid');
  end if;

  select * into v_invite
    from public.enrollment_invites
   where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');

  if not found then return jsonb_build_object('status', 'invalid'); end if;
  if v_invite.revoked_at is not null then return jsonb_build_object('status', 'replaced'); end if;
  if v_invite.used_at is not null then return jsonb_build_object('status', 'used'); end if;
  if v_invite.expires_at < now() then return jsonb_build_object('status', 'expired'); end if;

  select * into v_student from public.students where id = v_invite.student_id;
  if v_student.status <> 'active' then return jsonb_build_object('status', 'invalid'); end if;

  select g.* into v_first
    from public.student_guardians sg join public.guardians g on g.id = sg.guardian_id
   where sg.student_id = v_student.id
   order by sg.position limit 1;

  select g.* into v_second
    from public.student_guardians sg join public.guardians g on g.id = sg.guardian_id
   where sg.student_id = v_student.id
   order by sg.position offset 1 limit 1;

  select c.name into v_category
    from public.enrollments e left join public.categories c on c.id = e.category_id
   where e.student_id = v_student.id
   order by e.season desc limit 1;

  return jsonb_build_object(
    'status', 'ok',
    'expires_at', v_invite.expires_at,
    'category', v_category,
    'student', jsonb_build_object('name', v_student.name, 'birth_date', v_student.birth_date),
    'guardians', jsonb_build_array(
      jsonb_build_object('name', v_first.name, 'phone', v_first.phone, 'email', v_first.email),
      jsonb_build_object('name', v_second.name, 'phone', v_second.phone, 'email', v_second.email)
    )
  );
end;
$$;

/* ---------------------------------------------------------
 * public_enrollment_submit(token, p): grava o formulário na ficha
 * do aluno do link e registra a autorização. Campo vazio não apaga
 * o que a escola já tinha. O link deixa de valer.
 *
 * p = {
 *   student: {...}, guardians: [{...}, {...}],
 *   enrollment: { uniform_size, due_day }, health: {...},
 *   consent: { accepted, version, purpose_text, health, health_text, accepted_by }
 * }
 * -------------------------------------------------------*/
create or replace function public.public_enrollment_submit(p_token text, p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite   public.enrollment_invites;
  v_s        jsonb := coalesce(p -> 'student', '{}'::jsonb);
  v_c        jsonb := coalesce(p -> 'consent', '{}'::jsonb);
  v_h        jsonb := coalesce(p -> 'health', '{}'::jsonb);
  v_e        jsonb := coalesce(p -> 'enrollment', '{}'::jsonb);
  v_g        jsonb;
  v_health   boolean;
  v_guardian uuid;
  v_birth    date;
  v_due      smallint;
begin
  if p is null or jsonb_typeof(p) <> 'object' or length(p::text) > 30000 then
    raise exception 'Formulário inválido.';
  end if;

  select * into v_invite
    from public.enrollment_invites
   where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
   for update;

  if not found or v_invite.revoked_at is not null then
    raise exception 'Este link não vale mais. Peça um novo à escola.';
  end if;
  if v_invite.used_at is not null then
    raise exception 'Este formulário já foi enviado.';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'Este link venceu. Peça um novo à escola.';
  end if;

  if (v_c ->> 'accepted') is distinct from 'true'
     or public.form_text(v_c ->> 'version', 40) is null
     or public.form_text(v_c ->> 'purpose_text', 5000) is null
     or public.form_text(v_c ->> 'accepted_by', 150) is null then
    raise exception 'Confirme a autorização para enviar.';
  end if;

  if public.form_text(v_s ->> 'name', 150) is null then
    raise exception 'Informe o nome do aluno.';
  end if;

  v_health := (v_c ->> 'health') = 'true';

  if (v_s ->> 'birth_date') ~ '^\d{4}-\d{2}-\d{2}$' then
    v_birth := (v_s ->> 'birth_date')::date;
  end if;

  if (v_e ->> 'due_day') ~ '^\d{1,2}$' and (v_e ->> 'due_day')::int between 1 and 31 then
    v_due := (v_e ->> 'due_day')::smallint;
  end if;

  -- Aluno
  update public.students s set
    name            = public.form_text(v_s ->> 'name', 150),
    birth_date      = coalesce(v_birth, s.birth_date),
    gender          = coalesce(public.form_text(v_s ->> 'gender', 30), s.gender),
    cpf             = coalesce(public.form_text(v_s ->> 'cpf', 20), s.cpf),
    rg              = coalesce(public.form_text(v_s ->> 'rg', 30), s.rg),
    phone           = coalesce(public.form_text(v_s ->> 'phone', 30), s.phone),
    school          = coalesce(public.form_text(v_s ->> 'school', 150), s.school),
    school_type     = coalesce(public.form_text(v_s ->> 'school_type', 30), s.school_type),
    field_position  = coalesce(public.form_text(v_s ->> 'field_position', 80), s.field_position),
    club_team       = coalesce(public.form_text(v_s ->> 'club_team', 80), s.club_team),
    favorite_player = coalesce(public.form_text(v_s ->> 'favorite_player', 80), s.favorite_player),
    idol            = coalesce(public.form_text(v_s ->> 'idol', 80), s.idol),
    how_found       = coalesce(public.form_text(v_s ->> 'how_found', 150), s.how_found),
    updated_at      = now()
  where s.id = v_invite.student_id;

  -- Responsáveis: 1º e 2º, atualiza quem já existe ou cria
  for i in 1..2 loop
    v_g := p -> 'guardians' -> (i - 1);
    continue when v_g is null or jsonb_typeof(v_g) <> 'object'
               or public.form_text(v_g ->> 'name', 150) is null;

    select sg.guardian_id into v_guardian
      from public.student_guardians sg
     where sg.student_id = v_invite.student_id and sg.position = i;

    if v_guardian is null then
      insert into public.guardians (name) values (public.form_text(v_g ->> 'name', 150))
      returning id into v_guardian;

      insert into public.student_guardians (student_id, guardian_id, position)
      values (v_invite.student_id, v_guardian, i);
    end if;

    update public.guardians g set
      name         = public.form_text(v_g ->> 'name', 150),
      phone        = coalesce(public.form_text(v_g ->> 'phone', 30), g.phone),
      email        = coalesce(public.form_text(v_g ->> 'email', 150), g.email),
      gender       = coalesce(public.form_text(v_g ->> 'gender', 30), g.gender),
      cpf          = coalesce(public.form_text(v_g ->> 'cpf', 20), g.cpf),
      rg           = coalesce(public.form_text(v_g ->> 'rg', 30), g.rg),
      profession   = coalesce(public.form_text(v_g ->> 'profession', 100), g.profession),
      zip_code     = coalesce(public.form_text(v_g ->> 'zip_code', 12), g.zip_code),
      address      = coalesce(public.form_text(v_g ->> 'address', 200), g.address),
      complement   = coalesce(public.form_text(v_g ->> 'complement', 100), g.complement),
      neighborhood = coalesce(public.form_text(v_g ->> 'neighborhood', 100), g.neighborhood),
      city         = coalesce(public.form_text(v_g ->> 'city', 100), g.city),
      state        = coalesce(public.form_text(v_g ->> 'state', 2), g.state),
      updated_at   = now()
    where g.id = v_guardian;

    v_guardian := null;
  end loop;

  -- Matrícula mais recente: uniforme e vencimento
  update public.enrollments e set
    uniform_size = coalesce(public.form_text(v_e ->> 'uniform_size', 30), e.uniform_size),
    due_day      = coalesce(v_due, e.due_day),
    next_action  = coalesce(e.next_action, 'Conferir o formulário preenchido pela família'),
    updated_at   = now()
  where e.id = (
    select id from public.enrollments
     where student_id = v_invite.student_id
     order by season desc limit 1
  );

  -- Saúde: obrigatória no formulário; entra junto com a autorização
  if v_health then
    insert into public.student_health as h (
      student_id, blood_type, health_plan, first_aid_medication, physical_activity, injuries,
      surgeries, diseases, medications, drug_allergies, medical_notes, updated_at
    ) values (
      v_invite.student_id,
      public.form_text(v_h ->> 'blood_type', 10),
      public.form_text(v_h ->> 'health_plan', 500),
      public.form_text(v_h ->> 'first_aid_medication', 500),
      public.form_text(v_h ->> 'physical_activity', 500),
      public.form_text(v_h ->> 'injuries', 500),
      public.form_text(v_h ->> 'surgeries', 500),
      public.form_text(v_h ->> 'diseases', 500),
      public.form_text(v_h ->> 'medications', 500),
      public.form_text(v_h ->> 'drug_allergies', 500),
      public.form_text(v_h ->> 'medical_notes', 500),
      now()
    )
    on conflict (student_id) do update set
      blood_type           = coalesce(excluded.blood_type, h.blood_type),
      health_plan          = coalesce(excluded.health_plan, h.health_plan),
      first_aid_medication = coalesce(excluded.first_aid_medication, h.first_aid_medication),
      physical_activity    = coalesce(excluded.physical_activity, h.physical_activity),
      injuries             = coalesce(excluded.injuries, h.injuries),
      surgeries            = coalesce(excluded.surgeries, h.surgeries),
      diseases             = coalesce(excluded.diseases, h.diseases),
      medications          = coalesce(excluded.medications, h.medications),
      drug_allergies       = coalesce(excluded.drug_allergies, h.drug_allergies),
      medical_notes        = coalesce(excluded.medical_notes, h.medical_notes),
      updated_at           = now();
  end if;

  insert into public.enrollment_consents (
    student_id, invite_id, version, purpose_text, health_consent, health_text, accepted_by
  ) values (
    v_invite.student_id,
    v_invite.id,
    public.form_text(v_c ->> 'version', 40),
    public.form_text(v_c ->> 'purpose_text', 5000),
    v_health,
    case when v_health then public.form_text(v_c ->> 'health_text', 5000) end,
    public.form_text(v_c ->> 'accepted_by', 150)
  );

  update public.enrollment_invites set used_at = now() where id = v_invite.id;
end;
$$;

revoke all on function public.public_enrollment_form(text) from public;
revoke all on function public.public_enrollment_submit(text, jsonb) from public;
grant execute on function public.public_enrollment_form(text) to anon, authenticated;
grant execute on function public.public_enrollment_submit(text, jsonb) to anon, authenticated;

commit;
