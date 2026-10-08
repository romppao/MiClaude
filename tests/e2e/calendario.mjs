// Regresión del calendario por día de Madrid y orientación de las pantallas públicas.
// Solo se ejecuta contra la base local/de CI de las ayudas, nunca contra la demo pública.
import { B, rnd, browser, seen, check, sql, enDias, terminarDiagnosticos } from "./ayudas.mjs";

const prefix = `Calendario${rnd}`;
for (const [suffix, offset] of [["Ayer", -1], ["Hoy", 0], ["Manana", 1]]) {
  const id = `${prefix}${suffix}`;
  sql(`insert into "Event" (id,slug,name,date,discipline,level,venue,city,province,status) values ('${id}','${id.toLowerCase()}','${id}','${enDias(offset)}T12:00:00Z','BOXEO','AMATEUR','Recinto de prueba','Madrid','Madrid','SCHEDULED');`);
}
const page = await (await browser.newContext()).newPage();
const cards = async () => page.locator("main .grid a.card").allTextContents();
await page.goto(`${B}/veladas?q=${prefix}`);
check("el calendario de hoy y próximas incluye hoy y mañana", await seen(page.locator("main .card", { hasText: `${prefix}Hoy` })) && (await cards()).some(t => t.includes(`${prefix}Manana`)) && !(await cards()).some(t => t.includes(`${prefix}Ayer`)));
await page.goto(`${B}/veladas?q=${prefix}&past=1`);
check("las pasadas incluyen ayer y excluyen hoy y mañana", await seen(page.locator("main .card", { hasText: `${prefix}Ayer` })) && !(await cards()).some(t => t.includes(`${prefix}Hoy`) || t.includes(`${prefix}Manana`)));
await page.goto(`${B}/veladas?q=${prefix}&past=todas&province=Madrid&disciplina=BOXEO`);
check("todas las fechas recupera los tres días", await seen(page.locator("main .card", { hasText: `${prefix}Hoy` })) && (await cards()).length === 3);
await page.getByRole("group", { name: "Filtros aplicados" }).getByRole("link", { name: "Madrid (quitar este filtro)", exact: true }).click();
await page.waitForURL(u => !u.searchParams.has("province"));
check("quitar provincia conserva búsqueda, disciplina y periodo", new URL(page.url()).searchParams.get("q") === prefix && new URL(page.url()).searchParams.get("disciplina") === "BOXEO" && new URL(page.url()).searchParams.get("past") === "todas");
await page.goto(`${B}/veladas?q=${prefix}&past=desconocido`);
check("un periodo desconocido usa hoy y próximas sin error", await seen(page.locator("main .card", { hasText: `${prefix}Hoy` })) && !(await cards()).some(t => t.includes(`${prefix}Ayer`)));

// Orientación inicial y explicaciones visibles, sin depender del volumen de datos.
await page.goto(B);
check("la portada ofrece un recorrido por objetivo", await seen(page.getByRole("heading", { name: "¿Qué quieres hacer?", exact: true })) && await seen(page.getByRole("link", { name: /^Encontrar dónde entrenar/ })));
await page.goto(`${B}/ranking`);
await page.locator("main details summary", { hasText: "¿Cómo se calcula el ránking?" }).click();
check("el ránking explica periodo, empates y clasificación", await seen(page.getByText("El total no se divide por el número de combates:", { exact: false })) && (await page.locator("main").innerText()).includes("No es una clasificación deportiva oficial") && (await page.locator("main").innerText()).includes("la trayectoria y sus respaldos se mantienen"));
await page.goto(`${B}/ayuda#respaldo`);
check("la ayuda explica el resultado declarado en ambas fichas y la confirmación opcional", await seen(page.getByRole("heading", { name: "Qué significan las etiquetas de un combate" })) && (await page.locator("main").innerText()).includes("se muestra como declarado en ambas fichas") && (await page.locator("main").innerText()).includes("El aviso por sí solo no lo suspende"));
await terminarDiagnosticos();
await browser.close();
