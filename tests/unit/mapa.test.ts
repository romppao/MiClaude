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
