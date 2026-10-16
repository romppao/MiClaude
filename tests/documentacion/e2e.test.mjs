// Vigila tests/e2e/orden.json: ningún recorrido de navegador puede quedarse fuera del CI por olvido, ni figurar sin existir.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { recorridos, aparte } = JSON.parse(readFileSync(join(raiz, "tests", "e2e", "orden.json"), "utf8"));
const archivos = readdirSync(join(raiz, "tests", "e2e")).filter((f) => f.endsWith(".mjs")).map((f) => f.replace(/\.mjs$/, ""));

test("cada recorrido de la lista existe y no está repetido", () => {
  assert.equal(new Set(recorridos).size, recorridos.length, "hay recorridos repetidos en tests/e2e/orden.json");
  for (const r of recorridos) assert.ok(existsSync(join(raiz, "tests", "e2e", `${r}.mjs`)), `tests/e2e/${r}.mjs figura en orden.json pero no existe`);
});

test("cada archivo de tests/e2e está en la lista de recorridos o declarado «aparte» con su motivo", () => {
  const sueltos = archivos.filter((a) => !recorridos.includes(a) && !(a in aparte));
  assert.deepEqual(sueltos, [], `Estos archivos de tests/e2e no se ejecutan en el CI: ${sueltos.join(", ")}. Añádelos a «recorridos» en tests/e2e/orden.json (o a «aparte», explicando por qué).`);
});

test("lo declarado «aparte» existe y tiene motivo", () => {
  for (const [nombre, motivo] of Object.entries(aparte)) {
    assert.ok(existsSync(join(raiz, "tests", "e2e", `${nombre}.mjs`)), `«aparte» cita tests/e2e/${nombre}.mjs, que no existe`);
    assert.ok(String(motivo).length > 5, `«aparte» → ${nombre}: falta el motivo`);
  }
});
