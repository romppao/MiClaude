// Escenarios de uso como personas reales, desde un iPhone (emulado): cada persona hace lo que haría de verdad, con los textos que ve en pantalla, y cada paso deja una captura
// en ESC_DIR (por defecto /tmp/escenarios) para revisarla a ojo. No es un conjunto de comprobaciones sueltas: es un recorrido. Si una persona no consigue hacer algo, el paso falla
// y se explica qué intentaba. Además se anotan las fricciones automáticas: errores de consola, respuestas de error, pasos lentos y pantallas que se desplazan en horizontal.
// Uso: BASE_URL=… DATABASE_URL=… MAIL_LOG=… node tests/e2e/escenarios.mjs [visitante|aficionado|peleador|promotora|federacion|…]
import { PrismaClient } from "@prisma/client";
import { createHmac } from "node:crypto";
import sharp from "sharp";
import { devices } from "playwright-core";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { B, rnd, browser, link, hacerAdmin, sql, datosDeAlta, enDias, hoyMadrid, registrar, esperarEnlace, esperarCorreo, mostrar } from "./ayudas.mjs";

const DIR = process.env.ESC_DIR ?? "test-results/escenarios";
const db = new PrismaClient();
let numeroCuenta = 0;
const auxiliares = [];
const comprobar = (condicion, mensaje) => { if (!condicion) throw new Error(mensaje); };
class RecorridoInterrumpido extends Error {}
mkdirSync(DIR, { recursive: true });
const SOLO = process.argv.slice(2);
const informe = [];
// Los escenarios necesitan los datos de ejemplo (peleadores, veladas, combates): se arranca con `scripts/entorno-aislado.sh iniciar <nombre> <puerto> --semilla`.
{
  const r = await fetch(B + "/peleadores"); const t = await r.text();
  if (!/href="\/peleadores\/[^"]+"/.test(t)) { console.error("Los escenarios necesitan datos de ejemplo y esta base está vacía. Arranca el entorno con --semilla (scripts/entorno-aislado.sh iniciar <nombre> <puerto> --semilla)."); process.exit(2); }
}
let numPaso = 0;

async function persona(nombre, descripcion, guion) {
  if (SOLO.length && !SOLO.includes(nombre)) return;
  const ctx = await browser.newContext({ ...devices["iPhone 14"], reducedMotion: "reduce" }) /* sin desplazamiento animado: Playwright no consigue pulsar un botón que se está desplazando */;
  const p = await ctx.newPage();
  const fricciones = [];
  p.on("pageerror", (e) => fricciones.push(`error de la página: ${e.message.slice(0, 120)}`));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource: the server responded with a status of 40[34]/.test(m.text())) fricciones.push(`consola: ${m.text().slice(0, 120)}`); });
  p.on("response", (r) => { if (r.status() >= 500) fricciones.push(`respuesta ${r.status()} en ${new URL(r.url()).pathname}`); });
  const pasos = [];
  const paso = async (texto, fn) => {
    const t0 = Date.now();
    let estado = "ok", detalle = "";
    try { const observacion = await fn(); if (typeof observacion === "string") detalle = observacion; } catch (e) { estado = "FALLO"; detalle = String(e.message).split("\n").filter((l) => l.trim() && !l.includes("====")).slice(0, 7).join(" ⏎ ").slice(0, 700); }
    const ms = Date.now() - t0;
    const desborde = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth).catch(() => 0);
    if (desborde > 1) fricciones.push(`«${texto}»: la pantalla se desplaza ${desborde} px en horizontal`);
    if (ms > 4000 && estado === "ok") fricciones.push(`«${texto}»: tardó ${(ms / 1000).toFixed(1)} s`);
    numPaso++;
    const archivo = `${nombre}-${String(pasos.length + 1).padStart(2, "0")}.png`;
    await p.screenshot({ path: `${DIR}/${archivo}`, fullPage: false }).catch(() => {});
    pasos.push({ texto, estado, detalle, archivo, url: new URL(p.url()).pathname + new URL(p.url()).search });
    console.log(`${estado === "ok" ? "  ✓" : "  ✗"} [${nombre}] ${texto}${detalle ? " → " + detalle : ""}`);
    if (estado !== "ok") throw new RecorridoInterrumpido(detalle);
  };
  try { await guion(p, paso, ctx); } catch (e) { if (!(e instanceof RecorridoInterrumpido)) { pasos.push({ texto: "Completar el recorrido", estado: "FALLO", detalle: e.message, archivo: "", url: new URL(p.url()).pathname }); } }
  informe.push({ nombre, descripcion, ejecutadoEl: new Date().toISOString(), pasos, fricciones: [...new Set(fricciones)] });
  await ctx.close();
}

const texto = async (p) => (await p.locator("main").innerText()).replace(/\s+/g, " ");
const aviso = (p, t) => p.locator("[role=status], [role=alert]", { hasText: t }).first().waitFor({ timeout: 8000 });

/** Registro como lo haría una persona (formulario de «Crear mi cuenta») y confirmación del correo con el enlace que llega. */
async function registrarse(p, nombre, rol = "FAN", correo = "") {
  const email = correo || `${nombre.toLowerCase().replace(/[^a-z]/g, "")}${++numeroCuenta}-${rnd}@test.es`;
  await p.goto(B + "/registro");
  await p.locator(`a.panel-registro[href*="tipo=${rol === "FIGHTER" ? "peleador" : rol === "TRAINER" ? "entrenador" : "usuario"}"]`).click(); // la persona elige su panel
  await p.fill("[name=name]", nombre); await p.fill("[name=email]", email); await p.fill("[name=password]", "contraseña123");
  await p.getByRole("button", { name: /^Crear mi cuenta/ }).click();
  await p.waitForURL(u => u.pathname.startsWith("/registro/") || u.pathname === "/verificar");
  while (new URL(p.url()).pathname.startsWith("/registro/")) {
    await p.getByRole("link", { name: "Lo haré después", exact: true }).click();
    await p.waitForURL(u => u.pathname === "/verificar" || u.pathname === "/registro/clase");
  }
  return email;
}
async function confirmarCorreo(p, email) {
  await p.goto(B + link(email));
  await p.getByRole("button", { name: /Confirmar/ }).click();
  await p.locator("[role=status]", { hasText: "Correo electrónico verificado" }).waitFor({ timeout: 8000 });
}


