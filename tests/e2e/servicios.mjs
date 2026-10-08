// Servicios a mano (petición del fundador, 8 de octubre de 2026): acciones principales en el panel de cada tipo de cuenta, «Buscar clases»
// y retos a combate y propuestas de sparring entre peleadores (propuesta n.º 1 del diseño v3).
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, btn, check, seen, sql, esperarCorreo, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};
const acciones = async (p) => (await p.getByRole("navigation", { name: "Acciones principales" }).locator("strong").allInnerTexts()).map((t) => t.trim());
async function peleador(nombre, disciplina = "BOXEO") {
  const u = await newUser(nombre, "FIGHTER");
  await u.p.setViewportSize({ width: 390, height: 844 });
  await u.p.goto(B + "/mi-ficha");
  await u.p.fill("[name=firstName]", nombre); await u.p.fill("[name=lastName]", `Servicios${rnd}`);
  await u.p.selectOption("select[name=discipline]", disciplina); await u.p.selectOption("select[name=province]", "Valencia");
  await btn(u.p, "Crear mi ficha"); await u.p.locator(".notice-ok").waitFor();
  const f = await db.fighter.findFirstOrThrow({ where: { firstName: nombre, lastName: `Servicios${rnd}` } });
  return { ...u, f };
}

// 1) Visitante: «¿Qué quieres hacer?» arriba, con «Buscar clases».
const visita = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await visita.goto(B + "/");
const queHacer = visita.getByRole("heading", { name: "¿Qué quieres hacer?" });
const actualidad = visita.getByRole("heading", { name: "Actualidad", exact: true });
check("el visitante ve «¿Qué quieres hacer?» antes que las noticias", (await queHacer.boundingBox()).y < ((await actualidad.boundingBox())?.y ?? Infinity));
check("y entre sus acciones está «Buscar clases»", (await acciones(visita)).includes("Buscar clases"));

// 2) Entrenador con una clase; «Buscar clases» la encuentra y deja solicitarla.
const ent = await newUser("Profe", "FAN"); sql(`update "User" set role='TRAINER' where email='${ent.email}';`);
await ent.p.goto(B + "/registro/perfil"); await ent.p.locator("label.chip", { hasText: "Muay Thai" }).click(); await ent.p.selectOption("[name=province]", "Valencia");
await ent.p.getByRole("button", { name: "Siguiente" }).click(); await ent.p.waitForURL("**/registro/clase**");
await ent.p.goto(B + "/mi-panel");
check("el entrenador sin perfil ya ve «Crear una velada» y «Crear un interclub» arriba", JSON.stringify((await acciones(ent.p)).slice(0, 2)) === JSON.stringify(["Crear una velada", "Crear un interclub"]));
await ent.p.getByRole("button", { name: "Publicar mi perfil" }).click(); await ent.p.waitForURL("**/mis-clases**");
const nueva = ent.p.locator("#nueva form");
await nueva.locator("[name=title]").fill(`Clinch ${rnd}`); await nueva.locator("[name=price]").fill("30");
await nueva.getByRole("button", { name: "Publicar la clase" }).click(); await ent.p.locator(".notice-ok", { hasText: "Clase publicada" }).waitFor();
await ent.p.goto(B + "/mi-panel");
const accEnt = await acciones(ent.p);
check("el panel del entrenador empieza por crear velada e interclub, publicar clase y solicitudes", ["Crear una velada", "Crear un interclub", "Publicar una clase", "Solicitudes de clase"].every((t, i) => accEnt[i] === t));
await ent.p.locator(".accion-principal", { hasText: "Crear un interclub" }).click(); await ent.p.waitForURL("**/organizador**");
check("«Crear un interclub» lleva al formulario con «Interclub» ya elegido", await ent.p.locator("input[name=kind][value=INTERCLUB]").isChecked());
await visita.goto(B + `/clases?q=${encodeURIComponent(`Clinch ${rnd}`)}`);
check("«Buscar clases» encuentra la clase con su entrenador y precio", await seen(visita.locator("main section", { hasText: `Clinch ${rnd}` }).getByText("30 €")));
await visita.goto(B + `/clases?q=${encodeURIComponent(`Clinch ${rnd}`)}&disciplina=BOXEO`);
check("y el filtro de disciplina la deja fuera si no es la suya", await seen(visita.getByText("Ninguna clase coincide con estos filtros")));
await visita.goto(B + `/clases?q=${encodeURIComponent(`Clinch ${rnd}`)}&disciplina=MUAYTHAI`);
check("con su disciplina sí sale, y se puede solicitar", await seen(visita.getByRole("link", { name: new RegExp(`^Solicitar la clase «Clinch ${rnd}»`) })));
await axe(visita, "Buscar clases");

// 3) Aficionado: acciones principales.
const fan = await newUser("Aficion", "FAN");
await fan.p.goto(B + "/mi-panel");
const accFan = await acciones(fan.p);
check("el panel del aficionado empieza por «Buscar clases» y tiene «Mis reservas»", accFan[0] === "Buscar clases" && accFan.includes("Mis reservas"));

