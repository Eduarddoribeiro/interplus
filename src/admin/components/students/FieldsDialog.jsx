import { useEffect, useState } from "react";

import { Button, Dialog, DialogActions, inputClass } from "../../ui";
import { errorMessage } from "../../../helpers/errorMessage";

export function Field({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

/*
 * Janela de edição a partir de uma lista de campos.
 * fields: [{ name, label, type: "text" | "date" | "number" | "tel" |
 *   "email" | "select" | "textarea", options: [{ value, label }],
 *   required, wide }]
 * onSave(valores) recebe vazio como null.
 */
export default function FieldsDialog({ open, onClose, title, description, fields, values, onSave, saveLabel = "Salvar" }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(Object.fromEntries(fields.map((field) => [field.name, values?.[field.name] ?? ""])));
    setError("");
    // Só ao abrir: os valores não mudam enquanto a janela está aberta
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();

    const missing = fields.find((field) => field.required && !String(form[field.name] ?? "").trim());
    if (missing) {
      setError(`Preencha: ${missing.label.replace(" *", "")}.`);
      return;
    }

    const result = Object.fromEntries(
      fields.map((field) => {
        const value = typeof form[field.name] === "string" ? form[field.name].trim() : form[field.name];
        if (value === "" || value == null) return [field.name, null];
        return [field.name, field.type === "number" ? Number(value) : value];
      }),
    );

    try {
      setSaving(true);
      setError("");
      await onSave(result);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError(errorMessage(err, "Não foi possível salvar."));
    } finally {
      setSaving(false);
    }
  }

  const formId = `fields-${title.replace(/\W+/g, "-")}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={saving}
      title={title}
      description={description}
      size="lg"
      footer={
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form={formId} disabled={saving}>
            {saving ? "Salvando…" : saveLabel}
          </Button>
        </DialogActions>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const props = {
            value: form[field.name] ?? "",
            onChange: (event) => setForm((current) => ({ ...current, [field.name]: event.target.value })),
            className: inputClass,
          };

          return (
            <Field key={field.name} label={field.label} className={field.wide || field.type === "textarea" ? "sm:col-span-2" : ""}>
              {field.type === "select" ? (
                <select {...props}>
                  <option value="">Não informado</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea rows={3} {...props} className={`${inputClass} resize-y`} />
              ) : (
                <input
                  type={field.type ?? "text"}
                  inputMode={field.type === "tel" ? "tel" : field.type === "number" ? "numeric" : undefined}
                  autoComplete="off"
                  {...props}
                />
              )}
            </Field>
          );
        })}

        {error && (
          <p role="alert" className="rounded-lg bg-alert-soft p-3 text-sm text-alert-text sm:col-span-2">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
