// La flota: el flujo Claude + Codex de Lona, automatizado (inspirado en el flujo que el fundador vio en el vídeo de @robles.ia).
//   Claude PLANIFICA (escribe la ficha docs/tareas/T-xxx-….md) → Codex EJECUTA en una copia aparte → PUERTAS automáticas
//   (tipos, pruebas, catálogo, mapa, documentación y funciones aprobadas) → REVISIÓN de solo lectura (Luna, o Astra si es crítico)
//   con veredicto en JSON → Claude VERIFICA cada hallazgo y DECIDE (aprobar, otra ronda como mucho tres, o rechazar).
// Este script hace los pasos mecánicos y deja un informe; nunca guarda cambios (commit), nunca empuja, nunca fusiona: eso lo decide Claude y,
// para fusionar, el fundador. Detalle del flujo: docs/RED-DE-SEGURIDAD.md.
//
// Uso:
//   node scripts/flota.mjs todo <ficha.md> [--riesgo normal|critico] [--complejidad simple|normal|compleja] [--base rama]   ejecutar + puertas + revisión
//   node scripts/flota.mjs ejecutar <ficha.md> [--base rama] [--ronda N]             solo Codex en una copia nueva (rama flota/<id>)
//   node scripts/flota.mjs puertas [--dir carpeta]                                   solo las comprobaciones automáticas
//   node scripts/flota.mjs revisar [--dir carpeta] [--riesgo normal|critico] [--base rama] [--id T-xxx]
//   node scripts/flota.mjs simulacro <ficha.md>                                      enseña lo que haría, sin gastar nada
//   node scripts/flota.mjs estado <paso> <activo|hecho|fallo|omitido> [nota]          apunta un paso a mano (plan y decisión son de Claude)
//   node scripts/flota.mjs instalar-barra                                            instala la barra de estado de Claude Code con el flujo
// En pantalla: barra de estado de Claude Code (scripts/flota-barra.mjs) y panel en vivo (node scripts/flota-panel.mjs → http://localhost:4777).
// Modelo y esfuerzo según la tarea (política completa en docs/MODELOS-Y-ESFUERZO.md). La ficha dice «Complejidad: simple|normal|compleja» y «Riesgo: normal|crítico»:
//   simple → Luna, esfuerzo bajo · normal → Sol, medio · compleja → Sol, alto · revisión normal → Luna, medio · revisión crítica → Astra, alto.
//   Se puede forzar con --complejidad y --esfuerzo, o cambiar los modelos con FLOTA_SIMPLE, FLOTA_EJECUTOR, FLOTA_REVISOR y FLOTA_CRITICO.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { iniciarTarea, marcar } from "./flota-estado.mjs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const win = process.platform === "win32";
const MODELO_SIMPLE = process.env.FLOTA_SIMPLE ?? "gpt-6-luna";
const MODELO_EJECUTOR = process.env.FLOTA_EJECUTOR ?? "gpt-6.1-sol";
const MODELO_REVISOR = process.env.FLOTA_REVISOR ?? "gpt-6-luna";
const MODELO_CRITICO = process.env.FLOTA_CRITICO ?? "gpt-6-astra";

const decir = (t) => console.log(`\n▶ ${t}`);
const fallar = (t) => { console.error(`\n✘ ${t}`); process.exit(1); };
const ESFUERZOS = ["low", "medium", "high", "xhigh"];

/** Perfil del ejecutor según la complejidad de la ficha. */
const perfilDeEjecucion = (complejidad = "normal", esfuerzo) => {
  const base = { simple: { modelo: MODELO_SIMPLE, esfuerzo: "low" }, normal: { modelo: MODELO_EJECUTOR, esfuerzo: "medium" }, compleja: { modelo: MODELO_EJECUTOR, esfuerzo: "high" } }[complejidad];
  if (!base) fallar(`Complejidad desconocida «${complejidad}» (usa simple, normal o compleja).`);
  if (esfuerzo && !ESFUERZOS.includes(esfuerzo)) fallar(`Esfuerzo desconocido «${esfuerzo}» (usa ${ESFUERZOS.join(", ")}).`);
  return { ...base, esfuerzo: esfuerzo ?? base.esfuerzo };
};

