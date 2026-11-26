import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Plus, X } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import TaskRow from "../components/tasks/TaskRow";
import TaskDialog from "../components/tasks/TaskDialog";
import { toast } from "../components/common/Toaster";
import { Button, Count, Panel, Tabs, inputClass } from "../ui";

import { createTask, deleteTask, getStaffMembers, getTasks, moveTask, updateTask } from "../../services/tasks";
import { getCurrentUser } from "../../services/auth";
import { DONE_VISIBLE_DAYS, TASK_COLUMNS } from "../../constants/tasks";
import { TASK_GROUPS, nextDueDate, recentDone, taskCounts, taskGroups, taskUrgency } from "../../helpers/taskBoard";
import { addDaysISO, toLocalISO } from "../../helpers/dashboardSummary";
import { errorMessage } from "../../helpers/errorMessage";

const DUE_FILTER = {
  atrasadas: { label: "Só as atrasadas", urgency: "alert" },
  hoje: { label: "Só as de hoje", urgency: "attention" },
};

// Prazos da criação rápida; outra data, área ou repetição ficam em "Nova tarefa"
const QUICK_DUE = [
  { value: "today", label: "Hoje" },
  { value: "tomorrow", label: "Amanhã" },
  { value: "none", label: "Sem prazo" },
];

// Arrastar só com mouse; no toque, o círculo conclui e a edição marca "Em andamento"
const canDrag = () => typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

// Feito mostra as mais recentes; o resto abre em "Ver todas"
const DONE_PREVIEW = 5;

const formatDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

