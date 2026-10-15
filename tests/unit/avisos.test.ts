import { describe, expect, it } from "vitest";
import { parseAvisoSinCuenta, rutaDeLona } from "../../src/lib/community/reports";

// Aviso de contenido con o sin cuenta (/avisar; DSA, art. 16). Ver docs/LEGAL.md.
const APP = "https://lonaclub.es";
const base = { direccion: "/peleadores/ana", motivo: "ILEGAL", explicacion: "Hay amenazas contra una deportista en el comentario.", nombre: "Testigo", correo: "testigo@correo.es", declaracion: true };

describe("rutaDeLona", () => {
  it("acepta la ruta o la dirección completa de Lona, con o sin www y sin protocolo", () => {
    expect(rutaDeLona("/veladas/x#multimedia", APP)).toBe("/veladas/x#multimedia");
    expect(rutaDeLona("https://lonaclub.es/peleadores/ana?a=1", APP)).toBe("/peleadores/ana?a=1");
    expect(rutaDeLona("https://www.lonaclub.es/peleadores/ana", APP)).toBe("/peleadores/ana");
    expect(rutaDeLona("lonaclub.es/peleadores/ana", APP)).toBe("/peleadores/ana");
  });
  it("rechaza otras webs, direcciones de protocolo relativo y texto raro", () => {
    expect(rutaDeLona("https://otra.example/peleadores/ana", APP)).toBeNull();
    expect(rutaDeLona("https://lonaclub.es.otra.example/x", APP)).toBeNull();
    expect(rutaDeLona("//otra.example/x", APP)).toBeNull();
    expect(rutaDeLona("javascript:alert(1)", APP)).toBeNull();
    expect(rutaDeLona("/x\u0000", APP)).toBeNull();
    expect(rutaDeLona("", APP)).toBeNull();
  });
});

describe("parseAvisoSinCuenta", () => {
  it("admite un aviso completo y deja la dirección como ruta", () => {
    const r = parseAvisoSinCuenta({ ...base, direccion: "https://lonaclub.es/peleadores/ana" }, APP);
    expect(r).toEqual({ ok: true, value: { ruta: "/peleadores/ana", motivo: "ILEGAL", explicacion: base.explicacion, nombre: "Testigo", correo: "testigo@correo.es" } });
  });
  it("pide lo que exige la ley: motivo válido, explicación, identidad y declaración", () => {
    expect(parseAvisoSinCuenta({ ...base, motivo: "NO_OCURRIO" }, APP)).toEqual({ ok: false, problema: "aviso_motivo" });
    expect(parseAvisoSinCuenta({ ...base, explicacion: "corto" }, APP)).toEqual({ ok: false, problema: "aviso_explicacion_corta" });
    expect(parseAvisoSinCuenta({ ...base, correo: "" }, APP)).toEqual({ ok: false, problema: "aviso_identidad" });
    expect(parseAvisoSinCuenta({ ...base, correo: "sin-arroba" }, APP)).toEqual({ ok: false, problema: "aviso_correo" });
    expect(parseAvisoSinCuenta({ ...base, declaracion: false }, APP)).toEqual({ ok: false, problema: "aviso_declaracion" });
    expect(parseAvisoSinCuenta({ ...base, direccion: "https://otra.example/x" }, APP)).toEqual({ ok: false, problema: "aviso_direccion" });
  });
  it("los avisos de abuso de menores se pueden enviar sin identificarse (art. 16.2.c)", () => {
    const r = parseAvisoSinCuenta({ ...base, motivo: "MENORES", nombre: "", correo: "", declaracion: false }, APP);
    expect(r.ok && r.value.nombre === null && r.value.correo === null).toBe(true);
  });
});
