import { describe, expect, it } from "vitest";

import { buildContactTimeline, parseNoteLines } from "./contactTimeline";

const today = "2026-11-10";

describe("linha do tempo do contato", () => {
  it("lê as linhas datadas das observações", () => {
    expect(parseNoteLines("[05/11/2026] Ligou a mãe\nsem data\n[07/11/2026] Pediu outro dia")).toEqual([
      { at: "2026-11-05", text: "Ligou a mãe" },
      { at: "2026-11-07", text: "Pediu outro dia" },
    ]);
  });

  it("monta a história com o próximo passo em cima", () => {
    const events = buildContactTimeline(
      {
        status: "pending_confirmation",
        first_contact_at: "2026-10-20T10:00:00Z",
        internal_notes: "[06/11/2026] Mãe pediu remarcar",
      },
      [
        { id: 1, status: "no_show", experimental_date: "2026-11-06", experimental_time: "19:00:00", created_at: "2026-10-21T10:00:00Z" },
        { id: 2, status: "pending_confirmation", experimental_date: "2026-11-13", experimental_time: "19:00:00", created_at: "2026-11-06T12:00:00Z" },
      ],
      today,
    );

    const titles = events.map((event) => event.title);

    expect(events[0]).toMatchObject({ upcoming: true, title: "Experimental a confirmar" });
    expect(titles).toContain("Faltou à experimental");
    expect(titles).toContain("Mãe pediu remarcar");
    expect(titles.at(-1)).toBe("Primeiro contato");
  });

  it("aula remarcada aparece como remarcada, sem 'próximo'", () => {
    const events = buildContactTimeline(
      { status: "pending_confirmation", created_at: "2026-11-01T10:00:00Z" },
      [{ id: 1, status: "cancelled", experimental_date: "2026-11-20", created_at: "2026-11-02T10:00:00Z" }],
      today,
    );

    expect(events.some((event) => event.upcoming)).toBe(false);
    expect(events.find((event) => event.key === "marcada-1").detail).toBe("Remarcada depois para outra data");
  });
});
