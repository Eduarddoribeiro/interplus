import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, X } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import TaskCard from "../components/tasks/TaskCard";
import TaskDialog from "../components/tasks/TaskDialog";
import { toast } from "../components/common/Toaster";
import { Button, Count, Panel, Tabs } from "../ui";

import { createTask, deleteTask, getStaffMembers, getTasks, moveTask, updateTask } from "../../services/tasks";
import { getCurrentUser } from "../../services/auth";
import { TASK_COLUMNS, TASK_STATUS_LABEL } from "../../constants/tasks";
import { boardColumns, nextDueDate, taskCounts, taskUrgency } from "../../helpers/taskBoard";
import { toLocalISO } from "../../helpers/dashboardSummary";
import { errorMessage } from "../../helpers/errorMessage";

const DUE_FILTER = {
  atrasadas: { label: "Só as atrasadas", urgency: "alert" },
  hoje: { label: "Só as de hoje", urgency: "attention" },
};

const formatDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

// Arrastar só com mouse; no toque ficam os botões do cartão
const canDrag = () => typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

/*
 * Tarefas da equipe: quadro A fazer / Fazendo / Feito.
 * No computador, três colunas e arrastar; no celular, uma coluna por
 * aba. "Minhas tarefas" e o filtro de prazo (vindo da Visão geral)
 * ficam na URL.
 */
