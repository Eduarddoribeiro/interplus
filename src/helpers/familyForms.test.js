import { describe, expect, it } from "vitest";

import { familyFormGroup, familyFormGroups, inviteStatus, latestInvite } from "./familyForms.js";

const now = new Date("2026-11-03T12:00:00Z");

const invite = (fields = {}) => ({
  created_at: "2026-11-01T12:00:00Z",
  expires_at: "2026-11-08T12:00:00Z",
  used_at: null,
  revoked_at: null,
  reviewed_at: null,
  ...fields,
});

describe("inviteStatus", () => {
  it("separa aberto, vencido, usado e substituído", () => {
    expect(inviteStatus(null, now)).toBe("none");
    expect(inviteStatus(invite(), now)).toBe("open");
    expect(inviteStatus(invite({ expires_at: "2026-11-02T12:00:00Z" }), now)).toBe("expired");
    expect(inviteStatus(invite({ used_at: "2026-11-02T12:00:00Z" }), now)).toBe("used");
    expect(inviteStatus(invite({ revoked_at: "2026-11-02T12:00:00Z" }), now)).toBe("replaced");
  });
});

describe("familyFormGroup", () => {
  it("usado e não conferido vai para conferir; conferido sai", () => {
    expect(familyFormGroup(invite({ used_at: "2026-11-02T12:00:00Z" }), now)).toBe("conferir");
    expect(
      familyFormGroup(invite({ used_at: "2026-11-02T12:00:00Z", reviewed_at: "2026-11-03T10:00:00Z" }), now),
    ).toBe("conferida");
  });

  it("usado depois de vencer a data continua como preenchido", () => {
    expect(familyFormGroup(invite({ used_at: "2026-11-02T12:00:00Z", expires_at: "2026-11-02T13:00:00Z" }), now)).toBe(
      "conferir",
    );
  });
});

describe("familyFormGroups", () => {
  it("vale o link mais recente e ignora quem saiu", () => {
    const old = invite({ created_at: "2026-10-01T12:00:00Z", expires_at: "2026-10-08T12:00:00Z", revoked_at: "2026-11-01T12:00:00Z" });
    const students = [
      { id: "a", status: "active", enrollment_invites: [old, invite()] },
      { id: "b", status: "active", enrollment_invites: [invite({ expires_at: "2026-11-02T12:00:00Z" })] },
      { id: "c", status: "left", enrollment_invites: [invite({ used_at: "2026-11-02T12:00:00Z" })] },
      { id: "d", status: "active", enrollment_invites: [] },
    ];

    const groups = familyFormGroups(students, now);

    expect(groups.aguardando.map((row) => row.student.id)).toEqual(["a"]);
    expect(groups.vencido.map((row) => row.student.id)).toEqual(["b"]);
    expect(groups.conferir).toEqual([]);
    expect(latestInvite(students[0].enrollment_invites)).toBe(students[0].enrollment_invites[1]);
  });
});