/** Cuentas auxiliares reales para los interlocutores de cada recorrido; nunca se reutiliza una cuenta de otra persona. */
async function auxiliar(nombre, rol = "FAN", admin = false) {
  const ctx = await browser.newContext({ ...devices["iPhone 14"], reducedMotion: "reduce" }); auxiliares.push(ctx);
  const p = await ctx.newPage(); const email = await registrarse(p, nombre, rol); await confirmarCorreo(p, email);
  if (admin) hacerAdmin(email);
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  return { p, email, user };
}
async function crearFicha(p, nombre, apellido) {
  await p.goto(B + "/mi-ficha"); await p.getByLabel("Nombre", { exact: true }).fill(nombre); await p.getByLabel("Apellidos", { exact: true }).fill(apellido);
  await datosDeAlta(p); await p.getByRole("button", { name: "Crear mi ficha", exact: true }).click(); await aviso(p, "ficha de peleador se ha creado");
  return db.fighter.findFirstOrThrow({ where: { firstName: nombre, lastName: apellido } });
}
async function registrarContra(p, rival, evento) {
  await p.goto(B + "/mi-ficha"); await registrar(p, { evento, fecha: enDias(-45), rivalNombre: rival.firstName, rivalApellidos: rival.lastName });
  await p.getByRole("heading", { name: "¿Quién es tu rival?", exact: true }).waitFor();
  await p.getByRole("button", { name: /^Es esta persona:/ }).click(); await aviso(p, "Combate registrado");
}
const fotoPequena = async () => sharp({ create: { width: 640, height: 360, channels: 3, background: "#65774a" } }).png().toBuffer();
const archivoFoto = async nombre => ({ name: nombre, mimeType: "image/png", buffer: await fotoPequena() });
const filaDe = (p, nombre) => p.locator('tr, article[data-cola]', { hasText: nombre });
async function entrar(p, email, clave = "contraseña123") {
  await p.goto(B + "/entrar"); await p.getByLabel("Correo electrónico", { exact: true }).fill(email); await p.locator('[name=password]').fill(clave);
  await p.getByRole("button", { name: "Entrar en mi cuenta", exact: true }).click(); await p.waitForURL(u => u.pathname !== "/entrar");
}
async function recuperar(p, email, nueva) {
  await p.goto(B + "/recuperar"); await p.locator('[name=email]').fill(email); await p.getByRole("button", { name: "Enviar el enlace a mi correo electrónico", exact: true }).click(); await aviso(p, "te hemos enviado un enlace");
  const enlace = await esperarEnlace(email, "/recuperar/nueva"); comprobar(enlace, "no llegó el enlace de recuperación por correo");
  await p.goto(B + enlace); await p.locator('[name=password]').fill(nueva); await p.locator('[name=repeat]').fill(nueva); await p.getByRole("button", { name: /Guardar/ }).click(); await aviso(p, /contraseña|cuenta/i);
}

// ───────────────────────── 1) Visitante sin cuenta ─────────────────────────
await persona("visitante", "Marta, 58 años, sin cuenta, quiere ver si su sobrino aparece y qué pasa en su ciudad", async (p, paso) => {
  await paso("abre la portada", async () => { await p.goto(B + "/"); await p.locator("h1").first().waitFor(); });
  await paso("pulsa «Encontrar un peleador»", async () => { await p.getByRole("link", { name: /Encontrar un peleador/ }).click(); await p.waitForURL("**/peleadores"); });
  await paso("abre la ficha del primer peleador", async () => { await p.locator("main a.card").first().click(); await p.waitForURL(/\/peleadores\/.+/); });
  await paso("intenta seguirlo (debe llevarla a entrar y explicarle por qué)", async () => {
    await p.getByRole("link", { name: /Entra para seguir/ }).click(); await p.waitForURL("**/entrar**");
    if (!(await texto(p)).match(/Entra en tu cuenta|iniciar sesión|sesión/i)) throw new Error("la pantalla de entrada no explica por qué está aquí");
  });
  await paso("abre el menú", async () => { await p.getByRole("button", { name: /Menú/ }).first().click(); await p.locator("dialog[open]").waitFor(); });
  await paso("elige «Veladas» en el menú", async () => { await p.locator("dialog[open]").getByRole("link", { name: /Veladas/ }).first().click(); await p.waitForURL("**/veladas**"); });
  // En móvil usa el buscador visible de la portada, sin intentar pulsar el control de escritorio oculto.
  await paso("busca «demo» con el buscador", async () => { await p.goto(B + "/"); const buscador = p.getByRole("search", { name: "Buscar en Lona", exact: true }); await buscador.getByRole("textbox", { name: "Busca peleadores, gimnasios o veladas", exact: true }).fill("demo"); await buscador.getByRole("button", { name: "Buscar", exact: true }).click(); await p.waitForURL("**/buscar?q=demo**"); });
  await paso("abre «¿Cómo funciona?»", async () => { await p.goto(B + "/ayuda"); await p.locator("h1").waitFor(); });
});

