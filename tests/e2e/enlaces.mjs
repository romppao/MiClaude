// Ni enlaces ni botones muertos (regla del fundador, 2 de octubre de 2026): todo lo que parece pulsable tiene que llevar a un sitio o hacer algo visible.
// Recorre la aplicación como cada papel (sin cuenta, aficionado, peleador, organizador y moderador), sigue los enlaces internos y comprueba que
//  - todo enlace que abre otra pestaña lo anuncia y protege la pestaña de origen;
//  - ningún enlace apunta a «#», está vacío, es «javascript:» o apunta a un ancla que no existe;
//  - todo enlace tiene un texto (o nombre accesible) que lo describe;
//  - todo enlace interno lleva a una página que existe (no a un error ni a «No hemos encontrado esta página»);
//  - ningún enlace lleva a la misma pantalla en la que ya estás (salvo el logotipo, el inicio y el menú de la propia sección);
//  - todo botón está dentro de un formulario que se envía a algún sitio (un botón suelto no hace nada);
//  - no hay elementos con aspecto de enlace (cursor de mano) que no sean ni enlaces ni botones.
import { B, rnd, browser, check, newUser, hacerAdmin, sql, datosDeAlta, pestanaDeMiFicha, mostrar, seen, terminarDiagnosticos } from "./ayudas.mjs";

import { PrismaClient } from "@prisma/client";

const MAX_PAGINAS = Number(process.env.ENLACES_MAX ?? 90);
const origen = new URL(B).origin;
// Rutas que no se recorren: acciones destructivas o de un solo uso, que no son pantallas.
// «Continuar con Google» (/api/auth/google) lleva fuera de Lona, a Google: lo comprueba tests/e2e/google.mjs sin salir a internet.
const OMITIR = [/\/mi-cuenta\/datos/, /\/mi-cuenta\/eliminar/, /\/baja/, /^\/salud/, /\/sitemap/, /\/robots/, /^\/api\/auth\/google/];

const problemas = [];
const anotar = (papel, desde, texto) => problemas.push(`[${papel}] ${desde}: ${texto}`);

