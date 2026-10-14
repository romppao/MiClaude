// Estado vivo del trabajo en equipo (petición del fundador, 14 de octubre de 2026): que Claude (nube y portátil), Codex y los demás
// sepan, sin que nadie lo repita, qué hay hecho, qué está en marcha y dónde se pisarían. Complementa a docs/ESTADO.md.
// Sin dependencias; solo necesita Git (y, si está, la CLI `gh` para ver los PR). Funciona igual en Windows, macOS y Linux.
//
//   node scripts/estado.mjs                           resumen en directo (ejecuta antes `git fetch`, salvo --sin-fetch)
//   node scripts/estado.mjs --sin-fetch --dias=30     sin tocar la red; ramas de los últimos 30 días (3 por defecto)
//   node scripts/estado.mjs reservar <asistente> <tema...> [--simular]
//        reserva un trabajo: crea la rama «<asistente>/<tema>-<fecha>» desde la demo con un commit vacío y la sube. No lanza el CI
//        (solo se ejecuta en PR y en la rama de la demo), así que reservar es gratis y las demás sesiones la ven en este resumen.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const RAMA_DEMO = "claude/ring-espana-mvp";

/** Ficheros que casi todos los PR tocan (registros, versión, catálogos): coincidir en ellos no es un solape de trabajo. */
const REGISTROS = new Set([
  "CHANGELOG.md", "package.json", "package-lock.json", "docs/DIARIO.md", "docs/LECCIONES.md", "docs/IDEAS.md", "docs/ESTADO.md",
  "docs/MAPA-FUNCIONAL.md", "docs/catalogo-codigo.json", "docs/mantenimiento/CATALOGO.md", "docs/APORTACIONES-CLAUDE.md", "docs/APORTACIONES-CODEX.md",
]);
export const esRegistro = (f) => REGISTROS.has(f) || f.startsWith("docs/ecosistema/traspasos/");

/**
 * Ficheros que tocan dos o más ramas. Las ramas apiladas (una contiene a la otra: un PR sobre otro) no cuentan entre sí, porque
 * comparten ficheros por construcción. `ramas`: [{ nombre, ficheros: string[], ancestros: Set<string> }]. Devuelve los solapes
 * de trabajo y, aparte, los de ficheros de registro.
 */
export function solapes(ramas) {
  const por = new Map();
  for (const r of ramas) for (const f of r.ficheros) { if (!por.has(f)) por.set(f, []); por.get(f).push(r); }
  const reales = [], registros = [];
  for (const [fichero, rs] of [...por].sort(([a], [b]) => a.localeCompare(b))) {
    // Hay solape si alguna pareja de ramas que tocan el fichero NO es de ramas apiladas.
    const implicadas = new Set();
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      if (!(rs[i].ancestros.has(rs[j].nombre) || rs[j].ancestros.has(rs[i].nombre))) { implicadas.add(rs[i]); implicadas.add(rs[j]); }
    }
    if (!implicadas.size) continue;
    const independientes = rs.filter((r) => implicadas.has(r));
    (esRegistro(fichero) ? registros : reales).push({ fichero, ramas: independientes.map((r) => r.nombre) });
  }
  return { reales, registros };
}

export const diasDesde = (segundos, ahora = Date.now()) => Math.floor((ahora - segundos * 1000) / 864e5);
export const nombreDeRama = (asistente, tema, fecha = new Date()) => {
  const slug = tema.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "trabajo";
  return `${asistente.toLowerCase().replace(/[^a-z0-9-]+/g, "")}/${slug}-${fecha.toISOString().slice(0, 10).replaceAll("-", "")}`;
};

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const gitSuave = (...args) => { try { return git(...args); } catch { return ""; } };
const esAncestro = (a, b) => { try { git("merge-base", "--is-ancestor", a, b); return true; } catch { return false; } }; // sale con 1 si no lo es
const fecha = (u) => new Date(u * 1000).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", timeZone: "Europe/Madrid" });
const hora = (u) => new Date(u * 1000).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
const versionDe = (texto) => { try { return JSON.parse(texto).version; } catch { return "?"; } };

function reservar(argumentos) {
  const simular = argumentos.includes("--simular");
  const [asistente, ...resto] = argumentos.filter((a) => a !== "--simular");
  const tema = resto.join(" ").trim();
  if (!asistente || !tema) { console.error("Uso: node scripts/estado.mjs reservar <asistente> <tema...> [--simular]"); process.exit(1); }
  const rama = nombreDeRama(asistente, tema);
  console.log(`Reserva «${tema}» en la rama ${rama} (desde origin/${RAMA_DEMO}).`);
  if (simular) { console.log("(simulación: no se ha cambiado nada)"); return; }
  git("fetch", "--prune", "--quiet", "origin");
  git("switch", "-c", rama, `origin/${RAMA_DEMO}`);
  git("commit", "--allow-empty", "-m", `Reserva: ${tema}\n\nTrabajo reservado para no solaparse con otras sesiones (docs/ESTADO.md).`);
  git("push", "-u", "origin", rama);
  console.log("✓ Reservado y subido. Trabaja en esta rama; al terminar, abre el PR y actualiza docs/ESTADO.md.");
}

