/** Regresión del enlace de los filtros: repetir disciplina conserva categoría y división. */
import { describe, expect, it } from "vitest";
import { enlaceDisciplina } from "../../src/app/components/DirectorioNav";

describe("enlaces de disciplina del directorio", () => {
  const filtros = { q: "Ana López", level: "PRO", province: "Madrid", disponibles: "1", categoria: "WELTER", divisionId: "division-ejemplo" };
  it("conserva todos los filtros al pulsar la disciplina activa", () => {
    const url = new URL(enlaceDisciplina("/peleadores", "BOXEO", "BOXEO", filtros), "https://example.test");
    expect(Object.fromEntries(url.searchParams)).toEqual({ ...filtros, disciplina: "BOXEO" });
  });
  for (const destino of ["MMA", undefined] as const) {
    it(`limpia categoría y división al cambiar a ${destino ?? "Todas"}`, () => {
      const url = new URL(enlaceDisciplina("/peleadores", "BOXEO", destino, filtros), "https://example.test");
      expect(Object.fromEntries(url.searchParams)).toEqual({ q: filtros.q, level: filtros.level, province: filtros.province, disponibles: "1", ...(destino ? { disciplina: destino } : {}) });
    });
  }
  it("conserva los filtros transversales al repetir Todas", () => {
    expect(enlaceDisciplina("/entrenadores", undefined, undefined, { q: "Ana", province: undefined })).toBe("/entrenadores?q=Ana");
  });
  it("devuelve la ruta sin interrogante si no hay filtros", () => {
    expect(enlaceDisciplina("/gimnasios", "BOXEO", undefined, {})).toBe("/gimnasios");
  });
});
