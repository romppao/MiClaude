import { describe, expect, it } from "vitest";
import { rankByCategory, type AuraEntry } from "../../src/lib/aura/ranking";

const e = (name: string, weightClass: string | null, aura: number, level: "PRO" | "AMATEUR" = "PRO"): AuraEntry => ({ fighterId: name, slug: name.toLowerCase(), name, level, weightClass, aura });

describe("rankByCategory", () => {
  it("ordena por aura dentro de cada categoría, sin mezclar categorías", () => {
    const r = rankByCategory([e("Ana", "Ligero", 5), e("Blas", "Ligero", 9), e("Carlos", "Wélter", 2)], "BOXEO");
    expect(r.map((g) => g.weightClass)).toEqual(["Ligero", "Wélter"]);
    expect(r[0].entries.map((x) => x.name)).toEqual(["Blas", "Ana"]);
    expect(r[1].entries.map((x) => x.name)).toEqual(["Carlos"]);
  });
  it("las categorías salen de menos a más peso y «sin categoría» al final", () => {
    const r = rankByCategory([e("A", null, 1), e("B", "Pesado", 1), e("C", "Mosca", 1), e("D", "Ligero", 1)], "BOXEO");
    expect(r.map((g) => g.weightClass)).toEqual(["Mosca", "Ligero", "Pesado", null]);
  });
  it("los empates comparten posición y se desempatan por nombre", () => {
    const r = rankByCategory([e("Luis", "Ligero", 4), e("Ana", "Ligero", 4), e("Pedro", "Ligero", 1)], "BOXEO")[0].entries;
    expect(r.map((x) => [x.name, x.position])).toEqual([["Ana", 1], ["Luis", 1], ["Pedro", 3]]);
  });
  it("una categoría que no está en la lista de la disciplina va después de las conocidas", () => {
    const r = rankByCategory([e("A", "Inventada", 1), e("B", "Ligero", 1), e("C", null, 1)], "BOXEO");
    expect(r.map((g) => g.weightClass)).toEqual(["Ligero", "Inventada", null]);
  });
  it("sin datos no hay ránking", () => {
    expect(rankByCategory([], "MMA")).toEqual([]);
  });
});

describe("el ránking separa profesional y amateur", () => {
  it("las categorías de cada nivel salen por separado, profesionales primero, y nunca se mezclan", () => {
    const r = rankByCategory([e("Amateur A", "M60", 9, "AMATEUR"), e("Pro A", "Ligero", 1), e("Pro B", "Ligero", 5), e("Amateur B", "M55", 2, "AMATEUR")], "BOXEO");
    expect(r.map((g) => `${g.level}:${g.weightClass}`)).toEqual(["PRO:Ligero", "AMATEUR:M55", "AMATEUR:M60"]);
    expect(r[0].entries.map((x) => x.name)).toEqual(["Pro B", "Pro A"]);
  });
});
