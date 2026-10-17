// Moderación con papel propio (17 de octubre de 2026, petición del fundador: «cuando entro como moderador, las pantallas son muy confusas»):
// «Mi panel» es «Hoy», barra inferior propia, menú solo con su trabajo, un número por tipo de trabajo y la siguiente tarea.
import AxeBuilder from "@axe-core/playwright";
import { B, rnd, browser, newUser, check, seen, sql, hacerAdmin, terminarDiagnosticos } from "./ayudas.mjs";

const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};

// Trabajo pendiente conocido: una denuncia abierta y un gimnasio por revisar.
sql(`insert into "Report"(id, entity, "entityId", reason, message, status) values ('mod-rep-${rnd}', 'PAGINA', '/peleadores', 'otro', 'Aviso de prueba ${rnd}', 'OPEN');
  insert into "Gym"(id, slug, name, city, province, status) values ('mod-gym-${rnd}', 'mod-gym-${rnd}', 'Gimnasio por revisar ${rnd}', 'Madrid', 'Madrid', 'PENDING');`);

const mod = await newUser("Moderadora", "FAN");
hacerAdmin(mod.email);
await mod.p.setViewportSize({ width: 390, height: 844 });

// 1) «Mi panel» lleva a «Hoy»: moderación no tiene panel de aficionado.
await mod.p.goto(B + "/mi-panel");
await mod.p.waitForURL(/\/moderacion\/hoy$/);
check("«Mi panel» de moderación es «Hoy»", await seen(mod.p.getByRole("heading", { name: "Hoy", level: 1 })));
check("no sale nada de aficionado («todavía no sigues a ningún peleador»)", !(await mod.p.locator("main").innerText()).includes("no sigues"));

// 2) Un número por tipo de trabajo, agrupado, y la siguiente tarea (las denuncias van primero).
const siguiente = mod.p.locator("a.siguiente-tarea");
check("hay un botón grande con la siguiente tarea", await seen(siguiente));
check("la siguiente tarea son las denuncias, que van antes que nada", (await siguiente.innerText()).includes("Denuncias de usuarios"));
check("los tres grupos de trabajo", (await mod.p.locator("main h2").allInnerTexts()).filter((t) => ["Personas", "Contenido", "Datos y sistema"].includes(t)).length === 3);
const tarjeta = (texto) => mod.p.locator(".hoy-tareas a", { hasText: texto });
check("«Gimnasios por revisar» cuenta el que acabo de crear", Number((await tarjeta("Gimnasios por revisar").locator("strong").innerText()).trim()) >= 1);
check("lo que no tiene trabajo se resume en «Al día», sin tarjetas vacías", (await mod.p.locator(".al-dia-lista").count()) >= 1 && (await mod.p.locator(".hoy-tareas .dato", { hasText: /^[^0-9]*$/ }).count()) === 0);
check("cada número lleva a su cola", (await mod.p.locator(".hoy-tareas a").evaluateAll((as) => as.every((a) => a.getAttribute("href")?.startsWith("/moderacion")))));

// 3) Barra inferior propia: Hoy · Bandeja · Historial · Cuenta, con una sola pestaña activa.
const barra = mod.p.locator("nav.mobile-nav");
check("la barra inferior es la de moderación", (await barra.locator("a").allInnerTexts()).map((t) => t.trim()).join("|") === "Hoy|Bandeja|Historial|Cuenta");
check("en «Hoy», solo «Hoy» está activa", (await barra.locator("a[aria-current=page]").allInnerTexts()).map((t) => t.trim()).join("|") === "Hoy");
check("sin «Mi panel», «Peleadores» ni «Veladas» de aficionado", (await barra.getByText(/Mi panel|Peleadores|Veladas|Inicio/).count()) === 0);
await axe(mod.p, "Hoy");
if (process.env.CAPTURA_HOY) await mod.p.screenshot({ path: process.env.CAPTURA_HOY, fullPage: true });

// 4) La bandeja sigue siendo la de siempre y la barra la marca a ella, no a «Hoy».
await barra.getByRole("link", { name: "Bandeja" }).click();
await mod.p.waitForURL(/\/moderacion$/);
check("«Bandeja» abre la bandeja de moderación", await seen(mod.p.getByRole("heading", { name: "Bandeja de moderación" })));
check("en la bandeja, solo «Bandeja» está activa", (await barra.locator("a[aria-current=page]").allInnerTexts()).map((t) => t.trim()).join("|") === "Bandeja");
await barra.getByRole("link", { name: "Historial" }).click();
await mod.p.waitForURL(/\/moderacion\/historial$/);
check("en el historial, solo «Historial» está activa", (await barra.locator("a[aria-current=page]").allInnerTexts()).map((t) => t.trim()).join("|") === "Historial");

// 5) El menú: solo su trabajo.
await mod.p.goto(B + "/moderacion/hoy");
await mod.p.getByRole("button", { name: "Menú", exact: true }).click();
const menu = mod.p.getByRole("dialog", { name: "Explora Lona", exact: true });
check("el menú tiene «Trabajo de moderación»", await seen(menu.getByRole("heading", { name: "Trabajo de moderación", exact: true })));
const textoMenu = await menu.innerText();
check("y nada de aficionado: ni «Peleadores que sigo» ni reservas ni «Mi panel»", !/Peleadores que sigo|Mis reservas|Mi panel|Mis vídeos/.test(textoMenu));
check("«Explorar» sigue ahí: moderación también consulta lo público", await seen(menu.getByRole("heading", { name: "Explorar", exact: true })));
await mod.p.keyboard.press("Escape");

// 6) Quien no es moderador no entra a «Hoy».
const fan = await newUser("Aficionada", "FAN");
await fan.p.goto(B + "/moderacion/hoy");
check("una persona sin permiso no ve «Hoy»", !/\/moderacion\/hoy$/.test(fan.p.url()) && (await fan.p.locator("a.siguiente-tarea").count()) === 0);

await terminarDiagnosticos();
await browser.close();
if (process.exitCode) console.error("Moderador: hay comprobaciones fallidas");