// 4) Retos y sparring entre dos peleadores.
const ana = await peleador("Ana");
const bea = await peleador("Bea");
await ana.p.goto(B + "/mi-panel");
check("el panel del peleador tiene «Retar o proponer sparring» y «Mis propuestas»", (await acciones(ana.p)).includes("Retar o proponer sparring") && (await acciones(ana.p)).includes("Mis propuestas"));
await fan.p.goto(B + `/peleadores/${bea.f.slug}`);
check("un aficionado (sin ficha) no ve los botones de retar", await fan.p.getByRole("link", { name: "Retar a combate" }).count() === 0);
await ana.p.goto(B + `/peleadores/${bea.f.slug}`);
await ana.p.getByRole("link", { name: "Retar a combate" }).click(); await ana.p.waitForURL("**/proponer?tipo=FIGHT");
check("el formulario llega con «Reto a combate» y la disciplina común elegidos", await ana.p.locator("input[name=kind][value=FIGHT]").isChecked() && await ana.p.locator("input[name=discipline][value=BOXEO]").isChecked());
await axe(ana.p, "Retar o proponer sparring");
await ana.p.fill("[name=place]", "Club Turia");
await ana.p.fill("[name=message]", "A tres asaltos");
await btn(ana.p, "Enviar la propuesta"); await ana.p.waitForURL("**/propuestas**");
check("la propuesta se envía y sale en «Enviadas» esperando respuesta", await seen(ana.p.locator(".notice-ok", { hasText: "Propuesta enviada" })) && await seen(ana.p.locator("#pestana-enviadas article", { hasText: "Reto a combate" }).getByText("Esperando respuesta")));
const correo = await esperarCorreo(bea.email, "te reta a un combate");
check("la otra peleadora recibe un correo, y al responderlo le llega a quien retó", !!correo && correo.includes(`reply_to=${ana.email}`) && correo.includes("Club Turia"));
// Sparring repetido: solo una abierta del mismo tipo.
for (let i = 0; i < 2; i++) {
  await ana.p.goto(B + `/peleadores/${bea.f.slug}/proponer?tipo=SPARRING`);
  await btn(ana.p, "Enviar la propuesta"); await ana.p.waitForURL("**/propuestas**");
}
check("no se puede enviar dos veces el mismo tipo mientras espera respuesta", await seen(ana.p.locator(".notice-bad", { hasText: "Ya tienes una propuesta de ese tipo" })) && (await db.fightProposal.count({ where: { fromId: ana.f.id, toId: bea.f.id, kind: "SPARRING" } })) === 1);
await bea.p.goto(B + "/mi-panel");
check("el panel de quien la recibe cuenta las propuestas pendientes", (await bea.p.locator(".accion-principal", { hasText: "Mis propuestas" }).locator(".aviso-accion").innerText()).startsWith("2"));
await bea.p.goto(B + "/propuestas");
await axe(bea.p, "Mis propuestas");
const reto = bea.p.locator("#pestana-recibidas article", { hasText: "Reto a combate" });
await reto.locator("[name=reply]").fill("Hecho, el 15 en el Turia");
await reto.getByRole("button", { name: "Aceptar" }).click();
check("quien recibe el reto lo acepta", await seen(bea.p.locator(".notice-ok", { hasText: "Has aceptado la propuesta" })));
check("y quien retó recibe la respuesta por correo", !!(await esperarCorreo(ana.email, "Hecho, el 15 en el Turia")));
await ana.p.goto(B + "/propuestas#pestana-enviadas");
const enviada = ana.p.locator("#pestana-enviadas article", { hasText: "Reto a combate" });
check("quien retó ve «Aceptada», la respuesta y el correo para concretarlo", await seen(enviada.getByText("Aceptada")) && await seen(enviada.getByText("Hecho, el 15 en el Turia")) && await enviada.locator(`a[href="mailto:${bea.email}"]`).count() === 1);
const sparring = ana.p.locator("#pestana-enviadas article", { hasText: "Sparring" });
await sparring.getByRole("button", { name: /Cancelar la propuesta/ }).click();
check("puede cancelar el sparring pendiente y se avisa a la otra peleadora", await seen(ana.p.locator(".notice-ok", { hasText: "Has cancelado la propuesta" })) && !!(await esperarCorreo(bea.email, "ha cancelado su propuesta")));
check("todo queda en el historial", (await db.auditLog.count({ where: { entity: "PROPOSAL", action: { in: ["PROPOSED", "PROPOSAL_ACCEPTED", "PROPOSAL_CANCELLED"] }, userId: { in: [(await db.user.findUniqueOrThrow({ where: { email: ana.email } })).id, (await db.user.findUniqueOrThrow({ where: { email: bea.email } })).id] } } })) === 4);

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
