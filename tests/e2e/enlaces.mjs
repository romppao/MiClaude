// Ni enlaces ni botones muertos (regla del fundador, 2 de octubre de 2026): todo lo que parece pulsable tiene que llevar a un sitio o hacer algo visible.
// Recorre la aplicación como cada papel (sin cuenta, aficionado, peleador, organizador y moderador), sigue los enlaces internos y comprueba que
//  - ningún enlace apunta a «#», está vacío, es «javascript:» o apunta a un ancla que no existe;
//  - todo enlace tiene un texto (o nombre accesible) que lo describe;
//  - todo enlace interno lleva a una página que existe (no a un error ni a «No hemos encontrado esta página»);
//  - ningún enlace lleva a la misma pantalla en la que ya estás (salvo el logotipo, el inicio y el menú de la propia sección);
//  - todo botón está dentro de un formulario que se envía a algún sitio (un botón suelto no hace nada);
//  - no hay elementos con aspecto de enlace (cursor de mano) que no sean ni enlaces ni botones.
import { B, rnd, browser, check, newUser, hacerAdmin, sql, datosDeAlta, terminarDiagnosticos } from "./ayudas.mjs";

const MAX_PAGINAS = Number(process.env.ENLACES_MAX ?? 90);
const origen = new URL(B).origin;
// Rutas que no se recorren: acciones destructivas o de un solo uso, que no son pantallas.
const OMITIR = [/\/mi-cuenta\/datos/, /\/mi-cuenta\/eliminar/, /\/baja/, /^\/salud/, /\/sitemap/, /\/robots/];

const problemas = [];
const anotar = (papel, desde, texto) => problemas.push(`[${papel}] ${desde}: ${texto}`);

async function auditarPagina(p, papel, ruta) {
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
      // Un enlace que lleva a la propia pantalla no hace nada visible (salvo el logotipo y el inicio, que siempre deben estar).
      try {
        const u = new URL(href, location.href);
        if (u.origin === location.origin && !href.startsWith("#") && u.pathname + u.search === aqui && a.target !== "_blank" && !a.closest("[aria-current], header, nav, footer") ) out.push(`enlace a esta misma pantalla (no hace nada): «${n}» → ${href}`);
      } catch { out.push(`dirección no válida: ${href}`); }
    }
    for (const b of document.querySelectorAll("button, input[type=submit], input[type=button]")) {
      const n = nombre(b) || b.getAttribute("value") || "";
      const f = b.closest("form") || (b.getAttribute("form") && document.getElementById(b.getAttribute("form")));
      // Un botón que abre o cierra un diálogo (menú) lleva su propia función: se reconoce por aria-controls / aria-haspopup o por estar dentro del diálogo.
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

const SEMILLAS = ["/", "/peleadores", "/veladas", "/veladas?past=1", "/ranking", "/gimnasios", "/entrenadores", "/buscar?q=a", "/ayuda", "/privacidad", "/registro", "/entrar", "/recuperar", "/pagina-que-no-existe"];

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
  await recorrer(papel, u.p, [...SEMILLAS.filter((r) => !r.includes("no-existe")), "/mi-cuenta", "/siguiendo", "/mi-ficha", "/organizador", "/moderacion", "/moderacion/historial"]);
}

// Las direcciones con identificadores (perfiles, veladas…) se agrupan para contar cada defecto una sola vez por tipo de pantalla.
const unicos = [...new Set(problemas.map((t) => t.replace(/\/[a-z0-9]{20,}\b/g, "/:id")))];
console.log(unicos.length ? "\nPROBLEMAS ENCONTRADOS:\n" + unicos.map((t) => "  - " + t).join("\n") : "");
check(`ninguna pantalla tiene enlaces ni botones que no lleven a ningún sitio (${unicos.length} problemas)`, unicos.length === 0);
await terminarDiagnosticos();
await browser.close();
