// Control de versiones de Lona (docs/VERSIONES.md). Sin dependencias: lo usan las personas, los asistentes y el CI.
//
//   node scripts/version.mjs subir <parche|menor|mayor>   sube el número en package.json y package-lock.json y convierte
//                                                          «## [Sin publicar]» del CHANGELOG en la nueva versión con la fecha de hoy
//   node scripts/version.mjs comprobar [versión-base]      CI de cada PR: package.json y package-lock.json coinciden, el CHANGELOG
//                                                          tiene la sección de la versión con contenido y, si se da la base, es mayor
//   node scripts/version.mjs etiquetas                     CI al fusionar: «vX.Y.Z commit» de cada versión que debe tener etiqueta
//                                                          (las históricas, por su línea «Fusión», y la actual en HEAD)
import { readFileSync, writeFileSync } from "node:fs";

const PAQUETE = "package.json";
const BLOQUEO = "package-lock.json";
const REGISTRO = "CHANGELOG.md";
const SIN_PUBLICAR = "## [Sin publicar]";
const FORMATO = /^(\d+)\.(\d+)\.(\d+)$/;

const leerJson = (f) => JSON.parse(readFileSync(f, "utf8"));
const escribirJson = (f, d) => writeFileSync(f, JSON.stringify(d, null, 2) + "\n");
const partes = (v) => { const m = FORMATO.exec(v ?? ""); if (!m) throw new Error(`«${v}» no es una versión X.Y.Z`); return m.slice(1).map(Number); };
const mayorQue = (a, b) => { const [x, y] = [partes(a), partes(b)]; for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };
const fallar = (texto) => { console.error(`✗ ${texto}`); process.exit(1); };
const hoy = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" }); // AAAA-MM-DD, hora de España

/** Las secciones del registro: { version, cuerpo } en el orden del archivo (la de «Sin publicar» con version null). */
function secciones(texto) {
  const res = [];
  for (const trozo of texto.split(/^(?=## \[)/m).slice(1)) {
    const titulo = /^## \[([^\]]+)\]/.exec(trozo)[1];
    res.push({ version: titulo === "Sin publicar" ? null : titulo, cuerpo: trozo.replace(/^.*\n/, "").trim() });
  }
  return res;
}

const [orden, arg] = process.argv.slice(2);

if (orden === "subir") {
  const paquete = leerJson(PAQUETE);
  const [a, b, c] = partes(paquete.version);
  const nueva = { parche: `${a}.${b}.${c + 1}`, menor: `${a}.${b + 1}.0`, mayor: `${a + 1}.0.0` }[arg];
  if (!nueva) fallar("indica parche, menor o mayor (docs/VERSIONES.md explica cuál toca)");
  const registro = readFileSync(REGISTRO, "utf8");
  if (!registro.includes(SIN_PUBLICAR)) fallar(`${REGISTRO} no tiene la sección «${SIN_PUBLICAR}»`);
  if (!secciones(registro).find((s) => s.version === null)?.cuerpo) fallar(`escribe primero en «${SIN_PUBLICAR}» qué cambia en esta versión`);
  writeFileSync(REGISTRO, registro.replace(SIN_PUBLICAR, `${SIN_PUBLICAR}\n\n## [${nueva}] — ${hoy()}`));
  paquete.version = nueva; escribirJson(PAQUETE, paquete);
  const bloqueo = leerJson(BLOQUEO); bloqueo.version = nueva; if (bloqueo.packages?.[""]) bloqueo.packages[""].version = nueva; escribirJson(BLOQUEO, bloqueo);
  console.log(`✓ Versión ${nueva}. Revisa ${REGISTRO} y súbelo junto con ${PAQUETE} y ${BLOQUEO}.`);
} else if (orden === "comprobar") {
  const version = leerJson(PAQUETE).version;
  partes(version);
  const bloqueo = leerJson(BLOQUEO);
  if (bloqueo.version !== version || (bloqueo.packages?.[""] && bloqueo.packages[""].version !== version)) fallar(`${BLOQUEO} no tiene la misma versión que ${PAQUETE} (${version}): usa node scripts/version.mjs subir`);
  const seccion = secciones(readFileSync(REGISTRO, "utf8")).find((s) => s.version === version);
  if (!seccion) fallar(`${REGISTRO} no tiene la sección «## [${version}]»`);
  if (!seccion.cuerpo) fallar(`la sección ${version} de ${REGISTRO} está vacía: di qué cambia`);
  if (arg && !mayorQue(version, arg)) fallar(`la versión ${version} no es mayor que la de la rama de destino (${arg}): todo PR que se fusiona sube la versión (node scripts/version.mjs subir parche|menor|mayor)`);
  console.log(`✓ Versión ${version}${arg ? ` (la rama de destino tiene ${arg})` : ""} con su entrada en ${REGISTRO}.`);
} else if (orden === "etiquetas") {
  const version = leerJson(PAQUETE).version;
  for (const s of secciones(readFileSync(REGISTRO, "utf8"))) {
    if (!s.version) continue;
    const fusion = /Fusión: `([0-9a-f]{7,40})`/.exec(s.cuerpo)?.[1];
    if (s.version === version) console.log(`v${s.version} HEAD`);
    else if (fusion) console.log(`v${s.version} ${fusion}`);
  }
} else {
  fallar("uso: node scripts/version.mjs subir <parche|menor|mayor> | comprobar [versión-base] | etiquetas");
}
