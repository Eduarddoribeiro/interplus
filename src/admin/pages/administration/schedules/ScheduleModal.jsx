import CrudModal from "../components/CrudModal";
import FormField from "../components/FormField";

import { WEEKDAYS } from "../../../../constants/weekdays";

export default function ScheduleModal({
  open,
  editing,
  form,
  onChange,
  onClose,
  onSave,
}) {
  return (
    <CrudModal
      open={open}
      title={
        editing
          ? "Editar Horário"
          : "Novo Horário"
      }
      onClose={onClose}
      onSave={onSave}
    >
      <FormField label="Dia">
        <select
          name="weekday"
          value={form.weekday}
          onChange={onChange}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3"
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
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />
        </FormField>

        <FormField label="Hora fim">
          <input
            type="time"
            name="end_time"
            value={form.end_time}
            onChange={onChange}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />
        </FormField>

      </div>

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
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 disabled:bg-neutral-100 disabled:text-neutral-400"
        />
      </FormField>
    </CrudModal>
  );
}
