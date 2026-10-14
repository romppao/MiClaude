import { describe, expect, it } from "vitest";
import { filtrosSiguiendo } from "../../src/lib/community/siguiendo";
import { boutsQueCuentan } from "../../src/lib/common/record-eligibility";
import { resumenResultadosPendientes, veladasConResultadosPendientes } from "../../src/lib/events/resultados-pendientes";

// Fallos de los paneles encontrados en la revisión del 14 de octubre de 2026 (bloque E del encargo de paneles).
describe("«Peleadores que sigo» solo muestra veladas públicas", () => {
  const ahora = new Date("2026-10-14T10:00:00.000Z");
  const { proximos, resultados } = filtrosSiguiendo(["p1", "p2"], ahora);

  it("los próximos combates excluyen veladas canceladas, pendientes de autorizar y rechazadas", () => {
    expect(proximos).toEqual({
      AND: [
        { OR: [{ fighterAId: { in: ["p1", "p2"] } }, { fighterBId: { in: ["p1", "p2"] } }] },
        { verification: { not: "DISPUTED" } },
        { event: { status: { notIn: ["CANCELLED", "PENDING_AUTHORIZATION", "REJECTED"] } } },
      ],
    });
  });

  it("los resultados usan la misma regla que el récord (incluido el plazo de 24 horas)", () => {
    if (!Array.isArray(resultados.AND)) throw new Error("El filtro debe agrupar las condiciones en AND.");
    expect(resultados.AND).toContainEqual({ result: { not: null } });
    expect(resultados.AND).toContainEqual(boutsQueCuentan(ahora));
  });
});

describe("panel de la entidad: resultados por poner", () => {
  it("busca todas las veladas celebradas salvo las canceladas o rechazadas", () => {
    const hoy = new Date("2026-10-14T00:00:00.000Z");
    expect(veladasConResultadosPendientes("org", hoy)).toEqual({ organizerId: "org", date: { lt: hoy }, status: { notIn: ["CANCELLED", "REJECTED"] }, bouts: { some: { result: null } } });
  });

  it("suma los combates sin resultado de todas las veladas, no solo de la última", () => {
    const veladas = [{ id: "a", _count: { bouts: 2 } }, { id: "b", _count: { bouts: 3 } }];
    const r = resumenResultadosPendientes(veladas);
    expect(r.total).toBe(5);
    expect(r.visibles.map((v) => v.id)).toEqual(["a", "b"]);
    expect(r.resto).toBe(0);
  });

  it("enseña como mucho tres veladas y cuenta las demás", () => {
    const veladas = ["a", "b", "c", "d", "e"].map((id) => ({ id, _count: { bouts: 1 } }));
    const r = resumenResultadosPendientes(veladas);
    expect(r.total).toBe(5);
    expect(r.visibles).toHaveLength(3);
    expect(r.resto).toBe(2);
  });

  it("sin veladas pendientes, el total es cero y no hay aviso", () => {
    expect(resumenResultadosPendientes([])).toEqual({ total: 0, visibles: [], resto: 0 });
  });
});