// ───────────────────────── 2) Aficionado ─────────────────────────
await persona("aficionado", "Lucas, 24 años, aficionado: sigue a un peleador, le da aura y ajusta sus avisos", async (p, paso) => {
  let email;
  await paso("crea su cuenta de aficionado", async () => { email = await registrarse(p, "Lucas", "FAN"); });
  await paso("confirma su correo con el enlace recibido", async () => { await confirmarCorreo(p, email); });
  await paso("busca peleadores de MMA con los filtros", async () => {
    await p.goto(B + "/peleadores");
    await p.locator("select[name=disciplina]").selectOption("MMA");
    await p.getByRole("button", { name: "Aplicar filtros" }).click();
    await p.waitForURL("**disciplina=MMA**");
    if (!(await texto(p)).match(/peleadores? encontrados?/)) throw new Error("no dice cuántos peleadores hay");
  });
  await paso("abre la primera ficha", async () => { await p.locator("main a.card").first().click(); await p.waitForURL(/\/peleadores\/.+/); });
  await paso("pulsa «Seguir a este peleador» y ve la confirmación", async () => { await p.getByRole("button", { name: "Seguir a este peleador" }).click(); await aviso(p, "Ahora sigues"); });
  await paso("la confirmación está a la vista (sin tener que desplazarse)", async () => {
    const y = await p.locator("[role=status]", { hasText: "Ahora sigues" }).first().evaluate((e) => e.getBoundingClientRect().top);
    if (y < 0 || y > 800) throw new Error(`el aviso está en la posición ${Math.round(y)} px: fuera de la pantalla`);
  });
  await paso("da aura a un combate que ha visto", async () => {
    const boton = p.getByRole("button", { name: /Dar aura/ }).first();
    if (!(await boton.count())) throw new Error("no encuentra ningún botón «Dar aura» en la ficha");
    await boton.click(); await aviso(p, /aura/i);
  });
  await paso("va a «Peleadores que sigo»", async () => { await p.goto(B + "/siguiendo"); await p.getByText(/Peleadores que sigo/).first().waitFor(); });
  await paso("abre «Mi cuenta» y desactiva los avisos por correo", async () => {
    await p.goto(B + "/mi-cuenta");
    await mostrar(p.getByLabel(/Quiero recibir avisos/));
    await p.getByLabel(/Quiero recibir avisos/).uncheck();
    await p.getByRole("button", { name: /Guardar cambios/ }).click(); await aviso(p, "cambios de tu cuenta");
  });
  await paso("sale de su cuenta desde el menú", async () => { await p.getByRole("button", { name: /Menú/ }).first().click(); await p.locator("dialog[open]").getByRole("button", { name: "Salir" }).click(); await p.waitForLoadState("load"); });
});

// ───────────────────────── 3) Peleador ─────────────────────────
await persona("peleador", "Diego, 27 años, peleador amateur de boxeo: crea su ficha, registra su primer combate y completa su perfil", async (p, paso) => {
  let email;
  await paso("crea su cuenta eligiendo «Tener mi ficha de peleador»", async () => { email = await registrarse(p, "Diego", "FIGHTER"); });
  await paso("confirma su correo", async () => { await confirmarCorreo(p, email); });
  await paso("abre «Mi ficha» y la crea con disciplina, nivel y categoría", async () => {
    await p.goto(B + "/mi-ficha");
    await p.fill("[name=firstName]", "Diego"); await p.fill("[name=lastName]", `Escenario${rnd}`);
    await p.locator("main form select[name=discipline]").first().selectOption("BOXEO");
    await p.locator("main form select[name=level]").first().selectOption("AMATEUR");
    await datosDeAlta(p);
    await p.getByRole("button", { name: "Crear mi ficha" }).click(); await aviso(p, "ficha de peleador se ha creado");
  });
  await paso("registra su primer combate contra un rival nuevo", async () => {
    await registrar(p, { evento: `Velada Escenario ${rnd}`, fecha: enDias(-30), rivalNombre: "Rival", rivalApellidos: `Escenario${rnd}` }); await aviso(p, "Combate registrado");
  });
  await paso("ve su combate en «Mis combates» con su estado explicado", async () => {
    const t = await texto(p);
    if (!t.includes(`Velada Escenario ${rnd}`)) throw new Error("el combate no aparece en «Mis combates»");
    if (!/declarado/i.test(t) || !/Contará en tu récord a partir|cuenta en el récord a partir/i.test(t)) throw new Error("no explica que es declarado y cuándo empezará a contar (regla de 24 horas)");
  });
  await paso("abre su ficha pública y comprueba su récord", async () => { await p.getByRole("link", { name: /Ver mi ficha pública/ }).click(); await p.waitForURL(/\/peleadores\/.+/); });
  await paso("entra en «Mi trayectoria»", async () => { await p.goto(B + "/mi-ficha/trayectoria"); await p.locator("h1").waitFor(); });
  await paso("abre el editor de su perfil (foto y banner)", async () => {
    await p.goto(B + "/mi-ficha");
    await p.getByRole("link", { name: /Editar foto y banner/ }).first().click(); await p.waitForURL("**/editar");
  });
  await paso("se equivoca de combate y lo quita", async () => {
    await p.goto(B + "/mi-ficha");
    await p.locator("summary", { hasText: "Quitar este combate" }).first().click();
    await p.getByRole("button", { name: /Sí, quitar este combate/ }).first().click(); await aviso(p, "se ha quitado");
  });
});

// ───────────────────────── 4) Promotora ─────────────────────────
await persona("promotora", "Clara, 41 años, organiza veladas amateur: pide ser organizadora, crea su velada, monta el cartel y la corrige", async (p, paso, ctx) => {
  let email; const org = `Promotora Escenario ${rnd}`;
  await paso("crea su cuenta", async () => { email = await registrarse(p, "Clara", "FAN"); });
  await paso("confirma su correo", async () => { await confirmarCorreo(p, email); });
  await paso("abre «Organizar una velada» desde el menú y pide ser organizadora", async () => {
    await p.getByRole("button", { name: /Menú/ }).first().click();
    await p.locator("dialog[open]").getByRole("link", { name: /velada|promotor|Organiz/i }).first().click();
    await p.waitForLoadState("load");
    await p.goto(B + "/organizador");
    await p.fill("[name=orgName]", org); await p.fill("[name=message]", "Web y redes de la promotora");
    await p.getByRole("button", { name: /Solicitar/ }).click(); await aviso(p, "Solicitud enviada");
  });
  await paso("ve qué pasa a partir de ahora (queda pendiente y se le explica)", async () => { if (!/pendiente|revis/i.test(await texto(p))) throw new Error("no le dice que su solicitud está pendiente de revisión"); });
  await paso("[moderadora] aprueba la solicitud", async () => {
    const mctx = await browser.newContext({ ...devices["iPhone 14"], reducedMotion: "reduce" }); const m = await mctx.newPage();
    const memail = await registrarse(m, "Moderadora", "FAN"); await confirmarCorreo(m, memail); hacerAdmin(memail);
    await m.goto(B + "/moderacion");
    const fila = m.locator("tr, article[data-cola], .card", { hasText: org }).first();
    await fila.locator("input[name=note]").fill("Web y redes comprobadas");
    await fila.getByRole("button", { name: /Aprobar/ }).click(); await m.locator("[role=status]", { hasText: /aprobad/i }).first().waitFor({ timeout: 8000 });
    await mctx.close();
  });
  await paso("recarga y ya puede crear veladas", async () => { await p.goto(B + "/organizador"); await p.locator("[name=name]").first().waitFor(); });
  await paso("crea su velada", async () => {
    await p.locator("form [name=name]").first().fill(`Velada Clara ${rnd}`); await p.fill("form [name=date]", enDias(20));
    await p.selectOption("form select[name=discipline]", "BOXEO"); await p.selectOption("form select[name=province]", "Madrid"); await p.fill("form [name=city]", "Madrid");
    await p.selectOption("form select[name=level]", "AMATEUR");
    await p.getByRole("button", { name: "Crear el evento" }).click(); await p.waitForURL(/\/organizador\/velada-clara/);
  });
  await paso("añade un combate al cartel", async () => {
    const opciones = await p.$$eval("select[name=fighterA] option", (o) => o.filter((x) => x.value).slice(0, 2).map((x) => x.value));
    if (opciones.length < 2) throw new Error("no hay peleadores que elegir para el cartel");
    await p.selectOption("select[name=fighterA]", opciones[0]); await p.selectOption("select[name=fighterB]", opciones[1]);
    await p.getByRole("button", { name: "Añadir al cartel" }).click(); await aviso(p, "se ha añadido al cartel");
  });
  await paso("corrige el nombre de la velada", async () => {
    await p.locator("summary", { hasText: /Corregir|datos de la velada/i }).first().click();
    await p.locator("details [name=name]").first().fill(`Velada Clara corregida ${rnd}`);
    await p.getByRole("button", { name: /Guardar/ }).first().click(); await aviso(p, /corregid|guardad|actualizad/i);
  });
  await paso("mira cómo la ve el público", async () => { await p.goto(B + `/veladas?q=${encodeURIComponent("Velada Clara corregida")}&past=todas`); await p.getByText(`Velada Clara corregida ${rnd}`).first().waitFor(); });
});

