import { describe, expect, it } from "vitest";
import { categoriaSinSitio, claveCategoria, enListaDeEspera, ocupacion, parsePlazas } from "../../src/lib/events/registrations";
import { avisos, distancia, parecido, porcentajeVictorias, sugerirRivales, type DatosPareja } from "../../src/lib/events/pairing";

describe("plazas por categoría", () => {
  const plazas = [{ divisionId: "", weightClass: "M71", places: 2 }, { divisionId: "D1", weightClass: "M60", places: 1 }];
  const filas = [
    { status: "ACCEPTED" as const, divisionId: null, weightClass: "M71" },
    { status: "PENDING" as const, divisionId: null, weightClass: "M71" },
    { status: "ACCEPTED" as const, divisionId: "D1", weightClass: "M60" },
    { status: "PENDING" as const, divisionId: "D1", weightClass: "M60" },
    { status: "DECLINED" as const, divisionId: "D1", weightClass: "M60" },
    { status: "ACCEPTED" as const, divisionId: null, weightClass: "M81" },
  ];
  const o = ocupacion(plazas, filas);
  it("cuenta aceptadas, pendientes y plazas libres; la división vacía y null son la misma", () => {
    expect(o.get(claveCategoria(null, "M71"))).toEqual({ places: 2, aceptadas: 1, pendientes: 1, libres: 1, llena: false });
    expect(o.get(claveCategoria("D1", "M60"))).toEqual({ places: 1, aceptadas: 1, pendientes: 1, libres: 0, llena: true });
    expect(o.has(claveCategoria(null, "M81"))).toBe(false);
  });
  it("una pendiente en una categoría llena está en lista de espera", () => {
    expect(enListaDeEspera(filas[3], o)).toBe(true);
    expect(enListaDeEspera(filas[1], o)).toBe(false);
    expect(enListaDeEspera(filas[2], o)).toBe(false);
  });
  it("no deja aceptar más de las plazas (contando varias a la vez); sin plazas definidas no hay límite", () => {
    expect(categoriaSinSitio(o, [{ divisionId: null, weightClass: "M71" }])).toBeNull();
    expect(categoriaSinSitio(o, [{ divisionId: null, weightClass: "M71" }, { divisionId: "", weightClass: "M71" }])).toBe("|M71");
    expect(categoriaSinSitio(o, [{ divisionId: "D1", weightClass: "M60" }])).toBe("D1|M60");
    expect(categoriaSinSitio(o, [{ divisionId: null, weightClass: "M91" }, { divisionId: null, weightClass: "M91" }])).toBeNull();
  });
  it("número de plazas de 1 a 64", () => {
    expect(parsePlazas("8")).toBe(8);
    for (const v of ["0", "65", "", "3.5", "-2", "abc"]) expect(parsePlazas(v)).toBeNull();
  });
});

describe("ayuda para emparejar", () => {
  const p = (id: string, x: Partial<DatosPareja>): DatosPareja => ({ id, combates: 0, victorias: 0, derrotas: 0, empates: 0, aura: 0, weightKg: null, edad: null, ...x });
  const ana = p("ana", { combates: 6, victorias: 4, derrotas: 2, aura: 20, weightKg: 70, edad: 25 });
  const bea = p("bea", { combates: 5, victorias: 3, derrotas: 2, aura: 18, weightKg: 70.5, edad: 24 });
  const cris = p("cris", { combates: 0, aura: 1, weightKg: 75, edad: 18 });
  const dani = p("dani", { combates: 20, victorias: 18, derrotas: 2, aura: 200, weightKg: 69, edad: 33 });
  it("dos peleadores idénticos están a distancia 0 y la distancia es simétrica", () => {
    expect(distancia(ana, { ...ana, id: "x" })).toBe(0);
    expect(distancia(ana, dani)).toBeCloseTo(distancia(dani, ana));
  });
  it("propone primero al más parecido, sin repetirse a sí mismo, y como mucho tres", () => {
    const s = sugerirRivales(ana, [ana, bea, cris, dani]);
    expect(s.map((x) => x.rival.id)).toHaveLength(3);
    expect(s.map((x) => x.rival.id)).not.toContain("ana");
    expect(s[0].distancia <= s[1].distancia && s[1].distancia <= s[2].distancia).toBe(true);
    expect(s[0].rival.id).toBe("bea");
    expect(s[0].parecido).toBe("muy");
    expect(sugerirRivales(ana, [ana, bea, cris, dani], 1)).toHaveLength(1);
  });
  it("con mucha diferencia de experiencia, peso o edad lo dice en palabras", () => {
    expect(parecido(distancia(cris, dani))).toBe("poco");
    const a = avisos(cris, dani);
    expect(a).toContain("6 kg de diferencia de peso");
    expect(a).toContain("20 combates de diferencia de experiencia");
    expect(a).toContain("15 años de diferencia de edad");
    expect(avisos(ana, bea)).toEqual([]);
    expect(avisos(ana, p("z", {}))).toContain("Alguno no ha indicado su peso");
  });
  it("porcentaje de victorias", () => {
    expect(porcentajeVictorias(ana)).toBeCloseTo(4 / 6);
    expect(porcentajeVictorias(cris)).toBeNull();
  });
});
