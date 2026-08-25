-- Adiciona modality_id, unit_id, training_group_id e
-- training_group_schedule_id em contacts.
--
-- Idempotente (IF NOT EXISTS) porque não temos certeza se alguma
-- dessas colunas já foi criada manualmente em etapas anteriores.
-- Não remove nem altera nada existente.

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS modality_id bigint,
  ADD COLUMN IF NOT EXISTS unit_id bigint,
  ADD COLUMN IF NOT EXISTS training_group_id bigint,
  ADD COLUMN IF NOT EXISTS training_group_schedule_id bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_modality_id_fkey'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_modality_id_fkey
      FOREIGN KEY (modality_id) REFERENCES public.modalities(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_unit_id_fkey'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_unit_id_fkey
      FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_training_group_id_fkey'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_training_group_id_fkey
      FOREIGN KEY (training_group_id) REFERENCES public.training_groups(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_training_group_schedule_id_fkey'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_training_group_schedule_id_fkey
      FOREIGN KEY (training_group_schedule_id) REFERENCES public.training_group_schedules(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS contacts_modality_id_idx ON public.contacts (modality_id);
CREATE INDEX IF NOT EXISTS contacts_unit_id_idx ON public.contacts (unit_id);
CREATE INDEX IF NOT EXISTS contacts_training_group_id_idx ON public.contacts (training_group_id);
CREATE INDEX IF NOT EXISTS contacts_training_group_schedule_id_idx ON public.contacts (training_group_schedule_id);