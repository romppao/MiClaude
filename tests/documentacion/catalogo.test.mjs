/** Pruebas del catálogo en repositorios temporales: omisiones, bajas y desactualización. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { maintainedFiles, validateCatalog, renderCatalog, run, MANIFEST, OUTPUT } from "../../scripts/generar-catalogo.mjs";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ring-catalogo-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  function write(file, content) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  write("src/lib/common/regla.ts", "export function regla() { return true; }\n");
  write("docs/mantenimiento/README.md", "# Contexto\n");
  const entries = [{ path: "src/lib/common/regla.ts", purpose: "Valida la regla de prueba.", guide: "docs/mantenimiento/README.md" }];
  write(MANIFEST, JSON.stringify(entries));
  return { root, write, entries };
}

test("detecta una fuente nueva sin explicación individual", (t) => {
  const { root, write, entries } = fixture(t);
  write("src/lib/common/nueva.ts", "export const nueva = 1;\n");
  assert.ok(validateCatalog(root, entries).errors.includes("Sin documentar: src/lib/common/nueva.ts"));
});

test("detecta un archivo eliminado y duplicados", (t) => {
  const { root, entries } = fixture(t);
  fs.unlinkSync(path.join(root, entries[0].path));
  const errors = validateCatalog(root, [...entries, entries[0]]).errors;
  assert.ok(errors.some((e) => e.startsWith("Archivo eliminado")));
  assert.ok(errors.some((e) => e.startsWith("Entrada duplicada")));
});

test("rechaza explicación vacía y guía inexistente", (t) => {
  const { root, entries } = fixture(t);
  const errors = validateCatalog(root, [{ ...entries[0], purpose: "  ", guide: "docs/no-existe.md" }]).errors;
  assert.ok(errors.some((e) => e.startsWith("Responsabilidad vacía")));
  assert.ok(errors.some((e) => e.startsWith("Guía inexistente")));
});

test("rechaza rutas fuera del repositorio, sin leerlas", (t) => {
  const { root, entries } = fixture(t);
  assert.ok(validateCatalog(root, [{ ...entries[0], guide: "docs/../../secreto.md" }]).errors.some((e) => e.startsWith("Guía inválida")));
  assert.ok(validateCatalog(root, [{ ...entries[0], path: "../fuera.ts" }]).errors.some((e) => e.startsWith("Entrada con ruta inválida")));
});

test("incluye código, pruebas, scripts, migraciones y configuración; excluye datos privados y recursos", (t) => {
  const { root, write } = fixture(t);
  const included = ["tests/unit/regla.test.ts", "scripts/herramienta.sh", "prisma/migrations/001/migration.sql", ".github/workflows/ci.yml", "package-lock.json", ".env.example", "config-nueva.mjs", "Dockerfile"];
  for (const p of included) write(p, "fuente\n");
  for (const p of [".env", ".env.local.json", "public/foto.webp", "node_modules/tercero.js", "docs/ingreso/aislado/reto.ts"]) write(p, "excluido\n");
  assert.deepEqual(maintainedFiles(root), [...included, "src/lib/common/regla.ts"].sort());
});

test("comprobar detecta edición de código y no escribe la salida", (t) => {
  const { root, write } = fixture(t);
  run(root);
  const before = fs.readFileSync(path.join(root, OUTPUT), "utf8");
  write("src/lib/common/regla.ts", "export function regla() { return false; }\n");
  assert.throws(() => run(root, true), /Catálogo desactualizado/);
  assert.equal(fs.readFileSync(path.join(root, OUTPUT), "utf8"), before);
  run(root);
  assert.equal(run(root, true), 1);
});

test("una salida editada a mano también se rechaza", (t) => {
  const { root, write } = fixture(t);
  run(root);
  write(OUTPUT, "Catálogo manipulado\n");
  assert.throws(() => run(root, true), /Catálogo desactualizado/);
});

test("salida estable, ordenada y con enlaces escapados para rutas dinámicas", (t) => {
  const { root, write, entries } = fixture(t);
  write("src/app/peleadores/[slug]/page.tsx", "export default function Ficha() {}\n");
  const all = [...entries, { path: "src/app/peleadores/[slug]/page.tsx", purpose: "Ficha | pública", guide: entries[0].guide }];
  const output = renderCatalog(root, all);
  assert.equal(output, renderCatalog(root, [...all].reverse()));
  assert.match(output, /%5Bslug%5D/);
  assert.match(output, /Ficha \\\| pública/);
});

test("una fuente con enlace simbólico requiere resolver el alcance explícitamente", (t) => {
  const { root } = fixture(t);
  fs.symlinkSync("regla.ts", path.join(root, "src/lib/common/enlace.ts"));
  assert.throws(() => maintainedFiles(root), /enlace simbólico no admitido/);
});
