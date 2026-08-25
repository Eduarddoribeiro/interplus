-- Adiciona training_group_schedule_id em experimental_sessions,
-- espelhando o padrão já existente de category_id.
--
-- Isso permite calcular a ocupação real de um horário (training_group_schedule)
-- em uma data específica, contando as sessões existentes — sem depender
-- de training_group_schedules.current_experimentals.
--
-- Não remove nem altera nenhuma coluna existente.

ALTER TABLE public.experimental_sessions
  ADD COLUMN training_group_schedule_id bigint;

ALTER TABLE public.experimental_sessions
  ADD CONSTRAINT experimental_sessions_training_group_schedule_id_fkey
    FOREIGN KEY (training_group_schedule_id)
    REFERENCES public.training_group_schedules(id)
    ON DELETE SET NULL;

CREATE INDEX experimental_sessions_training_group_schedule_id_idx
  ON public.experimental_sessions (training_group_schedule_id);

-- Índice composto para a query de ocupação (schedule_id + data),
-- que passa a ser executada tanto no formulário público quanto
-- na validação final em contacts.js.
CREATE INDEX experimental_sessions_schedule_date_idx
  ON public.experimental_sessions (training_group_schedule_id, experimental_date);