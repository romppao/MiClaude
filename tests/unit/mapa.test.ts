import { describe, expect, it } from "vitest";
import { CENTROS_PROVINCIA, distanciaKm, puntoDeGimnasio, textoDistancia } from "../../src/lib/common/mapa";
import { PROVINCES } from "../../src/lib/common/labels";

describe("mapa de gimnasios", () => {
  it("hay un centro para cada provincia de la lista, y en España", () => {
    for (const p of PROVINCES) {
      const c = CENTROS_PROVINCIA[p];
      expect(c, p).toBeDefined();
      expect(c.lat).toBeGreaterThan(27); expect(c.lat).toBeLessThan(44);
      expect(c.lng).toBeGreaterThan(-19); expect(c.lng).toBeLessThan(5);
    }
    expect(Object.keys(CENTROS_PROVINCIA).length).toBe(PROVINCES.length);
  });
  it("calcula distancias reales (Madrid–Barcelona, unos 505 km en línea recta)", () => {
    const d = distanciaKm(CENTROS_PROVINCIA["Madrid"], CENTROS_PROVINCIA["Barcelona"]);
    expect(d).toBeGreaterThan(495); expect(d).toBeLessThan(515);
    expect(distanciaKm(CENTROS_PROVINCIA["Madrid"], CENTROS_PROVINCIA["Madrid"])).toBe(0);
  });
  it("escribe la distancia como la diría una persona", () => {
    expect(textoDistancia(0.004)).toBe("a 10 m");
    expect(textoDistancia(0.853)).toBe("a 850 m");
    expect(textoDistancia(3.24)).toBe("a 3,2 km");
    expect(textoDistancia(120.4)).toBe("a 120 km");
  });
  it("usa las coordenadas del gimnasio si las tiene, y dice de dónde salen", () => {
    expect(puntoDeGimnasio({ id: "a", lat: 40, lng: -3, geoSource: "direccion", province: "Madrid" })).toEqual({ lat: 40, lng: -3, origen: "direccion" });
    expect(puntoDeGimnasio({ id: "a", lat: 40, lng: -3, geoSource: "ciudad", province: "Madrid" })?.origen).toBe("ciudad");
  });
  it("sin coordenadas, lo pone cerca del centro de su provincia, siempre en el mismo sitio y separado de los demás", () => {
    const a = puntoDeGimnasio({ id: "gym-a", lat: null, lng: null, geoSource: null, province: "Sevilla" })!;
    const b = puntoDeGimnasio({ id: "gym-b", lat: null, lng: null, geoSource: null, province: "Sevilla" })!;
    expect(a.origen).toBe("provincia");
    expect(distanciaKm(a, CENTROS_PROVINCIA["Sevilla"])).toBeLessThan(5);
    expect(puntoDeGimnasio({ id: "gym-a", lat: null, lng: null, geoSource: null, province: "Sevilla" })).toEqual(a);
    expect(a).not.toEqual(b);
  });
  it("una provincia desconocida no se pinta", () => {
    expect(puntoDeGimnasio({ id: "x", lat: null, lng: null, geoSource: null, province: "Narnia" })).toBeNull();
  });
});

import { mejoresDeLaZona, valoracionGimnasio } from "../../src/lib/common/mapa";

describe("los mejores gimnasios de la zona", () => {
  it("la valoración suma aura, peleadores, entrenadores y el sello", () => {
    expect(valoracionGimnasio({ aura: 10, peleadores: 2, entrenadores: 1, verificado: true })).toBe(10 + 10 + 3 + 20);
    expect(valoracionGimnasio({ aura: 0, peleadores: 0, entrenadores: 0, verificado: false })).toBe(0);
  });
  const madrid = CENTROS_PROVINCIA["Madrid"];
  const g = (nombre: string, lat: number, lng: number, valoracion: number) => ({ nombre, lat, lng, valoracion });
  const lista = [g("Cerca flojo", 40.42, -3.70, 5), g("Cerca bueno", 40.45, -3.68, 50), g("Toledo top", 39.86, -4.03, 900), g("Getafe medio", 40.30, -3.73, 20)];
  it("con ubicación, solo los de la zona, del mejor al peor", () => {
    expect(mejoresDeLaZona(lista, madrid).map((x) => x.nombre)).toEqual(["Cerca bueno", "Getafe medio", "Cerca flojo"]);
  });
  it("si en la zona hay menos de 3, amplía el radio", () => {
    expect(mejoresDeLaZona(lista.slice(1, 3), madrid).map((x) => x.nombre)).toEqual(["Toledo top", "Cerca bueno"]);
  });
  it("sin ubicación, todos por valoración", () => {
    expect(mejoresDeLaZona(lista, null, 2).map((x) => x.nombre)).toEqual(["Toledo top", "Cerca bueno"]);
  });
});