async function auditarPagina(p, papel, ruta) {
  // La autoría llega con el mapa: esperar a que se dibuje o explique la alternativa sin WebGL.
  if (await p.locator(".mapa-gimnasios").count()) {
    await p.locator('.mapa-gimnasios [data-listo="si"], .mapa-gimnasios .notice-info').first().waitFor({ state: "attached", timeout: 15000 });
  }
  // 1) Lo que se ve en la propia pantalla.
  const hallazgos = await p.evaluate(() => {
    const out = [];
    const nombre = (el) => (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "").replace(/\s+/g, " ").trim();
    const aqui = location.pathname + location.search;
    for (const a of document.querySelectorAll("a")) {
      const href = a.getAttribute("href");
      const n = nombre(a) || a.querySelector("img[alt]")?.getAttribute("alt") || "";
      if (href === null) { out.push(`enlace sin dirección: «${n}»`); continue; }
      if (href === "" || href === "#" || href.toLowerCase().startsWith("javascript:")) out.push(`enlace muerto (${JSON.stringify(href)}): «${n}»`);
      else if (href.startsWith("#") && !document.getElementById(href.slice(1))) out.push(`ancla que no existe (${href}): «${n}»`);
      if (!n) out.push(`enlace sin texto ni nombre accesible (${href})`);
      if (a.target.toLowerCase() === "_blank") {
        const rel = (a.getAttribute("rel") || "").toLowerCase().split(/\s+/);
        if (!rel.includes("noopener") && !rel.includes("noreferrer")) out.push(`enlace que abre otra pestaña sin protección rel: «${n}»`);
        if (!/otra pestaña|otra página web/i.test(n)) out.push(`enlace que abre otra pestaña sin avisarlo en su nombre accesible: «${n}»`);
      }
      // Un enlace que lleva a la propia pantalla no hace nada visible (salvo el logotipo y el inicio, que siempre deben estar).
      try {
        const u = new URL(href, location.href);
        if (u.origin === location.origin && !href.startsWith("#") && u.pathname + u.search === aqui && a.target !== "_blank" && !a.closest("[aria-current], header, nav, footer") ) out.push(`enlace a esta misma pantalla (no hace nada): «${n}» → ${href}`);
      } catch { out.push(`dirección no válida: ${href}`); }
    }
    for (const b of document.querySelectorAll("button, input[type=submit], input[type=button]")) {
      const n = nombre(b) || b.getAttribute("value") || "";
      const f = b.closest("form") || (b.getAttribute("form") && document.getElementById(b.getAttribute("form")));
      // Un botón que abre o cierra un diálogo (menú) o que cambia otra parte de la pantalla (pestañas, mapa) lleva su propia función:
      // se reconoce por aria-controls / aria-haspopup o por estar dentro del diálogo.
      const abreDialogo = b.hasAttribute("aria-controls") || b.hasAttribute("aria-haspopup") || !!b.closest("dialog");
      if (!f && b.type !== "reset" && !abreDialogo) out.push(`botón suelto, sin formulario (no hace nada): «${n}»`);
      else if (f && !f.getAttribute("action") && !f.action) out.push(`formulario sin acción: «${n}»`);
      if (!n) out.push("botón sin texto ni nombre accesible");
    }
    for (const el of document.querySelectorAll("body *")) {
      if (["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "LABEL", "SUMMARY", "OPTION", "HTML", "BODY"].includes(el.tagName)) continue;
      if (el.closest("a, button, label, summary, [role=button], [role=link]")) continue;
      if (getComputedStyle(el).cursor === "pointer") out.push(`elemento con cursor de mano que no es ni enlace ni botón: <${el.tagName.toLowerCase()}> «${(el.textContent || "").trim().slice(0, 40)}»`);
    }
    return out;
  });
  for (const h of hallazgos) anotar(papel, ruta, h);
  // 2) Enlaces internos que hay que seguir.
  return p.evaluate(() => [...document.querySelectorAll("a[href]")]
    .filter((a) => a.target !== "_blank")
    .map((a) => a.href)
    .filter((h) => !h.includes("#") || new URL(h).pathname !== location.pathname));
}

async function recorrer(papel, p, semillas) {
  const cola = [...semillas];
  const vistas = new Set();
  let n = 0;
  while (cola.length && n < MAX_PAGINAS) {
    const ruta = cola.shift();
    if (vistas.has(ruta)) continue;
    vistas.add(ruta);
    if (OMITIR.some((r) => r.test(ruta))) continue;
    let respuesta;
    try { respuesta = await p.goto(origen + ruta, { waitUntil: "load" }); } catch (e) { anotar(papel, ruta, `no se pudo abrir (${e.message.split("\n")[0]})`); continue; }
    n++;
    // Una pantalla privada sin permiso redirige a «Entrar» con un aviso: es lo esperado, no un enlace roto.
    const h1 = (await p.locator("h1").first().innerText().catch(() => "")).trim();
    if (respuesta && respuesta.status() >= 400) { anotar(papel, ruta, `lleva a un error ${respuesta.status()}`); continue; }
    if (h1.startsWith("No hemos encontrado")) { anotar(papel, ruta, "lleva a «No hemos encontrado esta página»"); continue; }
    if (/Algo no ha ido bien|Error|Ha ocurrido un problema/.test(h1)) { anotar(papel, ruta, `lleva a una pantalla de error: «${h1}»`); continue; }
    const enlaces = await auditarPagina(p, papel, ruta);
    for (const href of enlaces) {
      let u; try { u = new URL(href); } catch { continue; }
      if (u.origin !== origen) continue;
      const destino = u.pathname + u.search;
      if (!vistas.has(destino)) cola.push(destino);
    }
  }
  console.log(`   ${papel}: ${n} pantallas recorridas`);
}

const SEMILLAS = ["/", "/peleadores", "/veladas", "/veladas?past=1", "/ranking", "/gimnasios", "/entrenadores", "/buscar?q=a", "/ayuda", "/privacidad", "/condiciones", "/cookies", "/aviso-legal", "/registro", "/registro?tipo=usuario", "/registro?tipo=peleador", "/registro?tipo=entidad", "/entrar", "/recuperar", "/pagina-que-no-existe"];

// Sin cuenta
const anon = await (await browser.newContext()).newPage();
await recorrer("sin cuenta", anon, SEMILLAS.filter((r) => !r.includes("no-existe")));

// Con cuenta, un papel cada vez
const cuentas = [
  ["aficionado", "FAN", `Aficion${rnd}`],
  ["peleador", "FIGHTER", `Peleador${rnd}`],
  ["organizador", "FAN", `Organiza${rnd}`],
  ["moderador", "FAN", `Moderador${rnd}`],
];
for (const [papel, rol, nombre] of cuentas) {
  const u = await newUser(nombre.replace(/\d+$/, ""), rol);
  if (papel === "organizador") sql(`update "User" set role='ORGANIZER' where email='${u.email}'`);
  if (papel === "moderador") hacerAdmin(u.email);
  if (papel === "peleador") {
    await u.p.goto(B + "/mi-ficha");
    await u.p.fill("[name=firstName]", "Enlaces"); await u.p.fill("[name=lastName]", `Prueba${rnd}`);
    await datosDeAlta(u.p);
    await u.p.click("main button:has-text('Crear mi ficha')");
    await u.p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
  }
  // El reglamento solo aparece después de elegir una división: no basta con visitar el formulario vacío.
  if (papel === "peleador") {
    await u.p.goto(B + "/mi-ficha");
    await pestanaDeMiFicha(u.p, "Combates");
    const formulario = u.p.locator('main form').filter({ has: u.p.getByRole('button', { name: 'Registrar este combate', exact: true }) });
    const division = formulario.locator('select[name="divisionId"]');
    const valor = await division.locator('option[value]:not([value=""])').first().getAttribute("value");
    await division.selectOption(valor);
    await u.p.getByRole("link", { name: /Consultar reglamento/ }).waitFor();
    await auditarPagina(u.p, papel, "/mi-ficha (división seleccionada)");
  }
  // Casos nuevos de #73: la cola vacía no permite comprobar los enlaces de fotos, vídeos y páginas avisadas.
  if (papel === "moderador") {
    const db = new PrismaClient();
    let evento;
    try {
      const autor = await db.user.findUniqueOrThrow({ where: { email: u.email } });
      evento = await db.event.create({ data: { slug: `enlaces-${rnd}`, name: `Velada enlaces ${rnd}`, date: new Date(), venue: "Pabellón", city: "Sevilla", province: "Sevilla", discipline: "KICKBOXING", level: "AMATEUR" } });
      for (const datos of [{ kind: "PHOTO", image: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=", "base64") }, { kind: "VIDEO", videoUrl: "https://www.youtube.com/watch?v=abcdefghijk" }, { kind: "VIDEO", videoKey: "enlaces-prueba.mp4", hiddenAt: new Date() }]) {
        const medio = await db.mediaItem.create({ data: { ...datos, eventId: evento.id, uploaderId: autor.id, caption: `Enlaces ${rnd}` } });
        await db.report.create({ data: { userId: autor.id, entity: "MEDIA", entityId: medio.id, reason: "OTRO", message: `Enlaces ${rnd}` } });
      }
      await db.report.create({ data: { userId: autor.id, entity: "PAGINA", entityId: "/condiciones", reason: "OTRO", message: `Enlaces ${rnd}` } });
      await u.p.goto(B + "/moderacion");
      check("la auditoría incluye los cuatro enlaces de medios y páginas en moderación", await u.p.locator('a[target="_blank"]').count() >= 4);
      await auditarPagina(u.p, papel, "/moderacion (avisos con contenido)");
      await u.p.goto(B + `/veladas/${evento.slug}`);
      const video = u.p.getByRole("link", { name: /Ver el vídeo.*otra página web/ });
      await mostrar(video);
      check("el vídeo externo avisa de la salida de forma visible", await seen(video) && (await video.innerText()).includes("otra página web"));
      await auditarPagina(u.p, papel, `/veladas/${evento.slug}`);
    } finally {
      await db.report.deleteMany({ where: { message: `Enlaces ${rnd}` } });
      if (evento) await db.event.delete({ where: { id: evento.id } });
      await db.$disconnect();
    }
  }
  await recorrer(papel, u.p, [...SEMILLAS.filter((r) => !r.includes("no-existe")), "/mi-cuenta", "/siguiendo", "/mi-ficha", "/organizador", "/moderacion", "/moderacion/historial"]);
}

// Las direcciones con identificadores (perfiles, veladas…) se agrupan para contar cada defecto una sola vez por tipo de pantalla.
const unicos = [...new Set(problemas.map((t) => t.replace(/\/[a-z0-9]{20,}\b/g, "/:id")))];
console.log(unicos.length ? "\nPROBLEMAS ENCONTRADOS:\n" + unicos.map((t) => "  - " + t).join("\n") : "");
check(`ninguna pantalla tiene enlaces ni botones que no lleven a ningún sitio (${unicos.length} problemas)`, unicos.length === 0);
await terminarDiagnosticos();
await browser.close();