function resumen(argumentos) {
  const dias = Number(argumentos.find((a) => a.startsWith("--dias="))?.slice(7)) || 3;
  const todas = argumentos.includes("--todas");
  if (!argumentos.includes("--sin-fetch")) {
    try { git("fetch", "--prune", "--quiet", "origin"); } catch { console.log("⚠ No se ha podido consultar GitHub (¿sin conexión?): se muestra lo último descargado.\n"); }
  }
  const demo = `origin/${RAMA_DEMO}`;
  if (!gitSuave("rev-parse", "--verify", demo)) { console.error(`No encuentro ${demo}. Ejecuta «git fetch origin» primero.`); process.exit(1); }
  const ahora = Date.now();

  const verDemo = versionDe(gitSuave("show", `${demo}:package.json`));
  const etiqueta = gitSuave("tag", "--list", "v*", "--sort=-v:refname").split("\n")[0] || "(sin etiquetas descargadas)";
  console.log(`DEMO (${RAMA_DEMO}): versión ${verDemo} · última etiqueta ${etiqueta}`);
  const actual = gitSuave("branch", "--show-current") || "(sin rama)";
  const detras = Number(gitSuave("rev-list", "--count", `HEAD..${demo}`)) || 0;
  const verLocal = (() => { try { return versionDe(readFileSync("package.json", "utf8")); } catch { return "?"; } })();
  console.log(`TU COPIA: rama ${actual}, versión ${verLocal}${detras ? ` · ${detras} cambio(s) de la demo que aún no tienes (git pull / rebase)` : " · al día con la demo"}`);

  const ultimo = Number(gitSuave("log", "-1", "--format=%ct", demo, "--", "docs/ESTADO.md")) || 0;
  console.log(`docs/ESTADO.md: ${ultimo ? `actualizado ${fecha(ultimo)} (hace ${diasDesde(ultimo, ahora)} día(s))${diasDesde(ultimo, ahora) > 3 ? " ⚠ desconfía: puede estar anticuado" : ""}` : "⚠ no existe en la demo"}\n`);

  console.log("ÚLTIMAS FUSIONES EN LA DEMO");
  for (const l of gitSuave("log", demo, "--first-parent", "--merges", "-n", "6", "--format=%ct|%s").split("\n").filter(Boolean)) {
    const [u, ...s] = l.split("|");
    console.log(`  ${fecha(Number(u))} ${hora(Number(u))}  ${s.join("|").replace(/^Merge pull request #(\d+) from \S+/, "PR #$1")}`);
  }

  // Ramas con commits que la demo aún no tiene.
  // PR por la API REST (`gh pr list` usa GraphQL, bloqueado en las sesiones de la nube). Sin `gh`, se sigue sin esta parte.
  const prs = (() => {
    try { return JSON.parse(execFileSync("gh", ["api", "repos/{owner}/{repo}/pulls?state=all&per_page=60&sort=updated&direction=desc"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); } catch { return null; }
  })();
  const prDe = (nombre) => prs?.find((p) => p.head?.ref === nombre);
  const filas = gitSuave("for-each-ref", "--format=%(refname:short)|%(committerdate:unix)|%(subject)", "refs/remotes/origin").split("\n").filter(Boolean)
    .map((l) => { const [ref, u, ...s] = l.split("|"); return { ref, nombre: ref.replace(/^origin\//, ""), u: Number(u), asunto: s.join("|") }; })
    .filter((r) => r.nombre !== "HEAD" && r.nombre !== RAMA_DEMO && !r.nombre.startsWith("dependabot/") && r.ref !== "origin");
  const conTrabajo = filas.map((r) => ({ ...r, delante: Number(gitSuave("rev-list", "--count", `${demo}..${r.ref}`)) || 0 })).filter((r) => r.delante > 0);
  const activas = conTrabajo.filter((r) => todas || (diasDesde(r.u, ahora) <= dias && prDe(r.nombre)?.state !== "closed")).sort((a, b) => b.u - a.u);
  const viejas = conTrabajo.filter((r) => !activas.includes(r));
  console.log(`\nTRABAJO EN CURSO (ramas con commits aún sin fusionar, últimos ${dias} días)`);
  if (!activas.length) console.log("  (ninguno)");
  for (const r of activas) {
    const pr = prDe(r.nombre);
    console.log(`  ${r.nombre}\n      ${fecha(r.u)} ${hora(r.u)} · +${r.delante} commit(s) · «${r.asunto.slice(0, 80)}»${pr ? ` · PR #${pr.number}${pr.draft ? " (borrador)" : ""}` : ""}`);
  }
  if (prs === null) console.log("  (sin la CLI «gh»: no se muestran los PR abiertos; mira la pestaña Pull requests de GitHub)");
  if (viejas.length) console.log(`  + ${viejas.length} rama(s) más con commits sin fusionar, sin actividad en ${dias} días o con su PR ya cerrado (trabajo descartado u olvidado): --todas las lista`);

  // Solapes entre ramas activas.
  const ramas = activas.map((r) => ({
    nombre: r.nombre,
    ficheros: gitSuave("diff", "--name-only", `${demo}...${r.ref}`).split("\n").filter(Boolean),
    ancestros: new Set(),
  }));
  for (const a of ramas) for (const b of ramas) if (a !== b && esAncestro(`origin/${b.nombre}`, `origin/${a.nombre}`)) a.ancestros.add(b.nombre);
  const { reales, registros } = solapes(ramas);
  console.log("\nSOLAPES ENTRE RAMAS (mismo fichero tocado por trabajos independientes)");
  if (!reales.length) console.log("  (ninguno)");
  for (const s of reales) console.log(`  ⚠ ${s.fichero}  ←  ${s.ramas.join(", ")}`);
  if (registros.length) console.log(`  (además coinciden en ${registros.length} fichero(s) de registro: ${registros.map((s) => s.fichero).slice(0, 4).join(", ")}${registros.length > 4 ? "…" : ""}; se resuelve al fusionar)`);
  console.log("\nSiguiente paso: lee docs/ESTADO.md. Si vas a empezar algo grande: node scripts/estado.mjs reservar <asistente> \"<tema>\"");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [orden, ...resto] = process.argv.slice(2);
  if (orden === "reservar") reservar(resto);
  else resumen(orden ? [orden, ...resto] : resto);
}
