-- Tarefas da equipe (quadro A fazer / Fazendo / Feito).
-- Ver docs/features/tarefas-equipe.md.
--
-- Tarefas gerais da escola, sem ligação com aluno ou contato. Só a
-- equipe (is_staff()) lê e escreve; o público (anon) não tem acesso.
-- Tarefa repetida: ao ir para Feito pela primeira vez, o gatilho cria
-- a próxima em A fazer com o prazo seguinte (uma vez só).
--
-- Responsável: staff_users só tem user_id, então ganha a coluna opcional
-- name (nome curto para o quadro). A lista da equipe vem pela função
-- staff_members(), que só responde para a equipe; as policies de
-- staff_users não mudam. Sem nome, aparece o começo do e-mail.
--
-- ADITIVO: 1 tabela, 1 coluna opcional em staff_users e 3 funções novas.
-- Nada que já existe muda de comportamento.
begin;

create table public.staff_tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  notes        text,
  area         text,
  status       text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  due_date     date,
  assigned_to  uuid references auth.users(id) on delete set null,  -- membro da equipe
  repeat       text not null default 'none' check (repeat in ('none', 'daily', 'weekly', 'monthly')),
  next_created boolean not null default false,
  done_at      timestamptz,
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index staff_tasks_status_due_idx on public.staff_tasks (status, due_date);
create index staff_tasks_assigned_idx on public.staff_tasks (assigned_to);

alter table public.staff_tasks enable row level security;

create policy staff_all on public.staff_tasks
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

revoke all on public.staff_tasks from anon, public;
grant select, insert, update, delete on public.staff_tasks to authenticated;

/* ---------------------------------------------------------
 * Equipe: nome curto e lista para escolher o responsável
 * -------------------------------------------------------*/
alter table public.staff_users add column name text;

create function public.staff_members()
returns table (user_id uuid, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select s.user_id,
         coalesce(nullif(btrim(s.name), ''), split_part(u.email, '@', 1)) as name
  from public.staff_users s
  join auth.users u on u.id = s.user_id
  where public.is_staff()
  order by 2;
$$;

revoke all on function public.staff_members() from public, anon;
grant execute on function public.staff_members() to authenticated;

/* ---------------------------------------------------------
 * Próximo prazo de uma tarefa repetida (igual a nextDueDate
 * em src/helpers/taskBoard.js): prazo + 1 dia, semana ou mês;
 * se já passou, avança até hoje (fuso de São Paulo).
 * -------------------------------------------------------*/
create function public.staff_task_next_due(p_due date, p_repeat text)
returns date
language plpgsql
stable
set search_path = ''
as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  base  date := coalesce(p_due, today);
  n     integer := 1;
  v_next date;
begin
  loop
    v_next := case p_repeat
      when 'daily'   then base + n
      when 'weekly'  then base + 7 * n
      else (base + make_interval(months => n))::date  -- 31/01 + 1 mês = 28/02
    end;
    exit when v_next >= today;
    n := n + 1;
  end loop;

  return v_next;
end;
$$;

/* ---------------------------------------------------------
 * Antes de cada mudança: carimba updated_at e done_at e, na
 * primeira conclusão de uma repetida, cria a próxima.
 * -------------------------------------------------------*/
create function public.staff_tasks_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();

  if new.status = 'done' and old.status <> 'done' then
    new.done_at := coalesce(new.done_at, now());

    if new.repeat <> 'none' and not old.next_created then
      insert into public.staff_tasks (title, notes, area, due_date, assigned_to, repeat, created_by)
      values (new.title, new.notes, new.area,
              public.staff_task_next_due(new.due_date, new.repeat),
              new.assigned_to, new.repeat, auth.uid());
      new.next_created := true;
    end if;
  elsif new.status <> 'done' then
    new.done_at := null;
  end if;

  return new;
end;
$$;

create trigger staff_tasks_before_update
  before update on public.staff_tasks
  for each row execute function public.staff_tasks_before_update();

-- O gatilho roda como quem mexeu na tarefa (equipe), que precisa poder
-- calcular o próximo prazo; o público não
revoke all on function public.staff_task_next_due(date, text) from public, anon;
grant execute on function public.staff_task_next_due(date, text) to authenticated;
revoke all on function public.staff_tasks_before_update() from public, anon;

commit;
