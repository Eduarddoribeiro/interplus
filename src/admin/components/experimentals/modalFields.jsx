
import { Button, DialogActions, inputClass } from "../../ui";
import { LOST_REASON_OPTIONS } from "../../../constants/lostReasons";

export function ModalActions({
  saving,
  onClose,
  submitLabel,
}) {
  return (
    <DialogActions className="mt-6">
      <Button disabled={saving} onClick={onClose}>
        Cancelar
      </Button>

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Salvando…" : submitLabel}
      </Button>
    </DialogActions>
  );
}

export function FormDate({
  label,
  value,
  min,
  onChange,
}) {
  return (
    <div className="mt-6">
      <label className="text-sm font-medium text-ink">
        {label}
      </label>

      <input
        type="date"
        value={value}
        min={min}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`mt-1.5 ${inputClass}`}
      />
    </div>
  );
}

export function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  helper,
}) {
  return (
    <div className="mt-6">
      <label className="text-sm font-medium text-ink">
        {label}
        <span className="ml-1 font-normal text-muted">
          (opcional)
        </span>
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={4}
        placeholder={placeholder}
        className={`mt-1.5 resize-none ${inputClass}`}
      />

      {helper && (
        <p className="mt-2 text-xs text-muted">
          {helper}
        </p>
      )}
    </div>
  );
}

export function LostReasonSelect({
  value,
  onChange,
  label,
}) {
  return (
    <div className="mt-6">
      <label className="text-sm font-medium text-ink">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`mt-1.5 ${inputClass}`}
      >
        <option value="">
          Selecione o motivo
        </option>

        {LOST_REASON_OPTIONS.map(
          (reason) => (
            <option
              key={reason.value}
              value={reason.value}
            >
              {reason.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}
