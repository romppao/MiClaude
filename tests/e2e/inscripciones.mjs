// Inscripción de peleadores en veladas e interclubs (propuesta n.º 3 del diseño v3; petición del fundador, 9 de octubre de 2026): el
// organizador abre la inscripción, los peleadores piden participar y el organizador filtra, ordena, acepta o rechaza (una a una o varias
// a la vez), descarga la lista y empareja a los aceptados en el cartel.
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, btn, check, seen, sql, enDias, esperarCorreo, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};
const apellido = `Inscrito${rnd}`;
async function peleador(nombre, provincia, disciplina = "KICKBOXING") {
  const u = await newUser(nombre, "FIGHTER");
  await u.p.setViewportSize({ width: 390, height: 844 });
  await u.p.goto(B + "/mi-ficha");
  await u.p.fill("[name=firstName]", nombre); await u.p.fill("[name=lastName]", apellido);
  await u.p.selectOption("select[name=discipline]", disciplina); await u.p.selectOption("select[name=province]", provincia);
  await btn(u.p, "Crear mi ficha"); await u.p.locator(".notice-ok").waitFor();
  const f = await db.fighter.findFirstOrThrow({ where: { firstName: nombre, lastName: apellido } });
  return { ...u, f };
}

// 1) El organizador crea un interclub y abre la inscripción con requisitos y fecha límite.
const org = await newUser("Organiza", "FAN"); sql(`update "User" set role='ORGANIZER' where email='${org.email}';`);
await org.p.setViewportSize({ width: 390, height: 844 });
await org.p.goto(B + "/organizador?tipo=interclub");
const nombreEvento = `Interclub Inscripciones ${rnd}`;
await org.p.fill("[name=name]", nombreEvento); await org.p.fill("[name=date]", enDias(40));
await org.p.selectOption("select[name=discipline]", "KICKBOXING"); await org.p.fill("[name=city]", "Valencia"); await org.p.selectOption("select[name=province]", "Valencia");
check("al crear un evento, la inscripción viene marcada para abrirse", await org.p.locator("input[name=inscripcion]").isChecked());
// Aquí se desmarca para probar también cómo se abre después.
await org.p.locator("input[name=inscripcion]").uncheck();
await btn(org.p, "Crear el evento"); await org.p.waitForURL((u) => /\/organizador\/[^/]+$/.test(u.pathname));
const slug = new URL(org.p.url()).pathname.split("/").pop();
check("sin marcarla, el evento recién creado tiene la inscripción cerrada", await seen(org.p.locator("#inscripcion").getByText("Cerrada", { exact: true })));
await org.p.locator("#inscripcion [name=note]").fill("Mínimo un combate amateur y licencia en vigor");
await org.p.locator("#inscripcion [name=until]").fill(enDias(30));
await org.p.locator("#inscripcion").getByRole("button", { name: "Abrir la inscripción" }).click();
check("abre la inscripción", await seen(org.p.locator(".notice-ok")) && await seen(org.p.locator("#inscripcion").getByText("Abierta", { exact: true })));
await axe(org.p, "Gestión del evento con la inscripción");

// 2) Un visitante lo encuentra entre los eventos con inscripción abierta.
const visita = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await visita.goto(B + `/veladas?inscripcion=abierta&q=${encodeURIComponent(nombreEvento)}&past=todas`);
check("el calendario filtra los eventos con inscripción abierta y los marca", await seen(visita.locator("a.card", { hasText: nombreEvento }).getByText("Inscripción abierta")));
await visita.goto(B + `/veladas/${slug}`);
check("la página pública enseña los requisitos y «Solicitar participar»", await seen(visita.getByText("Mínimo un combate amateur")) && await seen(visita.getByRole("link", { name: "Solicitar participar" })));

