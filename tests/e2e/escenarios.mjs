// Escenarios de uso como personas reales, desde un iPhone (emulado): cada persona hace lo que haría de verdad, con los textos que ve en pantalla, y cada paso deja una captura
// en ESC_DIR (por defecto /tmp/escenarios) para revisarla a ojo. No es un conjunto de comprobaciones sueltas: es un recorrido. Si una persona no consigue hacer algo, el paso falla
// y se explica qué intentaba. Además se anotan las fricciones automáticas: errores de consola, respuestas de error, pasos lentos y pantallas que se desplazan en horizontal.
// Uso: BASE_URL=… DATABASE_URL=… MAIL_LOG=… node tests/e2e/escenarios.mjs [visitante|aficionado|peleador|promotora|federacion|…]
import { devices } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { B, rnd, browser, link, hacerAdmin, sql, datosDeAlta, enDias, hoyMadrid } from "./ayudas.mjs";

const DIR = process.env.ESC_DIR ?? "/tmp/escenarios";
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
    try { await fn(); } catch (e) { estado = "FALLO"; detalle = String(e.message).split("\n").filter((l) => l.trim() && !l.includes("====")).slice(0, 7).join(" ⏎ ").slice(0, 700); }
    const ms = Date.now() - t0;
    const desborde = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth).catch(() => 0);
    if (desborde > 1) fricciones.push(`«${texto}»: la pantalla se desplaza ${desborde} px en horizontal`);
    if (ms > 4000 && estado === "ok") fricciones.push(`«${texto}»: tardó ${(ms / 1000).toFixed(1)} s`);
    numPaso++;
    const archivo = `${nombre}-${String(pasos.length + 1).padStart(2, "0")}.png`;
    await p.screenshot({ path: `${DIR}/${archivo}`, fullPage: false }).catch(() => {});
    pasos.push({ texto, estado, detalle, archivo, url: new URL(p.url()).pathname + new URL(p.url()).search });
    console.log(`${estado === "ok" ? "  ✓" : "  ✗"} [${nombre}] ${texto}${detalle ? " → " + detalle : ""}`);
  };
  await guion(p, paso, ctx);
  informe.push({ nombre, descripcion, pasos, fricciones: [...new Set(fricciones)] });
  await ctx.close();
}

const texto = async (p) => (await p.locator("main").innerText()).replace(/\s+/g, " ");
const aviso = (p, t) => p.locator("[role=status], [role=alert]", { hasText: t }).first().waitFor({ timeout: 8000 });

/** Registro como lo haría una persona (formulario de «Crear mi cuenta») y confirmación del correo con el enlace que llega. */
async function registrarse(p, nombre, rol = "FAN") {
  const email = `${nombre.toLowerCase().replace(/[^a-z]/g, "")}${rnd}@test.es`;
  await p.goto(B + "/registro");
  await p.locator(`a.panel-registro[href*="tipo=${rol === "FIGHTER" ? "peleador" : "usuario"}"]`).click(); // la persona elige su panel
  await p.fill("[name=name]", nombre); await p.fill("[name=email]", email); await p.fill("[name=password]", "contraseña123");
  await p.getByRole("button", { name: /^Crear mi cuenta/ }).click();
  await p.waitForURL("**/verificar");
  return email;
}
async function confirmarCorreo(p, email) {
  await p.goto(B + link(email));
  await p.getByRole("button", { name: /Confirmar/ }).click();
  await p.locator("[role=status]", { hasText: "Correo electrónico verificado" }).waitFor({ timeout: 8000 });
}

