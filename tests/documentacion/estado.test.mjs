// Pruebas de scripts/estado.mjs (estado vivo del trabajo en equipo): solo la parte pura, sin Git ni red.
import test from "node:test";
import assert from "node:assert/strict";
import { diasDesde, esRegistro, nombreDeRama, solapes } from "../../scripts/estado.mjs";

const rama = (nombre, ficheros, ancestros = []) => ({ nombre, ficheros, ancestros: new Set(ancestros) });

test("detecta el fichero que tocan dos trabajos independientes", () => {
  const r = solapes([rama("codex/a", ["src/app/page.tsx", "x.ts"]), rama("claude/b", ["src/app/page.tsx", "y.ts"])]);
  assert.deepEqual(r.reales, [{ fichero: "src/app/page.tsx", ramas: ["codex/a", "claude/b"] }]);
  assert.deepEqual(r.registros, []);
});

test("los ficheros de registro se listan aparte: coincidir en ellos no es un solape de trabajo", () => {
  const r = solapes([rama("a", ["CHANGELOG.md", "docs/DIARIO.md"]), rama("b", ["CHANGELOG.md", "docs/ecosistema/traspasos/x.md"])]);
  assert.equal(r.reales.length, 0);
  assert.deepEqual(r.registros.map((s) => s.fichero), ["CHANGELOG.md"]);
  assert.ok(esRegistro("docs/ecosistema/traspasos/otro.md") && !esRegistro("src/app/page.tsx"));
});

test("las ramas apiladas (un PR sobre otro) no cuentan entre sí, pero sí frente a una tercera independiente", () => {
  const base = rama("claude/base", ["src/a.ts"]);
  const hija = rama("codex/hija", ["src/a.ts", "src/b.ts"], ["claude/base"]);
  assert.equal(solapes([base, hija]).reales.length, 0);
  const ajena = rama("claude/ajena", ["src/a.ts"]);
  const r = solapes([base, hija, ajena]);
  assert.equal(r.reales.length, 1);
  assert.deepEqual(r.reales[0].ramas, ["claude/base", "codex/hija", "claude/ajena"]);
});

test("los días se cuentan completos y la rama reservada lleva asistente, tema sin acentos y fecha", () => {
  const ahora = Date.UTC(2026, 9, 14, 12);
  assert.equal(diasDesde(ahora / 1000 - 2 * 86400 - 60, ahora), 2);
  assert.equal(nombreDeRama("Codex", "Paneles: bloque G (pulido)", new Date(Date.UTC(2026, 9, 14))), "codex/paneles-bloque-g-pulido-20261014");
  assert.equal(nombreDeRama("Claude", "  ¡¡¡  ", new Date(Date.UTC(2026, 9, 14))), "claude/trabajo-20261014");
});