// 3) Tres peleadores piden participar; uno de otra disciplina no puede.
const ana = await peleador("Ana", "Valencia");
const bea = await peleador("Bea", "Sevilla");
const cris = await peleador("Cris", "Valencia");
const otro = await peleador("Otro", "Valencia", "BOXEO");
sql(`update "Fighter" set "birthDate"='1998-05-01' where id='${ana.f.id}'; update "Fighter" set "birthDate"='2006-03-01' where id='${bea.f.id}';`);
await ana.p.goto(B + "/mi-panel");
check("el panel del peleador tiene «Inscribirme en una velada» y «Mis inscripciones»", await seen(ana.p.locator(".accion-principal", { hasText: "Inscribirme en una velada" })) && await seen(ana.p.locator(".accion-principal", { hasText: "Mis inscripciones" })));
await ana.p.goto(B + `/veladas/${slug}`);
await ana.p.getByRole("link", { name: "Solicitar participar" }).click(); await ana.p.waitForURL("**/inscribirme");
await axe(ana.p, "Pedir participar");
const pedir = async (u, peso, mensaje) => {
  await u.p.goto(B + `/veladas/${slug}/inscribirme`);
  await u.p.fill("[name=weightKg]", peso); await u.p.fill("[name=message]", mensaje);
  await btn(u.p, "Solicitar participar");
  return seen(u.p.locator(".notice-ok", { hasText: /solicitud/i }));
};
check("Ana pide participar con su peso", await pedir(ana, "70,5", "Del Club Turia, 3 combates"));
check("el organizador recibe un correo, y al responderlo le llega a Ana", !!(await esperarCorreo(org.email, "quiere participar")) && (await esperarCorreo(org.email, `reply_to=${ana.email}`)) !== null);
check("Bea y Cris también", await pedir(bea, "57", "Primera vez") && await pedir(cris, "66", ""));
await ana.p.goto(B + `/veladas/${slug}/inscribirme`);
check("Ana ve su solicitud pendiente y no puede repetirla", await seen(ana.p.getByText("Pendiente")) && await ana.p.locator("[name=weightKg]").count() === 0);
await otro.p.goto(B + `/veladas/${slug}/inscribirme`);
check("un peleador sin esa disciplina no ve el formulario y se le explica", await otro.p.locator("[name=weightKg]").count() === 0 && await seen(otro.p.locator(".notice-bad", { hasText: "que no está en tu ficha" })));

// 4) El organizador gestiona: recuentos, filtros, orden y respuesta.
await org.p.goto(B + `/organizador/${slug}`);
check("la gestión del evento enlaza a las solicitudes con su número de pendientes", await seen(org.p.getByRole("link", { name: "Gestionar las solicitudes (3 pendientes)" })));
await org.p.getByRole("link", { name: /Gestionar las solicitudes/ }).click(); await org.p.waitForURL("**/inscripciones");
const tarjetas = org.p.locator("article.tarjeta");
check("la lista sale con las tres pendientes", await seen(org.p.getByRole("link", { name: "Pendientes (3)" })) && (await tarjetas.count()) === 3);
await axe(org.p, "Solicitudes para participar");
await org.p.goto(B + `/organizador/${slug}/inscripciones?provincia=Valencia`);
check("filtra por provincia", (await tarjetas.count()) === 2 && await seen(org.p.getByRole("group", { name: "Filtros aplicados" }).getByText("Valencia")));
await org.p.goto(B + `/organizador/${slug}/inscripciones?minpeso=60&maxpeso=71`);
check("filtra por peso declarado", (await tarjetas.count()) === 2);
await org.p.goto(B + `/organizador/${slug}/inscripciones?minedad=18&maxedad=22`);
check("filtra por edad el día del evento (quien no la indicó queda fuera)", (await tarjetas.count()) === 1 && await seen(tarjetas.first().getByText("Bea")));
await org.p.goto(B + `/organizador/${slug}/inscripciones?orden=peso`);
const orden = await tarjetas.locator("strong").allInnerTexts();
check("ordena por peso de menos a más", orden[0].startsWith("Bea") && orden[2].startsWith("Ana"));
await org.p.goto(B + `/organizador/${slug}/inscripciones`);
await org.p.locator("summary", { hasText: "Más filtros" }).click();
await org.p.selectOption("select[name=provincia]", "Valencia");
await org.p.selectOption("select[name=orden]", "nombre");
await org.p.getByRole("button", { name: "Aplicar filtros" }).click(); await org.p.waitForURL("**provincia=Valencia**");
check("el formulario de filtros aplica provincia y orden", (await tarjetas.locator("strong").allInnerTexts()).join() === `Ana ${apellido},Cris ${apellido}`);
const csv = await (await org.p.request.get(B + `/organizador/${slug}/inscripciones/csv?provincia=Valencia`)).text();
check("la descarga CSV respeta los filtros", csv.includes("Ana") && csv.includes("Cris") && !csv.includes("Bea") && csv.includes("Peso declarado"));
check("y nadie más puede descargarla", (await bea.p.request.get(B + `/organizador/${slug}/inscripciones/csv`)).status() === 403);

