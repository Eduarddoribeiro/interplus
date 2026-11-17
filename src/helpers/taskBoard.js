/*
 * Regras do quadro de tarefas: próximo prazo das tarefas repetidas,
 * urgência pelo prazo, colunas e contadores. Datas em "AAAA-MM-DD".
 * A mesma regra do próximo prazo está no gatilho staff_tasks_repeat.
 */

import { DONE_VISIBLE_DAYS } from "../constants/tasks.js";

const toDate = (iso) => new Date(`${iso}T12:00:00Z`);
const toIso = (date) => date.toISOString().slice(0, 10);

function addDays(iso, days) {
  const date = toDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

// Soma meses mantendo o dia; no mês curto, cai no último dia (31/01 → 28/02)
function addMonths(iso, months) {
  const [year, month, day] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return toIso(target);
}

/*
 * Prazo da próxima tarefa repetida: o prazo anterior + 1 dia, semana
 * ou mês. Se já passou, avança até hoje ou depois (concluir com atraso
 * não gera tarefas vencidas). Sem prazo, conta a partir de hoje.
 */
export function nextDueDate(dueDate, repeat, today) {
  if (!repeat || repeat === "none") return null;

  const base = dueDate || today;
  const step = (count) =>
    repeat === "daily" ? addDays(base, count) : repeat === "weekly" ? addDays(base, 7 * count) : addMonths(base, count);

  let count = 1;
  while (step(count) < today) count += 1;

  return step(count);
}

// "alert" = atrasada, "attention" = para hoje, null = sem pressa ou feita
export function taskUrgency(task, today) {
  if (task.status === "done" || !task.due_date) return null;
  if (task.due_date < today) return "alert";
  if (task.due_date === today) return "attention";
  return null;
}

// Prazo mais cedo primeiro; sem prazo por último
const byDueDate = (a, b) =>
  (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31") || a.created_at.localeCompare(b.created_at);

/*
 * Tarefas nas três colunas. Feito mostra só as concluídas nos últimos
 * DONE_VISIBLE_DAYS dias, as mais recentes primeiro.
 */
export function boardColumns(tasks, today) {
  const since = addDays(today, -DONE_VISIBLE_DAYS);

  return {
    todo: tasks.filter((task) => task.status === "todo").sort(byDueDate),
    doing: tasks.filter((task) => task.status === "doing").sort(byDueDate),
    done: tasks
      .filter((task) => task.status === "done" && (task.done_at ?? "").slice(0, 10) >= since)
      .sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? "")),
  };
}

// Pendências da Visão geral e do menu
export function taskCounts(tasks, today) {
  const open = tasks.filter((task) => task.status !== "done" && task.due_date);

  return {
    overdue: open.filter((task) => task.due_date < today).length,
    today: open.filter((task) => task.due_date === today).length,
  };
}

/*
 * Lista por prazo (tela de Tarefas): atrasadas, hoje, próximos 7 dias,
 * mais adiante e sem prazo. Dentro de cada grupo, as já começadas
 * vêm primeiro, depois pelo prazo. Feitas ficam fora (ver recentDone).
 */
export const TASK_GROUPS = [
  { key: "overdue", label: "Atrasadas", urgency: "alert" },
  { key: "today", label: "Hoje", urgency: "attention" },
  { key: "week", label: "Próximos 7 dias" },
  { key: "later", label: "Mais adiante" },
  { key: "none", label: "Sem prazo" },
];

export function taskGroup(task, today) {
  if (!task.due_date) return "none";
  if (task.due_date < today) return "overdue";
  if (task.due_date === today) return "today";
  if (task.due_date <= addDays(today, 7)) return "week";
  return "later";
}

const startedFirst = (a, b) => (a.status === "doing" ? 0 : 1) - (b.status === "doing" ? 0 : 1) || byDueDate(a, b);

export function taskGroups(tasks, today) {
  const groups = Object.fromEntries(TASK_GROUPS.map((group) => [group.key, []]));
  tasks.filter((task) => task.status !== "done").forEach((task) => groups[taskGroup(task, today)].push(task));
  Object.values(groups).forEach((list) => list.sort(startedFirst));

  return groups;
}

export const recentDone = (tasks, today) => boardColumns(tasks, today).done;
