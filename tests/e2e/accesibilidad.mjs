// Medición automática de accesibilidad (WCAG 2.2 AA) con axe-core sobre el navegador real.
// Recorre las pantallas públicas y las de usuario, moderador y organizador. Requiere el servidor en marcha (ver ayudas.mjs).
// Sale con código 1 si hay incumplimientos de impacto «serious» o «critical».
import AxeBuilder from "@axe-core/playwright";
import { datosDeAlta, B, rnd, browser, btn, hoyMadrid, registrar, newUser, hacerAdmin, sql, terminarDiagnosticos } from "./ayudas.mjs";

const problemas = [];
async function analizar(page, ruta, etiqueta) {
  await page.goto(B + ruta);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  for (const v of r.violations) problemas.push({ pantalla: etiqueta ?? ruta, regla: v.id, impacto: v.impact, ayuda: v.help, nodos: v.nodes.length, ejemplo: v.nodes[0]?.html?.slice(0, 140) });
  console.log(`${r.violations.length === 0 ? "OK  " : "FALLA"} ${etiqueta ?? ruta} (${r.violations.length} reglas incumplidas)`);
}

// Datos: un peleador con un combate, una velada, un gimnasio y un organizador para tener fichas que analizar
const pepe = await newUser("Accesible", "FIGHTER");
await pepe.p.goto(B + "/mi-ficha");
await pepe.p.fill("[name=firstName]", "Accesible"); await pepe.p.fill("[name=lastName]", `Prueba${rnd}`); await pepe.p.fill("[name=gym]", `Gimnasio Accesible ${rnd}`);
await datosDeAlta(pepe.p); await btn(pepe.p, "Crear mi ficha");
await pepe.p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
await registrar(pepe.p, { evento: `Velada Accesible ${rnd}`, fecha: hoyMadrid, rivalNombre: "Rival", rivalApellidos: `Accesible${rnd}` });
await pepe.p.locator("[role=status]", { hasText: "Combate registrado" }).waitFor();

const anon = await (await browser.newContext()).newPage();
const primer = async (ruta, patron) => {
  await anon.goto(B + ruta);
  return anon.locator(`a[href^="${patron}"]`).first().getAttribute("href");
};
const fichaPeleador = `/peleadores/accesible-prueba${rnd}`;
const fichaVelada = await primer("/veladas?past=todas", "/veladas/");
const fichaGimnasio = await primer("/gimnasios", "/gimnasios/");
sql(`insert into "Trainer"(id, slug, name) values ('ent${rnd}', 'entrenador-accesible-${rnd}', 'Entrenador Accesible ${rnd}');`); // los entrenadores no se crean desde la web
const fichaEntrenador = `/entrenadores/entrenador-accesible-${rnd}`;

console.log("— Pantallas públicas —");
for (const [ruta, etiqueta] of [
  ["/", "Portada"], ["/peleadores", "Peleadores"], ["/peleadores?level=AMATEUR&pagina=2", "Peleadores (página 2)"], [fichaPeleador, "Ficha de peleador"], ["/veladas", "Veladas"],
  ...(fichaVelada ? [[fichaVelada, "Ficha de velada"]] : []), ["/gimnasios", "Gimnasios"],
  ...(fichaGimnasio ? [[fichaGimnasio, "Ficha de gimnasio"]] : []), ["/entrenadores", "Entrenadores"], [fichaEntrenador, "Ficha de entrenador"],
  ["/ranking", "Ránking"], ["/ayuda", "Ayuda"], ["/buscar", "Búsqueda (vacía)"], ["/buscar?q=accesible", "Búsqueda (con resultados)"], ["/buscar?q=zzzzqq", "Búsqueda (sin resultados)"],
  ["/registro", "Registro"], ["/entrar", "Entrar"], ["/recuperar", "Recuperar contraseña"], ["/recuperar/nueva?token=x", "Enlace de recuperación caducado"],
  ["/verificar", "Verificar correo (sin sesión)"], ["/baja", "Baja de avisos"], ["/privacidad", "Privacidad"], ["/organizador", "Organizadores (sin sesión)"],
  ["/pagina-que-no-existe", "Página no encontrada"],
]) await analizar(anon, ruta, etiqueta);

console.log("— Con sesión —");
for (const [ruta, etiqueta] of [
  ["/mi-ficha", "Mi ficha"], ["/mi-ficha/trayectoria", "Mi trayectoria"], ["/mi-cuenta", "Mi cuenta"], ["/mi-cuenta/eliminar", "Eliminar mi cuenta"], ["/siguiendo", "Peleadores que sigo"], [fichaPeleador, "Ficha de peleador (con sesión)"],
]) await analizar(pepe.p, ruta, etiqueta);
const sinFicha = await newUser("Sinficha", "FIGHTER");
await analizar(sinFicha.p, "/mi-ficha", "Mi ficha (sin crear todavía)");
const sinVerificar = await newUser("Sinverificar", "FAN", false);
await analizar(sinVerificar.p, "/verificar", "Verificar correo (con sesión)");

console.log("— Moderación y organizador —");
const admin = await newUser("Moderadora", "FAN"); hacerAdmin(admin.email);
for (const [ruta, etiqueta] of [["/respaldar", "Respaldar hechos"], ["/moderacion/acreditaciones", "Acreditaciones"], ["/moderacion", "Moderación"], ["/moderacion/historial", "Historial de cambios"], ["/organizador", "Organizadores (moderador)"]]) await analizar(admin.p, ruta, etiqueta);

await terminarDiagnosticos();
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