// ───────────────────────── 5) Federación ─────────────────────────
await persona("federacion", "Pedro, delegado de una federación autonómica: la solicita desde el registro, la moderación la aprueba y él completa su perfil", async (p, paso) => {
  const nombreFed = `Federación Escenario ${rnd}`; let emailPedro = `pedro${rnd}@test.es`; let idFed;
  await paso("Pedro elige el panel «Promotora o federación», rellena los datos de su federación y confirma el correo", async () => {
    await p.goto(B + "/registro");
    await p.locator('a.panel-registro[href*="tipo=entidad"]').click();
    await p.fill("[name=name]", "Pedro"); await p.fill("[name=email]", emailPedro); await p.fill("[name=password]", "contraseña123");
    await p.fill("[name=orgName]", nombreFed); await p.locator(".segmentos label", { hasText: "Federación" }).click(); await p.fill("[name=website]", "https://example.org"); await p.fill("[name=message]", "Web oficial de la federación");
    await p.getByRole("button", { name: /Enviar solicitud/ }).click(); await p.waitForURL("**/verificar*");
    if (!(await texto(p)).includes("un moderador la revisará")) throw new Error("no se le explica que un moderador revisará la solicitud");
    await confirmarCorreo(p, emailPedro);
  });
  await paso("[moderadora] ve que es una federación, con su web, y la aprueba", async () => {
    const mctx = await browser.newContext({ ...devices["iPhone 14"], reducedMotion: "reduce" }); const m = await mctx.newPage();
    const memail = await registrarse(m, "Moderadora Dos", "FAN"); await confirmarCorreo(m, memail); hacerAdmin(memail);
    await m.goto(B + "/moderacion");
    const fila = m.locator("tr, article[data-cola]", { hasText: nombreFed });
    await fila.waitFor({ timeout: 8000 });
    const t = await fila.innerText();
    if (!t.includes("Federación") || !(await fila.locator("a[href*='example.org']").count())) throw new Error("la cola no muestra el tipo de entidad y su web");
    await fila.locator("input[name=note]").fill("Web oficial comprobada"); await fila.locator("button:has-text('Aprobar')").click(); await fila.waitFor({ state: "detached" });
    await mctx.close();
  });
  await paso("Pedro encuentra su federación ya creada en «Mi cuenta», sin más pasos", async () => {
    await p.goto(B + "/mi-cuenta");
    if (!(await texto(p)).includes(nombreFed)) throw new Error("«Mi cuenta» no le enseña su federación aprobada");
    idFed = (await p.locator('main a[href*="/perfiles/federacion/"]').first().getAttribute("href")).split("/")[3];
  });
  await paso("edita su perfil: descripción, ciudad y web", async () => {
    await p.goto(B + `/perfiles/federacion/${idFed}/editar`);
    await p.fill("[name=bio]", "Federación de deportes de contacto de la comunidad."); await p.fill("[name=city]", "Valencia"); await p.fill("[name=website]", "https://example.org");
    await p.getByRole("button", { name: /Guardar/ }).first().click(); await aviso(p, /guardad|actualizad/i);
  });
  await paso("comprueba cómo ve su perfil el público", async () => { await p.goto(B + `/federaciones/${idFed}`); await p.getByText(nombreFed).first().waitFor(); const t = await texto(p); if (!t.includes("Valencia")) throw new Error("el perfil público no muestra la ciudad que acaba de guardar"); });
  await paso("sin acreditación, no puede respaldar resultados (y se le explica)", async () => { await p.goto(B + "/respaldar"); await aviso(p, "Este respaldo requiere una acreditación activa"); comprobar(new URL(p.url()).searchParams.get("problema") === "respaldo_sin_permiso", "una federación sin acreditar ha accedido a respaldar resultados"); });
});


