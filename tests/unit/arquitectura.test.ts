import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

/**
 * Reglas de organización del código (ver docs/DESARROLLO.md). Si esta prueba falla, no se arregla la prueba: se mueve el código
 * o, si de verdad hace falta una dependencia nueva, se decide aquí y se explica en docs/DESARROLLO.md.
 *
 *   lib/common      no depende de nada más
 *   lib/accounts    → common
 *   lib/fighters    → common
 *   lib/bouts       → common
 *   lib/aura        → common
 *   lib/community   → common, accounts
 *   lib/trainers    → common
 *   app/actions/*   → lib y ./shared; nunca otra acción; solo funciones asíncronas exportadas
 *   app/components  → lib y otros componentes; nunca acciones
 */
const RAIZ = process.cwd();
const PERMITIDAS: Record<string, string[]> = {
  common: [],
  accounts: ["common"],
  fighters: ["common"],
  bouts: ["common"],
  aura: ["common"],
  community: ["common", "accounts"],
  profiles: ["common"],
  trainers: ["common"],
};

const ficheros = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? ficheros(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []));
const importaciones = (texto: string) => [...texto.matchAll(/(?:from|import)\s*\(?\s*"([^"]+)"/g)].map((m) => m[1]);
const aRuta = (f: string) => relative(RAIZ, f).split(sep).join("/");
/** Ruta (relativa a la raíz) a la que apunta una importación relativa, sin extensión. */
const destino = (desde: string, spec: string) => aRuta(resolve(dirname(desde), spec));

const lib = ficheros(join(RAIZ, "src/lib"));
const app = ficheros(join(RAIZ, "src/app"));

describe("organización del código", () => {
  it("src/lib solo tiene las carpetas de dominio conocidas y ningún fichero suelto", () => {
    const entradas = readdirSync(join(RAIZ, "src/lib"), { withFileTypes: true });
    expect(entradas.filter((e) => !e.isDirectory()).map((e) => e.name)).toEqual([]);
    expect(entradas.map((e) => e.name).sort()).toEqual(Object.keys(PERMITIDAS).sort());
  });

  for (const f of lib) {
    const dominio = aRuta(f).split("/")[2];
    it(`${aRuta(f)} solo importa de ${["su dominio", ...(PERMITIDAS[dominio] ?? [])].join(", ")}`, () => {
      const texto = readFileSync(f, "utf8");
      const malas: string[] = [];
      for (const spec of importaciones(texto)) {
        if (!spec.startsWith(".")) continue;
        const d = destino(f, spec);
        if (d.startsWith("src/app/") || d === "src/app") malas.push(`${spec} (la lógica no depende de la interfaz)`);
        else if (d.startsWith("src/lib/")) {
          const otro = d.split("/")[2];
          if (otro !== dominio && !(PERMITIDAS[dominio] ?? []).includes(otro)) malas.push(`${spec} (${dominio} no puede depender de ${otro})`);
        }
      }
      expect(malas).toEqual([]);
    });
  }

  const modulosDeAcciones = ficheros(join(RAIZ, "src/app/actions")).filter((f) => !f.endsWith("shared.ts"));
  it("hay módulos de acciones que comprobar", () => expect(modulosDeAcciones.length).toBeGreaterThanOrEqual(7));

  for (const f of modulosDeAcciones) {
    const texto = readFileSync(f, "utf8");
    it(`${aRuta(f)} es un módulo "use server" que solo exporta funciones asíncronas y no importa otras acciones`, () => {
      expect(texto).toMatch(/^(\/\/[^\n]*\n)*"use server";/);
      const exportaciones = [...texto.matchAll(/^export\s+(.*)$/gm)].map((m) => m[1]);
      expect(exportaciones.filter((e) => !e.startsWith("async function "))).toEqual([]);
      const otras = importaciones(texto).filter((s) => s.startsWith(".") && (s.includes("/actions/") || s.startsWith("./")) && s !== "./shared");
      expect(otras).toEqual([]);
    });
  }

  it("shared.ts de las acciones no lleva \"use server\" (lo que exporta no es un punto de entrada público)", () => {
    expect(readFileSync(join(RAIZ, "src/app/actions/shared.ts"), "utf8")).not.toMatch(/^\s*"use server"/m);
  });

  it("ninguna pantalla ni componente usa el alias @/ (las importaciones son relativas)", () => {
    const con = [...lib, ...app].filter((f) => importaciones(readFileSync(f, "utf8")).some((s) => s.startsWith("@/")));
    expect(con.map(aRuta)).toEqual([]);
  });

  it("los componentes compartidos no importan acciones del servidor", () => {
    const dir = join(RAIZ, "src/app/components");
    expect(existsSync(dir)).toBe(true);
    const con = ficheros(dir).filter((f) => importaciones(readFileSync(f, "utf8")).some((s) => s.startsWith(".") && destino(f, s).startsWith("src/app/actions")));
    expect(con.map(aRuta)).toEqual([]);
  });

  it("no queda el antiguo fichero src/app/actions.ts ni componentes sueltos en src/app", () => {
    expect(existsSync(join(RAIZ, "src/app/actions.ts"))).toBe(false);
    const sueltos = readdirSync(join(RAIZ, "src/app")).filter((n) => /^[A-Z].*\.tsx$/.test(n));
    expect(sueltos).toEqual([]);
  });
});
