-- Número da camisa e goleiro na ficha do aluno.
--
-- Regra da escola: os jogadores de linha recebem o próximo número em
-- ordem; os goleiros usam 1, 12, 23, 34... (de 11 em 11). O número
-- não repete na escola toda, nem com quem já saiu. A sugestão do
-- próximo número fica no painel (src/helpers/shirtNumbers.js).

alter table public.students
  add column shirt_number integer check (shirt_number between 1 and 999),
  add column goalkeeper   boolean not null default false;

create unique index students_shirt_number_key
  on public.students (shirt_number)
  where shirt_number is not null;

-- Quem já tem "goleiro" na posição começa marcado como goleiro
update public.students
   set goalkeeper = true
 where field_position ilike '%goleir%';