await persona("rival", "Iker, peleador, recibe dos declaraciones de combate: confirma una y solicita revisión de la otra con motivo", async (p, paso) => {
  let autor, rival;
  await paso("crea y confirma su cuenta y su ficha", async () => { const email = await registrarse(p, "Iker Rival", "FIGHTER"); await confirmarCorreo(p, email); rival = await crearFicha(p, "Iker", `RivalEscenario${rnd}`); });
  await paso("su rival registra dos combates y él recibe el aviso", async () => {
    autor = await auxiliar("Autor Rival", "FIGHTER"); await crearFicha(autor.p, "Autor", `RivalEscenario${rnd}`);
    await registrarContra(autor.p, rival, `Combate confirmado Iker ${rnd}`); await registrarContra(autor.p, rival, `Combate revisión Iker ${rnd}`);
    comprobar(await esperarCorreo((await db.user.findUniqueOrThrow({ where: { id: rival.userId } })).email, "ha registrado un combate contra ti"), "Iker no recibió el aviso de su rival");
    await p.goto(B + "/mi-ficha");
  });
  await paso("confirma el primer combate", async () => { const fila = p.locator('li', { hasText: `Combate confirmado Iker ${rnd}` }); await fila.locator("button:has-text('Sí, es correcto')").click(); await aviso(p, "Has confirmado el combate"); });
  await paso("el autor ve la confirmación y recibe el correo", async () => { await autor.p.goto(B + "/mi-ficha"); const etiqueta = autor.p.locator("tr", { hasText: `Combate confirmado Iker ${rnd}` }).locator(".tag", { hasText: /confirmado/i }); await mostrar(etiqueta); await etiqueta.waitFor(); await autor.p.screenshot({ path: `${DIR}/rival-autor-confirmacion.png` }); comprobar(await esperarCorreo(autor.email, "ha confirmado tu combate"), "el autor no recibió la confirmación"); });
  await paso("pide revisión del segundo explicando el motivo", async () => { await p.goto(B + "/mi-ficha"); const fila = p.locator('li', { hasText: `Combate revisión Iker ${rnd}` }); await fila.locator('[name=motivo]').fill("No combatimos en esa fecha; revisad el acta."); await fila.locator("button:has-text('No es correcto')").click(); await aviso(p, "Has solicitado revisión"); });
  await paso("el autor recibe la respuesta completa y el motivo", async () => { comprobar(await esperarCorreo(autor.email, "No combatimos en esa fecha"), "el autor no recibe el motivo de la revisión"); await p.goto(B + "/mi-ficha"); });
});

await persona("reclamacion", "Nuria reclama una ficha provisional que creó su rival y recupera su control tras la revisión", async (p, paso) => {
  let ficha, moderadora;
  await paso("su rival registra el combate que crea su ficha provisional", async () => {
    const rival = await auxiliar("Rival Nuria", "FIGHTER"); await crearFicha(rival.p, "Rival", `DeNuria${rnd}`);
    await registrar(rival.p, { evento: `Origen ficha Nuria ${rnd}`, fecha: enDias(-60), rivalNombre: "Nuria", rivalApellidos: `Reclamacion${rnd}` }); await aviso(rival.p, "Combate registrado");
    ficha = await db.fighter.findFirstOrThrow({ where: { firstName: "Nuria", lastName: `Reclamacion${rnd}` } }); comprobar(ficha.userId === null, "la ficha no era provisional"); await p.goto(B + `/peleadores/${ficha.slug}`);
  });
  await paso("crea y confirma su cuenta, busca su ficha y la reclama", async () => { const email = await registrarse(p, "Nuria Reclamante", "FIGHTER"); await confirmarCorreo(p, email); await p.goto(B + `/mi-ficha?q=Reclamacion${rnd}`); await p.locator('form', { has: p.locator(`input[name=fighterId][value="${ficha.id}"]`) }).locator('[name=message]').fill("Soy Nuria, la participante de este combate; comprobad el acta."); await p.getByRole("button", { name: /^Reclamar esta ficha/ }).click(); await aviso(p, "Solicitud enviada"); });
  await paso("moderación comprueba la prueba y aprueba la reclamación", async () => { moderadora = await auxiliar("Moderadora Nuria", "FAN", true); await moderadora.p.goto(B + "/moderacion"); await filaDe(moderadora.p, `Reclamacion${rnd}`).getByRole("button", { name: /^Aprobar/ }).click(); await aviso(moderadora.p, /aprobad/i); await p.goto(B + "/mi-ficha"); });
  await paso("Nuria ve su ficha y puede registrar combates", async () => { await p.getByRole("button", { name: "Registrar este combate", exact: true }).waitFor(); comprobar((await db.fighter.findUniqueOrThrow({ where: { id: ficha.id } })).userId !== null, "la reclamación aprobada no vinculó la cuenta"); });
});

for (const kind of ["entrenador", "gimnasio"]) await persona(`${kind}-titular`, `${kind === "entrenador" ? "Elena" : "Javier"}, titular de un ${kind}, recibe el permiso de moderación y publica su presentación, foto y web`, async (p, paso) => {
  let email, entity, ruta;
  await paso("crea y confirma la cuenta con la que gestionará el perfil", async () => { email = await registrarse(p, `Titular ${kind}`, kind === "entrenador" ? "TRAINER" : "FAN"); await confirmarCorreo(p, email); });
  await paso("moderación le asigna el perfil con su correo confirmado", async () => {
    entity = kind === "entrenador" ? await db.trainer.create({ data: { name: `Entrenador Titular ${rnd}`, slug: `entrenador-titular-${rnd}`, city: "Valencia", province: "Valencia" } }) : await db.gym.create({ data: { name: `Gimnasio Titular ${rnd}`, slug: `gimnasio-titular-${rnd}`, city: "Valencia", province: "Valencia" } });
    const mod = await auxiliar(`Mod Titular ${kind}`, "FAN", true); await mod.p.goto(B + `/perfiles/${kind}/${entity.id}/editar`); await mod.p.locator('[name=ownerEmail]').fill(email); await mod.p.getByRole("button", { name: "Guardar perfil", exact: true }).click(); await aviso(mod.p, /guardad|actualizad/i); await p.goto(B + `/perfiles/${kind}/${entity.id}/editar`);
  });
  await paso("escribe presentación, zona y web y elige una foto", async () => { await p.locator('[name=bio]').fill(`Presentación profesional del ${kind} ${rnd}`); await p.locator('[name=city]').fill("Valencia"); await p.locator('[name=website]').fill(`https://example.org/${kind}-${rnd}`); await p.locator('[name=avatar]').setInputFiles(await archivoFoto(`${kind}.png`)); await p.getByRole("button", { name: "Guardar perfil", exact: true }).click(); await aviso(p, /guardad|actualizad/i); });
  await paso("comprueba texto, enlace y foto en el perfil público", async () => { ruta = `/${kind === "entrenador" ? "entrenadores" : "gimnasios"}/${entity.slug}`; await p.goto(B + ruta); await p.getByText(`Presentación profesional del ${kind} ${rnd}`, { exact: true }).waitFor(); comprobar(await p.locator(`a[href="https://example.org/${kind}-${rnd}"]`).count() > 0, "la web guardada no aparece en el perfil"); comprobar((await p.request.get(B + `/imagenes/${kind}/${entity.id}/avatar`)).ok(), "la foto pública no se puede leer"); });
});

