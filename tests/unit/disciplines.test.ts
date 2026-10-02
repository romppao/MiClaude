import { describe, expect, it } from "vitest";
import { DISCIPLINE_ORDER, METHODS_BY_DISCIPLINE, WEIGHT_CLASSES, isTournamentStyle, parseDisciplineChoice, weightClassLabel } from "../../src/lib/common/disciplines";
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

describe("weightClassLabel (peso de cada categoría en kilos)", () => {
  it("añade el límite en kilos en boxeo y MMA, con coma decimal", () => {
    expect(weightClassLabel("BOXEO", "Wélter")).toBe("Wélter · hasta 66,7 kg");
    expect(weightClassLabel("MMA", "Ligero")).toBe("Ligero · hasta 70,3 kg");
  });
  it("la categoría más alta no tiene límite: se dice «más de»", () => {
    expect(weightClassLabel("BOXEO", "Pesado")).toBe("Pesado · más de 90,7 kg");
  });
  it("el mismo nombre pesa distinto según la disciplina", () => {
    expect(weightClassLabel("BOXEO", "Mosca")).not.toBe(weightClassLabel("MMA", "Mosca"));
  });
  it("sin un peso fiable (kickboxing, K-1, jiu-jitsu) solo se muestra el nombre y no se inventa nada", () => {
    expect(weightClassLabel("KICKBOXING", "Ligero")).toBe("Ligero");
    expect(weightClassLabel("JIUJITSU", "Gallo")).toBe("Gallo");
  });
  it("toda categoría de boxeo y MMA tiene su peso", () => {
    for (const d of ["BOXEO", "MMA"] as const) for (const w of WEIGHT_CLASSES[d]) expect(weightClassLabel(d, w)).toContain(" kg");
  });
});
