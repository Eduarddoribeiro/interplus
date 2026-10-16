-- Incrementa current_experimentals de um training_group_schedule de
-- forma atômica, respeitando active / allow_trial / experimental_limit.
--
-- Se não houver mais vaga (ou o horário não existir/estiver inativo),
-- a função lança uma exceção e nenhuma linha é alterada.

CREATE OR REPLACE FUNCTION public.increment_schedule_experimentals(
  p_schedule_id bigint
)
RETURNS public.training_group_schedules
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule public.training_group_schedules;
BEGIN
  UPDATE public.training_group_schedules
  SET current_experimentals = current_experimentals + 1
  WHERE id = p_schedule_id
    AND active = true
    AND allow_trial = true
    AND current_experimentals < experimental_limit
  RETURNING * INTO v_schedule;

  IF v_schedule.id IS NULL THEN
    RAISE EXCEPTION 'Sem vagas disponíveis para este horário.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN v_schedule;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_schedule_experimentals(bigint) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_schedule_experimentals(bigint) TO authenticated;