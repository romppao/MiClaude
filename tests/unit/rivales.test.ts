import { describe, expect, it } from "vitest";
import { filtrarYOrdenarRivales, hayFiltrosRival, parseFiltrosRival, type Candidato } from "../../src/lib/fighters/rivals";

describe("filtros para buscar rival o sparring", () => {
  it("sin disciplina en la dirección usa la del peleador; «todas» la quita; valores desconocidos se ignoran", () => {
    expect(parseFiltrosRival({}, "BOXEO").disciplina).toBe("BOXEO");
    expect(parseFiltrosRival({ disciplina: "todas" }, "BOXEO").disciplina).toBeUndefined();
    expect(parseFiltrosRival({ disciplina: "MMA" }, "BOXEO").disciplina).toBe("MMA");
    expect(parseFiltrosRival({ disciplina: "constructor" }, "BOXEO").disciplina).toBeUndefined();
    const f = parseFiltrosRival({ guardia: "ZURDO", nivel: "PRO", orden: "aura", mincomb: "3", maxedad: "30", peso: "M71" }, "BOXEO");
    expect(f).toMatchObject({ guardia: "ZURDO", nivel: "PRO", orden: "aura", minCombates: 3, maxEdad: 30, peso: "M71" });
    expect(parseFiltrosRival({ guardia: "otra", orden: "__proto__", mincomb: "-1", maxedad: "abc" })).toMatchObject({ guardia: undefined, orden: "parecido", minCombates: undefined, maxEdad: undefined });
  });
  it("la disciplina por defecto no cuenta como filtro; el gimnasio sí", () => {
    expect(hayFiltrosRival(parseFiltrosRival({}, "BOXEO"))).toBe(false);
    expect(hayFiltrosRival(parseFiltrosRival({ gimnasio: "Club Turia" }, "BOXEO"))).toBe(true);
  });
});

describe("ordenar rivales", () => {
  const c = (id: string, x: Partial<Candidato>): Candidato => ({ id, nombre: id, combates: 0, aura: 0, edad: null, peso: null, ...x });
  const lista = [c("Ana", { combates: 5, peso: "M71", edad: 25, aura: 10 }), c("Bea", { combates: 5, peso: "M60", edad: 25, aura: 10 }), c("Cris", { combates: 20, peso: "M71", edad: 30, aura: 90 }), c("Dani", { combates: 0, edad: null })];
  const yo = { combates: 4, peso: "M71", edad: 24, aura: 8 };
  const n = (l: Candidato[]) => l.map((x) => x.id);
  it("«más parecidos a ti» pone primero la misma categoría de peso y la experiencia cercana", () => {
    expect(n(filtrarYOrdenarRivales(lista, parseFiltrosRival({}), yo)).slice(0, 2)).toEqual(["Ana", "Cris"]);
  });
  it("filtra por combates y edad (sin edad indicada, fuera)", () => {
    expect(n(filtrarYOrdenarRivales(lista, parseFiltrosRival({ mincomb: "5", maxcomb: "10", orden: "nombre" }), yo))).toEqual(["Ana", "Bea"]);
    expect(n(filtrarYOrdenarRivales(lista, parseFiltrosRival({ minedad: "26", orden: "nombre" }), yo))).toEqual(["Cris"]);
  });
  it("ordena por combates, experiencia y aura", () => {
    expect(n(filtrarYOrdenarRivales(lista, parseFiltrosRival({ orden: "combates" }), yo))[0]).toBe("Cris");
    expect(n(filtrarYOrdenarRivales(lista, parseFiltrosRival({ orden: "experiencia" }), yo))[0]).toBe("Dani");
    expect(n(filtrarYOrdenarRivales(lista, parseFiltrosRival({ orden: "aura" }), yo))[0]).toBe("Cris");
  });
});
