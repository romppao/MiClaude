// Comprobación completa antes de entregar un cambio: un solo comando, el mismo orden y las mismas puertas que el CI.
//   node scripts/verificar.mjs                       tipos, pruebas unitarias, catálogo, mapa funcional, versión y documentación
//   node scripts/verificar.mjs --e2e                 además, los recorridos de navegador (levanta una base desechable con Docker: scripts/e2e-local.mjs)
//   node scripts/verificar.mjs --e2e --solo a,b      solo esos recorridos
//   node scripts/verificar.mjs --e2e --a11y          además la accesibilidad (WCAG 2.2 AA)
//   node scripts/verificar.mjs --sin-version         sin la puerta de la versión (para la flota: Codex no sube versiones)
// No se detiene en la primera puerta que falla: las ejecuta todas y al final dice cuáles no pasaron.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const win = process.platform === "win32";
const args = process.argv.slice(2);
const node = process.execPath;
const pruebasDeDocumentacion = readdirSync(join(raiz, "tests", "documentacion")).filter((f) => f.endsWith(".test.mjs")).map((f) => `tests/documentacion/${f}`);

const puertas = [
  ["Documentación del código (catálogo, estado, recorridos, funciones aprobadas)", node, ["--test", ...pruebasDeDocumentacion]],
  ["Catálogo al día", node, ["scripts/generar-catalogo.mjs", "--comprobar"]],
  ["Mapa funcional al día", node, ["scripts/generar-mapa.mjs", "--comprobar"]],
  ["Tipos (TypeScript)", "npx", ["tsc", "--noEmit"]],
  ["Pruebas unitarias", "npx", ["vitest", "run"]],
];
if (args.includes("--e2e")) {
  const paso = ["scripts/e2e-local.mjs"];
  for (const a of ["--solo", "--desde"]) { const i = args.indexOf(a); if (i >= 0) paso.push(a, args[i + 1]); }
  for (const a of ["--sin-build", "--a11y", "--conservar"]) if (args.includes(a)) paso.push(a);
  puertas.push(["Recorridos de navegador", node, paso]);
}

if (!args.includes("--sin-version")) puertas.unshift(["Versión y registro de cambios", node, ["scripts/version.mjs", "comprobar"]]);

const resultados = [];
for (const [nombre, cmd, cmdArgs] of puertas) {
  console.log(`\n━━ ${nombre} ━━`);
  const t0 = Date.now();
  const r = spawnSync(cmd, cmdArgs, { cwd: raiz, stdio: "inherit", shell: win && cmd === "npx" });
  resultados.push({ nombre, bien: r.status === 0, segundos: Math.round((Date.now() - t0) / 1000) });
}

console.log("\n━━ Resumen ━━");
for (const r of resultados) console.log(`${r.bien ? "✔" : "✘"} ${r.nombre} (${r.segundos} s)`);
const fallan = resultados.filter((r) => !r.bien);
console.log(fallan.length ? `\n✘ No se debe entregar todavía: ${fallan.length} puerta(s) sin pasar.` : "\n✔ Todas las puertas pasan.");
process.exit(fallan.length ? 1 : 0);
