// Invitaciones a peleadores (plan aprobado el 17-10-2026): una organización aprobada o un entrenador invita a un peleador concreto; el peleador
// acepta (y solo entonces se comparte el contacto que eligió) o rechaza; límites, bloqueo y casos que no se pueden invitar.
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, btn, check, seen, sql, enDias, esperarCorreo, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};
const apellido = `Invitado${rnd}`;
async function peleador(nombre, { nacimiento = "1995-05-05", disciplina = "KICKBOXING" } = {}) {
  const u = await newUser(nombre, "FIGHTER");
  await u.p.setViewportSize({ width: 390, height: 844 });
  await u.p.goto(B + "/mi-ficha");
  await u.p.fill("[name=firstName]", nombre); await u.p.fill("[name=lastName]", apellido);
  await u.p.selectOption("select[name=discipline]", disciplina); await u.p.selectOption("select[name=province]", "Valencia");
  await btn(u.p, "Crear mi ficha"); await u.p.locator(".notice-ok").waitFor();
  const f = await db.fighter.findFirstOrThrow({ where: { firstName: nombre, lastName: apellido } });
  sql(`update "Fighter" set "birthDate"='${nacimiento}' where id='${f.id}';`);
  return { ...u, f };
}
const aviso = (p, texto) => seen(p.locator(".notice-ok", { hasText: texto }));
const problema = (p, texto) => seen(p.locator(".notice-bad", { hasText: texto }));

// 1) Preparación: organización con una velada de inscripción abierta, entrenador con un peleador, y peleadores de cada tipo.
const org = await newUser("OrgInvita", "FAN"); sql(`update "User" set role='ORGANIZER' where email='${org.email}';`);
sql(`insert into "OrganizerRequest"(id, "userId", "orgName", kind, status, "createdAt") values ('orgreq${rnd}', (select id from "User" where email='${org.email}'), 'Promotora Invita ${rnd}', 'PROMOTORA', 'APPROVED', now());`);
await org.p.setViewportSize({ width: 390, height: 844 });
await org.p.goto(B + "/organizador?tipo=velada");
const nombreEvento = `Velada Invitaciones ${rnd}`;
await org.p.fill("[name=name]", nombreEvento); await org.p.fill("[name=date]", enDias(40));
await org.p.selectOption("select[name=discipline]", "KICKBOXING"); await org.p.fill("[name=city]", "Valencia"); await org.p.selectOption("select[name=province]", "Valencia");
await org.p.selectOption("select[name=level]", "AMATEUR");
await btn(org.p, "Crear el evento"); await org.p.waitForURL((u) => /\/organizador\/[^/]+$/.test(u.pathname));

const ana = await peleador("Ana");
const menor = await peleador("Menor", { nacimiento: "2012-03-03" });
const cerrado = await peleador("Cerrado");
sql(`update "Fighter" set "acceptsInvitations"=false where id='${cerrado.f.id}';`);
const duenio = await peleador("Duenio");
const ent = await newUser("Entrena", "FAN"); sql(`update "User" set role='TRAINER' where email='${ent.email}';`);
sql(`insert into "Trainer"(id, slug, name, "userId") values ('tr${rnd}', 'entrena-${rnd}', 'Entrenador Invita ${rnd}', (select id from "User" where email='${ent.email}')); update "Fighter" set "trainerId"='tr${rnd}' where id='${duenio.f.id}';`);
await ent.p.setViewportSize({ width: 390, height: 844 });

// 2) Quién ve el botón y quién puede invitar.
await org.p.goto(B + `/peleadores/${ana.f.slug}`);
check("una organización aprobada ve «Invitar a este peleador» en su ficha", await seen(org.p.getByRole("link", { name: "Invitar a este peleador" })));
const visita = await newUser("Aficionado", "FAN");
await visita.p.goto(B + `/peleadores/${ana.f.slug}`);
check("un aficionado no ve el botón de invitar", (await visita.p.getByRole("link", { name: "Invitar a este peleador" }).count()) === 0);
await visita.p.goto(B + `/peleadores/${ana.f.slug}/invitar`);
check("y si entra a la dirección, se le explica quién puede invitar", await seen(visita.p.locator(".notice-bad", { hasText: "Solo pueden invitar a peleadores las organizaciones aprobadas" })));
await org.p.goto(B + `/peleadores/${menor.f.slug}/invitar`);
check("a una persona menor de edad no se la puede invitar y no se dice por qué", await seen(org.p.locator(".notice", { hasText: "no recibe invitaciones ahora mismo" })));
await org.p.goto(B + `/peleadores/${cerrado.f.slug}/invitar`);
check("quien cerró las invitaciones tampoco las recibe", await seen(org.p.locator(".notice", { hasText: "no recibe invitaciones ahora mismo" })));

// 3) La organización invita a Ana a su velada.
await org.p.goto(B + `/peleadores/${ana.f.slug}/invitar`);
check("el formulario ofrece sus veladas con inscripción abierta", (await org.p.locator("select[name=eventId]").innerText()).includes(nombreEvento));
await org.p.selectOption("select[name=eventId]", { label: (await org.p.locator("select[name=eventId] option", { hasText: nombreEvento }).innerText()).trim() });
await org.p.fill("[name=message]", "Nos encantaría contar contigo en el cartel");
await axe(org.p, "Invitar a un peleador");
await btn(org.p, "Enviar la invitación");
check("la invitación se envía y se explica qué pasa después", await aviso(org.p, "Invitación enviada") && org.p.url().includes("/invitaciones"));
check("sale en «Mis invitaciones» esperando respuesta", await seen(org.p.locator("article", { hasText: "Esperando respuesta" }).filter({ hasText: "Nos encantaría contar contigo" })));
check("a Ana le llega el correo de la invitación", await esperarCorreo(ana.email, "te invita a participar"));
await org.p.goto(B + `/peleadores/${ana.f.slug}/invitar`);
await org.p.selectOption("select[name=eventId]", { label: (await org.p.locator("select[name=eventId] option", { hasText: nombreEvento }).innerText()).trim() });
await btn(org.p, "Enviar la invitación");
check("repetir la misma invitación mientras espera respuesta no deja", await problema(org.p, "Ya tienes una invitación igual"));

