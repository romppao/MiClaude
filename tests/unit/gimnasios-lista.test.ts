import { describe, expect, it } from "vitest";
import { prepararFila } from "../../scripts/importar-gimnasios-lista";

// Lista de clubes investigada a mano (scripts/importar-gimnasios-lista.ts).
const base = { name: "Club de Boxeo Ludus", city: "Móstoles", province: "Madrid", disciplines: ["BOXEO", "K1"], source: "https://ejemplo.es/ludus", confidence: "alta", fechaFuente: "2026-10-15" };
const hoy = new Date("2026-10-15T12:00:00Z");

describe("lista de gimnasios investigada", () => {
  it("admite un club con fuente y lo publica si la confianza es alta y la fuente es de este año", () => {
    const r = prepararFila(base, hoy);
    expect(r.ok && r.datos.publicar && r.datos.disciplines).toEqual(["BOXEO", "K1"]);
  });
  it("una fuente de hace más de un año, o sin fecha, queda por revisar aunque la confianza sea alta", () => {
    for (const fechaFuente of ["2025-09-01", null]) { const r = prepararFila({ ...base, fechaFuente }, hoy); expect(r.ok && r.datos.publicar).toBe(false); }
  });
  it("la confianza media queda por revisar", () => {
    const r = prepararFila({ ...base, confidence: "media" });
    expect(r.ok && r.datos.publicar).toBe(false);
  });
  it("descarta Cataluña, provincias desconocidas, clubes sin fuente y sin disciplinas de contacto", () => {
    expect(prepararFila({ ...base, province: "Barcelona" })).toEqual({ ok: false, motivo: "provincia excluida (Cataluña)" });
    expect(prepararFila({ ...base, province: "Madriz" }).ok).toBe(false);
    expect(prepararFila({ ...base, source: "" })).toEqual({ ok: false, motivo: "sin fuente que lo confirme" });
    expect(prepararFila({ ...base, disciplines: ["CROSSFIT"] })).toEqual({ ok: false, motivo: "sin disciplinas de contacto" });
  });
  it("solo acepta Instagram como Instagram y descarta enlaces no web", () => {
    const r = prepararFila({ ...base, instagram: "https://evil.example/ludus", website: "javascript:alert(1)" });
    expect(r.ok && [r.datos.instagram, r.datos.website]).toEqual([null, null]);
  });
});
