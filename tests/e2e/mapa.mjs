// Mapa de gimnasios (petición del fundador, 13 de octubre de 2026: «un mapa de la ubicación en la que se encuentra el usuario en el que
// le muestren los gimnasios más cercanos»). En las pruebas no hay salida a internet: el fondo del mapa no se descarga, pero los marcadores,
// la ubicación, los más cercanos y la lista funcionan igual, que es lo que se comprueba.
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, check, seen, sql, hacerAdmin, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const nombre = `Mapa${rnd}`;
// Uno a unos 400 m de la Puerta del Sol (con dirección), otro en Madrid sin coordenadas (centro de la provincia) y otro en Sevilla.
sql(`insert into "Gym"(id, slug, name, city, province, address, lat, lng, "geoSource", "geocodedAt") values
  ('mapa-cerca-${rnd}', 'mapa-cerca-${rnd}', 'Gimnasio Cerca ${nombre}', 'Madrid', 'Madrid', 'Calle de prueba 1', 40.4195, -3.7075, 'direccion', now()),
  ('mapa-medio-${rnd}', 'mapa-medio-${rnd}', 'Gimnasio Medio ${nombre}', 'Getafe', 'Madrid', null, null, null, null, null),
  ('mapa-lejos-${rnd}', 'mapa-lejos-${rnd}', 'Gimnasio Lejos ${nombre}', 'Sevilla', 'Sevilla', null, 37.3891, -5.9845, 'ciudad', now());`);

const SOL = { latitude: 40.4169, longitude: -3.7035 };
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, geolocation: SOL, permissions: ["geolocation"] });
const p = await ctx.newPage();
await p.goto(B + `/gimnasios?q=${nombre}`);
check("la pantalla de gimnasios tiene el mapa y el botón «Usar mi ubicación»", await seen(p.getByRole("heading", { name: "Gimnasios en el mapa" })) && await seen(p.getByRole("button", { name: "Usar mi ubicación" })));
await p.waitForFunction(() => document.querySelector(".mapa-lienzo")?.getAttribute("data-listo") === "si" || !!document.querySelector(".mapa-gimnasios .notice-info"), null, { timeout: 15000 });
const hayMapa = (await p.locator(".mapa-lienzo").getAttribute("data-listo")) === "si";
check("el mapa se dibuja (o, si el dispositivo no puede, lo dice y deja la lista)", hayMapa || await seen(p.locator(".notice-info", { hasText: "no puede mostrar el mapa" })));
if (hayMapa) check("los gimnasios de la búsqueda salen en el mapa (sueltos o agrupados)", (await p.locator(".marcador-gimnasio, .marcador-grupo").count()) >= 1);
check("la lista de siempre sigue debajo, con los tres gimnasios", (await p.locator("ul.lista-gimnasios").last().locator("li").count()) === 3);

await p.getByRole("button", { name: "Usar mi ubicación" }).click();
check("con la ubicación aparecen «Los más cercanos a ti»", await seen(p.getByRole("heading", { name: "Los más cercanos a ti" })));
const cercanos = await p.locator(".mapa-cercanos li").allInnerTexts();
check("ordenados por distancia: primero el de al lado, el de Sevilla el último", cercanos.length === 3 && cercanos[0].includes("Gimnasio Cerca") && cercanos[2].includes("Gimnasio Lejos"));
check("con la distancia escrita («a 400 m»)", /a \d+ m/.test(cercanos[0]) && /a [\d.]+ km/.test(cercanos[2]));
check("avisa de que la ubicación es aproximada cuando no hay dirección", cercanos[1].includes("ubicación aproximada") && !cercanos[0].includes("ubicación aproximada"));
for (const tema of ["light", "dark"]) {
  await p.emulateMedia({ colorScheme: tema }); await p.waitForTimeout(600);
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  check(`mapa de gimnasios (${tema === "light" ? "claro" : "oscuro"}): sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 90)}`).join(" | ")})` : ""}`, r.violations.length === 0);
}
await ctx.close();

// Sin permiso de ubicación: lo explica y ofrece la alternativa.
// (El navegador de pruebas deja la pregunta de permiso sin responder: se simula que la persona pulsa «No permitir».)
const ctxSin = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctxSin.addInitScript(() => {
  Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: (_ok, error) => setTimeout(() => error({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "denegado" }), 50) } });
});
const sinPermiso = await ctxSin.newPage();
await sinPermiso.goto(B + `/gimnasios?q=${nombre}`);
await sinPermiso.getByRole("button", { name: "Usar mi ubicación" }).click();
check("sin permiso, explica qué pasa y que se puede elegir la provincia", await seen(sinPermiso.locator(".mapa-gimnasios .notice-info", { hasText: "provincia" }), 15000));

// La dirección del gimnasio se puede escribir en su perfil, y entonces se vuelve a buscar su ubicación.
const mod = await newUser("Mapamod");
hacerAdmin(mod.email);
await mod.p.goto(B + `/perfiles/gimnasio/mapa-medio-${rnd}/editar`);
await mod.p.getByLabel("Dirección del gimnasio").fill("Avenida de prueba 7");
await mod.p.getByRole("button", { name: /Guardar/ }).first().click();
await mod.p.waitForURL("**aviso=**");
const g = await db.gym.findUnique({ where: { id: `mapa-medio-${rnd}` } });
check("la dirección se guarda y su ubicación queda pendiente de volver a buscarse", g?.address === "Avenida de prueba 7" && g.geocodedAt === null && g.lat === null);
await mod.p.goto(B + `/gimnasios/mapa-medio-${rnd}`);
check("la ficha del gimnasio muestra la dirección", await seen(mod.p.getByText("Avenida de prueba 7", { exact: false })));

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