/** Perfil del revisor según el riesgo: lo crítico (dinero, permisos, datos personales, secretos) va a Astra con esfuerzo alto. */
const perfilDeRevision = (riesgo = "normal", esfuerzo) =>
  ({ ...(riesgo === "critico" ? { modelo: MODELO_CRITICO, esfuerzo: "high" } : { modelo: MODELO_REVISOR, esfuerzo: "medium" }), ...(esfuerzo && { esfuerzo }) });

const [orden, ...resto] = process.argv.slice(2);
const opcion = (nombre, porDefecto) => { const i = resto.indexOf(nombre); return i >= 0 ? resto[i + 1] : porDefecto; };
const posicional = resto.find((a, i) => !a.startsWith("--") && !(i > 0 && resto[i - 1].startsWith("--")));

// ───────────── utilidades ─────────────
function git(args, cwd = raiz) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr.trim()}`);
  return r.stdout.trim();
}

/** Localiza Codex sin pasar por el shell (en Windows `codex` es un .cmd y los textos largos se estropean al entrecomillarlos). */
function ordenDeCodex() {
  if (win) {
    const donde = spawnSync("where", ["codex"], { encoding: "utf8" }).stdout.split(/\r?\n/).find((l) => l.trim().endsWith("codex.cmd"));
    if (donde) {
      const js = join(dirname(donde.trim()), "node_modules", "@openai", "codex", "bin", "codex.js");
      if (existsSync(js)) return [process.execPath, [js]];
    }
  }
  return ["codex", []];
}

/** Ejecuta Codex sin interacción: el texto va por la entrada estándar (`-`), nunca como argumento. */
function codex(modelo, sandbox, cwd, texto, { esquema, salida, registro, esfuerzo } = {}) {
  const [cmd, base] = ordenDeCodex();
  const args = [...base, "exec", "-m", modelo, "-s", sandbox, "--ephemeral", "--color", "never", "-C", cwd];
  if (esfuerzo) args.push("-c", `model_reasoning_effort="${esfuerzo}"`);
  if (esquema) args.push("--output-schema", esquema);
  if (salida) args.push("-o", salida);
  args.push("-");
  const r = spawnSync(cmd, args, { input: texto, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, timeout: 40 * 60_000 });
  if (registro) writeFileSync(registro, `${r.stdout ?? ""}\n${r.stderr ?? ""}`);
  return r;
}

const fichaDe = (ruta) => {
  const abs = resolve(ruta);
  if (!existsSync(abs)) fallar(`No existe la ficha ${ruta}`);
  const texto = readFileSync(abs, "utf8");
  const id = (basename(abs).match(/^(T-\d+)/) ?? [])[1] ?? basename(abs, ".md");
  const riesgo = (texto.match(/^\s*[-*]?\s*\**riesgo\**\s*:\s*\**\s*(normal|cr[ií]tico)/im) ?? [])[1];
  const complejidad = (texto.match(/^\s*[-*]?\s*\**complejidad\**\s*:\s*\**\s*(simple|normal|compleja)/im) ?? [])[1]?.toLowerCase();
  const titulo = (texto.match(/^#\s+(?:T-\d+\s*[·:-]\s*)?(.+)$/m) ?? [])[1]?.trim() ?? "";
  return { abs, texto, id, titulo, complejidad, riesgo: riesgo ? (riesgo.toLowerCase().startsWith("cr") ? "critico" : "normal") : undefined };
};

const dirInforme = (id, ronda) => { const d = join(raiz, "docs", "logs", "flota", id, `ronda-${ronda}`); mkdirSync(d, { recursive: true }); return d; };

const PREAMBULO = `Eres el ejecutor de la flota de Lona. Trabajas en una copia aparte del repositorio (rama flota/…). Reglas fijas:
- Haz SOLO lo que pide la ficha. Cambios mínimos y centrados; no renombres ni muevas archivos que no toque la ficha.
- NO hagas commit, no cambies de rama, no empujes, no instales paquetes, no uses la red.
- NO toques la versión ni los registros (package.json, package-lock.json, CHANGELOG.md, docs/DIARIO.md, docs/ESTADO.md, docs/catalogo-codigo.json, docs/mantenimiento/CATALOGO.md, docs/MAPA-FUNCIONAL.md): los actualiza Claude al guardar.
- Lo aprobado por el fundador está en docs/APROBADO.md y lo vigilan sus pruebas: no se debilita ni se borra ninguna prueba para que pase. Si una prueba aprobada falla por tu cambio, corrige tu cambio.
- Textos para personas: español de España, tuteo, frases cortas, sin jerga; el nombre de la app es Lona.
- Antes de terminar, pasa \`npx tsc --noEmit\` y \`npx vitest run\`. Responde con: qué cambiaste (archivo por archivo), qué pruebas añadiste, el resultado exacto de los comandos y los riesgos o dudas que veas.

FICHA DE LA TAREA:
`;

