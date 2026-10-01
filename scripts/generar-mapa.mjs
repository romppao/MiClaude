// Genera docs/MAPA-FUNCIONAL.md a partir del código: qué pantallas hay, qué acción lanza cada una, quién puede ejecutarla,
// en qué tablas escribe y qué avisos da. Así el mapa nunca se queda desfasado: lo comprueba el CI.
//
//   npm run mapa                      escribe docs/MAPA-FUNCIONAL.md
//   node scripts/generar-mapa.mjs --comprobar    falla si el fichero sube desfasado (lo usa el CI)
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = path.join(RAIZ, "docs/MAPA-FUNCIONAL.md");
// Orden por código de carácter (no por idioma): el resultado es idéntico en cualquier ordenador.
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const rel = (p) => path.relative(RAIZ, p).split(path.sep).join("/");
const leer = (p) => fs.readFileSync(p, "utf8");
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : []));
const parse = (f) => ts.createSourceFile(f, leer(f), ts.ScriptTarget.Latest, true, f.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

// ---------- modelo de datos ----------
const esquema = leer(path.join(RAIZ, "prisma/schema.prisma"));
const MODELOS = [...esquema.matchAll(/^model (\w+) \{/gm)].map((m) => m[1]);
const modeloDe = new Map(MODELOS.map((m) => [m[0].toLowerCase() + m.slice(1), m]));
const ESCRITURAS = new Set(["create", "createMany", "update", "updateMany", "upsert", "delete", "deleteMany"]);

// ---------- índice de funciones de todo el código (lib + acciones) ----------
const ficherosCodigo = [...walk(path.join(RAIZ, "src/lib")), ...walk(path.join(RAIZ, "src/app/actions"))].sort(cmp);
const indice = new Map(); // nombre -> { archivo, nodo }
for (const f of ficherosCodigo) {
  for (const st of parse(f).statements) {
    if (ts.isFunctionDeclaration(st) && st.name) indice.set(st.name.text, { archivo: rel(f), nodo: st });
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) indice.set(d.name.text, { archivo: rel(f), nodo: d.initializer });
  }
}

/** Lo que hace una función, siguiendo las llamadas a otras funciones del proyecto. */
function analizar(nombre) {
  const r = { guardas: new Set(), escribe: new Set(), auditoria: new Set(), correo: false, avisos: new Set() };
  const vistos = new Set();
  const visitarFn = (n, esPropia) => {
    if (vistos.has(n)) return; vistos.add(n);
    const e = indice.get(n); if (!e) return;
    const v = (x) => {
      if (ts.isCallExpression(x)) {
        const c = x.expression;
        if (ts.isIdentifier(c)) {
          if (["requireUser", "requireVerifiedUser", "requireAdmin", "requireOrganizer"].includes(c.text)) r.guardas.add(c.text);
          if (["sendMail", "sendVerificationEmail", "sendPasswordResetEmail", "notifyDecision", "notifyFollowersOfBout"].includes(c.text)) r.correo = true;
          if (c.text === "audit" && x.arguments[0] && ts.isObjectLiteralExpression(x.arguments[0])) {
            const props = Object.fromEntries(x.arguments[0].properties.filter(ts.isPropertyAssignment).map((p) => [p.name.getText(), ts.isStringLiteralLike(p.initializer) ? p.initializer.text : null]));
            if (props.entity) r.auditoria.add(`${props.entity}: ${props.action ?? "(varias)"}`);
          }
          if (indice.has(c.text) && !NO_SEGUIR.has(c.text)) visitarFn(c.text, false);
        }
        // <algo>.<modelo>.<operación>(…)
        if (ts.isPropertyAccessExpression(c) && ESCRITURAS.has(c.name.text) && ts.isPropertyAccessExpression(c.expression) && modeloDe.has(c.expression.name.text)) r.escribe.add(modeloDe.get(c.expression.name.text));
      }
      if (esPropia && ts.isPropertyAssignment(x) && x.name.getText() === "aviso" && ts.isStringLiteralLike(x.initializer)) r.avisos.add(x.initializer.text);
      ts.forEachChild(x, v);
    };
    v(e.nodo);
  };
  visitarFn(nombre, true);
  return r;
}
// Tareas de mantenimiento que se disparan desde las acciones pero no son su propósito: no se siguen (ensuciarían el mapa).
const NO_SEGUIR = new Set(["maybePurge", "notifyFollowersOfBout", "notifyDecision"]);
const QUIEN = [["requireAdmin", "Moderación"], ["requireOrganizer", "Organizador (o moderación) con correo verificado"], ["requireVerifiedUser", "Cuenta con correo verificado"], ["requireUser", "Cuenta con sesión iniciada"]];
const quien = (g) => QUIEN.find(([k]) => g.has(k))?.[1] ?? "Cualquiera";
const lista = (s) => (s.size ? [...s].sort(cmp).join(", ") : "—");

// ---------- acciones ----------
const archivosAcciones = walk(path.join(RAIZ, "src/app/actions")).filter((f) => !f.endsWith("shared.ts")).sort(cmp);
const acciones = []; // { modulo, nombre, ...analisis }
for (const f of archivosAcciones) {
  const modulo = path.basename(f, ".ts");
  for (const st of parse(f).statements) {
    if (ts.isFunctionDeclaration(st) && st.name && st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) acciones.push({ modulo, nombre: st.name.text, ...analizar(st.name.text) });
  }
}

// ---------- pantallas ----------
const rutaDe = (f) => {
  const partes = rel(f).replace(/^src\/app\/?/, "").replace(/\/?(page\.tsx|route\.ts)$/, "").split("/").filter(Boolean).map((p) => (p.startsWith("[") ? ":" + p.slice(1, -1) : p));
  return "/" + partes.join("/");
};
const pantallas = walk(path.join(RAIZ, "src/app")).filter((f) => /\/(page\.tsx|route\.ts)$/.test(f)).map((f) => {
  const texto = leer(f);
  const sf = parse(f);
  const usa = []; // acciones importadas
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && /\/actions\/\w+$/.test(st.moduleSpecifier.text) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
      const modulo = st.moduleSpecifier.text.split("/").pop();
      for (const e of st.importClause.namedBindings.elements) usa.push(`${modulo}.${(e.propertyName ?? e.name).text}`);
    }
  }
  const lee = new Set([...texto.matchAll(/\bdb\.(\w+)\.(?:findMany|findUnique|findFirst|count|groupBy|aggregate)/g)].map((m) => modeloDe.get(m[1])).filter(Boolean));
  // Heurística sobre el texto de la pantalla (las acciones, en cambio, se analizan siguiendo las llamadas).
  let acceso = "Pública";
  if (/sin_permiso/.test(texto) && /\/entrar/.test(texto)) acceso = "Organizador de esa velada o moderación";
  else if (/role !== "ADMIN"\)\s*redirect|solo_moderadores/.test(texto)) acceso = "Moderación";
  else if (/requireVerifiedUser|redirect\("\/verificar"/.test(texto)) acceso = "Cuenta con correo verificado";
  else if (/requireUser\(|if \(!user\)[^\n]*redirect/.test(texto)) acceso = "Cuenta con sesión iniciada";
  else if (/\bgetUser\(/.test(texto)) acceso = "Pública (cambia lo que ve según la cuenta)";
  const h1 = texto.match(/<h1[^>]*>([^<{]+)/)?.[1]?.trim();
  const comentario = texto.match(/\/\*\*\s*([^*]+?)\s*\*\//)?.[1]?.replace(/\s+/g, " ");
  const titulo = h1 ?? (f.endsWith("route.ts") ? comentario : null) ?? (f.includes("[") ? "(ficha individual: el título depende del elemento)" : "(respuesta técnica, sin pantalla)");
  return { ruta: rutaDe(f), archivo: rel(f), titulo, acceso, usa: usa.sort(cmp), lee: [...lee].sort(cmp) };
}).sort((a, b) => cmp(a.ruta, b.ruta));

// ---------- lógica compartida ----------
const DOMINIOS = fs.readdirSync(path.join(RAIZ, "src/lib"), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort(cmp);
const exportaciones = (f) => {
  const nombres = [];
  for (const st of parse(f).statements) {
    if (!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (ts.isVariableStatement(st)) nombres.push(...st.declarationList.declarations.map((d) => d.name.getText()));
    else if ("name" in st && st.name) nombres.push(st.name.text);
  }
  return nombres.sort((a, b) => cmp(a, b));
};

// ---------- salida ----------
const celda = (s) => String(s).replace(/\|/g, "\\|");
const L = [];
L.push("# Mapa funcional");
L.push("");
L.push("> **Generado automáticamente por `npm run mapa` a partir del código. No se edita a mano:** el CI falla si no está al día.");
L.push("> Sirve para responder a «¿dónde se hace X?»: qué pantalla lanza qué acción, quién puede ejecutarla y en qué tablas escribe.");
L.push("> Para las recetas («cómo añado una acción nueva…») y las reglas de organización, ver [`DESARROLLO.md`](DESARROLLO.md).");
L.push("");
L.push("## Pantallas y direcciones");
L.push("");
L.push("| Dirección | Qué es | Quién puede entrar | Acciones que lanza | Lee de |");
L.push("|---|---|---|---|---|");
for (const p of pantallas) L.push(`| \`${p.ruta}\` | ${celda(p.titulo)} | ${p.acceso} | ${p.usa.length ? p.usa.map((u) => `\`${u}\``).join(", ") : "—"} | ${p.lee.join(", ") || "—"} |`);
L.push("");
L.push("«Quién puede entrar» se deduce del código de cada pantalla; las acciones comprueban sus permisos por su cuenta (siguiente tabla), nunca se fían de que la pantalla los haya comprobado.");
L.push("");
L.push("## Acciones del servidor");
L.push("");
L.push("Cada acción es un punto de entrada público del servidor (`src/app/actions/<módulo>.ts`). Lo que sigue sale de seguir las llamadas del código.");
const porModulo = new Map();
for (const a of acciones) porModulo.set(a.modulo, [...(porModulo.get(a.modulo) ?? []), a]);
for (const [modulo, lst] of [...porModulo].sort(([a], [b]) => cmp(a, b))) {
  L.push("");
  L.push(`### \`${modulo}\``);
  L.push("");
  L.push("| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |");
  L.push("|---|---|---|---|---|---|");
  for (const a of lst.sort((x, y) => cmp(x.nombre, y.nombre))) L.push(`| \`${a.nombre}\` | ${quien(a.guardas)} | ${lista(a.escribe)} | ${lista(a.auditoria)} | ${a.correo ? "Sí" : "—"} | ${lista(a.avisos)} |`);
}
L.push("");
L.push("## Tablas y quién escribe en ellas");
L.push("");
L.push("| Tabla | Acciones que escriben |");
L.push("|---|---|");
for (const m of MODELOS) {
  const quienes = acciones.filter((a) => a.escribe.has(m)).map((a) => `\`${a.modulo}.${a.nombre}\``);
  L.push(`| ${m} | ${quienes.length ? quienes.join(", ") : "ninguna acción (solo la retención, la semilla o la baja de cuenta)"} |`);
}
L.push("");
L.push("## Lógica compartida (`src/lib`)");
L.push("");
L.push("Sin interfaz y sin saber nada de las pantallas. Las dependencias permitidas entre dominios las vigila `tests/unit/arquitectura.test.ts`.");
for (const d of DOMINIOS) {
  L.push("");
  L.push(`### \`lib/${d}\``);
  L.push("");
  L.push("| Fichero | Exporta |");
  L.push("|---|---|");
  for (const f of walk(path.join(RAIZ, "src/lib", d)).sort(cmp)) L.push(`| \`${path.basename(f)}\` | ${exportaciones(f).map((n) => `\`${n}\``).join(", ") || "—"} |`);
}
L.push("");
const texto = L.join("\n");

if (process.argv.includes("--comprobar")) {
  const actual = fs.existsSync(SALIDA) ? leer(SALIDA) : "";
  if (actual !== texto) { console.error("docs/MAPA-FUNCIONAL.md está desfasado. Ejecuta «npm run mapa» y sube el resultado."); process.exit(1); }
  console.log("docs/MAPA-FUNCIONAL.md está al día.");
} else {
  fs.writeFileSync(SALIDA, texto);
  console.log(`docs/MAPA-FUNCIONAL.md escrito: ${pantallas.length} pantallas, ${acciones.length} acciones, ${MODELOS.length} tablas.`);
}
