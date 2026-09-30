// Medición automática de accesibilidad (WCAG 2.2 AA) con axe-core sobre el navegador real.
// Recorre las pantallas públicas y las de usuario, moderador y organizador.
//   BASE_URL      servidor (por defecto http://localhost:3111)
//   MAIL_LOG      fichero con la salida del servidor (para leer los enlaces de verificación)
//   DATABASE_URL  para promover a un usuario a moderador
//   CHROMIUM_PATH ejecutable de Chromium (opcional)
// Sale con código 1 si hay incumplimientos de impacto «serious» o «critical».
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const B = process.env.BASE_URL ?? "http://localhost:3111";
const MAIL_LOG = process.env.MAIL_LOG ?? "/tmp/next.log";
const rnd = Date.now();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });

const link = (email) => {
  const log = readFileSync(MAIL_LOG, "utf8");
  return log.slice(log.lastIndexOf(`to=${email}`)).match(/https?:\/\/[^\s/]+(\/verificar\?token=\w+)/)[1];
};

async function newUser(name, role) {
  const email = `${name.toLowerCase()}${rnd}@test.es`;
  const p = await (await browser.newContext()).newPage();
  await p.goto(B + "/registro");
  await p.fill("[name=name]", name); await p.fill("[name=email]", email); await p.fill("[name=password]", "contraseña123");
  await p.selectOption("[name=role]", role);
  await p.click("main form button"); await p.waitForURL("**/verificar");
  await p.goto(B + link(email)); await p.click("main form button");
  await p.locator("text=Correo electrónico verificado").waitFor();
  return { p, email };
}

const problemas = [];
async function analizar(page, ruta, etiqueta) {
  await page.goto(B + ruta);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  for (const v of r.violations) problemas.push({ pantalla: etiqueta ?? ruta, regla: v.id, impacto: v.impact, ayuda: v.help, nodos: v.nodes.length, ejemplo: v.nodes[0]?.html?.slice(0, 140) });
  console.log(`${r.violations.length === 0 ? "OK  " : "FALLA"} ${etiqueta ?? ruta} (${r.violations.length} reglas incumplidas)`);
}

// Datos: un peleador con combate, una velada, un gimnasio y un entrenador para tener fichas que analizar
const pepe = await newUser("Accesible", "FIGHTER");
await pepe.p.goto(B + "/mi-ficha");
await pepe.p.fill("[name=firstName]", "Accesible"); await pepe.p.fill("[name=lastName]", `Prueba${rnd}`); await pepe.p.fill("[name=gym]", `Gimnasio Accesible ${rnd}`);
await pepe.p.click("main form button:has-text('Crear mi ficha')");
await pepe.p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
await pepe.p.fill("[name=eventName]", `Velada Accesible ${rnd}`); await pepe.p.fill("[name=date]", "2026-05-01");
await pepe.p.fill("[name=oppFirst]", "Rival"); await pepe.p.fill("[name=oppLast]", `Accesible${rnd}`);
await pepe.p.click("main form button:has-text('Registrar este combate')");
await pepe.p.locator(".notice-ok", { hasText: "Combate registrado" }).waitFor();

const anon = await (await browser.newContext()).newPage();
const primer = async (ruta, patron) => {
  await anon.goto(B + ruta);
  return anon.locator(`a[href^="${patron}"]`).first().getAttribute("href");
};
const fichaPeleador = `/peleadores/accesible-prueba${rnd}`;
const fichaVelada = await primer("/veladas?past=1", "/veladas/");
const fichaGimnasio = await primer("/gimnasios", "/gimnasios/");

console.log("— Pantallas públicas —");
for (const [ruta, etiqueta] of [
  ["/", "Portada"], ["/peleadores", "Peleadores"], [fichaPeleador, "Ficha de peleador"], ["/veladas", "Veladas"],
  ...(fichaVelada ? [[fichaVelada, "Ficha de velada"]] : []), ["/gimnasios", "Gimnasios"],
  ...(fichaGimnasio ? [[fichaGimnasio, "Ficha de gimnasio"]] : []), ["/entrenadores", "Entrenadores"], ["/ranking", "Ránking"],
  ["/ayuda", "Ayuda"], ["/buscar?q=accesible", "Búsqueda"], ["/registro", "Registro"], ["/entrar", "Entrar"],
  ["/verificar", "Verificar correo"], ["/organizador", "Organizadores (sin sesión)"], ["/pagina-que-no-existe", "Página no encontrada"],
]) await analizar(anon, ruta, etiqueta);

console.log("— Con sesión —");
for (const [ruta, etiqueta] of [["/mi-ficha", "Mi ficha"], ["/siguiendo", "Mis peleadores"], [fichaPeleador, "Ficha de peleador (con sesión)"]]) await analizar(pepe.p, ruta, etiqueta);

console.log("— Moderación y organizador —");
const admin = await newUser("Moderadora", "FAN");
execSync(`psql "${process.env.DATABASE_URL}" -c "update \\"User\\" set role='ADMIN' where email='${admin.email}'"`);
for (const [ruta, etiqueta] of [["/moderacion", "Moderación"], ["/moderacion/historial", "Historial de cambios"], ["/organizador", "Organizadores (moderador)"]]) await analizar(admin.p, ruta, etiqueta);

await browser.close();

const graves = problemas.filter((p) => p.impacto === "serious" || p.impacto === "critical");
const agrupado = new Map();
for (const p of problemas) {
  const k = `${p.regla} (${p.impacto})`;
  const cur = agrupado.get(k) ?? { ayuda: p.ayuda, pantallas: new Set(), nodos: 0, ejemplo: p.ejemplo };
  cur.pantallas.add(p.pantalla); cur.nodos += p.nodos; agrupado.set(k, cur);
}
console.log("\nRESUMEN de incumplimientos por regla:");
for (const [k, v] of agrupado) console.log(`- ${k}: ${v.ayuda}\n    ${v.nodos} elementos en ${[...v.pantallas].join(", ")}\n    ejemplo: ${v.ejemplo}`);
console.log(`\n${problemas.length} incumplimientos en total, ${graves.length} graves o críticos.`);
if (graves.length) process.exitCode = 1;
