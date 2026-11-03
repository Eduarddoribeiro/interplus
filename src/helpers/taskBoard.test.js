import { describe, expect, it } from "vitest";

import { boardColumns, nextDueDate, taskCounts, taskUrgency } from "./taskBoard.js";

const today = "2026-11-03";

describe("nextDueDate", () => {
  it("soma um dia, uma semana ou um mês ao prazo", () => {
    expect(nextDueDate("2026-11-03", "daily", today)).toBe("2026-11-04");
    expect(nextDueDate("2026-11-03", "weekly", today)).toBe("2026-11-10");
    expect(nextDueDate("2026-11-05", "monthly", today)).toBe("2026-12-05");
  });

  it("no mês curto cai no último dia, sem perder o dia original depois", () => {
    expect(nextDueDate("2027-01-31", "monthly", "2027-01-31")).toBe("2027-02-28");
    expect(nextDueDate("2028-01-31", "monthly", "2028-01-31")).toBe("2028-02-29");
    expect(nextDueDate("2026-10-31", "monthly", "2026-12-15")).toBe("2026-12-31");
  });

  it("concluída com atraso: avança até hoje ou depois", () => {
    expect(nextDueDate("2026-10-20", "weekly", today)).toBe("2026-11-03");
    expect(nextDueDate("2026-10-01", "daily", today)).toBe("2026-11-03");
    expect(nextDueDate("2026-08-05", "monthly", today)).toBe("2026-11-05");
  });

  it("sem prazo conta a partir de hoje; sem repetição não há próxima", () => {
    expect(nextDueDate(null, "weekly", today)).toBe("2026-11-10");
    expect(nextDueDate("2026-11-03", "none", today)).toBeNull();
  });
});

describe("taskUrgency", () => {
  it("atrasada, para hoje, futura, sem prazo e feita", () => {
    expect(taskUrgency({ status: "todo", due_date: "2026-11-02" }, today)).toBe("alert");
    expect(taskUrgency({ status: "doing", due_date: today }, today)).toBe("attention");
    expect(taskUrgency({ status: "todo", due_date: "2026-11-04" }, today)).toBeNull();
    expect(taskUrgency({ status: "todo", due_date: null }, today)).toBeNull();
    expect(taskUrgency({ status: "done", due_date: "2026-11-01" }, today)).toBeNull();
  });
});

describe("boardColumns e taskCounts", () => {
  const task = (id, fields) => ({ id, status: "todo", due_date: null, done_at: null, created_at: `2026-11-01T1${id}:00:00Z`, ...fields });
  const tasks = [
    task(1, { due_date: null }),
    task(2, { due_date: "2026-11-05" }),
    task(3, { due_date: "2026-11-01" }),
    task(4, { status: "doing", due_date: today }),
    task(5, { status: "done", due_date: "2026-11-01", done_at: "2026-11-02T10:00:00Z" }),
    task(6, { status: "done", done_at: "2026-10-01T10:00:00Z" }),
    task(7, { status: "done", done_at: "2026-11-03T09:00:00Z" }),
  ];

  it("ordena pelo prazo, sem prazo por último, e Feito só com os últimos 14 dias", () => {
    const columns = boardColumns(tasks, today);

    expect(columns.todo.map((item) => item.id)).toEqual([3, 2, 1]);
    expect(columns.doing.map((item) => item.id)).toEqual([4]);
    expect(columns.done.map((item) => item.id)).toEqual([7, 5]);
  });

  it("conta atrasadas e de hoje, sem as feitas", () => {
    expect(taskCounts(tasks, today)).toEqual({ overdue: 1, today: 1 });
  });
});
