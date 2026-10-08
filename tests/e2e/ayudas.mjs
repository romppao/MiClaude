// Ayudas comunes de las pruebas de extremo a extremo (navegador real contra el servidor en marcha).
//   BASE_URL      servidor (por defecto http://localhost:3111)
//   MAIL_LOG      fichero donde el servidor escribe su salida (los enlaces de verificación salen en el log de correo)
//   DATABASE_URL  para promover a un usuario a ADMIN (única acción que no se puede hacer desde la web)
//   CHROMIUM_PATH ejecutable de Chromium (opcional)
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

export const B = process.env.BASE_URL ?? "http://localhost:3111";
export const rnd = Date.now();
export const MAIL_LOG = process.env.MAIL_LOG ?? "/tmp/next.log";
export const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });

// Diagnóstico al fallar: se guardan una captura y el HTML de todas las pantallas abiertas en test-results/ (el CI las sube como artefacto).
const contextos = [];
const crearContexto = browser.newContext.bind(browser);
browser.newContext = async (...args) => { const c = await crearContexto(...args); contextos.push(c); return c; };
const pendientes = [];
const ficheroSeguro = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 60);
async function volcarDiagnostico(motivo) {
  try {
    mkdirSync("test-results", { recursive: true });
    let n = 0;
    for (const c of contextos) for (const p of c.pages()) {
      const base = `test-results/${rnd}-${ficheroSeguro(motivo)}-${n++}`;
      await p.screenshot({ path: `${base}.png`, fullPage: true, timeout: 5000 }).catch(() => {});
      writeFileSync(`${base}.html`, `<!-- ${p.url()} -->\n` + (await p.content().catch(() => "")));
    }
  } catch { /* el diagnóstico nunca debe tapar el fallo real */ }
}
process.on("uncaughtException", async (error) => { console.error(error); await volcarDiagnostico("excepcion"); process.exit(1); });

// Pestañas que se deslizan (src/app/components/Pestanas.tsx): lo que está en una pestaña cerrada no se ve ni se puede pulsar, igual que
// para una persona. Antes de pulsar, escribir o elegir algo, las pruebas abren con su botón la pestaña que lo contiene (`mostrar`).
// Se hace aquí, una sola vez, para todos los guiones.
{
  const pagina = await (await crearContexto()).newPage();
  const Locator = Object.getPrototypeOf(pagina.locator("body"));
  const Page = Object.getPrototypeOf(pagina);
  await pagina.context().close();
  for (const m of ["click", "dblclick", "fill", "check", "uncheck", "selectOption", "setInputFiles", "press", "pressSequentially", "hover", "tap"]) {
    const original = Locator[m];
    if (original) Locator[m] = async function (...args) { await mostrar(this, true); return original.apply(this, args); };
    const deLaPagina = Page[m];
    if (deLaPagina && m !== "pressSequentially") Page[m] = async function (selector, ...args) { if (typeof selector === "string") await mostrar(this.locator(selector), true); return deLaPagina.call(this, selector, ...args); };
  }
}

/** Espera a que algo sea visible; devuelve true/false en vez de lanzar error. */
export const seen = (locator, timeout = 8000) => locator.waitFor({ timeout }).then(() => true, () => false);
export const check = (label, cond) => {
  console.log(cond ? "OK  " : "FAIL", label);
  if (!cond) { process.exitCode = 1; pendientes.push(volcarDiagnostico(label)); }
};
/** Espera a que terminen de guardarse los diagnósticos pendientes (llamar antes de cerrar el navegador). */
export const terminarDiagnosticos = () => Promise.all(pendientes);
export const btn = (p, t) => p.click(`main button:has-text("${t}")`);
/** Elige explícitamente los datos ficticios de las altas antiguas; la aplicación ya no presupone Madrid ni boxeo. */
export async function datosDeAlta(p) {
  const form = p.locator("main form").filter({ has: p.getByRole("button", { name: /^(Crear mi ficha|Crear el evento)$/ }) });
  for (const [name, value] of [["discipline", "BOXEO"], ["province", "Madrid"]]) {
    const campo = form.locator(`select[name=${name}]`);
    if (!(await campo.inputValue())) await campo.selectOption(value);
  }
  const ciudad = form.locator("input[name=city]");
  if (!(await ciudad.inputValue())) await ciudad.fill("Madrid");
}

export const hoyMadrid = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
export const enDias = (n) => new Date(Date.now() + n * 864e5).toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });

