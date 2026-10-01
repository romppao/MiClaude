import { describe, expect, it } from "vitest";
import { DISCIPLINE_ORDER, METHODS_BY_DISCIPLINE, WEIGHT_CLASSES, isTournamentStyle, parseDisciplineChoice } from "../../src/lib/common/disciplines";
import { proximityAppliesTo } from "../../src/lib/fighters/coherence";

describe("disciplinas", () => {
  it("el boxeo va en cabeza y todas tienen categorías y formas de terminar", () => {
    expect(DISCIPLINE_ORDER[0]).toBe("BOXEO");
    for (const d of DISCIPLINE_ORDER) {
      expect(WEIGHT_CLASSES[d].length).toBeGreaterThan(0);
      expect(METHODS_BY_DISCIPLINE[d].length).toBeGreaterThan(0);
    }
  });
  it("la sumisión existe en MMA y jiu-jitsu, no en boxeo", () => {
    expect(METHODS_BY_DISCIPLINE.MMA).toContain("SUBMISSION");
    expect(METHODS_BY_DISCIPLINE.JIUJITSU).toContain("SUBMISSION");
    expect(METHODS_BY_DISCIPLINE.BOXEO).not.toContain("SUBMISSION");
  });
  it("interpreta disciplina y categoría del selector", () => {
    expect(parseDisciplineChoice("BOXEO:Wélter")).toEqual({ discipline: "BOXEO", weightClass: "Wélter" });
    expect(parseDisciplineChoice("MMA:")).toEqual({ discipline: "MMA", weightClass: null });
    expect(parseDisciplineChoice("JIUJITSU:Medio-pesado")).toEqual({ discipline: "JIUJITSU", weightClass: "Medio-pesado" });
  });
  it("rechaza disciplinas o categorías que no existen en esa disciplina", () => {
    expect(parseDisciplineChoice("NATACION:Ligero")).toBeNull();
    expect(parseDisciplineChoice("JIUJITSU:Crucero")).toBeNull();
    expect(parseDisciplineChoice("")).toBeNull();
  });
  it("el jiu-jitsu es de torneo y no pasa las comprobaciones de proximidad", () => {
    expect(isTournamentStyle("JIUJITSU")).toBe(true);
    expect(proximityAppliesTo("JIUJITSU")).toBe(false);
    expect(proximityAppliesTo("BOXEO")).toBe(true);
  });
});
