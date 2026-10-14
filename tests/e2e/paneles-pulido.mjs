// Bloque F: aura de ambos participantes desde el panel, también sin JavaScript.
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, check, seen, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const fan = await newUser("PanelAura");
const user = await db.user.findUniqueOrThrow({ where: { email: fan.email } });
const fighters = await Promise.all(["Rojo", "Azul"].map((firstName) => db.fighter.create({ data: { firstName, lastName: `Panel${rnd}`, slug: `panel-${firstName.toLowerCase()}-${rnd}`, level: "PRO", disciplines: { create: { discipline: "BOXEO", level: "PRO" } } } })));
const event = await db.event.create({ data: { name: `Panel aura ${rnd}`, slug: `panel-aura-${rnd}`, date: new Date(Date.now() - 3 * 864e5), discipline: "BOXEO", level: "PRO", venue: "Sala de pruebas", city: "Valencia", province: "Valencia" } });
const bout = await db.bout.create({ data: { eventId: event.id, fighterAId: fighters[0].id, fighterBId: fighters[1].id, result: "A_WIN", verification: "VERIFIED" } });
await db.follow.create({ data: { userId: user.id, fighterId: fighters[0].id } });

for (const javaScriptEnabled of [true, false]) {
  const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 844 }, storageState: await fan.p.context().storageState() });
  const p = await context.newPage();
  await p.goto(B + "/mi-panel");
  check(`panel con JS=${javaScriptEnabled}: cuatro accesos como máximo`, await p.locator(".accion-principal").count() <= 4);
  for (const fighter of fighters) {
    const name = `${fighter.firstName} ${fighter.lastName}`;
    await p.getByRole("button", { name: `Dar aura a ${name}`, exact: true }).click();
    check(`dar aura a ${name}, JS=${javaScriptEnabled}`, await seen(p.getByRole("button", { name: `Quitar aura a ${name}`, exact: true })) && new URL(p.url()).pathname === "/mi-panel");
    check("se guarda aura para ese participante", await db.aura.count({ where: { userId: user.id, boutId: bout.id, fighterId: fighter.id } }) === 1);
  }
  check("los dos participantes tienen su propio estado Hecho", await p.locator("#resultados .pildora", { hasText: "Hecho" }).count() === 2);
  for (const fighter of fighters) {
    await p.getByRole("button", { name: `Quitar aura a ${fighter.firstName} ${fighter.lastName}`, exact: true }).click();
    check("quitar aura vuelve al panel y recupera el botón", await seen(p.getByRole("button", { name: `Dar aura a ${fighter.firstName} ${fighter.lastName}`, exact: true })));
  }
  if (javaScriptEnabled) {
    const results = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    check("panel sin problemas axe", results.violations.length === 0);
    check("panel sin desbordamiento móvil", await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.goto(B + "/siguiendo");
    check("siguiendo usa tarjetas y ninguna tabla", await p.locator("main table").count() === 0 && await p.locator("main .tarjeta").count() > 0);
    const following = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    check("siguiendo sin problemas axe", following.violations.length === 0);
    check("siguiendo sin desbordamiento móvil", await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await context.close();
}
// Primer día: los intereses filtran las recomendaciones antes de limitar la lista.
await db.follow.deleteMany({ where: { userId: user.id } });
await db.aura.create({ data: { userId: user.id, boutId: bout.id, fighterId: fighters[0].id } });
await db.user.update({ where: { id: user.id }, data: { interests: ["MMA"] } });
await fan.p.goto(B + "/mi-panel");
check("sin seguidos aparecen sugerencias y no resultados vacíos", await seen(fan.p.getByRole("heading", { name: "Peleadores destacados de tus disciplinas" })) && await fan.p.locator("#resultados").count() === 0);
check("no sugiere boxeo al elegir MMA", await fan.p.getByRole("region", { name: "Peleadores destacados de tus disciplinas" }).getByText(`${fighters[0].firstName} ${fighters[0].lastName}`).count() === 0);
await db.user.update({ where: { id: user.id }, data: { interests: ["BOXEO"] } });
await fan.p.goto(B + "/mi-panel");
await fan.p.getByRole("button", { name: `Seguir a ${fighters[0].firstName} ${fighters[0].lastName}`, exact: true }).click();
check("seguir desde las recomendaciones funciona", await seen(fan.p.locator("#resultados")) && await db.follow.count({ where: { userId: user.id, fighterId: fighters[0].id } }) === 1);

// Récord por disciplina: solo se cambia la vista del titular, no su privacidad.
await db.user.update({ where: { id: user.id }, data: { role: "FIGHTER" } });
await db.fighter.update({ where: { id: fighters[0].id }, data: { userId: user.id, recordPublic: false, disciplines: { create: { discipline: "MMA", level: "AMATEUR" } } } });
await fan.p.goto(B + "/mi-panel?disciplina=MMA");
check("el titular cambia a MMA y se explica su privacidad", await seen(fan.p.getByRole("navigation", { name: "Disciplina del récord" }).locator('[aria-current="page"]', { hasText: "MMA" })) && await seen(fan.p.getByText("Tu récord amateur es privado:", { exact: false })));
check("consultar el récord no cambia su privacidad", (await db.fighter.findUniqueOrThrow({ where: { id: fighters[0].id } })).recordPublic === false);
await fan.p.getByRole("navigation", { name: "Disciplina del récord" }).getByRole("link", { name: "Boxeo", exact: true }).click();
check("el enlace permite volver a boxeo", await seen(fan.p.getByRole("navigation", { name: "Disciplina del récord" }).locator('[aria-current="page"]', { hasText: "Boxeo" })));
await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
