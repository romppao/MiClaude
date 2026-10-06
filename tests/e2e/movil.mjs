// Móvil primero (prioridad del fundador, 6 de octubre de 2026): casi todo el uso será desde iOS y Android y el objetivo es publicarla en App Store y Google Play.
// Recorre las pantallas con la emulación de un iPhone y de un Android (tamaño, táctil, factor de pantalla) como cada papel y comprueba, en cada una:
//  - no hay desplazamiento horizontal (nada se sale por la derecha);
//  - se puede ampliar con los dedos (la etiqueta viewport no lo bloquea);
//  - los campos de formulario tienen al menos 16 px (si no, iOS amplía la pantalla al tocarlos);
//  - todo lo que se pulsa mide al menos 44 × 44 px (botones, campos y enlaces que no van dentro de una frase);
//  - el texto corrido mide al menos 16 px;
//  - la barra fija inferior no tapa el final de la pantalla;
//  - ningún elemento sale por la derecha de la pantalla aunque no provoque desplazamiento (recortado).
// LÍMITE: solo hay Chromium. Se emulan las medidas y el táctil de iPhone y Android, pero NO el motor de Safari (WebKit): el comportamiento propio de iOS
// (barra de direcciones, teclado, zonas seguras) hay que comprobarlo en un iPhone real o con un servicio de pruebas en dispositivos.
import { devices } from "playwright-core";
import { B, rnd, browser, check, newUser, hacerAdmin, sql, datosDeAlta, terminarDiagnosticos } from "./ayudas.mjs";

const origen = new URL(B).origin;
const PERFILES = [
  ["iPhone SE (375 px)", { ...devices["iPhone SE"] }],
  ["iPhone 14 (390 px)", { ...devices["iPhone 14"] }],
  ["Android Pixel 7 (412 px)", { ...devices["Pixel 7"] }],
  ["Android pequeño (360 px)", { viewport: { width: 360, height: 740 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices["Pixel 5"].userAgent }],
];
const MIN_TACTIL = 44;
const problemas = [];
const anotar = (perfil, papel, ruta, texto) => problemas.push(`[${perfil}] [${papel}] ${ruta}: ${texto}`);

async function auditar(p, perfil, papel, ruta) {
  const r = await p.evaluate((min) => {
    const out = [];
    const visible = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !el.closest("[hidden], dialog:not([open])"); };
    const desc = (el) => `<${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}> «${(el.getAttribute("aria-label") || el.textContent || el.getAttribute("name") || "").replace(/\s+/g, " ").trim().slice(0, 40)}»`;
    const ancho = innerWidth;
    if (document.documentElement.scrollWidth > ancho + 1) out.push(`se desplaza en horizontal (${document.documentElement.scrollWidth} px de contenido en ${ancho} px de pantalla)`);
    const vp = document.querySelector("meta[name=viewport]")?.getAttribute("content") ?? "";
    if (!/width=device-width/.test(vp)) out.push("falta la etiqueta viewport con width=device-width");
    if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/.test(vp)) out.push(`el viewport impide ampliar con los dedos (${vp})`);
    // Campos de formulario: 16 px como mínimo (iOS amplía la pantalla al tocar un campo menor).
    for (const el of document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), select, textarea")) {
      if (!visible(el)) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16) out.push(`campo con letra de ${fs} px (iOS amplía la pantalla al tocarlo): ${desc(el)}`);
    }
    // Zonas táctiles.
    for (const el of document.querySelectorAll("button, input:not([type=hidden]), select, textarea, summary, [role=button], a[href]")) {
      if (!visible(el)) continue;
      const limpio = (x) => (x.textContent || "").replace(/\s+/g, " ").trim();
      if (el.matches("a[href]") && el.parentElement && getComputedStyle(el).display === "inline" && limpio(el.parentElement) !== limpio(el)) continue; // enlace dentro de una frase (hay más texto a su alrededor)
      if (el.matches("a.skip")) continue;
      if (el.matches("input[type=checkbox], input[type=radio]") ) { const l = el.closest("label"); if (l) { const b = l.getBoundingClientRect(); if (b.height >= min) continue; } }
      const b = el.getBoundingClientRect();
      if (b.height < min - 0.5 || (b.width < min - 0.5 && !el.matches("a[href]"))) out.push(`zona táctil de ${Math.round(b.width)}×${Math.round(b.height)} px (mínimo ${min}): ${desc(el)}`);
    }
    // Texto corrido pequeño.
    const pequeños = new Set();
    for (const el of document.querySelectorAll("main p, main li, main td, main th, main label span, main .hint, main .mut, footer a, footer p")) {
      if (!visible(el) || !(el.textContent || "").trim()) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 15.5 && ![...el.children].some((c) => (c.textContent || "").trim() === (el.textContent || "").trim())) pequeños.add(`${fs}px ${desc(el)}`);
    }
    for (const t of [...pequeños].slice(0, 6)) out.push(`texto de menos de 16 px: ${t}`);
    // Elementos que salen por la derecha.
    for (const el of document.querySelectorAll("main *, header *, footer *")) {
      if (!visible(el)) continue;
      const b = el.getBoundingClientRect();
      if (b.right > ancho + 1 && !el.closest(".table-wrap, [role=region][tabindex], pre, code, dialog")) { out.push(`sale por la derecha de la pantalla (${Math.round(b.right)} px): ${desc(el)}`); break; }
    }
    // Barra fija inferior que tape el final.
    const barra = document.querySelector(".mobile-nav");
    if (barra && getComputedStyle(barra).display !== "none" && getComputedStyle(barra).position === "fixed") {
      const alto = barra.getBoundingClientRect().height;
      const pie = document.querySelector("footer.foot") || document.querySelector("main");
      const relleno = parseFloat(getComputedStyle(document.body).paddingBottom) + parseFloat(getComputedStyle(pie).paddingBottom) + parseFloat(getComputedStyle(pie).marginBottom);
      if (relleno + 1 < alto) out.push(`la barra fija inferior (${Math.round(alto)} px) puede tapar el final de la pantalla (margen inferior: ${Math.round(relleno)} px)`);
    }
    return out;
  }, MIN_TACTIL);
  for (const t of r) anotar(perfil, papel, ruta, t);
  return p.evaluate(() => [...document.querySelectorAll("a[href]")].filter((a) => a.target !== "_blank").map((a) => a.href));
}

