// Plazas por categoría con lista de espera, y ayuda para emparejar a los aceptados (decisión del fundador, 9 de octubre de 2026:
// «que se especifiquen los pesos para los combates, las plazas por categoría […] los emparejamientos, que no es automático, siempre con
// ayuda, que se vea el nivel, la popularidad, el número de combates»).
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, btn, check, seen, sql, enDias, esperarCorreo, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};
const apellido = `Plazas${rnd}`;
async function peleador(nombre, nacimiento) {
  const u = await newUser(nombre, "FIGHTER");
  await u.p.setViewportSize({ width: 390, height: 844 });
  await u.p.goto(B + "/mi-ficha");
  await u.p.fill("[name=firstName]", nombre); await u.p.fill("[name=lastName]", apellido);
  await u.p.selectOption("select[name=discipline]", "KICKBOXING"); await u.p.selectOption("select[name=province]", "Valencia");
  await btn(u.p, "Crear mi ficha"); await u.p.locator(".notice-ok").first().waitFor();
  const f = await db.fighter.findFirstOrThrow({ where: { firstName: nombre, lastName: apellido } });
  sql(`update "Fighter" set "birthDate"='${nacimiento}' where id='${f.id}';`);
  return { ...u, f };
}

// 1) El organizador crea el evento, abre la inscripción y ofrece plazas en dos categorías.
const org = await newUser("Promotora", "FAN"); sql(`update "User" set role='ORGANIZER' where email='${org.email}';`);
await org.p.setViewportSize({ width: 390, height: 844 });
await org.p.goto(B + "/organizador");
await org.p.fill("[name=name]", `Velada Plazas ${rnd}`); await org.p.fill("[name=date]", enDias(45));
await org.p.selectOption("select[name=discipline]", "KICKBOXING"); await org.p.fill("[name=city]", "Valencia"); await org.p.selectOption("select[name=province]", "Valencia");
await btn(org.p, "Crear el evento"); await org.p.waitForURL((u) => /\/organizador\/[^/]+$/.test(u.pathname));
const slug = new URL(org.p.url()).pathname.split("/").pop();
await org.p.locator("#inscripcion").getByRole("button", { name: "Abrir la inscripción" }).click();
await org.p.locator(".notice-ok", { hasText: "Inscripción abierta" }).first().waitFor(); await org.p.waitForLoadState("networkidle");
const evento = await db.event.findUniqueOrThrow({ where: { slug } });
// Espera a que la plaza esté guardada (el aviso de la anterior sigue en pantalla) y a que la página nueva esté lista.
const esperarPlaza = async (peso, n) => {
  for (let i = 0; i < 40; i++) { if ((await db.eventSlot.findFirst({ where: { eventId: evento.id, weightClass: peso } }))?.places === n) { await org.p.waitForLoadState("networkidle"); return true; } await new Promise((r) => setTimeout(r, 250)); }
  return false;
};
const ofrecer = async (peso, n) => {
  const f = org.p.locator('#plazas form[aria-label="Ofrecer plazas en una categoría"]');
  await f.locator("select[name=weightClass]").selectOption(peso); await f.locator("[name=places]").fill(String(n));
  await f.getByRole("button", { name: "Ofrecer plazas en esta categoría" }).click();
  return (await esperarPlaza(peso, n)) && seen(org.p.locator(".notice-ok", { hasText: "Plazas guardadas" }).first());
};
check("ofrece 2 plazas en hasta 60 kg y 1 en hasta 57 kg", await ofrecer("M60", 2) && await ofrecer("M57", 1));
check("y ve cuántas están cubiertas", await seen(org.p.locator("#plazas li", { hasText: "hasta 60 kg" }).getByText("0 de 2 plazas cubiertas")));
await axe(org.p, "Gestión del evento con plazas");

// 2) La página pública enseña las categorías y las plazas que quedan.
const visita = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await visita.goto(B + `/veladas/${slug}`);
check("la página pública enseña las categorías que busca el organizador y las plazas", await seen(visita.getByText("Categorías que busca el organizador")) && await seen(visita.locator("li", { hasText: "hasta 60 kg" }).getByText("quedan 2 plazas")));

// 3) Los peleadores eligen entre las categorías ofrecidas.
const ana = await peleador("Ana", "1998-03-01");
const bea = await peleador("Bea", "1999-06-01");
const cris = await peleador("Cris", "2007-01-01");
const dani = await peleador("Dani", "1997-01-01");
const pedir = async (u, peso) => {
  await u.p.goto(B + `/veladas/${slug}/inscribirme`);
  await u.p.locator("label", { hasText: "hasta 60 kg" }).locator("input[type=radio]").check();
  await u.p.fill("[name=weightKg]", peso);
  await btn(u.p, "Solicitar participar");
  await u.p.waitForURL("**aviso=**");
};
await ana.p.goto(B + `/veladas/${slug}/inscribirme`);
check("el peleador solo puede elegir entre las dos categorías ofrecidas", (await ana.p.locator("input[name=categoria]").count()) === 2 && await ana.p.locator("[name=weightClass]").count() === 0);
await axe(ana.p, "Pedir participar con plazas");
await pedir(ana, "60"); await ana.p.locator(".notice-ok", { hasText: "Solicitud enviada" }).first().waitFor();
await pedir(bea, "59,5"); await pedir(cris, "58");
const reg = async (u) => db.eventRegistration.findFirstOrThrow({ where: { fighterId: u.f.id } });
check("las solicitudes guardan la categoría elegida", (await reg(ana)).weightClass === "M60" && (await reg(cris)).weightClass === "M60");

