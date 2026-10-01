import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AVISOS, PROBLEMAS } from "../../src/lib/common/messages";

/** Todo código de aviso o de problema que usan las acciones del servidor debe tener su texto: si falta, la persona no ve ningún mensaje. */
describe("mensajes al usuario", () => {
  // Todo el código fuente salvo el propio catálogo de textos: así un módulo nuevo queda cubierto sin tocar esta prueba.
  const ficheros = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? ficheros(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []));
  const fuentes = ficheros("src").filter((f) => !f.endsWith("common/messages.ts")).map((f) => readFileSync(f, "utf8")).join("\n");
  const problemas = new Set([...fuentes.matchAll(/problema: "([a-z_]+)"/g)].map((m) => m[1]));
  for (const m of fuentes.matchAll(/problema: [^,}]*\? "([a-z_]+)" : "([a-z_]+)"/g)) { problemas.add(m[1]); problemas.add(m[2]); }
  // Códigos que devuelven las reglas compartidas (rules.ts): pueden ser avisos o problemas, pero siempre tienen texto.
  const dudosos = new Set([...fuentes.matchAll(/"((?:aura|combate|resultado)_[a-z_]+)"/g)].map((m) => m[1]));
  const avisos = new Set([...fuentes.matchAll(/aviso: "([a-z_]+)"/g)].map((m) => m[1]));
  for (const m of fuentes.matchAll(/aviso: [^,}]*\? "([a-z_]+)" : "([a-z_]+)"/g)) { avisos.add(m[1]); avisos.add(m[2]); }

  it("hay códigos que comprobar (la prueba no es vacía)", () => {
    expect(problemas.size).toBeGreaterThan(30);
    expect(avisos.size).toBeGreaterThan(15);
  });
  it("cada código de las reglas compartidas tiene su texto", () => {
    expect([...dudosos].filter((c) => !Object.hasOwn(PROBLEMAS, c) && !Object.hasOwn(AVISOS, c))).toEqual([]);
  });
  it("cada problema usado tiene su texto", () => {
    expect([...problemas].filter((c) => !Object.hasOwn(PROBLEMAS, c))).toEqual([]);
  });
  it("cada aviso usado tiene su texto", () => {
    expect([...avisos].filter((c) => !Object.hasOwn(AVISOS, c))).toEqual([]);
  });
  it("ningún texto está vacío ni usa jerga interna", () => {
    for (const t of [...Object.values(AVISOS), ...Object.values(PROBLEMAS)]) {
      expect(t.trim().length).toBeGreaterThan(10);
      expect(t).not.toMatch(/SELF_REPORTED|DISPUTED|VERIFIED|token|claim/i);
    }
  });
});