// Varias a la vez: marcar todas (Ana y Cris) y aceptarlas con un mensaje.
await org.p.getByLabel(/Marcar todas las de esta lista/).check();
check("«Marcar todas» marca las dos y lo cuenta", await seen(org.p.getByText("2 marcadas")));
await org.p.fill("#lote [name=reply]", "Pesaje el viernes a las 18:00");
await org.p.getByRole("button", { name: "Aceptar las marcadas" }).click();
check("acepta las marcadas y vuelve a la misma lista filtrada", await seen(org.p.locator(".notice-ok")) && org.p.url().includes("provincia=Valencia"));
check("Ana y Cris reciben el correo con el mensaje", !!(await esperarCorreo(ana.email, "Pesaje el viernes")) && !!(await esperarCorreo(cris.email, "Pesaje el viernes")));
// Una sola: rechazar a Bea desde su tarjeta.
await org.p.goto(B + `/organizador/${slug}/inscripciones`);
await org.p.getByRole("button", { name: `Rechazar a Bea ${apellido}` }).click();
check("rechaza a Bea desde su tarjeta", await seen(org.p.locator(".notice-ok")) && (await db.eventRegistration.findFirstOrThrow({ where: { fighterId: bea.f.id } })).status === "DECLINED");
await org.p.goto(B + `/organizador/${slug}/inscripciones?estado=aceptadas`);
check("en «Aceptadas» se ve el correo de cada peleador para concretar", await seen(org.p.locator(`a[href="mailto:${ana.email}"]`)));

// 5) El peleador ve la respuesta; Bea no puede volver a pedirlo; Cris se retira.
await ana.p.goto(B + "/mis-inscripciones");
check("Ana ve «Aceptada» y el mensaje del organizador", await seen(ana.p.getByText("Aceptada")) && await seen(ana.p.getByText("Pesaje el viernes a las 18:00")));
await axe(ana.p, "Mis inscripciones");
await bea.p.goto(B + `/veladas/${slug}/inscribirme`);
check("Bea ve «Rechazada» y no puede volver a pedirlo", await seen(bea.p.getByText("Rechazada")) && await bea.p.locator("[name=weightKg]").count() === 0);
await cris.p.goto(B + "/mis-inscripciones");
await cris.p.getByRole("button", { name: "Retirar mi solicitud" }).click();
check("Cris retira su solicitud y se avisa al organizador", await seen(cris.p.locator(".notice-ok")) && !!(await esperarCorreo(org.email, "retira su inscripción")));

// 6) En el cartel, los aceptados salen primero.
await org.p.goto(B + `/organizador/${slug}`);
const grupo = await org.p.$eval("select[name=fighterA] optgroup", (g) => ({ etiqueta: g.label, nombres: [...g.querySelectorAll("option")].map((o) => o.textContent) }));
check("al añadir un combate, los aceptados salen primero en su propio grupo", grupo.etiqueta === "Aceptados en la inscripción" && grupo.nombres.length === 1 && grupo.nombres[0].startsWith("Ana"));
// Cerrar la inscripción: deja de verse en la página pública.
await org.p.locator("#inscripcion").getByRole("button", { name: "Cerrar la inscripción" }).click();
await org.p.locator(".notice-ok").waitFor();
await visita.goto(B + `/veladas/${slug}`);
check("al cerrarla, la página pública deja de ofrecer «Solicitar participar» y explica por qué", await visita.getByRole("link", { name: "Solicitar participar" }).count() === 0 && await seen(visita.getByRole("heading", { name: "Inscripción de peleadores: cerrada" })));
check("todo queda en el historial", (await db.auditLog.count({ where: { entity: "EVENT", action: { in: ["REGISTRATION_OPENED", "REGISTRATION_REQUESTED", "REGISTRATIONS_ACCEPTED", "REGISTRATIONS_DECLINED", "REGISTRATION_WITHDRAWN", "REGISTRATION_CLOSED"] }, entityId: (await db.event.findUniqueOrThrow({ where: { slug } })).id } })) === 8);

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
