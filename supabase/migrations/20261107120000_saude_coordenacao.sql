/* =========================================================
 * Saúde só para quem a coordenação liberar
 *
 * Antes: qualquer pessoa da equipe (is_staff) lia e editava
 * student_health.
 * Depois:
 *   - staff_users.can_view_health marca quem vê a saúde
 *     (começa false para todos; a última parte deste arquivo
 *     libera as pessoas escolhidas);
 *   - ler, editar e apagar: só is_staff() e can_view_health();
 *   - gravar (insert): continua para toda a equipe, porque a
 *     matrícula e a importação da planilha (create_student_enrollment,
 *     security invoker) gravam a saúde junto com o aluno;
 *   - my_staff_access() diz ao painel se a pessoa logada vê a saúde.
 *
 * Não muda nenhum dado de aluno. A ficha que a família preenche
 * (public_enrollment_submit, security definer) não é afetada.
 * Reversão no fim do arquivo.
 * =======================================================*/

begin;

alter table public.staff_users
  add column if not exists can_view_health boolean not null default false;

create or replace function public.can_view_health()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_users s
    where s.user_id = auth.uid()
      and s.can_view_health
  );
$$;

revoke all on function public.can_view_health() from public, anon;
grant execute on function public.can_view_health() to authenticated;

-- O que o painel precisa saber da pessoa logada (sem dados de outros).
create or replace function public.my_staff_access()
returns table (can_view_health boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(s.can_view_health, false)
  from public.staff_users s
  where s.user_id = auth.uid();
$$;

revoke all on function public.my_staff_access() from public, anon;
grant execute on function public.my_staff_access() to authenticated;

drop policy if exists staff_all on public.student_health;

create policy health_insert on public.student_health
  for insert to authenticated
  with check (public.is_staff());

create policy health_select on public.student_health
  for select to authenticated
  using (public.is_staff() and public.can_view_health());

create policy health_update on public.student_health
  for update to authenticated
  using (public.is_staff() and public.can_view_health())
  with check (public.is_staff() and public.can_view_health());

create policy health_delete on public.student_health
  for delete to authenticated
  using (public.is_staff() and public.can_view_health());

/* ---------------------------------------------------------
 * Quem vê a saúde: troque os e-mails antes de rodar.
 * Sem esta parte, ninguém vê a saúde até alguém ser liberado.
 * -------------------------------------------------------*/
update public.staff_users s
set can_view_health = true
from auth.users u
where u.id = s.user_id
  and lower(u.email) in (
    'coordenacao@exemplo.com'   -- << trocar pelos e-mails da coordenação
  );

commit;

/* =========================================================
 * Verificação (rodar depois; só leitura, sem dados pessoais)
 * =========================================================

-- 1) Quantas pessoas veem a saúde (esperado: o número de e-mails acima)
select count(*) filter (where can_view_health) as veem_saude,
       count(*)                                as equipe
from public.staff_users;

-- 2) Políticas da tabela (esperado: health_delete, health_insert,
--    health_select, health_update; e nenhuma staff_all)
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'student_health'
order by policyname;

-- 3) Funções criadas (esperado: 2 linhas, ambas security definer = true)
select proname, prosecdef
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('can_view_health', 'my_staff_access');

 * =========================================================
 * Reversão (volta ao acesso de toda a equipe)
 * =========================================================

begin;
drop policy if exists health_insert on public.student_health;
drop policy if exists health_select on public.student_health;
drop policy if exists health_update on public.student_health;
drop policy if exists health_delete on public.student_health;
create policy staff_all on public.student_health
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop function if exists public.my_staff_access();
drop function if exists public.can_view_health();
alter table public.staff_users drop column if exists can_view_health;
commit;

 * =======================================================*/
