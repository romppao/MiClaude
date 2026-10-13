// Comprueba el plazo en la pantalla y en el récord; la frontera exacta se prueba en tests/unit/record.test.ts.
import { PrismaClient } from "@prisma/client";
import { B, browser, btn, check, datosDeAlta, enDias, newUser, registrar, rnd, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const user = await newUser("Record24h", "FIGHTER");
const p = user.p;
await p.goto(B + "/mi-ficha");
await p.fill("[name=firstName]", "Plazo");
await p.fill("[name=lastName]", `Record${rnd}`);
await datosDeAlta(p);
await btn(p, "Crear mi ficha");
await p.getByRole("link", { name: "Ver mi ficha pública", exact: true }).waitFor();

const eventName = `Autodeclarado 24 h ${rnd}`;
await registrar(p, { evento: eventName, fecha: enDias(-2), rivalNombre: "Rival", rivalApellidos: `Record${rnd}` });
const success = p.locator("[role=status]", { hasText: "Combate registrado. Contará en tu récord a partir del" });
await success.waitFor();
let ownText = await p.locator("main").innerText();
check("la declaración reciente no suma todavía en el récord propio", !ownText.includes("1-0-0"));
check("la ficha muestra la fecha y hora en que empezará a contar", await p.locator("tbody tr", { hasText: eventName }).getByText(/Declarado · cuenta en el récord a partir del/).count() === 1);

const bout = await db.bout.findFirstOrThrow({ where: { event: { name: eventName } } });
await db.bout.update({ where: { id: bout.id }, data: { createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
await p.reload();
await p.locator("main").waitFor();
ownText = await p.locator("main").innerText();
check("al cumplir 24 horas el combate se incorpora al récord", ownText.includes("1-0-0"));
check("al incorporarse al récord deja de mostrar la cuenta atrás", !ownText.includes("cuenta en el récord a partir del"));

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
