import { describe, expect, it } from "vitest";

import { withSessionLocation } from "./reportLocation";

const krahe = { id: 1, name: "Krahe" };
const bigua = { id: 2, name: "Biguá" };
const at = (location) => ({ training_group: { location } });

describe("local nos relatórios", () => {
  it("usa o local da experimental mais recente quando o contato não tem", () => {
    const [semLocal, comLocal, semAula] = withSessionLocation(
      [{ id: "a" }, { id: "b", location_id: 2, location: bigua }, { id: "c" }],
      [
        { contact_id: "a", status: "no_show", experimental_date: "2026-11-01", schedule: at(bigua) },
        { contact_id: "a", status: "pending_confirmation", experimental_date: "2026-11-08", schedule: at(krahe) },
        { contact_id: "a", status: "cancelled", experimental_date: "2026-11-20", schedule: at(bigua) },
        { contact_id: "b", status: "attended", experimental_date: "2026-11-02", schedule: at(krahe) },
      ],
    );

    expect(semLocal.location).toEqual(krahe);
    expect(comLocal.location).toEqual(bigua);
    expect(semAula.location).toBeUndefined();
  });
});
