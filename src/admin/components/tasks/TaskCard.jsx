import { Repeat } from "lucide-react";

import { Button, urgencyRail, urgencyText } from "../../ui";

import { TASK_REPEAT_LABEL } from "../../../constants/tasks";
import { taskUrgency } from "../../../helpers/taskBoard";
import { toLocalISO } from "../../../helpers/dashboardSummary";

const formatDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

function dueText(task, today, urgency) {
  if (task.status === "done") return task.done_at ? `Concluída em ${formatDay(toLocalISO(new Date(task.done_at)))}` : "";
  if (!task.due_date) return "";
  if (urgency === "alert") return `Atrasada, era ${formatDay(task.due_date)}`;
  if (urgency === "attention") return "Para hoje";
  return `Até ${formatDay(task.due_date)}`;
}

// Ações de cada coluna: no máximo duas, com o verbo do que acontece
const ACTIONS = {
  todo: [
    { to: "doing", label: "Começar" },
    { to: "done", label: "Concluir" },
  ],
  doing: [
    { to: "todo", label: "Voltar para A fazer" },
    { to: "done", label: "Concluir" },
  ],
  done: [{ to: "todo", label: "Reabrir" }],
};

/*
 * Cartão do quadro. Clicar abre a edição; os botões movem de coluna
 * (funcionam no toque e no teclado). No computador também arrasta.
 */
export default function TaskCard({ task, today, ownerName, draggable, busy, onOpen, onMove, onDragStart, onDragEnd }) {
  const urgency = taskUrgency(task, today);
  const due = dueText(task, today, urgency);
  const details = [ownerName, task.area].filter(Boolean).join(", ");

  return (
    <li
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(task);
      }}
      onDragEnd={onDragEnd}
      className={`rounded-lg border border-line bg-white ${urgencyRail(urgency)} ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${busy ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="block w-full rounded-t-lg px-3 pb-1 pt-2.5 text-left hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
      >
        <span className={`block font-semibold ${task.status === "done" ? "text-muted line-through decoration-neutral-400" : ""}`}>
          {task.title}
        </span>
        {(due || details || task.repeat !== "none") && (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
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

      <div className="flex flex-wrap gap-1 px-2 pb-2">
        {ACTIONS[task.status].map((action) => (
          <Button
            key={action.to}
            size="sm"
            variant="quiet"
            disabled={busy}
            onClick={() => onMove(task, action.to)}
            aria-label={`${action.label}: ${task.title}`}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </li>
  );
}