// 4) Ana elige compartir su teléfono y acepta.
await ana.p.goto(B + "/propuestas");
check("Ana ve la pestaña «Invitaciones (1)» con la organización y el mensaje", await seen(ana.p.getByRole("link", { name: "Invitaciones (1)" })) && await seen(ana.p.locator("article", { hasText: `Promotora Invita ${rnd}` }).filter({ hasText: "Nos encantaría contar contigo" })));
await ana.p.locator("label.chip", { hasText: "Mi teléfono" }).click();
await ana.p.fill("[name=phone]", "612 345 678");
await ana.p.locator("#titulo-ajustes-invitaciones").locator("xpath=..").getByRole("button", { name: "Guardar" }).click();
check("guarda sus ajustes de contacto", await aviso(ana.p, "Guardado"));
await ana.p.goto(B + "/propuestas");
await axe(ana.p, "Mis propuestas con invitaciones");
await ana.p.getByRole("button", { name: "Aceptar la invitación" }).click();
check("Ana acepta y se le dice qué se ha compartido", await aviso(ana.p, "Has aceptado la invitación"));
check("«Inscribirme en la velada» aparece tras aceptar", await seen(ana.p.getByRole("link", { name: "Inscribirme en la velada" })));
await org.p.goto(B + "/invitaciones");
check("la organización ve el teléfono elegido y solo ese dato", await seen(org.p.locator("article", { hasText: "Contacto compartido: Teléfono: 612345678" })) && !(await org.p.locator("main").innerText()).includes(ana.email));
check("y recibe el correo de la aceptación con el contacto", await esperarCorreo(org.email, "Teléfono: 612345678"));
check("ya no se puede retirar una invitación respondida", (await org.p.getByRole("button", { name: "Retirar la invitación" }).count()) === 0);

// 5) El entrenador invita a Ana a entrenar juntos y ella rechaza: no se puede repetir.
await ent.p.goto(B + `/peleadores/${ana.f.slug}/invitar?tipo=TRAIN`);
check("el entrenador puede proponer entrenar juntos", await seen(ent.p.locator("label", { hasText: "Entrenar juntos" })));
await ent.p.fill("[name=message]", "Te vendría bien un entrenador en Valencia");
await btn(ent.p, "Enviar la invitación");
check("el entrenador envía su invitación", await aviso(ent.p, "Invitación enviada"));
await ana.p.goto(B + "/propuestas");
await ana.p.locator("article", { hasText: `Entrenador Invita ${rnd}` }).getByRole("button", { name: "Rechazar" }).click();
check("Ana la rechaza", await aviso(ana.p, "Has rechazado la invitación"));
await ent.p.goto(B + "/invitaciones");
check("el entrenador ve que la rechazó, sin ningún dato de contacto", await seen(ent.p.locator("article", { hasText: "Rechazada" })) && !(await ent.p.locator("main").innerText()).includes("Contacto compartido"));
await ent.p.goto(B + `/peleadores/${ana.f.slug}/invitar?tipo=TRAIN`);
await btn(ent.p, "Enviar la invitación");
check("no puede repetirla hasta pasados 30 días", await problema(ent.p, "rechazó hace poco una invitación igual"));

// 6) Sparring en nombre de un peleador suyo y bloqueo: bloquear corta lo pendiente y la siguiente invitación ya no sale.
await ent.p.goto(B + `/peleadores/${ana.f.slug}/invitar?tipo=SPARRING`);
await ent.p.selectOption("select[name=onBehalfOfId]", duenio.f.id);
await btn(ent.p, "Enviar la invitación");
check("el entrenador propone un sparring en nombre de su peleador", await aviso(ent.p, "Invitación enviada"));
await ana.p.goto(B + "/propuestas");
await ana.p.locator(`article[aria-label^="Sparring de"]`).locator("details.bloquear > summary").click();
await ana.p.locator(`article[aria-label^="Sparring de"]`).locator("details.bloquear").getByRole("button", { name: /Bloquear a/ }).click();
await ana.p.locator(".notice-ok", { hasText: "Has bloqueado a esta persona" }).waitFor();
await ent.p.goto(B + "/invitaciones");
check("tras el bloqueo, la invitación pendiente deja de estar pendiente", await seen(ent.p.locator(`article[aria-label^="Sparring a"]`).filter({ hasText: /Rechazada|Retirada/ })));
await ent.p.goto(B + `/peleadores/${ana.f.slug}/invitar?tipo=TRAIN`);
check("y el bloqueado no puede volver a invitar: no se dice que está bloqueado", await seen(ent.p.locator(".notice", { hasText: "no recibe invitaciones ahora mismo" })));

// 7) Pantallas accesibles.
await axe(org.p, "Mis invitaciones");

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
if (process.exitCode) console.error("Invitaciones: hay comprobaciones fallidas");
