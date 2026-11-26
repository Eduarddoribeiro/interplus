-- Tarefas da equipe: repetição "Dias úteis" (segunda a sexta).
-- Para tarefas de todo dia de trabalho (ver o WhatsApp, responder
-- os pais) que não devem aparecer no sábado nem no domingo.
--
-- Muda só duas coisas:
--   1. a checagem da coluna repeat passa a aceitar 'weekdays';
--   2. staff_task_next_due ganha o caso 'weekdays' (os outros
--      casos ficam iguais). Mesma regra de nextDueDate em
--      src/helpers/taskBoard.js: o próximo dia de segunda a sexta,
--      nunca antes de hoje.
-- Nenhuma tarefa existente muda.
begin;

alter table public.staff_tasks drop constraint if exists staff_tasks_repeat_check;
alter table public.staff_tasks
  add constraint staff_tasks_repeat_check
  check (repeat in ('none', 'daily', 'weekdays', 'weekly', 'monthly'));

create or replace function public.staff_task_next_due(p_due date, p_repeat text)
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
  -- Dias úteis: o próximo de segunda a sexta, nunca antes de hoje
  if p_repeat = 'weekdays' then
    v_next := base;
    loop
      v_next := v_next + 1;
      exit when extract(isodow from v_next) < 6 and v_next >= today;
    end loop;
    return v_next;
  end if;

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

commit;

-- VERIFICAÇÃO (rode depois): as duas linhas precisam dar o que está no comentário.
-- select public.staff_task_next_due('2026-11-27', 'weekdays');  -- sexta 27/11 → segunda 30/11 (ou a próxima data útil a partir de hoje)
-- select pg_get_constraintdef(oid) from pg_constraint where conname = 'staff_tasks_repeat_check';  -- precisa citar 'weekdays'
--
-- REVERSÃO (só se nenhuma tarefa usar 'weekdays'):
-- alter table public.staff_tasks drop constraint staff_tasks_repeat_check;
-- alter table public.staff_tasks add constraint staff_tasks_repeat_check
--   check (repeat in ('none', 'daily', 'weekly', 'monthly'));
-- (a função pode ficar: o caso novo só é usado por tarefas 'weekdays')
