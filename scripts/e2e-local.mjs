// Pruebas de navegador completas en el propio equipo, con UN solo comando y sin instalar nada a mano más que Docker:
// levanta una base de datos PostgreSQL desechable, aplica las migraciones, compila la aplicación, arranca el servidor, ejecuta los recorridos
// (scripts/e2e-todos.mjs, sin pararse en el primer fallo) y lo recoge todo al terminar. Es lo mismo que hace el CI, sin esperar 20 minutos por vuelta.
// En Windows, donde no hay `psql`, crea un sustituto temporal que reenvía las órdenes al contenedor (las pruebas llaman a `psql`).
// Uso: node scripts/e2e-local.mjs [--solo a,b,c] [--desde nombre] [--sin-build] [--a11y] [--conservar]
//   --solo        solo esos recorridos (nombres de tests/e2e/orden.json)
//   --sin-build   reutiliza la compilación de .next si ya existe
//   --a11y        además de los recorridos, la medición de accesibilidad (WCAG 2.2 AA)
//   --conservar   no borra la base ni el contenedor al terminar (para investigar un fallo)
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, closeSync, existsSync, mkdtempSync, openSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const win = process.platform === "win32";
const args = process.argv.slice(2);
const tiene = (a) => args.includes(a);
const valor = (a) => { const i = args.indexOf(a); return i >= 0 ? args[i + 1] : undefined; };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const decir = (t) => console.log(`\n▶ ${t}`);

// npm, npx y docker se llaman con shell en Windows (son .cmd).
function correr(cmd, cmdArgs, opciones = {}) {
  return spawnSync(cmd, cmdArgs, { cwd: raiz, shell: win && cmd !== "docker", stdio: "pipe", encoding: "utf8", ...opciones });
}
function correrVisible(cmd, cmdArgs, env) {
  const r = spawnSync(cmd, cmdArgs, { cwd: raiz, shell: win, stdio: "inherit", env });
  if (r.status !== 0) throw new Error(`«${cmd} ${cmdArgs.join(" ")}» terminó con código ${r.status}`);
}
const puertoLibre = (desde) => new Promise((resolver) => {
  const s = net.createServer();
  s.once("error", () => resolver(puertoLibre(desde + 1)));
  s.listen(desde, "127.0.0.1", () => s.close(() => resolver(desde)));
});

async function asegurarDocker() {
  if (correr("docker", ["info"]).status === 0) return;
  decir("Docker no está en marcha: lo arranco (puede tardar un minuto)…");
  if (win) {
    const exe = join(process.env.ProgramFiles ?? "C:\\Program Files", "Docker", "Docker", "Docker Desktop.exe");
    if (!existsSync(exe)) throw new Error("No encuentro Docker Desktop. Instálalo o arráncalo y vuelve a ejecutar.");
    spawn(exe, [], { detached: true, stdio: "ignore" }).unref();
  } else if (process.platform === "darwin") {
    spawnSync("open", ["-a", "Docker"]);
  } else {
    throw new Error("Docker no responde. Arranca el servicio (por ejemplo «sudo systemctl start docker») y vuelve a ejecutar.");
  }
  for (let i = 0; i < 40; i++) { await pausa(5000); if (correr("docker", ["info"]).status === 0) return; }
  throw new Error("Docker no llegó a arrancar en 200 s.");
}

const hayPsql = () => correr("psql", ["--version"], { shell: true }).status === 0;

/** Sustituto temporal de `psql` que reenvía al contenedor de pruebas (ignora la dirección de conexión que le pasan las pruebas). */
function crearSustitutoDePsql(contenedor) {
  const dir = mkdtempSync(join(tmpdir(), "lona-psql-"));
  const js = join(dir, "psql-sustituto.mjs");
  writeFileSync(js, `import { spawnSync } from "node:child_process";
let a = process.argv.slice(2);
if (a.length && /^"?(postgres(ql)?:\\/\\/|\\$DATABASE_URL)/.test(a[0])) a = a.slice(1);
const r = spawnSync("docker", ["exec", "-i", ${JSON.stringify(contenedor)}, "psql", "-U", "postgres", "-d", "ringespana", ...a], { stdio: "inherit" });
process.exit(r.status ?? 1);
`);
  writeFileSync(join(dir, "psql.cmd"), `@echo off\r\nnode "%~dp0psql-sustituto.mjs" %*\r\n`);
  const sh = join(dir, "psql");
  writeFileSync(sh, `#!/bin/sh\nexec node "$(dirname "$0")/psql-sustituto.mjs" "$@"\n`);
  try { chmodSync(sh, 0o755); } catch { /* en Windows no hace falta */ }
  return dir;
}

let servidor = null;
let contenedor = null;
let dirPsql = null;
let registroFd = null;

function limpiar() {
  if (servidor && servidor.exitCode === null) {
    if (win) spawnSync("taskkill", ["/PID", String(servidor.pid), "/T", "/F"]); else servidor.kill("SIGTERM");
  }
  if (registroFd !== null) { try { closeSync(registroFd); } catch { /* ya cerrado */ } registroFd = null; }
  if (contenedor && !tiene("--conservar")) { correr("docker", ["rm", "-f", contenedor]); }
  else if (contenedor) console.log(`\nSe conserva el contenedor «${contenedor}». Bórralo con: docker rm -f ${contenedor}`);
  if (dirPsql) { try { rmSync(dirPsql, { recursive: true, force: true }); } catch { /* temporal */ } }
  contenedor = null; dirPsql = null; servidor = null;
}
process.on("SIGINT", () => { limpiar(); process.exit(130); });
process.on("SIGTERM", () => { limpiar(); process.exit(143); });

