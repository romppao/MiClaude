import { describe, expect, it } from "vitest";
import {
  DISCIPLINE_ORDER, LEVEL_ORDER, METHODS_BY_DISCIPLINE, PESOS, isTournamentStyle, isWeightClass, parseDisciplineChoice, weightClassLabel, weightClassesFor, weightNote,
} from "../../src/lib/common/disciplines";
import { proximityAppliesTo } from "../../src/lib/fighters/coherence";

describe("disciplinas", () => {
  it("el boxeo va en cabeza, el Muay Thai existe y todas tienen formas de terminar", () => {
    expect(DISCIPLINE_ORDER[0]).toBe("BOXEO");
    expect(DISCIPLINE_ORDER).toContain("MUAYTHAI");
    for (const d of DISCIPLINE_ORDER) expect(METHODS_BY_DISCIPLINE[d].length).toBeGreaterThan(0);
  });
  it("la sumisión existe en MMA y jiu-jitsu, no en boxeo ni en Muay Thai", () => {
    expect(METHODS_BY_DISCIPLINE.MMA).toContain("SUBMISSION");
    expect(METHODS_BY_DISCIPLINE.JIUJITSU).toContain("SUBMISSION");
    expect(METHODS_BY_DISCIPLINE.BOXEO).not.toContain("SUBMISSION");
    expect(METHODS_BY_DISCIPLINE.MUAYTHAI).not.toContain("SUBMISSION");
  });
  it("el jiu-jitsu es de torneo y no pasa las comprobaciones de proximidad", () => {
    expect(isTournamentStyle("JIUJITSU")).toBe(true);
    expect(proximityAppliesTo("JIUJITSU")).toBe(false);
    expect(proximityAppliesTo("BOXEO")).toBe(true);
  });
});

describe("categorías de peso por disciplina y nivel", () => {
  it("cada pareja disciplina × nivel tiene su entrada, con una nota que dice de dónde salen (o por qué faltan)", () => {
    for (const d of DISCIPLINE_ORDER) for (const n of LEVEL_ORDER) expect(PESOS[d][n].nota.length, `${d} ${n}`).toBeGreaterThan(20);
  });
  it("el boxeo profesional y el amateur NO comparten categorías", () => {
    const pro = weightClassesFor("BOXEO", "PRO").map((c) => c.valor);
    const amateur = weightClassesFor("BOXEO", "AMATEUR").map((c) => c.valor);
    expect(pro).toHaveLength(17);
    expect(pro.filter((v) => amateur.includes(v))).toEqual([]);
    expect(isWeightClass("BOXEO", "PRO", "Wélter")).toBe(true);
    expect(isWeightClass("BOXEO", "AMATEUR", "Wélter")).toBe(false);
    expect(isWeightClass("BOXEO", "AMATEUR", "M65")).toBe(true);
    expect(isWeightClass("BOXEO", "PRO", "M65")).toBe(false);
  });
  it("el boxeo amateur distingue masculino y femenino (categorías de la federación española)", () => {
    const valores = weightClassesFor("BOXEO", "AMATEUR").map((c) => c.valor);
    expect(valores.filter((v) => v.startsWith("M"))).toHaveLength(10);
    expect(valores.filter((v) => v.startsWith("F"))).toHaveLength(10);
    expect(weightClassLabel("BOXEO", "AMATEUR", "F51")).toBe("Femenino · hasta 51 kg");
    expect(weightClassLabel("BOXEO", "AMATEUR", "M+90")).toBe("Masculino · más de 90 kg");
  });
  it("cada disciplina tiene las suyas: mismo nombre, distinto peso (Mosca en boxeo y en MMA)", () => {
    expect(weightClassLabel("BOXEO", "PRO", "Mosca")).toBe("Mosca · hasta 50,8 kg");
    expect(weightClassLabel("MMA", "PRO", "Mosca")).toBe("Mosca · hasta 56,7 kg");
  });
  it("añade el peso en kilos con coma decimal y dice «más de» en la categoría más alta", () => {
    expect(weightClassLabel("BOXEO", "PRO", "Wélter")).toBe("Wélter · hasta 66,7 kg");
    expect(weightClassLabel("BOXEO", "PRO", "Pesado")).toBe("Pesado · más de 90,7 kg");
    expect(weightClassLabel("JIUJITSU", "AMATEUR", "Medio")).toBe("Medio · hasta 82,3 kg");
  });
  it("sin una lista profesional fiable (kickboxing y K-1) la lista está vacía y no se inventa ningún peso", () => {
    for (const [d, n] of [["KICKBOXING", "PRO"], ["K1", "PRO"]] as const) {
      expect(weightClassesFor(d, n)).toEqual([]);
      expect(weightNote(d, n)).toContain("Todavía no tenemos confirmadas");
    }
  });
  it("un valor guardado que ya no está en la lista se muestra tal cual: nunca se esconde lo que alguien declaró", () => {
    expect(weightClassLabel("BOXEO", "AMATEUR", "Wélter")).toBe("Wélter");
  });
  it("las categorías de cada lista no se repiten y cada una dice su peso", () => {
    for (const d of DISCIPLINE_ORDER) for (const n of LEVEL_ORDER) {
      const lista = weightClassesFor(d, n);
      expect(new Set(lista.map((c) => c.valor)).size).toBe(lista.length);
      for (const c of lista) expect(c.etiqueta, `${d} ${n} ${c.valor}`).toMatch(/kg|todos los pesos/);
    }
  });
});

describe("parseDisciplineChoice (disciplina, nivel y categoría del formulario)", () => {
  it("interpreta las tres cosas juntas; sin categoría es «todavía no sé»", () => {
    expect(parseDisciplineChoice("BOXEO", "PRO", "Wélter")).toEqual({ discipline: "BOXEO", level: "PRO", weightClass: "Wélter" });
    expect(parseDisciplineChoice("BOXEO", "AMATEUR", "M65")).toEqual({ discipline: "BOXEO", level: "AMATEUR", weightClass: "M65" });
    expect(parseDisciplineChoice("MMA", "AMATEUR", "")).toEqual({ discipline: "MMA", level: "AMATEUR", weightClass: null });
    expect(parseDisciplineChoice("MUAYTHAI", "AMATEUR", "")).toEqual({ discipline: "MUAYTHAI", level: "AMATEUR", weightClass: null });
  });
  it("rechaza una categoría que no pertenece a esa disciplina y nivel", () => {
    expect(parseDisciplineChoice("BOXEO", "AMATEUR", "Wélter")).toBeNull();
    expect(parseDisciplineChoice("BOXEO", "PRO", "M65")).toBeNull();
    expect(parseDisciplineChoice("JIUJITSU", "PRO", "Crucero")).toBeNull();
    expect(parseDisciplineChoice("MUAYTHAI", "AMATEUR", "Mosca")).toBeNull();
  });
  it("rechaza disciplinas o niveles que no existen, y claves heredadas", () => {
    expect(parseDisciplineChoice("NATACION", "PRO", "")).toBeNull();
    expect(parseDisciplineChoice("BOXEO", "SEMIPRO", "")).toBeNull();
    expect(parseDisciplineChoice("", "", "")).toBeNull();
    expect(parseDisciplineChoice("constructor", "PRO", "")).toBeNull();
    expect(parseDisciplineChoice("BOXEO", "PRO", "__proto__")).toBeNull();
  });
});