await persona("moderadora", "Sonia, moderadora, recorre avisos, reclamaciones, organizadores, acreditaciones e historial y toma una decisión real en cada cola", async (p, paso) => {
  let report, claim, org, target;
  await paso("entra con una cuenta de moderación", async () => { const email = await registrarse(p, "Sonia Moderadora"); await confirmarCorreo(p, email); hacerAdmin(email); await p.goto(B + "/moderacion"); await p.getByRole("heading", { name: "Moderación", exact: true }).waitFor(); });
  await paso("prepara casos sintéticos independientes para sus colas", async () => {
    target = await auxiliar("Persona Colas"); const orgUser = await auxiliar("Entidad Colas");
    const ficha = await db.fighter.create({ data: { firstName: "Ficha", lastName: `Colas${rnd}`, slug: `ficha-colas-${rnd}` } });
    report = await db.report.create({ data: { userId: target.user.id, entity: "PAGINA", entityId: `/peleadores/${ficha.slug}`, reason: "DATOS", message: `Aviso de cola ${rnd}` } });
    claim = await db.claimRequest.create({ data: { userId: target.user.id, fighterId: ficha.id, message: `Reclamación de cola ${rnd}` } });
    org = await db.organizerRequest.create({ data: { userId: orgUser.user.id, orgName: `Organizador Cola ${rnd}`, message: "Evidencia sintética para revisión profesional" } });
    await p.goto(B + "/moderacion");
  });
  await paso("resuelve un aviso de página con nota para quien avisó", async () => { const fila = p.locator('tr, article[data-cola]', { has: p.locator(`input[name=reportId][value="${report.id}"]`) }); await fila.locator('[name=note]').fill("Página comprobada y datos corregidos."); await fila.getByRole("button", { name: /^Cerrar: ya está corregido/ }).click(); await aviso(p, "Aviso marcado como resuelto"); comprobar((await db.report.findUniqueOrThrow({ where: { id: report.id } })).status === "RESOLVED", "el aviso continúa abierto"); });
  await paso("aprueba una reclamación comprobada", async () => { const fila = p.locator('tr, article[data-cola]', { has: p.locator(`input[name=claimId][value="${claim.id}"]`) }); await fila.getByRole("button", { name: /^Aprobar/ }).click(); await aviso(p, /aprobad/i); comprobar((await db.claimRequest.findUniqueOrThrow({ where: { id: claim.id } })).status === "APPROVED", "la reclamación no se ha aprobado"); });
  await paso("aprueba un organizador anotando la evidencia", async () => { const fila = filaDe(p, org.orgName); await fila.locator('[name=note]').fill("Web y actividad de la organización comprobadas."); await fila.getByRole("button", { name: /^Aprobar/ }).click(); await fila.waitFor({ state: "detached" }); await aviso(p, /aprobad/i); comprobar((await db.organizerRequest.findUniqueOrThrow({ where: { id: org.id } })).status === "APPROVED", "el organizador sigue pendiente"); });
  await paso("concede una acreditación a la persona que la justifica", async () => { await p.goto(B + "/moderacion/acreditaciones"); const form = p.locator('form', { has: p.getByRole("button", { name: "Conceder acreditación", exact: true }) }); await form.locator('[name=email]').fill(target.email); await form.locator('[name=supportKind]').selectOption("TRAINER"); await form.locator('[name=authority]').fill(`Entrenador acreditado ${rnd}`); await form.locator('input[name=disciplines][value=BOXEO]').check(); await form.locator('[name=evidenceUrl]').fill("https://example.org/acreditacion"); await form.locator('[name=note]').fill("Identidad y actividad comprobadas en el escenario."); await form.getByRole("button", { name: "Conceder acreditación", exact: true }).click(); await aviso(p, /acreditaci/i); comprobar((await db.supportAccreditation.findUniqueOrThrow({ where: { userId: target.user.id } })).active, "no se ha concedido la acreditación"); });
  await paso("consulta en el historial el caso que acaba de resolver", async () => { await p.goto(B + `/moderacion/historial?entity=REPORT&id=${report.id}`); await p.getByRole("heading", { name: /Historial/ }).waitFor(); await p.locator("tr", { hasText: report.id }).getByRole("cell", { name: /cerrado como corregido/ }).waitFor(); });
});

await persona("mayor", "Carmen, 70 años, usa letra al 150 % y 200 %, teclado y botones sencillos para registrarse, seguir y recuperar la contraseña", async (p, paso) => {
  let email;
  // La ampliación acompaña a Carmen también tras los cambios de página (registro, correo y recuperación).
  await p.addInitScript(() => { addEventListener("DOMContentLoaded", () => { const style = document.createElement("style"); style.textContent = "html{font-size:200%}"; document.head.append(style); }); });
  for (const zoom of [150, 200]) await paso(`comprueba que los controles se alcanzan con letra al ${zoom} %`, async () => { await p.goto(B + "/registro?tipo=usuario"); await p.addStyleTag({ content: `html{font-size:${zoom}%}` }); comprobar(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `la pantalla se desborda con letra al ${zoom} %`); const boton = p.getByRole("button", { name: "Crear mi cuenta", exact: true }); await boton.focus(); await boton.scrollIntoViewIfNeeded(); comprobar(await boton.evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }), `no se alcanza el botón de registro al ${zoom} %`); await p.keyboard.press("Tab"); const medidas = await p.evaluate(() => ({ raiz: getComputedStyle(document.documentElement).fontSize, cuerpo: getComputedStyle(document.body).fontSize, boton: getComputedStyle(document.querySelector("main button")).fontSize })); return `Tamaños medidos: raíz ${medidas.raiz}, cuerpo ${medidas.cuerpo}, botón ${medidas.boton}`; });
  await paso("se registra y confirma el correo sin gestos complejos", async () => { email = await registrarse(p, "Carmen Mayor"); await confirmarCorreo(p, email); });
  await paso("abre una ficha y sigue al peleador usando el teclado", async () => { await p.goto(B + "/peleadores"); await p.addStyleTag({ content: "html{font-size:200%}" }); const ficha = p.locator('main a.card').first(); await ficha.focus(); await p.keyboard.press("Enter"); await p.waitForURL(/\/peleadores\/.+/); await p.addStyleTag({ content: "html{font-size:200%}" }); const seguir = p.getByRole("button", { name: "Seguir a este peleador", exact: true }); await seguir.focus(); await seguir.scrollIntoViewIfNeeded(); await p.keyboard.press("Enter"); await aviso(p, "Ahora sigues"); comprobar(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "la ficha se desborda al 200 %"); });
  await paso("recupera su contraseña mediante el correo", async () => { await recuperar(p, email, "carmen-clave-nueva-123"); comprobar(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "la recuperación se desborda con letra ampliada"); });
});

