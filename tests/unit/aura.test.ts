import { describe, expect, it } from "vitest";
import { rankByCategory, type AuraEntry } from "../../src/lib/aura";

const e = (name: string, weightClass: string | null, aura: number): AuraEntry => ({ fighterId: name, slug: name.toLowerCase(), name, weightClass, aura });

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
