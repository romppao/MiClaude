import { describe, expect, it } from "vitest";
import { EXCLUDED_GYM_PROVINCES, excludedGymProvince, gymIsPublic, gymDistanceMetres, osmMayUpdate } from "../../src/lib/common/gym-policy";
import { osmGymCandidate, osmProvince, osmAreaProvince } from "../../src/lib/common/gym-osm";
import { PROVINCES } from "../../src/lib/common/labels";
import { publicGyms } from "../../src/lib/common/gym-directory";

const element = { type: "node", id: 123, lat: 40.4, lon: -3.7, tags: { name: "Club de boxeo de prueba", sport: "boxing", "addr:city": "Madrid" } };

describe("territorio y publicación de gimnasios", () => {
  it("lista, mapa y ficha usan las mismas provincias excluidas, incluso altas manuales", () => {
    for (const province of EXCLUDED_GYM_PROVINCES) {
      expect(gymIsPublic({ province, status: "PUBLISHED" }, true)).toBe(false);
      expect(osmGymCandidate(element, province, excludedGymProvince)).toBe(null);
    }
    expect(excludedGymProvince("Gerona")).toBe(true);
    expect(publicGyms().province).toMatchObject({ notIn: expect.arrayContaining([...EXCLUDED_GYM_PROVINCES]) });
    expect(gymIsPublic({ province: "Madrid", status: "PENDING" }, true)).toBe(false);
    expect(gymIsPublic({ province: "Madrid", status: "PUBLISHED", isFictional: true }, false)).toBe(false);
    expect(gymIsPublic({ province: "Madrid", status: "PUBLISHED", isFictional: true }, true)).toBe(true);
  });
  it("sin addr:province, las áreas que contienen las coordenadas también excluyen Cataluña", () => {
    const province = osmAreaProvince([{ tags: { name: "Catalunya" } }, { tags: { name: "Barcelona" } }], PROVINCES);
    expect(province).toBe("Barcelona");
    expect(osmGymCandidate({ ...element, lat: 41.38, lon: 2.17 }, province, excludedGymProvince)).toBe(null);
    expect(osmProvince("Provincia de Gerona", PROVINCES)).toBe("Girona");
  });
});

describe("transformación de OSM", () => {
  it("descarta fitboxing, conserva deportes explícitos y manda dudas a revisión sin contacto privado", () => {
    expect(osmGymCandidate({ ...element, tags: { ...element.tags, name: "Fitboxing" } }, "Madrid", excludedGymProvince)).toBe(null);
    const candidate = osmGymCandidate({ ...element, tags: { ...element.tags, phone: "612345678", email: "persona@gmail.com" } }, "Madrid", excludedGymProvince)!;
    expect(candidate).toMatchObject({ status: "PENDING", phone: null, email: null, sourceRef: "node/123", sourceLicense: "ODbL-1.0", disciplines: ["BOXEO"] });
    expect(osmGymCandidate(element, null, excludedGymProvince)?.status).toBe("PENDING");
    const professional = osmGymCandidate({ ...element, tags: { ...element.tags, phone: "913456789", website: "https://club.example", email: "info@club.example" } }, "Madrid", excludedGymProvince)!;
    expect(professional).toMatchObject({ phone: "913456789", email: "info@club.example", status: "PUBLISHED" });
  });
  it("una descarga posterior no puede pisar gimnasios reclamados, corregidos o verificados", () => {
    const g = { ownerUserId: null, source: "OSM", verifiedAt: null };
    expect(osmMayUpdate(g)).toBe(true);
    expect(osmMayUpdate({ ...g, ownerUserId: "titular" })).toBe(false);
    expect(osmMayUpdate({ ...g, source: "MANUAL" })).toBe(false);
    expect(osmMayUpdate({ ...g, source: "PROPIETARIO" })).toBe(false);
    expect(osmMayUpdate({ ...g, verifiedAt: new Date() })).toBe(false);
  });
  it("detecta la proximidad de duplicados sin consultar la ubicación de personas", () => {
    expect(gymDistanceMetres({ lat: 40.4, lng: -3.7 }, { lat: 40.4001, lng: -3.7 })).toBeLessThan(150);
    expect(gymDistanceMetres({ lat: 40.4, lng: -3.7 }, { lat: 40.5, lng: -3.7 })).toBeGreaterThan(150);
  });
});
