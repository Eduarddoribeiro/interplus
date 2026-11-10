import { describe, expect, it } from "vitest";

import { buildJourney, describeJourneyCard } from "./journey";

const today = "2026-11-10";
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const contact = (fields) => ({ id: Math.random(), child_name: "Criança", updated_at: daysAgo(0), ...fields });

describe("Jornada das famílias", () => {
  it("põe cada status na sua etapa", () => {
    const columns = buildJourney(
      [
        contact({ status: "new_contact" }),
        contact({ status: "pending_confirmation", experimental_date: "2026-11-20" }),
        contact({ status: "confirmed", experimental_date: "2026-11-11" }),
        contact({ status: "no_show" }),
        contact({ status: "lost" }),
        contact({ status: "cancelled" }),
      ],
      today,
    );
    const count = Object.fromEntries(columns.map((column) => [column.key, column.items.length]));

    expect(count).toMatchObject({ new: 1, scheduled: 2, no_show: 1, closed: 2, enrolled: 0 });
  });

  it("matriculados e encerrados só dos últimos 30 dias", () => {
    const columns = buildJourney(
      [
        contact({ status: "enrolled", enrolled_at: daysAgo(5) }),
        contact({ status: "enrolled", enrolled_at: daysAgo(90) }),
        contact({ status: "lost", updated_at: daysAgo(40) }),
      ],
      today,
    );

    expect(columns.find((column) => column.key === "enrolled").items).toHaveLength(1);
    expect(columns.find((column) => column.key === "closed").items).toHaveLength(0);
  });

  it("só pede ação quando há algo a fazer", () => {
    expect(describeJourneyCard(contact({ status: "new_contact", updated_at: daysAgo(3) }), today).waiting).toBe("marcar a aula");
    expect(describeJourneyCard(contact({ status: "new_contact", updated_at: daysAgo(1) }), today).waiting).toBeNull();
    expect(describeJourneyCard(contact({ status: "pending_confirmation", experimental_date: "2026-11-12" }), today).waiting).toBe("confirmar a aula");
    expect(describeJourneyCard(contact({ status: "pending_confirmation", experimental_date: "2026-11-20" }), today).waiting).toBeNull();
    expect(describeJourneyCard(contact({ status: "follow_up", follow_up_date: "2026-11-09" }), today).waiting).toBe("retorno para fazer");
    expect(describeJourneyCard(contact({ status: "waiting_list", updated_at: daysAgo(50) }), today).waiting).toBeNull();
  });

  it("quem pede ação vem primeiro", () => {
    const [first] = buildJourney(
      [contact({ child_name: "Calma", status: "new_contact", updated_at: daysAgo(1) }), contact({ child_name: "Parada", status: "new_contact", updated_at: daysAgo(5) })],
      today,
    )[0].items;

    expect(first.contact.child_name).toBe("Parada");
  });
});