const CRITERIOS_REVISION = `Eres el revisor de la flota de Lona (SOLO LECTURA: no modifiques nada). Revisa los cambios sin guardar de esta copia de trabajo (\`git status\`, \`git diff\` y los archivos nuevos) frente a la ficha de la tarea.
Busca problemas REALES y demostrables, con archivo y línea y el escenario concreto; no estilo ni preferencias. Orden: (1) que haga lo que pide la ficha y no rompa lo aprobado (docs/APROBADO.md); (2) permisos y propiedad (que nadie vea o toque lo de otra persona); (3) dinero, aforos y carreras entre peticiones simultáneas; (4) datos personales y secretos; (5) validación de entradas, inyección y XSS; (6) pruebas que no prueban lo que dicen o que se han debilitado.
Veredicto: «aprobar» si no hay problemas graves; «cambios» si los hay (ordénalos); «rechazar» si el enfoque es erróneo. Responde en español de España con el JSON pedido.
`;

// ───────────── pasos ─────────────
function ejecutar(ficha, { base, ronda = 1, simulacro = false, complejidad, esfuerzo } = {}) {
  const perfil = perfilDeEjecucion(complejidad ?? ficha.complejidad, esfuerzo);
  const rama = `flota/${ficha.id.toLowerCase()}${ronda > 1 ? `-r${ronda}` : ""}`;
  const carpeta = join(tmpdir(), "lona-flota", rama.replace("/", "-"));
  const origen = base ?? git(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (simulacro) { console.log(`[simulacro] copia: git worktree add ${carpeta} -b ${rama} ${origen}\n[simulacro] Codex ${perfil.modelo} (esfuerzo ${perfil.esfuerzo}, escritura en la copia) con la ficha ${ficha.abs}`); return { carpeta, rama }; }
  decir(`Copia de trabajo ${carpeta} (rama ${rama}, desde ${origen})`);
  mkdirSync(dirname(carpeta), { recursive: true });
  git(["worktree", "add", carpeta, "-b", rama, origen]);
  try { symlinkSync(join(raiz, "node_modules"), join(carpeta, "node_modules"), "junction"); } catch (e) { console.warn(`(No se pudo enlazar node_modules: ${e.message}. Ejecuta npm ci en la copia.)`); }
  const informe = dirInforme(ficha.id, ronda);
  iniciarTarea(ficha.id, { ronda, titulo: ficha.titulo, riesgo: ficha.riesgo ?? "normal", complejidad: complejidad ?? ficha.complejidad ?? "normal" });
  marcar("plan", "hecho", { quien: "Claude", nota: `ficha ${basename(ficha.abs)}` });
  marcar("ejecutar", "activo", { quien: `Codex ${perfil.modelo} (${perfil.esfuerzo})` });
  decir(`Codex (${perfil.modelo}, esfuerzo ${perfil.esfuerzo}) ejecuta la ficha ${ficha.id}… (puede tardar varios minutos)`);
  const r = codex(perfil.modelo, "workspace-write", carpeta, `${PREAMBULO}${ficha.texto}`, { esfuerzo: perfil.esfuerzo, salida: join(informe, "resultado-codex.txt"), registro: join(informe, "ejecucion-codex.log") });
  if (r.status !== 0) console.warn(`Codex terminó con código ${r.status}. Mira ${join(informe, "ejecucion-codex.log")}`);
  marcar("ejecutar", r.status === 0 ? "hecho" : "fallo", { nota: r.status === 0 ? "cambios sin guardar en la copia" : `código ${r.status}` });
  return { carpeta, rama, informe };
}

function puertas(carpeta) {
  decir(`Puertas automáticas en ${carpeta}`);
  marcar("puertas", "activo", { quien: "tipos · pruebas · catálogo · aprobado" });
  const r = spawnSync(process.execPath, [join(raiz, "scripts", "verificar.mjs"), "--sin-version"], { cwd: carpeta, stdio: "inherit" });
  marcar("puertas", r.status === 0 ? "hecho" : "fallo", { nota: r.status === 0 ? "todas pasan" : "alguna no pasa" });
  return r.status === 0;
}

function revisar(ficha, carpeta, { riesgo = "normal", base, ronda = 1, simulacro = false, esfuerzo } = {}) {
  const { modelo, esfuerzo: nivel } = perfilDeRevision(riesgo, esfuerzo);
  if (simulacro) { console.log(`[simulacro] revisión de solo lectura con ${modelo} (esfuerzo ${nivel}) → docs/logs/flota/${ficha.id}/ronda-${ronda}/revision-${modelo}.json`); return null; }
  const informe = dirInforme(ficha.id, ronda);
  const salida = join(informe, `revision-${modelo}.json`);
  decir(`Revisión (${riesgo}) con ${modelo}, esfuerzo ${nivel}, solo lectura…`);
  marcar("revision", "activo", { quien: `Codex ${modelo} (${nivel})` });
  const esquema = join(raiz, "scripts", "flota-veredicto.schema.json");
  const r = codex(modelo, "read-only", carpeta, `${CRITERIOS_REVISION}\nBase de comparación: ${base ?? "HEAD"}.\n\nFICHA DE LA TAREA:\n${ficha.texto}`, { esquema, salida, esfuerzo: nivel, registro: join(informe, `revision-${modelo}.log`) });
  if (r.status !== 0 || !existsSync(salida)) { marcar("revision", "fallo", { nota: `código ${r.status}` }); console.warn(`La revisión no terminó bien (código ${r.status}). Mira ${join(informe, `revision-${modelo}.log`)}`); return null; }
  const v = JSON.parse(readFileSync(salida, "utf8"));
  marcar("revision", "hecho", { veredicto: v.veredicto, resumen: v.resumen, hallazgos: v.hallazgos, nota: `${v.hallazgos.length} hallazgo(s)` });
  marcar("decision", "activo", { quien: "Claude", nota: "verifica los hallazgos y decide" });
  console.log(`\nVEREDICTO de ${modelo}: ${v.veredicto}\n${v.resumen}`);
  for (const h of v.hallazgos) console.log(`  [${h.gravedad}] ${h.archivo}: ${h.problema}`);
  return v;
}

function resumen(ficha, ronda, datos) {
  const informe = dirInforme(ficha.id, ronda);
  const lineas = [`# ${ficha.id} · ronda ${ronda}`, "", `- Copia de trabajo: \`${datos.carpeta}\` (rama \`${datos.rama ?? "—"}\`)`, `- Puertas automáticas: ${datos.puertas === undefined ? "no ejecutadas" : datos.puertas ? "**pasan**" : "**NO pasan**"}`,
    `- Revisión: ${datos.revision ? `**${datos.revision.veredicto}** — ${datos.revision.resumen}` : "no disponible"}`, "", "## Hallazgos del revisor (Claude los verifica uno a uno antes de aplicar nada)"];
  for (const h of datos.revision?.hallazgos ?? []) lineas.push(`- [${h.gravedad}] \`${h.archivo}\`: ${h.problema}`);
  if (!datos.revision?.hallazgos?.length) lineas.push("- (ninguno)");
  lineas.push("", "## Decide Claude", "Aprobar (guardar, versión, PR) · otra ronda (máximo tres) · rechazar.");
  writeFileSync(join(informe, "resumen.md"), lineas.join("\n") + "\n");
  console.log(`\nInforme: ${join(informe, "resumen.md")}`);
}

// ───────────── órdenes ─────────────
switch (orden) {
  case "todo": {
    if (!posicional) fallar("Falta la ficha: node scripts/flota.mjs todo docs/tareas/T-xxx-….md");
    const ficha = fichaDe(posicional);
    const riesgo = opcion("--riesgo", ficha.riesgo ?? "normal");
    const base = opcion("--base");
    const ronda = Number(opcion("--ronda", "1"));
    const e = ejecutar(ficha, { base, ronda, complejidad: opcion("--complejidad"), esfuerzo: opcion("--esfuerzo") });
    const pasan = puertas(e.carpeta);
    const v = revisar(ficha, e.carpeta, { riesgo, base: "HEAD", ronda, esfuerzo: opcion("--esfuerzo-revision") });
    resumen(ficha, ronda, { ...e, puertas: pasan, revision: v });
    break;
  }
  case "ejecutar": {
    if (!posicional) fallar("Falta la ficha.");
    const ficha = fichaDe(posicional);
    const e = ejecutar(ficha, { base: opcion("--base"), ronda: Number(opcion("--ronda", "1")), complejidad: opcion("--complejidad"), esfuerzo: opcion("--esfuerzo") });
    console.log(`\nListo. Cambios sin guardar en ${e.carpeta}`);
    break;
  }
  case "puertas": {
    process.exit(puertas(resolve(opcion("--dir", raiz))) ? 0 : 1);
    break;
  }
  case "revisar": {
    const carpeta = resolve(opcion("--dir", raiz));
    const id = opcion("--id", "revision");
    const ficha = posicional && existsSync(posicional) ? fichaDe(posicional) : { abs: "", id, texto: "(Sin ficha: revisa los cambios sin guardar con los criterios generales.)", riesgo: undefined };
    const v = revisar(ficha, carpeta, { riesgo: opcion("--riesgo", ficha.riesgo ?? "normal"), base: opcion("--base"), ronda: Number(opcion("--ronda", "1")) });
    process.exit(v ? 0 : 1);
    break;
  }
  case "simulacro": {
    if (!posicional) fallar("Falta la ficha.");
    const ficha = fichaDe(posicional);
    console.log(`Ficha ${ficha.id} (riesgo: ${ficha.riesgo ?? "normal"}, complejidad: ${ficha.complejidad ?? "normal"})`);
    ejecutar(ficha, { simulacro: true, complejidad: opcion("--complejidad"), esfuerzo: opcion("--esfuerzo") });
    console.log("[simulacro] puertas: scripts/verificar.mjs --sin-version en la copia");
    revisar(ficha, "(copia)", { riesgo: ficha.riesgo ?? "normal", simulacro: true });
    break;
  }
  case "estado": {
    const [paso, valor, ...nota] = resto;
    if (!["plan", "ejecutar", "puertas", "revision", "decision"].includes(paso) || !["activo", "hecho", "fallo", "omitido"].includes(valor)) fallar("Uso: node scripts/flota.mjs estado <plan|ejecutar|puertas|revision|decision> <activo|hecho|fallo|omitido> [nota]");
    marcar(paso, valor, { nota: nota.join(" ") || undefined, quien: ["plan", "decision"].includes(paso) ? "Claude" : undefined });
    console.log(`Apuntado: ${paso} → ${valor}`);
    break;
  }
  case "instalar-barra": {
    const destino = join(homedir(), ".claude", "lona-flota-barra.mjs");
    copyFileSync(join(raiz, "scripts", "flota-barra.mjs"), destino);
    const ajustes = join(homedir(), ".claude", "settings.json");
    const actual = existsSync(ajustes) ? JSON.parse(readFileSync(ajustes, "utf8")) : {};
    if (actual.statusLine && !String(actual.statusLine.command ?? "").includes("lona-flota-barra")) fallar(`Ya hay otra barra de estado configurada (${actual.statusLine.command}). No la sustituyo sin permiso.`);
    actual.statusLine = { type: "command", command: `node "${destino.split("\\").join("/")}"`, padding: 0 };
    writeFileSync(ajustes, JSON.stringify(actual, null, 2) + "\n");
    console.log(`Barra instalada: ${destino}. Aparece en Claude Code al enviar el siguiente mensaje.`);
    break;
  }
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"));
    process.exit(orden ? 2 : 0);
}