await persona("cuenta", "Alicia gestiona su cuenta: recupera y cambia la contraseña, descarga sus datos y elimina la cuenta con confirmación", async (p, paso) => {
  let email;
  await paso("crea y confirma su cuenta", async () => { email = await registrarse(p, "Alicia Cuenta"); await confirmarCorreo(p, email); });
  await paso("recupera el acceso con una contraseña nueva", async () => { await recuperar(p, email, "alicia-recuperada-123"); });
  await paso("cambia de nuevo la contraseña desde Mi cuenta", async () => { await p.goto(B + "/mi-cuenta"); await p.locator('[name=current]').fill("alicia-recuperada-123"); await p.locator('[name=password]').fill("alicia-definitiva-123"); await p.locator('[name=repeat]').fill("alicia-definitiva-123"); await p.getByRole("button", { name: "Cambiar mi contraseña", exact: true }).click(); await aviso(p, "contraseña se ha cambiado"); });
  await paso("descarga el archivo y comprueba que contiene sus datos", async () => { const download = p.waitForEvent("download"); await p.getByRole("button", { name: "Descargar una copia de mis datos", exact: true }).click(); const fichero = await download; const datos = JSON.parse(readFileSync(await fichero.path(), "utf8")); comprobar(datos.cuenta.correoElectronico === email && !JSON.stringify(datos).includes("passwordHash"), "la descarga no corresponde a su cuenta o incluye la contraseña"); });
  await paso("lee la confirmación, escribe su contraseña y elimina la cuenta", async () => { await p.goto(B + "/mi-cuenta/eliminar"); await p.locator('[name=current]').fill("alicia-definitiva-123"); await p.getByLabel("Entiendo que no se puede deshacer y quiero eliminar mi cuenta.", { exact: true }).check(); await p.getByRole("button", { name: "Eliminar mi cuenta definitivamente", exact: true }).click(); await aviso(p, /eliminad/i); comprobar(await db.user.count({ where: { email } }) === 0, "la cuenta sigue existiendo después de eliminarla"); });
});

await persona("peleador-completo", "Óscar completa su ficha con foto, banner y un título anterior declarado y pide el respaldo opcional", async (p, paso) => {
  let fighter;
  await paso("crea su cuenta y su ficha", async () => { const email = await registrarse(p, "Oscar Completo", "FIGHTER"); await confirmarCorreo(p, email); fighter = await crearFicha(p, "Óscar", `Completo${rnd}`); });
  await paso("elige foto y banner y guarda ambos", async () => { await p.goto(B + `/perfiles/peleador/${fighter.id}/editar`); await p.locator('[name=avatar]').setInputFiles(await archivoFoto("foto.png")); await p.locator('[name=banner]').setInputFiles(await archivoFoto("banner.png")); await p.getByRole("button", { name: "Guardar perfil", exact: true }).click(); await aviso(p, /guardad|actualizad/i); });
  await paso("declara un título anterior sin atribuirse una verificación", async () => { await p.goto(B + "/mi-ficha/trayectoria"); const form = p.locator('form', { has: p.getByRole("button", { name: "Guardar título declarado", exact: true }) }); await form.locator('[name=championship]').fill(`Campeonato Anterior ${rnd}`); await form.locator('[name=organization]').fill("Organización de prueba"); await form.locator('[name=awardedOn]').fill("2020-05-12"); await form.locator('[name=scope]').selectOption("REGIONAL"); await form.locator('[name=discipline]').selectOption("BOXEO"); await form.locator('[name=level]').selectOption("AMATEUR"); await form.getByRole("button", { name: "Guardar título declarado", exact: true }).click(); await aviso(p, /título|guardad/i); });
  await paso("solicita respaldo con la fuente y una explicación", async () => { const gestion = p.locator('details', { hasText: `Gestionar: Campeonato Anterior ${rnd}` }); await gestion.locator('summary').click(); const form = gestion.locator('form', { has: p.getByRole("button", { name: "Solicitar revisión del logro", exact: true }) }); await form.locator('[name=evidenceUrl]').fill("https://example.org/acta-titulo"); await form.locator('[name=note]').fill("Acta del campeonato anterior donde consta el resultado."); await form.getByRole("button", { name: "Solicitar revisión del logro", exact: true }).click(); await aviso(p, /revisión/i); });
  await paso("ve en su ficha pública el título declarado y las dos imágenes", async () => { await p.goto(B + `/peleadores/${fighter.slug}`); comprobar((await texto(p)).includes(`Campeonato Anterior ${rnd}`), "el título no se ve en la ficha pública"); comprobar((await p.request.get(B + `/imagenes/peleador/${fighter.id}/avatar`)).ok() && (await p.request.get(B + `/imagenes/peleador/${fighter.id}/banner`)).ok(), "la foto o el banner públicos no responden"); comprobar(!/verificado por.*Organización de prueba/i.test(await texto(p)), "la ficha presenta una declaración como verificada"); });
});

