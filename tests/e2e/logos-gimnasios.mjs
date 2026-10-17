// Logotipos de gimnasios (petición del fundador, 17-10-2026: «los logos se pueden encontrar muy fácil… y mejorar las imágenes»).
// Un gimnasio sin logotipo propio enseña el que se encontró en su web (src/lib/common/gimnasios-logos.json); el que sube él mismo siempre manda.
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, check, seen, sql, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const nombre = `Logo${rnd}`;
// Un gimnasio real del registro de logotipos (se toma el primero, para no depender de cuál sea).
const SLUG_CON_LOGO = Object.keys(JSON.parse(readFileSync("src/lib/common/gimnasios-logos.json", "utf8")))[0];
const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};

// Tres gimnasios: uno con logotipo encontrado, otro sin nada, y otro que ha subido el suyo (que manda).
sql(`insert into "Gym"(id, slug, name, city, province) values
  ('logo-hallado-${rnd}', '${SLUG_CON_LOGO}', 'Cima ${nombre}', 'Villaviciosa de Odón', 'Madrid'),
  ('logo-nada-${rnd}', 'logo-nada-${rnd}', 'Sin Logo ${nombre}', 'Getafe', 'Madrid'),
  ('logo-propio-${rnd}', 'logo-propio-${rnd}', 'Propio ${nombre}', 'Leganés', 'Madrid');`);
// El gimnasio con logotipo propio: una imagen de 1x1 píxel (la que sea; lo que se comprueba es que no se redirige al hallado).
const pixel = Buffer.from("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==", "base64");
await db.profile.create({ data: { kind: "gimnasio", entityId: `logo-propio-${rnd}`, hasAvatar: true, avatar: pixel } });

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();

// La ruta de la imagen: redirige al logotipo hallado, no inventa nada para quien no lo tiene y respeta el que sube el gimnasio.
const pedir = (id) => ctx.request.get(`${B}/imagenes/gimnasio/${id}/avatar`, { maxRedirects: 0 });
const hallado = await pedir(`logo-hallado-${rnd}`);
check("el gimnasio sin logotipo propio apunta al hallado en su web", hallado.status() === 302 && hallado.headers().location === `/gimnasios/logos/${SLUG_CON_LOGO}.webp`);
const estatico = await ctx.request.get(`${B}/gimnasios/logos/${SLUG_CON_LOGO}.webp`);
check("y el archivo del logotipo se sirve como imagen", estatico.status() === 200 && estatico.headers()["content-type"] === "image/webp" && (await estatico.body()).length > 1000);
check("sin logotipo hallado ni propio, no hay imagen (quedan las iniciales)", (await pedir(`logo-nada-${rnd}`)).status() === 204);
const propio = await pedir(`logo-propio-${rnd}`);
check("el que sube el propio gimnasio manda sobre el hallado", propio.status() === 200 && propio.headers()["content-type"] === "image/webp");
check("el banner nunca se rellena con el logotipo hallado", (await ctx.request.get(`${B}/imagenes/gimnasio/logo-hallado-${rnd}/banner`, { maxRedirects: 0 })).status() === 204);

// En la lista: el logotipo se ve en la tarjeta, grande; sin logotipo salen las iniciales.
await p.goto(`${B}/gimnasios?q=${nombre}`);
await p.locator(".lista-completa summary").click();
const tarjeta = (texto) => p.locator(".lista-completa .cartel-gimnasio", { hasText: texto });
check("salen los tres gimnasios", (await p.locator(".lista-completa .cartel-gimnasio").count()) === 3);
const imagenCargada = (img) => img.evaluate((i) => (i.complete ? i.naturalWidth > 0 : new Promise((r) => { i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); })));
const cargada = async (texto) => { const img = tarjeta(texto).locator(".cartel-logo img").first(); return (await seen(img)) && (await imagenCargada(img)); };
check("la tarjeta con logotipo hallado lo muestra cargado", await cargada(`Cima ${nombre}`));
// La imagen vacía (204) desaparece al fallar su carga: se espera a que se vaya antes de comprobar (en el CI tarda más que en local).
await tarjeta(`Sin Logo ${nombre}`).locator(".cartel-logo img").first().waitFor({ state: "detached", timeout: 10000 }).catch(() => undefined);
check("la tarjeta sin logotipo no deja una imagen rota: quedan las iniciales", (await tarjeta(`Sin Logo ${nombre}`).locator(".cartel-logo img").count()) === 0 && (await tarjeta(`Sin Logo ${nombre}`).locator(".cartel-logo").innerText()).trim() === "SL");
const caja = await tarjeta(`Cima ${nombre}`).locator(".cartel-logo").boundingBox();
check("el logotipo es grande (más de 90 píxeles) y no se sale de la tarjeta", !!caja && caja.width >= 90 && caja.width <= 120);
if (process.env.CAPTURA_LOGOS) await p.locator(".lista-completa ul").screenshot({ path: process.env.CAPTURA_LOGOS });
await axe(p, "Lista de gimnasios con logotipos");

// En la ficha del gimnasio.
await p.goto(`${B}/gimnasios/${SLUG_CON_LOGO}`);
check("la ficha del gimnasio muestra su logotipo", await seen(p.locator(".profile-avatar img")) && await imagenCargada(p.locator(".profile-avatar img")));
await axe(p, "Ficha de gimnasio con logotipo");

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
if (process.exitCode) console.error("Logotipos de gimnasios: hay comprobaciones fallidas");