/** Rellena y envía el formulario «Registrar un combate» con un resultado (por defecto, victoria por decisión unánime). */
/** «Mi ficha» va en pestañas que se deslizan (components/Pestanas.tsx): abre la indicada, como lo haría una persona. */
export async function pestanaDeMiFicha(p, nombre) {
  const enlace = p.getByRole("navigation", { name: "Secciones de mi ficha" }).getByRole("link", { name: nombre, exact: true });
  if (!(await enlace.count())) return;
  if ((await enlace.getAttribute("aria-current")) !== "true") await enlace.click();
  // Espera a que el deslizamiento suave termine justo en la sección pedida.
  await p.waitForFunction((n) => {
    const barra = document.querySelector('nav[aria-label="Secciones de mi ficha"]');
    const pista = barra?.parentElement?.querySelector(".pestanas-pista");
    const i = [...(barra?.querySelectorAll("a") ?? [])].findIndex((a) => a.textContent === n);
    const panel = pista?.querySelectorAll(".pestanas-panel")[i];
    return panel && barra.querySelector("a[aria-current]")?.textContent === n && Math.abs(panel.getBoundingClientRect().left - pista.getBoundingClientRect().left) < 2;
  }, nombre);
}

/** Si `loc` está dentro de una pestaña cerrada (components/Pestanas.tsx), la abre con su botón, como una persona, y espera a verla. */
export async function mostrar(loc, silencioso = false) {
  const p = loc.page();
  // Si todavía no existe (por ejemplo, llega tras una navegación), se deja que la acción original espere como siempre.
  if (!(await loc.first().waitFor({ state: "attached", timeout: silencioso ? 3000 : 30000 }).then(() => true, () => false))) return loc;
  const id = await loc.first().evaluate((el) => el.closest(".pestanas-panel")?.id ?? "").catch(() => "");
  if (!id) return loc;
  const enlace = p.locator(`.pestanas-barra a[href="#${id}"]`);
  if ((await enlace.getAttribute("aria-current")) === "true") return loc;
  await enlace.click();
  await p.waitForFunction((i) => { const panel = document.getElementById(i); const pista = panel?.closest(".pestanas-pista"); return panel && Math.abs(panel.getBoundingClientRect().left - pista.getBoundingClientRect().left) < 2; }, id);
  return loc;
}

export const registrar = async (p, o) => {
  await pestanaDeMiFicha(p, "Combates");
  // Disciplina, resultado, método y evidencia también existen en otros formularios de la ficha.
  const form = p.locator("main form").filter({ has: p.getByRole("button", { name: "Registrar este combate", exact: true }) });
  await form.locator("[name=eventName]").fill(o.evento); await form.locator("[name=date]").fill(o.fecha);
  await form.locator("[name=oppFirst]").fill(o.rivalNombre); await form.locator("[name=oppLast]").fill(o.rivalApellidos);
  // Una ficha provisional no tiene procedencia: el guion debe elegirla, igual que la persona.
  if (!(await form.locator("select[name=province]").inputValue())) await form.locator("select[name=province]").selectOption(o.provincia ?? "Madrid");
  if (o.disciplina) await form.locator("select[name=discipline]").selectOption(o.disciplina);
  if (o.resultado === null) { await form.locator("select[name=outcome]").selectOption(""); await form.locator("select[name=method]").selectOption(""); } // tras un error el formulario conserva lo elegido: «sin resultado» se elige de forma explícita
  if (o.resultado !== null) { await form.locator("select[name=outcome]").selectOption(o.resultado ?? "WIN"); if (o.metodo !== null) await form.locator("select[name=method]").selectOption(o.metodo ?? "UD"); }
  if (o.peso) await form.locator("select[name=weightClass]").selectOption(o.peso);
  // Tras un error el formulario conserva lo escrito: el enlace se fija siempre de forma explícita (vacío si no se pide) para no heredar el de un intento anterior.
  // El enlace de respaldo está en «Más datos del combate (opcional)»: se abre como lo haría una persona.
  const mas = form.locator("details.opcionales"); if (!(await mas.evaluate((d) => d.open))) await mas.locator("summary").click();
  await form.locator("[name=evidenceUrl]").fill(o.evidencia ?? "");
  const guardar = form.getByRole("button", { name: "Registrar este combate", exact: true });
  if (o.dobleClic) await guardar.dblclick(); else await guardar.click();
};

export const link = (email) => { const log = readFileSync(MAIL_LOG, "utf8"); const i = log.lastIndexOf(`to=${email}`); return log.slice(i).match(/https?:\/\/[^\s/]+(\/verificar\?token=\w+)/)[1]; };