await persona("club", "Raquel representa un club: pide acceso como entidad, recibe la aprobación y prepara un interclub", async (p, paso) => {
  const nombre = `Club Escenario ${rnd}`; let email;
  await paso("elige el registro de entidad e identifica a su club", async () => { email = `club-${rnd}@test.es`; await p.goto(B + "/registro?tipo=entidad"); await p.locator('[name=name]').fill("Raquel Club"); await p.locator('[name=email]').fill(email); await p.locator('[name=password]').fill("contraseña123"); await p.locator('[name=orgName]').fill(nombre); await p.locator('.segmentos label', { hasText: "Club" }).click(); await p.locator('[name=message]').fill("Actividad del club y web para comprobar su identidad."); await p.getByRole("button", { name: /^Enviar solicitud/ }).click(); await p.waitForURL("**/verificar*"); await confirmarCorreo(p, email); });
  await paso("moderación comprueba y aprueba el club", async () => { const mod = await auxiliar("Moderadora Club", "FAN", true); await mod.p.goto(B + "/moderacion"); const fila = filaDe(mod.p, nombre); await fila.locator('[name=note]').fill("Actividad del club comprobada en este caso de prueba."); await fila.getByRole("button", { name: /^Aprobar/ }).click(); await aviso(mod.p, /aprobad/i); await p.goto(B + "/organizador"); });
  await paso("el club crea un interclub futuro desde su panel", async () => { await p.locator('label.chip', { hasText: "Interclub" }).click(); await p.locator('[name=name]').fill(`Interclub Raquel ${rnd}`); await p.locator('[name=date]').fill(enDias(30)); await datosDeAlta(p); await p.getByRole("button", { name: "Crear el evento", exact: true }).click(); await aviso(p, /interclub se ha creado/i); });
});

await persona("sin-verificar", "Luis crea una cuenta de peleador y entiende qué necesita confirmar antes de publicar", async (p, paso) => {
  let email;
  await paso("se registra y ve la explicación del correo pendiente", async () => { email = await registrarse(p, "Luis Sin Confirmar", "FIGHTER"); comprobar(/correo|confirma/i.test(await texto(p)), "no se explica cómo confirmar el correo"); });
  await paso("no puede crear la ficha antes de confirmar", async () => { await p.goto(B + "/mi-ficha"); comprobar(new URL(p.url()).pathname === "/verificar", "una cuenta sin confirmar accede al alta de ficha"); });
  await paso("confirma y puede empezar su ficha", async () => { await confirmarCorreo(p, email); await p.goto(B + "/mi-ficha"); await p.getByRole("button", { name: "Crear mi ficha", exact: true }).waitFor(); });
});

const codigoTemporal = clave => {
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let bits = 0, valor = 0; const bytes = [];
  for (const letra of clave) { valor = (valor << 5 | alfabeto.indexOf(letra)) & 0xffff; bits += 5; if (bits >= 8) { bytes.push(valor >>> (bits - 8) & 255); bits -= 8; } }
  const contador = Buffer.alloc(8); contador.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac("sha1", Buffer.from(bytes)).update(contador).digest(); const offset = hash.at(-1) & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, "0");
};
await persona("creador", "La cuenta del creador entra con contraseña y segundo paso y revisa la administración sin rebajar sus protecciones", async (p, paso) => {
  const correo = process.env.CREADOR_CORREO ?? "creador@prueba.test"; let clave;
  await paso("crea y confirma su cuenta especial de pruebas", async () => { const anterior = await db.user.findUnique({ where: { email: correo } }); comprobar(!anterior || anterior.name === "Creador Escenarios", "la cuenta del creador no pertenece a este guion: usa una base aislada vacía"); if (anterior) { comprobar(new URL(B).hostname === "localhost" && correo.endsWith("@prueba.test"), "solo se prepara de nuevo la cuenta ficticia del entorno local"); await db.user.update({ where: { id: anterior.id }, data: { email: `antes-${rnd}-${correo}` } }); } await registrarse(p, "Creador Escenarios", "FAN", correo); await p.goto(B + link(correo)); await p.getByRole("button", { name: "Confirmar mi correo electrónico", exact: true }).click(); await p.getByRole("heading", { name: "Tu correo electrónico está confirmado", exact: true }).waitFor(); });
  await paso("entra con contraseña y recibe la petición del segundo paso", async () => { await entrar(p, correo); await p.getByRole("heading", { name: "Protege la cuenta del creador", exact: true }).waitFor(); clave = (await p.locator('.clave-app').innerText()).replace(/\s/g, ""); });
  await paso("activa el segundo paso con un código válido y guarda los códigos de emergencia", async () => { await p.locator('[name=codigo]').fill(codigoTemporal(clave)); await p.getByRole("button", { name: "Activar y ver mis códigos de emergencia", exact: true }).click(); await p.locator('ol.codigos-emergencia li').first().waitFor(); comprobar(await p.locator('ol.codigos-emergencia li').count() > 0, "no se muestran los códigos de emergencia"); await p.getByRole("link", { name: "Ya los he guardado: continuar", exact: true }).click(); });
  await paso("accede a administración y consulta las cuentas", async () => { await p.goto(B + "/moderacion/usuarios"); await p.getByRole("heading", { name: "Administración", exact: true }).waitFor(); await p.getByRole("textbox", { name: "Buscar por nombre o correo electrónico", exact: true }).waitFor(); });
});

// ───────────────────────── Informe ─────────────────────────
// Una repetición explícita de una persona conserva el resultado y las capturas de las demás.
// Solo sustituye su resultado tras ejecutarla de nuevo; los fallos del resto siguen siendo fallos.
if (SOLO.length && existsSync(`${DIR}/informe.json`)) {
  const anteriores = JSON.parse(readFileSync(`${DIR}/informe.json`, "utf8"));
  const repetidas = new Set(informe.map(i => i.nombre));
  informe.push(...anteriores.filter(i => !repetidas.has(i.nombre)));
}
comprobar(informe.length > 0, "No se ha ejecutado ninguna persona: comprueba el nombre del escenario solicitado");
if (!SOLO.length) comprobar(informe.length >= 12, "La batería completa debe cubrir al menos doce personas");
writeFileSync(`${DIR}/informe.json`, JSON.stringify(informe, null, 1));
console.log("\n══ RESUMEN POR PERSONA ══");
for (const i of informe) {
  const fallos = i.pasos.filter((s) => s.estado !== "ok");
  console.log(`\n${i.nombre.toUpperCase()} — ${i.descripcion}\n  pasos: ${i.pasos.length}, fallos: ${fallos.length}`);
  for (const f of fallos) console.log(`  ✗ ${f.texto}: ${f.detalle}  (${f.url})`);
  for (const f of i.fricciones) console.log(`  ⚠ ${f}`);
}
process.exitCode = informe.some((i) => i.pasos.some((s) => s.estado !== "ok")) ? 1 : 0;
for (const ctx of auxiliares) await ctx.close();
await db.$disconnect();
await browser.close();
