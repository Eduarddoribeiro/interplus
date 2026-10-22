import CrudModal from "../components/CrudModal";
import FormField from "../components/FormField";

import { WEEKDAYS } from "../../../../constants/weekdays";
import { inputClass } from "../../../ui";

export default function ScheduleModal({
  open,
  editing,
  form,
  coaches = [],
  onChange,
  onToggleCoach,
  onClose,
  onSave,
}) {
  return (
    <CrudModal
      open={open}
      title={
        editing
          ? "Editar horário"
          : "Novo horário"
      }
      onClose={onClose}
      onSave={onSave}
    >
      <FormField label="Dia">
        <select
          name="weekday"
          value={form.weekday}
          onChange={onChange}
          className={inputClass}
        >
          <option value="">
            Selecione...
          </option>

          {WEEKDAYS.map((day) => (
            <option
              key={day.value}
              value={day.value}
            >
              {day.label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-5">

        <FormField label="Hora início">
          <input
            type="time"
            name="start_time"
            value={form.start_time}
            onChange={onChange}
            className={inputClass}
          />
        </FormField>

        <FormField label="Hora fim">
          <input
            type="time"
            name="end_time"
            value={form.end_time}
            onChange={onChange}
            className={inputClass}
          />
        </FormField>

      </div>

      <FormField label="Professores">
        <div className="flex flex-wrap gap-2">
          {coaches.map((coach) => {
            const selected = form.coach_ids?.includes(coach.id);

            return (
              <button
                key={coach.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggleCoach?.(coach.id)}
                className={`h-9 rounded-lg border px-3 text-sm font-medium transition-colors ${
                  selected
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-ink hover:border-neutral-400"
                }`}
              >
                {coach.name}
              </button>
            );
          })}

          {coaches.length === 0 && (
            <p className="text-sm text-muted">Nenhum professor ativo cadastrado.</p>
          )}
        </div>
      </FormField>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="allow_trial"
          checked={form.allow_trial}
          onChange={onChange}
        />

        <span>Permitir experimental</span>
      </label>

      <FormField label="Limite de experimentais">
        <input
          type="number"
          min="0"
          name="experimental_limit"
          value={form.experimental_limit}
          onChange={onChange}
          disabled={!form.allow_trial}
          className={inputClass}
        />
      </FormField>
    </CrudModal>
  );
}