// 4) Aceptar a Ana y Bea llena la categoría; Cris queda en lista de espera y no se puede aceptar.
await org.p.goto(B + `/organizador/${slug}/inscripciones?orden=nombre`);
const hastaEstado = async (u, estado) => { for (let i = 0; i < 40 && (await reg(u)).status !== estado; i++) await new Promise((r) => setTimeout(r, 250)); await org.p.waitForLoadState("networkidle"); };
for (const u of [ana, bea]) { await org.p.getByRole("button", { name: `Aceptar a ${u.f.firstName} ${apellido}` }).click(); await hastaEstado(u, "ACCEPTED"); }
await org.p.goto(B + `/organizador/${slug}/inscripciones`);
check("con la categoría llena, Cris sale «En lista de espera»", await seen(org.p.locator("article", { hasText: "Cris" }).getByText("En lista de espera")));
check("el resumen de plazas lo cuenta", await seen(org.p.locator("li", { hasText: "hasta 60 kg" }).getByText(/2 de 2 cubiertas \(completa\) · 1 en lista de espera/)));
await org.p.getByRole("button", { name: `Aceptar a Cris ${apellido}` }).click();
check("no deja aceptar más peleadores que plazas, y explica cómo seguir", await seen(org.p.locator(".notice-bad, [role=alert]", { hasText: "No quedan plazas suficientes" }).first()) && (await reg(cris)).status === "PENDING");
await cris.p.goto(B + "/mis-inscripciones");
check("Cris ve que está en lista de espera", await seen(cris.p.getByText("En lista de espera")));
await pedir(dani, "61");
check("quien pide en una categoría llena recibe el aviso de lista de espera", await seen(dani.p.locator(".notice-ok", { hasText: "lista de espera" }).first()));

// 5) Ampliar las plazas permite aceptar a Cris; no se pueden dejar menos plazas que aceptados.
await org.p.goto(B + `/organizador/${slug}#plazas`);
const fila60 = org.p.locator("#plazas li", { hasText: "hasta 60 kg" });
await fila60.locator("[name=places]").fill("1"); await fila60.getByRole("button", { name: /Guardar las plazas/ }).click();
check("no deja dejar menos plazas que peleadores aceptados", await seen(org.p.locator(".notice-bad, [role=alert]", { hasText: "más peleadores" }).first()));
await org.p.goto(B + `/organizador/${slug}#plazas`);
await org.p.waitForLoadState("networkidle");
await fila60.locator("[name=places]").fill("3"); await fila60.getByRole("button", { name: /Guardar las plazas/ }).click();
await esperarPlaza("M60", 3);
await org.p.goto(B + `/organizador/${slug}/inscripciones`);
await org.p.getByRole("button", { name: `Aceptar a Cris ${apellido}` }).click(); await hastaEstado(cris, "ACCEPTED");
check("con más plazas, Cris entra", (await reg(cris)).status === "ACCEPTED" && !!(await esperarCorreo(cris.email, "Te han aceptado")));

// 6) Ayuda para emparejar: nivel de cada uno y rivales más parecidos de su categoría; nunca automático.
await org.p.getByRole("link", { name: /Emparejar a los aceptados/ }).click(); await org.p.waitForURL("**/emparejar");
await axe(org.p, "Ayuda para emparejar");
const tarjetaAna = org.p.locator("article", { has: org.p.getByRole("link", { name: `Ana ${apellido}`, exact: true }) }).first();
check("cada aceptado muestra su nivel: récord, combates, victorias, aura, edad y peso", await seen(tarjetaAna.getByText("Combates:").first()) && await seen(tarjetaAna.getByText("Aura:").first()) && await seen(tarjetaAna.getByText("60 kg").first()));
const primero = await tarjetaAna.locator("div[style*='border-radius'] a").first().innerText();
check("a Ana le propone primero a Bea (peso y edad más parecidos que Cris)", primero.startsWith("Bea"));
check("con Cris avisa de la diferencia de edad", await seen(org.p.locator("article", { hasText: `Ana ${apellido}` }).first().getByText(/años de diferencia de edad/)));
check("aceptar no ha creado ningún combate: el cartel sigue vacío", (await db.bout.count({ where: { event: { slug } } })) === 0);
await tarjetaAna.getByRole("button", { name: `Añadir al cartel: Ana ${apellido} contra Bea ${apellido}` }).click();
check("el organizador añade el combate con un botón y vuelve a la ayuda", await seen(org.p.locator(".notice-ok", { hasText: "añadido al cartel" }).first()) && org.p.url().includes("/emparejar"));
const bout = await db.bout.findFirst({ where: { event: { slug } } });
check("el combate queda en el cartel con la categoría de la inscripción", !!bout && bout.weightClass === "M60" && [bout.fighterAId, bout.fighterBId].sort().join() === [ana.f.id, bea.f.id].sort().join());
check("Ana y Bea salen como «Ya en el cartel»", (await org.p.getByText("Ya en el cartel").count()) === 2);
await bea.p.goto(B + `/organizador/${slug}/emparejar`);
check("nadie más que su organizador abre la ayuda para emparejar", new URL(bea.p.url()).pathname === "/organizador");

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
