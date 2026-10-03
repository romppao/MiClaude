import { describe, expect, it } from "vitest";
import type { SupportKind } from "@prisma/client";
import {
  achievementPoints,
  trajectoryByCategory,
  boutBackingPoints,
  effectiveSupport,
  type SupportedAchievement,
} from "../../src/lib/aura/trajectory";
import { canEndorse } from "../../src/lib/accounts/backing";

const title = (
  over: Partial<SupportedAchievement> = {},
): SupportedAchievement => ({
  id: "t1",
  fighterId: "f1",
  championship: "Campeonato de España",
  organization: "Entidad ficticia",
  awardedOn: new Date("2025-05-01"),
  scope: "NATIONAL",
  discipline: "BOXEO",
  level: "AMATEUR",
  divisionId: null,
  weightClass: "M70",
  declarationKey: "unico",
  evidenceUrl: null,
  supportKind: "DECLARED",
  supportAuthority: null,
  supportNote: null,
  supportReviewedAt: null,
  supportReviewedById: null,
  supportAccreditationId: null,
  reviewRequestedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  withdrawnAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe("aura por trayectoria y respaldo opcional", () => {
  it.each([
    ["REGIONAL", 20],
    ["NATIONAL", 50],
    ["INTERNATIONAL", 80],
  ] as const)(
    "un campeón %s declarado tiene %i puntos sin terceros",
    (scope, total) => {
      expect(achievementPoints(title({ scope }))).toEqual({
        trajectory: total,
        backing: 0,
        total,
        declared: true,
      });
    },
  );
  it.each([
    ["DOCUMENT", 62],
    ["TRAINER", 75],
    ["ORGANIZER", 75],
    ["FEDERATION", 100],
  ] as const)(
    "un título nacional con respaldo %s suma %i",
    (supportKind, total) => {
      expect(achievementPoints(title({ supportKind })).total).toBe(total);
    },
  );
  it("repetir títulos no acumula puntos; el respaldo superior sustituye el anterior", () => {
    const a = title({ supportKind: "TRAINER" }),
      b = title({ id: "t2", supportKind: "FEDERATION" });
    const groups = trajectoryByCategory([a, b, title({ id: "t3" })]);
    expect(groups.size).toBe(1);
    expect([...groups.values()][0]).toMatchObject({
      trajectory: 50,
      backing: 50,
      total: 100,
    });
  });
  it("cada disciplina, nivel, división y peso conserva sus propios puntos históricos", () => {
    const groups = trajectoryByCategory([
      title(),
      title({ discipline: "MMA" }),
      title({ level: "PRO" }),
      title({ divisionId: "juvenil" }),
      title({ weightClass: "M75" }),
    ]);
    expect(groups.size).toBe(5);
    expect([...groups.values()].map((g) => g.total)).toEqual([
      50, 50, 50, 50, 50,
    ]);
  });
  it("excluir o retirar un título lo deja sin puntos aunque estuviese respaldado", () => {
    expect(
      trajectoryByCategory([
        title({ supportKind: "FEDERATION", rejectedAt: new Date() }),
        title({ withdrawnAt: new Date() }),
      ]).size,
    ).toBe(0);
  });
  it.each([false, true])(
    "una acreditación retirada o sin cuenta no concede bonus (activa=%s)",
    (active) => {
      const a = title({
        supportKind: "FEDERATION",
        supportAccreditationId: "a1",
        supportAccreditation: { active, userId: active ? null : "u1" },
      });
      expect(achievementPoints(a)).toMatchObject({
        total: 50,
        backing: 0,
        declared: true,
      });
      expect(boutBackingPoints(a)).toBe(0);
    },
  );
  it("sin datos de la acreditación tampoco se supone un respaldo", () => {
    expect(
      effectiveSupport({
        supportKind: "FEDERATION",
        supportAccreditationId: "a1",
      }),
    ).toBe("DECLARED");
    expect(boutBackingPoints({ supportKind: null })).toBe(0);
  });
  it.each([
    ["DOCUMENT", 1],
    ["TRAINER", 2],
    ["ORGANIZER", 2],
    ["FEDERATION", 3],
  ] as const)("el bonus del combate %s es %i", (supportKind, points) => {
    expect(boutBackingPoints({ supportKind })).toBe(points);
  });
});

describe("la identidad visual no acredita respaldos", () => {
  const actor = {
    user: { id: "u1", role: "FAN" },
    accreditation: {
      active: true,
      kind: "TRAINER" as SupportKind,
      disciplines: ["MMA" as const],
    },
  };
  it("un entrenador acredita solo su disciplina y tipo de respaldo", () => {
    expect(canEndorse(actor, "MMA", "otro", "TRAINER")).toBe(true);
    expect(canEndorse(actor, "BOXEO", "otro", "TRAINER")).toBe(false);
    expect(canEndorse(actor, "MMA", "otro", "FEDERATION")).toBe(false);
  });
  it("ni moderación ni una federación pueden respaldar un hecho propio", () => {
    expect(canEndorse(actor, "MMA", "u1", "TRAINER")).toBe(false);
    expect(
      canEndorse(
        { ...actor, user: { id: "u1", role: "ADMIN" } },
        "MMA",
        "u1",
        "FEDERATION",
      ),
    ).toBe(false);
  });
  it("ser organizador o tener una acreditación retirada no basta", () => {
    expect(
      canEndorse(
        {
          ...actor,
          accreditation: null,
          user: { id: "u1", role: "ORGANIZER" },
        },
        "MMA",
        "otro",
        "ORGANIZER",
      ),
    ).toBe(false);
    expect(
      canEndorse(
        { ...actor, accreditation: { ...actor.accreditation, active: false } },
        "MMA",
        "otro",
        "TRAINER",
      ),
    ).toBe(false);
  });
});
