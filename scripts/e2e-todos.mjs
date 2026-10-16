// Ejecuta los recorridos de navegador (tests/e2e/orden.json) UNO TRAS OTRO SIN PARAR en el primero que falle, y al final resume cuáles fallaron.
// Antes (`a && b && c`) el CI se detenía en el primer fallo: los siguientes recorridos no se ejecutaban y los fallos aparecían de uno en uno,
// con 20 minutos de espera entre uno y otro (lección del 15-10-2026, PR de la fase 1).
// La salida de cada recorrido se deja tal cual (scripts/avisos-ci.mjs la sigue leyendo); el resumen va al final.
// Uso: node scripts/e2e-todos.mjs [--solo a,b,c] [--desde nombre] [--lista]
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const { recorridos } = JSON.parse(readFileSync(join(raiz, "tests/e2e/orden.json"), "utf8"));

const arg = (nombre) => { const i = process.argv.indexOf(nombre); return i >= 0 ? process.argv[i + 1] : undefined; };
if (process.argv.includes("--lista")) { console.log(recorridos.join("\n")); process.exit(0); }

let elegidos = recorridos;
const solo = arg("--solo");
if (solo) {
  const pedidos = solo.split(",").map((s) => s.trim()).filter(Boolean);
  const desconocidos = pedidos.filter((p) => !recorridos.includes(p));
  if (desconocidos.length) { console.error(`Recorridos que no existen en tests/e2e/orden.json: ${desconocidos.join(", ")}`); process.exit(2); }
  elegidos = recorridos.filter((r) => pedidos.includes(r));
}
const desde = arg("--desde");
if (desde) {
  const i = elegidos.indexOf(desde);
  if (i < 0) { console.error(`«${desde}» no está en la lista a ejecutar.`); process.exit(2); }
  elegidos = elegidos.slice(i);
}

const resultados = [];
for (const nombre of elegidos) {
  const t0 = Date.now();
  console.log(`\n===== e2e: ${nombre} =====`);
  const r = spawnSync(process.execPath, [join("tests", "e2e", `${nombre}.mjs`)], { cwd: raiz, stdio: "inherit", env: process.env });
  const segundos = Math.round((Date.now() - t0) / 1000);
  const codigo = r.status ?? (r.signal ? 1 : 1);
  resultados.push({ nombre, codigo, segundos });
  console.log(`===== e2e: ${nombre} → ${codigo === 0 ? "bien" : "FALLA"} (${segundos} s) =====`);
}

const fallan = resultados.filter((r) => r.codigo !== 0);
console.log(`\nRESUMEN e2e: ${resultados.length - fallan.length} de ${resultados.length} recorridos sin fallos, ${resultados.reduce((s, r) => s + r.segundos, 0)} s.`);
if (fallan.length) {
  console.log(`Recorridos que fallan (${fallan.length}): ${fallan.map((r) => r.nombre).join(", ")}`);
  console.log(`Para repetir solo esos: node scripts/e2e-todos.mjs --solo ${fallan.map((r) => r.nombre).join(",")}`);
  process.exit(1);
}
