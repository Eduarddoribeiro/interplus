import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button, Dialog, DialogActions, inputClass } from "../../ui";
import ConfirmDialog from "../../pages/administration/components/ConfirmDialog";

import { TASK_AREAS, TASK_REPEAT_OPTIONS } from "../../../constants/tasks";
import { errorMessage } from "../../../helpers/errorMessage";

const EMPTY = { title: "", assigned_to: "", due_date: "", area: "", repeat: "none", notes: "" };

/*
 * Criar ou editar uma tarefa. task = null cria; com task, edita e
 * mostra "Excluir" (com confirmação). onSave recebe os valores.
 */
export default function TaskDialog({ open, task, members, defaultAssignee, onClose, onSave, onDelete }) {
  const [values, setValues] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setConfirming(false);
    setValues(
      task
        ? {
            title: task.title,
            assigned_to: task.assigned_to ?? "",
            due_date: task.due_date ?? "",
            area: task.area ?? "",
            repeat: task.repeat,
            notes: task.notes ?? "",
          }
        : { ...EMPTY, assigned_to: defaultAssignee ?? "" },
    );
  }, [open, task, defaultAssignee]);

  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (!values.title.trim()) return setError("Escreva o que precisa ser feito.");

    try {
      setSaving(true);
      setError("");
      await onSave(values);
    } catch (err) {
      console.error("Erro ao salvar tarefa:", err);
      setError(errorMessage(err, "Não foi possível salvar a tarefa. Tente de novo."));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      setSaving(true);
      await onDelete(task);
    } catch (err) {
      console.error("Erro ao excluir tarefa:", err);
      setConfirming(false);
      setError(errorMessage(err, "Não foi possível excluir a tarefa. Tente de novo."));
    } finally {
      setSaving(false);
    }
  }

  const formId = "task-form";

  return (
    <>
      <Dialog
        open={open && !confirming}
        onClose={onClose}
        busy={saving}
        title={task ? "Editar tarefa" : "Nova tarefa"}
        description={task ? task.title : "Algo que a equipe precisa fazer."}
        footer={
          <DialogActions className={task ? "sm:justify-between" : ""}>
            {task && (
              <Button variant="quiet" onClick={() => setConfirming(true)} disabled={saving}>
                <Trash2 size={16} aria-hidden="true" />
                Excluir
              </Button>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" form={formId} disabled={saving}>
                {saving ? "Salvando…" : task ? "Salvar" : "Criar tarefa"}
              </Button>
            </div>
          </DialogActions>
        }
      >
        <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
          <Field label="O que fazer" htmlFor="task-title">
            <input
              id="task-title"
              data-autofocus={task ? undefined : true}
              value={values.title}
              onChange={set("title")}
              maxLength={200}
              required
              aria-invalid={Boolean(error && !values.title.trim())}
              aria-describedby={error ? "task-error" : undefined}
              placeholder="Ex.: reservar a van para a Taça"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Responsável" htmlFor="task-assignee">
              <select id="task-assignee" value={values.assigned_to} onChange={set("assigned_to")} className={inputClass}>
                <option value="">Sem responsável</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Prazo" htmlFor="task-due">
              <input id="task-due" type="date" value={values.due_date} onChange={set("due_date")} className={inputClass} />
            </Field>

            <Field label="Área" htmlFor="task-area">
              <select id="task-area" value={values.area} onChange={set("area")} className={inputClass}>
                <option value="">Sem área</option>
                {TASK_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Repetir" htmlFor="task-repeat">
              <select id="task-repeat" value={values.repeat} onChange={set("repeat")} className={inputClass}>
                {TASK_REPEAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {values.repeat !== "none" && (
            <p className="text-sm text-muted">
              Ao concluir, a próxima nasce sozinha em A fazer{values.due_date ? ", com o prazo seguinte" : ""}.
            </p>
          )}

          <Field label="Observação" htmlFor="task-notes">
            <textarea id="task-notes" rows={3} value={values.notes} onChange={set("notes")} className={inputClass} />
          </Field>

          {error && (
            <p id="task-error" role="alert" className="text-sm font-medium text-alert-text">
              {error}
            </p>
          )}
        </form>
      </Dialog>

      <ConfirmDialog
        open={open && confirming}
        title="Excluir tarefa"
        description={`"${task?.title ?? ""}" será apagada de vez.`}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}