/*
 * Tarefas da equipe: lista por prazo (atrasadas, hoje, próximos 7 dias,
 * mais adiante, sem prazo). Escrever e Enter cria; o círculo conclui
 * com Desfazer. "Em andamento" é marcado na edição. As concluídas dos
 * últimos dias ficam recolhidas no fim. "Minhas tarefas" e o filtro
 * de prazo (vindo da Visão geral) ficam na URL.
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
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDue, setQuickDue] = useState("today");
  const [adding, setAdding] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [mobileColumn, setMobileColumn] = useState("todo");
  const draggable = useMemo(canDrag, []);
  const quickRef = useRef(null);

  const mine = searchParams.get("quem") === "minhas";
  const dueFilter = DUE_FILTER[searchParams.get("prazo")] ? searchParams.get("prazo") : null;
  const today = toLocalISO();

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

  const groups = useMemo(
    () => taskGroups(visible.filter((task) => task.status === "todo"), today),
    [visible, today],
  );
  const doing = useMemo(
    () =>
      visible
        .filter((task) => task.status === "doing")
        .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")),
    [visible],
  );
  const done = useMemo(() => (dueFilter ? [] : recentDone(visible, today)), [visible, today, dueFilter]);
  const counts = useMemo(() => taskCounts(tasks, today), [tasks, today]);
  const todoCount = TASK_GROUPS.reduce((total, group) => total + groups[group.key].length, 0);
  const columnCount = { todo: todoCount, doing: doing.length, done: done.length };

  // Muda já na tela; se o banco recusar, volta como estava
  async function setStatus(task, status, { undo = true } = {}) {
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

      if (status === "done") {
        const repeats = task.repeat !== "none" && !task.next_created;
        const message = repeats
          ? `Concluída. A próxima ficou para ${formatDay(nextDueDate(task.due_date, task.repeat, today))}.`
          : "Tarefa concluída.";
        toast(message, {
          type: "success",
          action: undo ? { label: "Desfazer", onClick: () => setStatus({ ...task, status: "done" }, task.status, { undo: false }) } : undefined,
        });
      } else if (undo) {
        toast(status === "doing" ? "Em andamento." : "Voltou para A fazer.", { type: "success" });
      }

      await load();
    } catch (err) {
      console.error("Erro ao mudar a tarefa:", err);
      setTasks(previous);
      toast(errorMessage(err, "Não foi possível salvar. Tente de novo."));
    } finally {
      setBusyId(null);
    }
  }

  async function quickAdd(event) {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title || adding) return;

    try {
      setAdding(true);
      await createTask({
        title,
        due_date: quickDue === "today" ? today : quickDue === "tomorrow" ? addDaysISO(today, 1) : null,
        assigned_to: userId,
        repeat: "none",
      });
      setQuickTitle("");
      toast("Tarefa criada.", { type: "success" });
      await load();
      quickRef.current?.focus();
    } catch (err) {
      console.error("Erro ao criar tarefa:", err);
      toast(errorMessage(err, "Não foi possível criar a tarefa. Tente de novo."));
    } finally {
      setAdding(false);
    }
  }

  async function save(values) {
    const { status, ...fields } = values;

    if (dialog.task) {
      await updateTask(dialog.task.id, fields);
      if (status && status !== dialog.task.status) await moveTask(dialog.task.id, status);
    } else {
      await createTask(fields);
    }

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

  const row = (task) => (
    <TaskRow
      key={task.id}
      task={task}
      today={today}
      ownerName={memberName[task.assigned_to]}
      busy={busyId === task.id}
      onOpen={(item) => setDialog({ task: item })}
      onToggle={(item) => setStatus(item, item.status === "done" ? "todo" : "done")}
      card
      draggable={draggable && busyId !== task.id}
      onDragStart={setDragging}
      onDragEnd={() => {
        setDragging(null);
        setDropTarget(null);
      }}
    />
  );

  function drop(event, status) {
    event.preventDefault();
    setDropTarget(null);
    const task = tasks.find((item) => item.id === event.dataTransfer.getData("text/plain"));
    if (task) setStatus(task, status);
  }

  // Coluna do quadro: recebe tarefas arrastadas (computador) e some no celular quando não é a aba aberta
  const column = (value, children) => {
    const label = TASK_COLUMNS.find((item) => item.value === value).label;

    return (
      <section
        key={value}
        aria-labelledby={`coluna-${value}`}
        onDragOver={(event) => {
          if (!dragging) return;
          event.preventDefault();
          setDropTarget(value);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(null);
        }}
        onDrop={(event) => drop(event, value)}
        className={`${value === mobileColumn ? "" : "hidden"} min-w-0 rounded-xl border bg-canvas p-2 transition-colors lg:block ${
          dropTarget === value && dragging?.status !== value ? "border-ink" : "border-line"
        }`}
      >
        <h2 id={`coluna-${value}`} className="hidden items-center gap-2 px-2 pb-2 pt-1 font-semibold lg:flex">
          {label}
          <Count value={columnCount[value]} />
        </h2>
        {children}
      </section>
    );
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Tarefas"
        summary={summary}
        actions={
          <Button onClick={() => setDialog({ task: null })}>
            <Plus size={18} aria-hidden="true" />
            Com detalhes
          </Button>
        }
      />

      {/* CRIAÇÃO RÁPIDA */}
      <Panel as="form" onSubmit={quickAdd} className="space-y-3 p-3 sm:p-4">
        <label htmlFor="quick-task" className="sr-only">
          Nova tarefa
        </label>
        <div className="flex gap-2">
          <input
            id="quick-task"
            ref={quickRef}
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            maxLength={200}
            placeholder="O que precisa ser feito?"
            className={inputClass}
          />
          <Button type="submit" variant="primary" disabled={!quickTitle.trim() || adding}>
            {adding ? "Criando…" : "Criar"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Prazo da nova tarefa">
          <span className="mr-1 text-sm text-muted">Prazo</span>
          {QUICK_DUE.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={quickDue === option.value}
              onClick={() => setQuickDue(option.value)}
              className={`h-8 rounded-lg px-3 text-sm font-medium transition-colors touch:h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                quickDue === option.value ? "bg-ink text-white" : "border border-line bg-white text-ink hover:border-neutral-400"
              }`}
            >
              {option.label}
            </button>
          ))}
          <span className="ml-auto hidden text-sm text-muted sm:inline">Fica com você. Enter cria.</span>
        </div>
      </Panel>

      {/* FILTROS */}
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
              items={TASK_COLUMNS.map((item) => ({ ...item, count: columnCount[item.value] }))}
            />
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-3">
            {column(
              "todo",
              todoCount === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted">
                  {dueFilter ? "Nada com esse prazo." : "Nada a fazer."}
                </p>
              ) : (
                <div className="space-y-3">
                  {TASK_GROUPS.filter((group) => groups[group.key].length > 0).map((group) => (
                    <div key={group.key}>
                      <p
                        className={`px-2 pb-1.5 text-sm font-medium ${
                          group.urgency === "alert"
                            ? "text-alert-text"
                            : group.urgency === "attention"
                              ? "text-attention-text"
                              : "text-muted"
                        }`}
                      >
                        {group.label}
                      </p>
                      <ul className="space-y-2">{groups[group.key].map(row)}</ul>
                    </div>
                  ))}
                </div>
              ),
            )}

            {column(
              "doing",
              doing.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted">
                  {draggable ? "Arraste para cá o que você começou." : "Marque \"Em andamento\" na tarefa."}
                </p>
              ) : (
                <ul className="space-y-2">{doing.map(row)}</ul>
              ),
            )}

            {column(
              "done",
              done.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted">Nada concluído nos últimos {DONE_VISIBLE_DAYS} dias.</p>
              ) : (
                <>
                  <ul className="space-y-2">{(showDone ? done : done.slice(0, DONE_PREVIEW)).map(row)}</ul>
                  {done.length > DONE_PREVIEW && (
                    <button
                      type="button"
                      onClick={() => setShowDone((current) => !current)}
                      aria-expanded={showDone}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                    >
                      <ChevronDown
                        size={16}
                        aria-hidden="true"
                        className={`transition-transform motion-reduce:transition-none ${showDone ? "rotate-180" : ""}`}
                      />
                      {showDone ? "Mostrar menos" : `Ver todas (${done.length})`}
                    </button>
                  )}
                </>
              ),
            )}
          </div>
        </>
      )}

      <TaskDialog
        open={Boolean(dialog)}
        task={dialog?.task ?? null}
        members={members}
        defaultAssignee={userId ?? ""}
        onClose={() => setDialog(null)}
        onSave={save}
        onDelete={remove}
      />
    </div>
  );
}