async function main() {
  await asegurarDocker();

  const puertoBd = await puertoLibre(5433);
  const puertoApp = await puertoLibre(3111);
  contenedor = `lona-e2e-${process.pid}`;
  decir(`Base de datos desechable «${contenedor}» en el puerto ${puertoBd}…`);
  const run = correr("docker", ["run", "-d", "--name", contenedor, "-e", "POSTGRES_USER=postgres", "-e", "POSTGRES_PASSWORD=postgres", "-e", "POSTGRES_DB=ringespana", "-p", `${puertoBd}:5432`, "postgres:16"]);
  if (run.status !== 0) { const c = contenedor; contenedor = null; throw new Error(`No pude crear la base: ${run.stderr || run.stdout} (${c})`); }
  // El servidor temporal de arranque de Postgres solo escucha por socket: se espera a que responda por TCP, dos veces seguidas.
  let listas = 0;
  for (let i = 0; i < 60 && listas < 2; i++) {
    listas = correr("docker", ["exec", contenedor, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"]).status === 0 ? listas + 1 : 0;
    if (listas < 2) await pausa(1000);
  }
  if (listas < 2) throw new Error("La base de datos no llegó a estar lista.");

  const tmp = mkdtempSync(join(tmpdir(), "lona-e2e-"));
  const registro = join(tmp, "servidor.log");
  const entorno = {
    ...process.env,
    DATABASE_URL: `postgresql://postgres:postgres@localhost:${puertoBd}/ringespana`,
    BASE_URL: `http://localhost:${puertoApp}`, APP_URL: `http://localhost:${puertoApp}`,
    MAIL_TRANSPORT: "log", MAIL_LOG: registro, NEWS_FETCH: "no", GEOCODIFICAR: "no", CREADOR_CORREO: "creador@prueba.test",
    GOOGLE_CLIENT_ID: "cliente-de-pruebas.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "secreto-de-pruebas",
    MEDIA_DIR: join(tmp, "subidas"), FOTOS_EN_DISCO: "si",
  };
  if (!hayPsql()) {
    dirPsql = crearSustitutoDePsql(contenedor);
    const clavePath = Object.keys(entorno).find((k) => k.toUpperCase() === "PATH") ?? "PATH";
    entorno[clavePath] = `${dirPsql}${delimiter}${entorno[clavePath] ?? ""}`;
    console.log("(No hay «psql» en este equipo: uso un sustituto temporal que habla con el contenedor.)");
  }

  decir("Aplicando las migraciones…");
  correrVisible("npx", ["prisma", "migrate", "deploy"], entorno);

  if (tiene("--sin-build") && existsSync(join(raiz, ".next", "BUILD_ID"))) console.log("\n▶ Reutilizo la compilación que ya existe (--sin-build).");
  else { decir("Compilando la aplicación (unos minutos)…"); correrVisible("npm", ["run", "build"], entorno); }

  decir(`Arrancando el servidor en el puerto ${puertoApp}…`);
  registroFd = openSync(registro, "w");
  servidor = spawn(process.execPath, ["--import", "./tests/e2e/google-falso.mjs", join("node_modules", "next", "dist", "bin", "next"), "start", "-p", String(puertoApp)], { cwd: raiz, env: entorno, stdio: ["ignore", registroFd, registroFd] });
  let arriba = false;
  for (let i = 0; i < 60 && !arriba; i++) {
    if (servidor.exitCode !== null) throw new Error(`El servidor se cerró al arrancar (código ${servidor.exitCode}). Mira ${registro}`);
    try { arriba = (await fetch(`${entorno.BASE_URL}/registro`, { signal: AbortSignal.timeout(3000) })).ok; } catch { /* aún no */ }
    if (!arriba) await pausa(1000);
  }
  if (!arriba) throw new Error("El servidor no respondió en 60 s.");

  decir("Recorridos de navegador…");
  const pasar = [];
  if (valor("--solo")) pasar.push("--solo", valor("--solo"));
  if (valor("--desde")) pasar.push("--desde", valor("--desde"));
  let fallo = spawnSync(process.execPath, [join("scripts", "e2e-todos.mjs"), ...pasar], { cwd: raiz, stdio: "inherit", env: entorno }).status !== 0;

  if (tiene("--a11y")) {
    decir("Medición de accesibilidad (WCAG 2.2 AA)…");
    if (spawnSync(process.execPath, [join("tests", "e2e", "accesibilidad.mjs")], { cwd: raiz, stdio: "inherit", env: entorno }).status !== 0) fallo = true;
  }
  return fallo ? 1 : 0;
}

let codigo = 1;
try { codigo = await main(); }
catch (e) { console.error(`\nNo se pudo completar: ${e.message}`); }
finally { limpiar(); }
console.log(codigo === 0 ? "\n✔ Todo correcto." : "\n✘ Hay fallos (arriba, el resumen de cada recorrido).");
process.exit(codigo);