/** Espera el último correo enviado a `email` que contenga un enlace a `ruta` (por ejemplo «/recuperar/nueva») y devuelve ese enlace, o null. */
export async function esperarEnlace(email, ruta, intentos = 40) {
  const patron = new RegExp(`https?://[^\\s/]+(${ruta}\\?token=\\w+)`);
  for (let i = 0; i < intentos; i++) {
    const bloques = readFileSync(MAIL_LOG, "utf8").split("[mail] to=").filter((b) => b.startsWith(`${email} `));
    for (const b of bloques.reverse()) { const m = b.match(patron); if (m) return m[1]; }
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}
/** Espera un correo enviado a `email` que contenga `fragmento` y devuelve su texto, o null. */
export async function esperarCorreo(email, fragmento, intentos = 40) {
  for (let i = 0; i < intentos; i++) {
    const bloque = readFileSync(MAIL_LOG, "utf8").split("[mail] to=").filter((b) => b.startsWith(`${email} `) && b.includes(fragmento)).pop();
    if (bloque) return bloque;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}
/** ¿Se ha enviado algún correo a esta dirección? (espera un poco por si el envío se hace después de responder) */
export async function hayCorreoPara(email, espera = 1500) {
  await new Promise((r) => setTimeout(r, espera));
  return readFileSync(MAIL_LOG, "utf8").includes(`[mail] to=${email} `);
}

/** Crea una cuenta nueva (y, salvo que se pida lo contrario, verifica su correo). */
export async function newUser(name, role = "FAN", verify = true) {
  const email = `${name.toLowerCase()}${rnd}@test.es`;
  const p = await (await browser.newContext()).newPage();
  await p.goto(B + `/registro?tipo=${role === "FIGHTER" ? "peleador" : "usuario"}`);
  await p.fill("[name=name]", name); await p.fill("[name=email]", email); await p.fill("[name=password]", "contraseña123");
  // Diseño v3: tras crear la cuenta viene el último paso del registro (opcional); el guion lo deja para después.
  await btn(p, "Crear mi cuenta"); await p.waitForURL((u) => u.pathname.startsWith("/registro/"));
  await p.getByRole("link", { name: "Lo haré después" }).click(); await p.waitForURL("**/verificar");
  if (verify) { await p.goto(B + link(email)); await btn(p, "Confirmar"); await p.waitForSelector("text=Correo electrónico verificado"); }
  return { p, email };
}

/** Ejecuta SQL directamente en la base de pruebas (solo para preparar datos que la web no permite crear en bloque). */
/** Dirección (slug) de la ficha cuyo apellido es `apellidos`: las fichas provisionales de rivales no llevan el apellido en la dirección, así que se lee de la base de datos. */
export const slugDe = (apellidos) => execSync(`psql "${process.env.DATABASE_URL}" -tAc "select slug from \\"Fighter\\" where \\"lastName\\"='${apellidos}'"`).toString().trim();
export const sql = (sentencias) => execSync('psql "$DATABASE_URL" -v ON_ERROR_STOP=1', { input: sentencias, env: process.env, stdio: ["pipe", "ignore", "inherit"] });

/** Convierte a un usuario en moderador (solo posible con acceso a la base de datos). */
export const hacerAdmin = (email) => execSync(`psql "${process.env.DATABASE_URL}" -c "update \\"User\\" set role='ADMIN' where email='${email}'"`);

/** Pide ser organizador (la comprobación es obligatoria) y espera a la confirmación. */
export async function solicitarOrganizador(p, nombreOrg) {
  await p.goto(B + "/organizador");
  await p.fill("[name=orgName]", nombreOrg); await p.fill("[name=message]", `Web y redes de ${nombreOrg}`);
  await btn(p, "Solicitar");
  await p.locator("[role=status]", { hasText: "Solicitud enviada" }).waitFor();
}

/** Añade un combate al cartel eligiendo a cada peleador por su nombre en las listas desplegables. */
export async function anadirAlCartel(p, nombreRojo, nombreAzul) {
  const valor = (campo, texto) => p.$eval(`select[name=${campo}]`, (sel, t) => [...sel.options].find((o) => o.textContent.includes(t))?.value, texto);
  await p.selectOption("select[name=fighterA]", await valor("fighterA", nombreRojo));
  await p.selectOption("select[name=fighterB]", await valor("fighterB", nombreAzul));
  await btn(p, "Añadir al cartel");
}

/** Un moderador aprueba la solicitud de organizador anotando la evidencia comprobada (es obligatoria) y espera a que salga de la cola. */
export async function aprobarOrganizador(mod, nombreOrg) {
  await mod.goto(B + "/moderacion");
  const fila = mod.locator("tr", { hasText: nombreOrg });
  await fila.locator("input[name=note]").fill("Web y redes comprobadas");
  await fila.locator("button:has-text('Aprobar')").click();
  await fila.waitFor({ state: "detached" });
}
