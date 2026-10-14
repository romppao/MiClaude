import { describe, expect, it } from "vitest";
import { boutsQueCuentan } from "../../src/lib/common/record-eligibility";

describe("filtro de combates que cuentan en el récord", () => {
  it("incluye declaraciones al alcanzar exactamente las 24 horas", () => {
    const ahora = new Date("2026-10-13T10:00:00.000Z");
    const where = boutsQueCuentan(ahora);
    if (!Array.isArray(where.AND)) throw new Error("El filtro debe agrupar las condiciones en AND.");
    expect(where.AND[2]).toEqual({
      OR: [
        { verification: { not: "SELF_REPORTED" } },
        { createdAt: { lte: new Date("2026-10-12T10:00:00.000Z") } },
      ],
    });
  });

  it("excluye declaraciones rechazadas o en revisión y veladas pendientes", () => {
    const { AND } = boutsQueCuentan(new Date("2026-10-13T10:00:00.000Z"));
    if (!Array.isArray(AND)) throw new Error("El filtro debe agrupar las condiciones en AND.");
    expect(AND[0]).toEqual({ verification: { not: "DISPUTED" } });
    expect(AND[1]).toEqual({ event: { status: { notIn: ["CANCELLED", "PENDING_AUTHORIZATION", "REJECTED"] } } });
  });
});
