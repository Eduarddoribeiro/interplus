/*
 * Tarefas da equipe: colunas do quadro, áreas e repetição.
 * Ver docs/features/tarefas-equipe.md.
 */

export const TASK_COLUMNS = [
  { value: "todo", label: "A fazer" },
  { value: "doing", label: "Fazendo" },
  { value: "done", label: "Feito" },
];

export const TASK_STATUS_LABEL = Object.fromEntries(TASK_COLUMNS.map((column) => [column.value, column.label]));

export const TASK_AREAS = ["Secretaria", "Financeiro", "Eventos", "Uniforme", "Comunicação", "Estrutura", "Outros"];

export const TASK_REPEAT_OPTIONS = [
  { value: "none", label: "Não repete" },
  { value: "daily", label: "Todo dia" },
  { value: "weekly", label: "Toda semana" },
  { value: "monthly", label: "Todo mês" },
];

export const TASK_REPEAT_LABEL = Object.fromEntries(TASK_REPEAT_OPTIONS.map((option) => [option.value, option.label]));

// Feito mostra só o que foi concluído nestes últimos dias
export const DONE_VISIBLE_DAYS = 14;
