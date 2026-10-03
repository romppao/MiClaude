import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  totals: [] as unknown[], titles: [] as unknown[], supported: [] as unknown[],
  publicFighters: [{ id: "f1", slug: "ana", firstName: "Ana", lastName: "Prueba" }],
  communityBouts: [{ id: "b1", weightClass: "M70", divisionId: null, event: { discipline: "BOXEO", level: "AMATEUR" } }],
  auraQuery: vi.fn(), titleQuery: vi.fn(), boutQuery: vi.fn(), fighterQuery: vi.fn(),
}));
vi.mock("../../src/lib/common/db", () => ({ db: {
  aura: { groupBy: (args: unknown) => { mocks.auraQuery(args); return mocks.totals; } },
  fighterAchievement: { findMany: (args: unknown) => { mocks.titleQuery(args); return mocks.titles; } },
  bout: { findMany: (args: { include?: unknown }) => { mocks.boutQuery(args); return args.include ? mocks.supported : mocks.communityBouts; } },
  fighter: { findMany: (args: unknown) => { mocks.fighterQuery(args); return mocks.publicFighters; } },
} }));
import { auraRanking } from "../../src/lib/aura/ranking";

const title = () => ({ fighterId: "f1", scope: "NATIONAL", discipline: "BOXEO", level: "AMATEUR", weightClass: "M70", divisionId: null, supportKind: "FEDERATION", supportAccreditationId: null, rejectedAt: null, withdrawnAt: null });
const supported = () => ({ fighterAId: "f1", fighterBId: "oculto", weightClass: "M70", divisionId: null, supportKind: "FEDERATION", supportAccreditationId: null, event: { discipline: "BOXEO", level: "AMATEUR" } });
beforeEach(() => {
  vi.clearAllMocks(); mocks.totals = []; mocks.titles = []; mocks.supported = [];
});
it("suma trayectoria, respaldo y comunidad; el bonus de combates tiene un límite por categoría", async () => {
  mocks.totals = [{ fighterId: "f1", boutId: "b1", _count: { _all: 7 } }];
  mocks.titles = [title()]; mocks.supported = Array.from({ length: 20 }, supported);
  const result = (await auraRanking())[0].entries;
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ fighterId: "f1", trajectory: 50, backing: 90, community: 7, aura: 147, declared: false });
});
it("el periodo solo limita reconocimientos; las fuentes históricas mantienen categoría y puntuación", async () => {
  mocks.titles = [title(), { ...title(), divisionId: "juvenil", weightClass: "M60" }];
  const groups = await auraRanking({ sinceDays: 90, province: "Valencia", fighterId: "f1" });
  expect(groups).toHaveLength(2);
  expect(groups.map(g => g.entries[0].aura)).toEqual([100, 100]);
  expect(mocks.auraQuery.mock.calls[0][0].where.createdAt.gte).toBeInstanceOf(Date);
  expect(mocks.titleQuery.mock.calls[0][0].where).not.toHaveProperty("awardedOn");
  expect(mocks.fighterQuery.mock.calls[0][0].where).toMatchObject({ listed: true, hiddenAt: null, province: "Valencia", id: "f1" });
});
it("se excluyen revisiones, cancelaciones y eventos futuros en las consultas del ranking", async () => {
  await auraRanking({ discipline: "MMA", level: "PRO" });
  const community = mocks.auraQuery.mock.calls[0][0].where.bout;
  expect(community.verification).toEqual({ not: "DISPUTED" });
  expect(community.event).toMatchObject({ discipline: "MMA", level: "PRO", status: { not: "CANCELLED" } });
  expect(community.event.date.lt).toBeInstanceOf(Date);
  expect(mocks.boutQuery.mock.calls[0][0].where).toMatchObject({ verification: "VERIFIED", result: { not: null }, supportKind: { not: null } });
});
it("retirar una acreditación elimina ambos tipos de bonus sin borrar la trayectoria declarada", async () => {
  const revoked = { supportAccreditationId: "a1", supportAccreditation: { active: false, userId: "u1" } };
  mocks.titles = [{ ...title(), ...revoked }]; mocks.supported = [{ ...supported(), ...revoked }];
  expect((await auraRanking())[0].entries[0]).toMatchObject({ aura: 50, trajectory: 50, backing: 0, declared: true });
});