// ───────────────────────── 1) Visitante sin cuenta ─────────────────────────
await persona("visitante", "Marta, 58 años, sin cuenta, quiere ver si su sobrino aparece y qué pasa en su ciudad", async (p, paso) => {
  await paso("abre la portada", async () => { await p.goto(B + "/"); await p.locator("h1").first().waitFor(); });
  await paso("pulsa «Explorar peleadores»", async () => { await p.getByRole("link", { name: /Explorar peleadores/ }).click(); await p.waitForURL("**/peleadores"); });
  await paso("abre la ficha del primer peleador", async () => { await p.locator("main a.card").first().click(); await p.waitForURL(/\/peleadores\/.+/); });
  await paso("intenta seguirlo (debe llevarla a entrar y explicarle por qué)", async () => {
    await p.getByRole("link", { name: /Entra para seguir/ }).click(); await p.waitForURL("**/entrar**");
    if (!(await texto(p)).match(/Entra en tu cuenta|iniciar sesión|sesión/i)) throw new Error("la pantalla de entrada no explica por qué está aquí");
  });
  await paso("abre el menú", async () => { await p.getByRole("button", { name: /Menú/ }).first().click(); await p.locator("dialog[open]").waitFor(); });
  await paso("elige «Veladas» en el menú", async () => { await p.locator("dialog[open]").getByRole("link", { name: /Veladas/ }).first().click(); await p.waitForURL("**/veladas**"); });
  await paso("busca «demo» con el buscador", async () => { await p.goto(B + "/"); await p.getByPlaceholder("Buscar…").fill("demo"); await p.getByRole("button", { name: "Buscar" }).first().click(); await p.waitForURL("**/buscar**"); });
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
    await p.getByLabel(/Quiero recibir avisos/).uncheck();
    await p.getByRole("button", { name: /Guardar cambios/ }).click(); await aviso(p, "cambios de tu cuenta");
  });
  await paso("sale de su cuenta desde el menú", async () => { await p.getByRole("button", { name: /Menú/ }).first().click(); await p.locator("dialog[open]").getByRole("button", { name: "Salir" }).click(); await p.waitForLoadState("load"); });
});

// ───────────────────────── 3) Peleador ─────────────────────────
await persona("peleador", "Diego, 27 años, boxeador amateur: crea su ficha, registra su primer combate y completa su perfil", async (p, paso) => {
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
    await p.fill("[name=eventName]", `Velada Escenario ${rnd}`); await p.fill("[name=date]", "2026-09-20");
    await p.fill("[name=oppFirst]", "Rival"); await p.fill("[name=oppLast]", `Escenario${rnd}`);
    await p.selectOption("select[name=outcome]", "WIN"); await p.selectOption("form select[name=method]", "UD");
    await p.getByRole("button", { name: "Registrar este combate" }).click(); await aviso(p, "Combate registrado");
  });
  await paso("ve su combate en «Mis combates» con su estado explicado", async () => {
    const t = await texto(p);
    if (!t.includes(`Velada Escenario ${rnd}`)) throw new Error("el combate no aparece en «Mis combates»");
    if (!/pendiente de confirmar/i.test(t)) throw new Error("no explica que está pendiente de confirmar");
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
    const fila = m.locator("tr, li, .card", { hasText: org }).first();
    await fila.locator("input[name=note]").fill("Web y redes comprobadas");
    await fila.getByRole("button", { name: /Aprobar/ }).click(); await m.locator("[role=status]", { hasText: /aprobad/i }).first().waitFor({ timeout: 8000 });
    await mctx.close();
  });
  await paso("recarga y ya puede crear veladas", async () => { await p.goto(B + "/organizador"); await p.locator("[name=name]").first().waitFor(); });
  await paso("crea su velada", async () => {
    await p.locator("form [name=name]").first().fill(`Velada Clara ${rnd}`); await p.fill("form [name=date]", enDias(20));
    await p.selectOption("form select[name=discipline]", "BOXEO"); await p.selectOption("form select[name=province]", "Madrid"); await p.fill("form [name=city]", "Madrid");
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
    const fila = m.locator("tr", { hasText: nombreFed });
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
  await paso("sin acreditación, no puede respaldar resultados (y se le explica)", async () => { await p.goto(B + "/respaldar"); await p.locator("h1").first().waitFor(); });
});

// ───────────────────────── Informe ─────────────────────────
writeFileSync(`${DIR}/informe.json`, JSON.stringify(informe, null, 1));
console.log("\n══ RESUMEN POR PERSONA ══");
for (const i of informe) {
  const fallos = i.pasos.filter((s) => s.estado !== "ok");
  console.log(`\n${i.nombre.toUpperCase()} — ${i.descripcion}\n  pasos: ${i.pasos.length}, fallos: ${fallos.length}`);
  for (const f of fallos) console.log(`  ✗ ${f.texto}: ${f.detalle}  (${f.url})`);
  for (const f of i.fricciones) console.log(`  ⚠ ${f}`);
}
process.exitCode = informe.some((i) => i.pasos.some((s) => s.estado !== "ok")) ? 1 : 0;
await browser.close();
