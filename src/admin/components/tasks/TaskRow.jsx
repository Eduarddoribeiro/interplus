import { Check, Repeat } from "lucide-react";

import { urgencyRail, urgencyText } from "../../ui";

import { TASK_REPEAT_LABEL } from "../../../constants/tasks";
import { taskUrgency } from "../../../helpers/taskBoard";
import { toLocalISO } from "../../../helpers/dashboardSummary";

const formatDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const formatWeekday = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long" });

function dueText(task, today, urgency) {
  if (task.status === "done") return task.done_at ? `Concluída em ${formatDay(toLocalISO(new Date(task.done_at)))}` : "";
  if (!task.due_date) return "";
  if (urgency === "alert") return `Era ${formatDay(task.due_date)}`;
  if (urgency === "attention") return "";

  const days = Math.round((new Date(`${task.due_date}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000);
  if (days === 1) return "Amanhã";
  if (days <= 6) return formatWeekday(task.due_date).replace("-feira", "");
  return formatDay(task.due_date);
}

/*
 * Linha da lista de tarefas. O círculo conclui (ou reabre) num toque;
 * o resto da linha abre a edição.
 */
export default function TaskRow({ task, today, ownerName, busy, onOpen, onToggle }) {
  const done = task.status === "done";
  const urgency = taskUrgency(task, today);
  const due = dueText(task, today, urgency);
  const details = [ownerName, task.area].filter(Boolean).join(", ");

  return (
    <li className={`flex items-start gap-3 border-t border-line px-3 py-2.5 first:border-t-0 sm:px-4 ${urgencyRail(urgency)} ${busy ? "opacity-60" : ""}`}>
      <button
        type="button"
        disabled={busy}
        onClick={() => onToggle(task)}
        aria-label={done ? `Reabrir "${task.title}"` : `Concluir "${task.title}"`}
        className={`group mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink touch:h-8 touch:w-8 ${
          done ? "border-ok bg-ok text-white" : "border-neutral-300 text-transparent hover:border-ok hover:text-ok"
        }`}
      >
        <Check size={14} strokeWidth={3} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onOpen(task)}
        className="min-w-0 flex-1 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
      >
        <span className={`block break-words font-medium ${done ? "text-muted line-through decoration-neutral-400" : "text-ink"}`}>
          {task.title}
        </span>
        {(due || details || task.repeat !== "none" || task.status === "doing") && (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm">
            {task.status === "doing" && <span className="font-medium text-ink">Em andamento</span>}
            {due && <span className={urgency ? urgencyText(urgency) : "text-muted"}>{due}</span>}
            {details && <span className="text-muted">{details}</span>}
            {task.repeat !== "none" && (
              <span className="inline-flex items-center gap-1 text-muted">
                <Repeat size={13} aria-hidden="true" />
                {TASK_REPEAT_LABEL[task.repeat]}
              </span>
            )}
          </span>
        )}
      </button>
    </li>
  );
}
