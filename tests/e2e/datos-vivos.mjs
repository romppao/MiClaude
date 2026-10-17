// Dos sesiones sobre una lista: cambios del servidor al recuperar el foco, sin pisar un filtro sin enviar.
import { PrismaClient } from "@prisma/client";
import { B, browser, check, rnd, enDias, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const marca = `Viva${rnd}`;
const datos = { date: new Date(`${enDias(7)}T18:00:00Z`), level: "AMATEUR", venue: "Recinto de prueba", city: "Madrid", province: "Madrid" };
await db.event.create({ data: { ...datos, slug: `viva-base-${rnd}`, name: `${marca} primera` } });
const contexto = await browser.newContext({ viewport: { width: 390, height: 844 } });
const pagina = await contexto.newPage();
await pagina.goto(`${B}/veladas?q=${marca}`, { waitUntil: "networkidle" });
await pagina.getByText(`${marca} primera`, { exact: true }).waitFor();
// El reloj solo evita esperar veinte segundos reales entre eventos; no cambia las reglas del producto.
await pagina.clock.install();
await db.event.create({ data: { ...datos, slug: `viva-nueva-${rnd}`, name: `${marca} segunda` } });
await pagina.clock.fastForward(21_000);
await pagina.evaluate(() => window.dispatchEvent(new Event("focus")));
await pagina.getByText(`${marca} segunda`, { exact: true }).waitFor({ timeout: 10_000 });
check("la nueva velada aparece al recuperar el foco, sin recargar a mano", await pagina.getByText(`${marca} segunda`, { exact: true }).isVisible());

const filtro = pagina.locator('main input[name="q"]');
await filtro.fill("Mi filtro todavía sin enviar");
await db.event.update({ where: { slug: `viva-nueva-${rnd}` }, data: { name: `${marca} actualizada` } });
await pagina.clock.fastForward(21_000);
await pagina.evaluate(() => window.dispatchEvent(new Event("focus")));
await pagina.waitForTimeout(300);
check("recuperar foco mientras se escribe conserva el filtro sin enviar", await filtro.inputValue() === "Mi filtro todavía sin enviar");
check("el refresco se evita mientras ese campo tiene el foco", await pagina.getByText(`${marca} segunda`, { exact: true }).isVisible() && await pagina.getByText(`${marca} actualizada`, { exact: true }).count() === 0);

await pagina.locator("h1").click();
await pagina.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
await pagina.getByText(`${marca} actualizada`, { exact: true }).waitFor({ timeout: 10_000 });
check("al volver a la pestaña sin escribir se recibe el cambio pendiente", await pagina.getByText(`${marca} actualizada`, { exact: true }).isVisible());
await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
