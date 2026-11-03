-- Fichas da família: marcar como conferida.
--
-- Quando a família envia o formulário, a coordenação confere os dados
-- na ficha do aluno e clica em "Marcar como conferida". Grava quando e
-- quem conferiu no próprio link. A Visão geral conta as fichas
-- preenchidas e ainda não conferidas.
--
-- ADITIVO: 2 colunas novas em enrollment_invites. As policies e os
-- grants dessa tabela já cobrem a atualização pela equipe.
begin;

alter table public.enrollment_invites
  add column reviewed_at timestamptz,
  add column reviewed_by uuid;

commit;