const SEMILLAS = ["/", "/peleadores", "/veladas", "/ranking", "/gimnasios", "/entrenadores", "/ayuda", "/privacidad", "/registro", "/registro?tipo=entidad", "/entrar", "/recuperar", "/buscar?q=a", "/pagina-que-no-existe"];
const SEGUIR = [/^\/peleadores\/[^/?]+$/, /^\/veladas\/[^/?]+$/, /^\/gimnasios\/[^/?]+$/, /^\/entrenadores\/[^/?]+$/];

async function recorrer(perfil, opciones, papel, cuenta, privadas) {
  const ctx = await browser.newContext(opciones);
  if (cuenta?.cookies) await ctx.addCookies(cuenta.cookies);
  const p = await ctx.newPage();
  if (cuenta?.email) { // iniciar sesión en este contexto
    await p.goto(B + "/entrar"); await p.fill("[name=email]", cuenta.email); await p.fill("[name=password]", "contraseña123"); await p.click("main button:has-text('Entrar')"); await p.waitForURL((u) => !u.pathname.startsWith("/entrar"));
  }
  const rutas = [...SEMILLAS, ...privadas];
  const vistos = new Set();
  const porPatron = new Map();
  for (let i = 0; i < rutas.length; i++) {
    const ruta = rutas[i];
    if (vistos.has(ruta)) continue; vistos.add(ruta);
    try { await p.goto(origen + ruta, { waitUntil: "load" }); } catch (e) { anotar(perfil, papel, ruta, `no se pudo abrir (${e.message.split("\n")[0]})`); continue; }
    const enlaces = await auditar(p, perfil, papel, ruta);
    // Una pantalla de cada tipo (ficha, velada…): la primera que se encuentre.
    for (const h of enlaces) { let u; try { u = new URL(h); } catch { continue; } if (u.origin !== origen) continue; const d = u.pathname; SEGUIR.forEach((re, k) => { if (re.test(d) && !porPatron.has(k)) { porPatron.set(k, d); rutas.push(d); } }); }
  }
  await ctx.close();
  console.log(`   ${perfil} · ${papel}: ${vistos.size} pantallas`);
}

const cuentas = {
  "sin cuenta": [null, []],
};
const conCuenta = [
  ["aficionado", "FAN", ["/mi-cuenta", "/siguiendo"]],
  ["peleador", "FIGHTER", ["/mi-cuenta", "/mi-ficha", "/mi-ficha/trayectoria", "/siguiendo"]],
  ["moderador", "FAN", ["/moderacion", "/moderacion/historial", "/mi-cuenta"]],
];
const usuarios = {};
for (const [papel, rol] of conCuenta) {
  const u = await newUser(`Movil${papel.replace(/[^a-z]/g, "")}`, rol);
  if (papel === "moderador") hacerAdmin(u.email);
  if (papel === "peleador") { await u.p.goto(B + "/mi-ficha"); await u.p.fill("[name=firstName]", "Movil"); await u.p.fill("[name=lastName]", `Prueba${rnd}`); await datosDeAlta(u.p); await u.p.click("main button:has-text('Crear mi ficha')"); await u.p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor(); }
  usuarios[papel] = u;
}
for (const [perfil, opciones] of PERFILES) {
  await recorrer(perfil, opciones, "sin cuenta", null, []);
  for (const [papel, , privadas] of conCuenta) await recorrer(perfil, opciones, papel, { email: usuarios[papel].email }, privadas);
}

const unicos = [...new Set(problemas.map((t) => t.replace(/\/[a-z0-9]{20,}\b/g, "/:id")))];
// Agrupa por defecto (sin perfil ni papel) para que el informe se pueda leer.
const porDefecto = new Map();
for (const t of unicos) { const m = t.match(/^\[(.*?)\] \[(.*?)\] (\S+): (.*)$/); if (!m) continue; const k = `${m[3]}: ${m[4].replace(/«[^»]*»/g, "«…»")}`; porDefecto.set(k, (porDefecto.get(k) ?? 0) + 1); }
if (unicos.length) { console.log("\nPROBLEMAS EN MÓVIL (agrupados por pantalla y tipo; el número es en cuántas combinaciones de móvil/papel aparece):"); for (const [k, n] of [...porDefecto].sort()) console.log(`  - (${n}) ${k}`); }
check(`la aplicación se usa bien en móvil (${porDefecto.size} tipos de problema)`, unicos.length === 0);
await terminarDiagnosticos();
await browser.close();
