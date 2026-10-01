import { describe, expect, it } from "vitest";
import { PROVINCES, slugify } from "../../src/lib/common/labels";

describe("slugify", () => {
  it("quita tildes, eñes y símbolos", () => {
    expect(slugify("Álvaro Núñez-Peña")).toBe("alvaro-nunez-pena");
    expect(slugify("  Velada  Nº 1 — Madrid!! ")).toBe("velada-n-1-madrid");
  });
  it("devuelve cadena vacía si no hay caracteres válidos", () => {
    expect(slugify("¡¡¡")).toBe("");
  });
});

describe("PROVINCES", () => {
  it("incluye Madrid y no tiene duplicados", () => {
    expect(PROVINCES).toContain("Madrid");
    expect(new Set(PROVINCES).size).toBe(PROVINCES.length);
  });
});
