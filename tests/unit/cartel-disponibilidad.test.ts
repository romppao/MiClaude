import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ fighter: { findMany: vi.fn() }, $queryRaw: vi.fn() }));
vi.mock("../../src/lib/common/db", () => ({ db }));
import { buscarParaCartel } from "../../src/lib/events/cartel-search";
const now = new Date("2026-10-14T12:00:00Z");
beforeEach(() => { vi.clearAllMocks(); db.fighter.findMany.mockResolvedValue([]); db.$queryRaw.mockResolvedValue([]); });

describe("disponibilidad en el buscador de cartel", () => {
  it("filtra disponibilidad y caducidad antes de limitar sugerencias", async () => {
    await buscarParaCartel("BOXEO", "", true, now);
    expect(db.fighter.findMany.mock.calls[0][0].where).toMatchObject({ availableToFight: true, availableSince: { gt: new Date(+now - 60 * 864e5) }, disciplines: { some: { discipline: "BOXEO" } } });
  });
  it("la búsqueda por nombre también filtra en SQL antes del límite", async () => {
    await buscarParaCartel("BOXEO", "Ana", true, now);
    const [strings, ...values] = db.$queryRaw.mock.calls[0];
    const sql = strings.join("?") + values.map((v) => typeof v === "object" && v?.sql ? v.sql : "").join(" ");
    expect(sql).toContain('f."availableToFight" = true');
    const clause = values.find((v) => v?.sql?.includes('f."availableSince"'));
    expect(clause.values).toContainEqual(new Date(+now - 60 * 864e5));
  });
});
