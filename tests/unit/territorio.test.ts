import { describe, expect, it } from "vitest";
import { PROVINCES } from "../../src/lib/common/labels";
import { PROVINCIAS_SIN_GIMNASIOS, gimnasiosVisibles, provinciaConGimnasios } from "../../src/lib/common/territorio";

// T-016, C5-02: los gimnasios de Cataluña no salen en Lona (decisión del fundador, 14-10-2026).
describe("provincias sin gimnasios", () => {
  it("excluye las cuatro provincias catalanas, escritas igual que en la lista de provincias", () => {
    for (const p of ["Barcelona", "Girona", "Lleida", "Tarragona"]) {
      expect(PROVINCES).toContain(p);
      expect(provinciaConGimnasios(p)).toBe(false);
    }
  });

  it("deja el resto de provincias y los valores vacíos", () => {
    expect(provinciaConGimnasios("Madrid")).toBe(true);
    expect(provinciaConGimnasios(null)).toBe(true);
    expect(PROVINCES.filter((p) => !provinciaConGimnasios(p))).toHaveLength(PROVINCIAS_SIN_GIMNASIOS.length);
  });

  it("el filtro de consultas usa esa misma lista", () => {
    expect(gimnasiosVisibles()).toEqual({ province: { notIn: ["Barcelona", "Girona", "Lleida", "Tarragona"] } });
  });
});
