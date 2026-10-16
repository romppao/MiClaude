/** Logotipos de gimnasios hallados en su web (petición del fundador, 17-10-2026): el registro es coherente y cada uno se puede retirar si lo piden. */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { logoDeGimnasio } from "../../src/lib/common/logos-gimnasios";

const registro: Record<string, { archivo: string; origen: string; pagina: string; fecha: string }> = JSON.parse(readFileSync(resolve("docs/datos/gimnasios-logos.json"), "utf8"));

describe("logoDeGimnasio", () => {
  it("da la dirección del logotipo de un gimnasio conocido y null para el resto", () => {
    const [slug, entrada] = Object.entries(registro)[0];
    expect(logoDeGimnasio(slug)).toBe(`/gimnasios/logos/${entrada.archivo}`);
    expect(logoDeGimnasio("gimnasio-que-no-existe")).toBeNull();
    expect(logoDeGimnasio(null)).toBeNull();
    expect(logoDeGimnasio(undefined)).toBeNull();
  });

  it("no se deja engañar por claves del prototipo", () => {
    for (const clave of ["__proto__", "constructor", "toString", "hasOwnProperty"]) expect(logoDeGimnasio(clave)).toBeNull();
  });
});

describe("registro de logotipos (docs/datos/gimnasios-logos.json)", () => {
  const filas = Object.entries(registro);

  it("tiene logotipos", () => expect(filas.length).toBeGreaterThan(20));

  it.each(filas)("%s: el archivo existe y anota de dónde salió", (slug, e) => {
    expect(e.archivo).toBe(`${slug}.webp`);
    expect(existsSync(resolve("public/gimnasios/logos", e.archivo))).toBe(true);
    expect(e.origen).toMatch(/^https?:\/\//);
    expect(e.pagina).toMatch(/^https?:\/\//);
    // Nunca de una red social: sus condiciones no permiten leerlas de forma automática.
    expect(`${e.origen} ${e.pagina}`).not.toMatch(/instagram\.com|facebook\.com|fbcdn\.net|cdninstagram/i);
    expect(e.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
