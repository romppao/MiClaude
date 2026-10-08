/**
 * Catálogo de mantenimiento: combina responsabilidades escritas explícitamente con
 * archivos y huellas del checkout. Falla ante omisiones; nunca inventa una explicación.
 * No ejecuta código de aplicación ni necesita PostgreSQL o dependencias de npm.
 * Uso: node scripts/generar-catalogo.mjs [--comprobar]
 * Contrato y alcance: docs/mantenimiento/README.md.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MANIFEST = "docs/catalogo-codigo.json";
export const OUTPUT = "docs/mantenimiento/CATALOGO.md";
const ROOT_SPECIAL = new Set([".env.example", ".gitignore", "Dockerfile", "Makefile"]);
const ROOT_SOURCE = /\.(?:[cm]?[jt]sx?|json|ya?ml|toml|sh|sql|css|html|py|go|rs|rb|java)$/;
const ROOT_DIRS = ["src", "prisma", "scripts", "tests", ".github"];
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const portable = (p) => p.split(path.sep).join("/");
const cell = (s) => String(s).replaceAll("|", "\\|").replace(/\s+/g, " ");
const link = (p) => p.split("/").map(encodeURIComponent).join("/");

/** Lista fuentes mantenidas; no lee .env, dependencias, binarios de public ni exámenes. */
export function maintainedFiles(root) {
  function walk(relative) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) return [];
    return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((e) => {
      const next = portable(path.join(relative, e.name));
      if (e.isSymbolicLink()) throw new Error(`Fuente con enlace simbólico no admitido: ${next}`);
      return e.isDirectory() ? walk(next) : e.isFile() ? [next] : [];
    });
  }
  const rootFiles = fs.readdirSync(root, { withFileTypes: true }).filter((e) =>
    e.isFile() && (ROOT_SPECIAL.has(e.name) || (!/^\.env(?:\.|$)/.test(e.name) && ROOT_SOURCE.test(e.name))),
  ).map((e) => e.name);
  return [...rootFiles, ...ROOT_DIRS.flatMap(walk)].sort(compare);
}

function canonical(p) {
  return typeof p === "string" && p.length > 0 && !p.includes("\\") && !p.startsWith("/") && p.split("/").every((s) => s && s !== "." && s !== "..");
}

/** Contrasta entradas individuales y guías con archivos reales; devuelve todas las faltas. */
export function validateCatalog(root, entries) {
  const errors = [];
  if (!Array.isArray(entries)) return { errors: ["El catálogo debe ser una lista de entradas."], files: [] };
  const files = maintainedFiles(root);
  const actual = new Set(files), documented = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || !canonical(entry.path)) {
      errors.push("Entrada con ruta inválida en el catálogo.");
      continue;
    }
    if (documented.has(entry.path)) errors.push(`Entrada duplicada: ${entry.path}`);
    documented.add(entry.path);
    if (!actual.has(entry.path)) errors.push(`Archivo eliminado o fuera del alcance: ${entry.path}`);
    if (typeof entry.purpose !== "string" || !entry.purpose.trim()) errors.push(`Responsabilidad vacía: ${entry.path}`);
    if (!canonical(entry.guide) || !entry.guide.startsWith("docs/") || !entry.guide.endsWith(".md")) {
      errors.push(`Guía inválida: ${entry.path}`);
    } else if (!fs.existsSync(path.join(root, entry.guide)) || !fs.statSync(path.join(root, entry.guide)).isFile()) {
      errors.push(`Guía inexistente: ${entry.guide} (${entry.path})`);
    }
  }
  for (const file of files) if (!documented.has(file)) errors.push(`Sin documentar: ${file}`);
  return { errors, files };
}

function group(p) {
  if (p.startsWith("src/lib/")) return `Lógica: ${p.split("/")[2]}`;
  if (p.startsWith("src/app/actions/")) return "Acciones del servidor";
  if (p.startsWith("src/app/components/")) return "Componentes compartidos";
  if (p.startsWith("src/")) return "Pantallas, rutas e integración";
  if (p.startsWith("prisma/")) return "Base de datos y migraciones";
  if (p.startsWith("tests/unit/")) return "Pruebas unitarias";
  if (p.startsWith("tests/e2e/")) return "Pruebas de navegador";
  if (p.startsWith("tests/")) return "Pruebas de herramientas";
  if (p.startsWith("scripts/")) return "Scripts de mantenimiento";
  return "Configuración y automatización";
}

/** Índice léxico orientativo de declaraciones directas; no interpreta AST ni permisos. */
function declarations(text) {
  return [...text.matchAll(/^export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|type|interface)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
}

/** Salida determinista, sin fecha ni estado del entorno; cada huella refleja el archivo entero. */
export function renderCatalog(root, entries) {
  const { errors, files } = validateCatalog(root, entries);
  if (errors.length) throw new Error(errors.join("\n"));
  const byPath = new Map(entries.map((e) => [e.path, e]));
  const groups = new Map();
  for (const file of files) {
    const category = group(file);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(file);
  }
  const lines = ["# Catálogo del código", "", "> Generado con `node scripts/generar-catalogo.mjs`. Editar responsabilidades en `docs/catalogo-codigo.json`; no editar esta salida.", "", `Cobertura estructural: **${files.length} archivos mantenidos**, cada uno con responsabilidad y guía. La comprobación no certifica que la explicación sea suficiente; requiere revisión humana.`, "", "La huella SHA-256 abreviada permite detectar cambios del archivo; `--comprobar` compara toda la salida. Las declaraciones exportadas se extraen por patrón léxico, son orientativas y no incluyen todas las reexportaciones: consultar el código y el [mapa funcional](../MAPA-FUNCIONAL.md) para acciones, tablas y guardas.", "", "Alcance y exclusiones: [manual](README.md) y [operación](OPERACION.md).", ""];
  for (const [category, members] of [...groups].sort(([a], [b]) => compare(a, b))) {
    lines.push(`## ${category}`, "", "| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |", "|---|---|---|---|---|");
    for (const file of members) {
      const entry = byPath.get(file), bytes = fs.readFileSync(path.join(root, file));
      const names = declarations(bytes.toString("utf8"));
      lines.push(`| [${file}](${link(`../../${file}`)}) | ${cell(entry.purpose)} | [Contexto](${link(portable(path.relative(path.dirname(OUTPUT), entry.guide)))}) | ${names.length ? names.map((n) => `\`${n}\``).join(", ") : "—"} | \`${createHash("sha256").update(bytes).digest("hex").slice(0, 16)}\` |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

/** Escribe o verifica; comprobar jamás crea ni modifica la salida. */
export function run(root, check = false) {
  const entries = JSON.parse(fs.readFileSync(path.join(root, MANIFEST), "utf8"));
  const generated = renderCatalog(root, entries), output = path.join(root, OUTPUT);
  if (check) {
    if (!fs.existsSync(output) || fs.readFileSync(output, "utf8") !== generated) throw new Error("Catálogo desactualizado. Ejecuta node scripts/generar-catalogo.mjs y sube CATALOGO.md.");
  } else {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, generated);
  }
  return entries.length;
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  try {
    const flags = process.argv.slice(2);
    if (flags.some((f) => f !== "--comprobar")) throw new Error("Uso: node scripts/generar-catalogo.mjs [--comprobar]");
    const count = run(path.resolve(path.dirname(thisFile), ".."), flags.includes("--comprobar"));
    console.log(`Catálogo ${flags.includes("--comprobar") ? "comprobado" : "generado"}: ${count} archivos.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