export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [dialog, setDialog] = useState(null); // { task } | { task: null }
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [mobileColumn, setMobileColumn] = useState("todo");

  const mine = searchParams.get("quem") === "minhas";
  const dueFilter = DUE_FILTER[searchParams.get("prazo")] ? searchParams.get("prazo") : null;
  const today = toLocalISO();
  const draggable = useMemo(canDrag, []);

  function setParam(key, value) {
    const params = Object.fromEntries(searchParams);
    if (value) params[key] = value;
    else delete params[key];
    setSearchParams(params, { replace: true });
  }

  useEffect(() => {
    load();
    getCurrentUser()
      .then((user) => setUserId(user?.id ?? null))
      .catch(() => setUserId(null));
    getStaffMembers()
      .then(setMembers)
      .catch((err) => console.error("Erro ao carregar a equipe:", err));

    function handleVisibility() {
      if (document.visibilityState === "visible") load();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  async function load() {
    try {
      setError("");
      setTasks(await getTasks());
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err);
      setError(errorMessage(err, "Não foi possível carregar as tarefas."));
    } finally {
      setLoading(false);
    }
  }

  const memberName = useMemo(() => Object.fromEntries(members.map((member) => [member.user_id, member.name])), [members]);

  const visible = useMemo(
    () =>
      tasks
        .filter((task) => !mine || task.assigned_to === userId)
        .filter((task) => !dueFilter || taskUrgency(task, today) === DUE_FILTER[dueFilter].urgency),
    [tasks, mine, userId, dueFilter, today],
  );

  const columns = useMemo(() => boardColumns(visible, today), [visible, today]);
  const counts = useMemo(() => taskCounts(tasks, today), [tasks, today]);

  // Move já na tela; se o banco recusar, volta como estava
  async function move(task, status) {
    if (task.status === status) return;

    const previous = tasks;
    setBusyId(task.id);
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status, done_at: status === "done" ? new Date().toISOString() : null } : item,
      ),
    );

    try {
      await moveTask(task.id, status);
      const repeats = status === "done" && task.repeat !== "none" && !task.next_created;
      if (repeats) {
        const next = nextDueDate(task.due_date, task.repeat, today);
        toast(`Concluída. A próxima ficou para ${formatDay(next)}.`, { type: "success" });
      } else {
        toast(`Movida para ${TASK_STATUS_LABEL[status]}.`, { type: "success" });
      }
      await load();
    } catch (err) {
      console.error("Erro ao mover tarefa:", err);
      setTasks(previous);
      toast(errorMessage(err, "Não foi possível mover a tarefa. Tente de novo."));
    } finally {
      setBusyId(null);
    }
  }

  async function save(values) {
    if (dialog.task) await updateTask(dialog.task.id, values);
    else await createTask(values);

    toast(dialog.task ? "Tarefa salva." : "Tarefa criada.", { type: "success" });
    setDialog(null);
    await load();
  }

  async function remove(task) {
    await deleteTask(task.id);
    toast("Tarefa excluída.", { type: "success" });
    setDialog(null);
    await load();
  }

  function drop(event, status) {
    event.preventDefault();
    setDropTarget(null);
    const task = tasks.find((item) => item.id === event.dataTransfer.getData("text/plain"));
    if (task) move(task, status);
  }

  const summary = loading
    ? ""
    : counts.overdue || counts.today
      ? [
          counts.overdue && `${counts.overdue} ${counts.overdue === 1 ? "atrasada" : "atrasadas"}`,
          counts.today && `${counts.today} para hoje`,
        ]
          .filter(Boolean)
          .join(", ") + "."
      : "Nenhuma tarefa atrasada nem para hoje.";

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Tarefas"
        summary={summary}
        actions={
          <Button variant="primary" onClick={() => setDialog({ task: null })}>
            <Plus size={18} aria-hidden="true" />
            Nova tarefa
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="De quem" className="flex gap-1">
          {[
            { value: false, label: "Todas" },
            { value: true, label: "Minhas tarefas" },
          ].map((option) => (
            <Button
              key={option.label}
              size="sm"
              variant={mine === option.value ? "secondary" : "quiet"}
              aria-pressed={mine === option.value}
              onClick={() => setParam("quem", option.value ? "minhas" : null)}
              className={mine === option.value ? "!border-ink !bg-ink !text-white" : ""}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {dueFilter && (
          <Button size="sm" onClick={() => setParam("prazo", null)} aria-label={`${DUE_FILTER[dueFilter].label}. Tirar o filtro`}>
            {DUE_FILTER[dueFilter].label}
            <X size={15} aria-hidden="true" />
          </Button>
        )}
      </div>

      {loading && tasks.length === 0 ? (
        <p role="status" className="py-12 text-center text-muted">
          Carregando tarefas…
        </p>
      ) : error ? (
        <Panel className="p-5">
          <p role="alert" className="font-medium text-alert-text">
            {error}
          </p>
          <Button className="mt-3" onClick={load}>
            Tentar de novo
          </Button>
        </Panel>
      ) : (
        <>
          <div className="lg:hidden">
            <Tabs
              label="Colunas do quadro"
              value={mobileColumn}
              onChange={setMobileColumn}
              items={TASK_COLUMNS.map((column) => ({ ...column, count: columns[column.value].length }))}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {TASK_COLUMNS.map((column) => (
              <section
                key={column.value}
                aria-labelledby={`coluna-${column.value}`}
                onDragOver={(event) => {
                  if (!dragging) return;
                  event.preventDefault();
                  setDropTarget(column.value);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(null);
                }}
                onDrop={(event) => drop(event, column.value)}
                className={`${column.value === mobileColumn ? "" : "hidden"} rounded-xl border bg-canvas p-2 transition-colors lg:block ${
                  dropTarget === column.value && dragging?.status !== column.value ? "border-ink" : "border-line"
                }`}
              >
                <h2 id={`coluna-${column.value}`} className="flex items-center gap-2 px-2 pb-2 pt-1 font-semibold max-lg:sr-only">
                  {column.label}
                  <Count value={columns[column.value].length} />
                </h2>

                {columns[column.value].length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted">
                    {column.value === "done" ? "Nada concluído nos últimos 14 dias." : "Nenhuma tarefa aqui."}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {columns[column.value].map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        today={today}
                        ownerName={memberName[task.assigned_to]}
                        draggable={draggable && busyId !== task.id}
                        busy={busyId === task.id}
                        onOpen={(item) => setDialog({ task: item })}
                        onMove={move}
                        onDragStart={setDragging}
                        onDragEnd={() => {
                          setDragging(null);
                          setDropTarget(null);
                        }}
                      />
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </>
      )}

      <TaskDialog
        open={Boolean(dialog)}
        task={dialog?.task ?? null}
        members={members}
        defaultAssignee={mine ? userId : ""}
        onClose={() => setDialog(null)}
        onSave={save}
        onDelete={remove}
      />
    </div>
  );
}
