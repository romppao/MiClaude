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
check("el panel del entrenador empieza por crear velada e interclub, publicar clase y solicitudes", ["Publicar una clase", "Crear una velada o interclub", "Mis clases", "Mis veladas"].every((t, i) => accEnt[i] === t));
await ent.p.locator(".accion-principal", { hasText: "Crear una velada o interclub" }).click(); await ent.p.waitForURL("**/organizador**");
await ent.p.locator("label.chip", { has: ent.p.locator('input[name=kind][value=INTERCLUB]') }).click();
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
check("el aficionado sin reservas ve Buscar clases y no un acceso vacío a Mis reservas", accFan[0] === "Buscar clases" && !accFan.includes("Mis reservas") && accFan.length <= 4);
const fanUser = await db.user.findUniqueOrThrow({ where: { email: fan.email } });
const offeredClass = await db.trainingClass.findFirstOrThrow({ where: { title: `Clinch ${rnd}` } });
await db.classRequest.create({ data: { classId: offeredClass.id, userId: fanUser.id, preferred: "Por acordar", status: "PENDING" } });
await fan.p.reload();
check("cuando tiene una solicitud, Mis reservas aparece entre sus accesos", (await acciones(fan.p)).includes("Mis reservas"));

// 4) Retos y sparring entre dos peleadores.
const ana = await peleador("Ana");
const bea = await peleador("Bea");
// El fundador no conoce el nombre: elige ciudad y gimnasio y encuentra a quien encaja.
const gym = await db.gym.create({ data: { name: `Turia filtros ${rnd}`, slug: `turia-filtros-${rnd}`, city: "Valencia", province: "Valencia" } });
await db.fighter.update({ where: { id: bea.f.id }, data: { gymId: gym.id, city: "Valencia", stance: "ZURDO" } });
// Clubes sin un perfil reclamado, ocultos o de otra disciplina/guardia no deben ofrecerse.
const descartados = [];
for (const caso of ["sin-titular", "oculto", "otra-disciplina", "otra-guardia"]) {
  const club = await db.gym.create({ data: { name: `Descartado ${caso} ${rnd}`, slug: `${caso}-${rnd}`, city: "Valencia", province: "Valencia" } });
  descartados.push(club.id);
  const titular = caso === "sin-titular" ? null : await db.user.create({ data: { name: caso, email: `${caso}-${rnd}@test.es`, passwordHash: "sin-acceso", role: "FIGHTER" } });
  await db.fighter.create({ data: { slug: `filtro-${caso}-${rnd}`, firstName: "Descartado", lastName: caso, city: "Valencia", province: "Valencia", gymId: club.id, userId: titular?.id, hiddenAt: caso === "oculto" ? new Date() : null, stance: caso === "otra-guardia" ? "ORTODOXO" : "ZURDO", disciplines: { create: { discipline: caso === "otra-disciplina" ? "MMA" : "BOXEO", level: "AMATEUR" } } } });
}
await ana.p.goto(B + "/propuestas?provincia=Valencia&guardia=ZURDO");
const busqueda = ana.p.getByRole("search", { name: "Buscar rival o sparring" });
check("se puede elegir ciudad y gimnasio sin escribir sus nombres", await seen(busqueda.locator("select[name=ciudad]")) && await seen(busqueda.locator("select[name=gimnasioId]")));
const opcionesGym = await busqueda.locator("select[name=gimnasioId] option").evaluateAll(xs => xs.map(x => x.value));
check("los gimnasios ofrecidos excluyen fichas sin titular, ocultas o incompatibles", opcionesGym.includes(gym.id) && descartados.every(id => !opcionesGym.includes(id)));
await busqueda.locator("select[name=ciudad]").selectOption("Valencia");
await busqueda.getByRole("button", { name: "Aplicar filtros" }).click(); await ana.p.waitForURL(u => u.searchParams.get("ciudad") === "Valencia");
await busqueda.locator("select[name=gimnasioId]").selectOption(gym.id);
await busqueda.getByRole("button", { name: "Aplicar filtros" }).click(); await ana.p.waitForURL(u => u.searchParams.get("gimnasioId") === gym.id);
const candidata = ana.p.locator("#proponer article", { hasText: `Bea Servicios${rnd}` });
check("sin nombre escrito aparecen candidatos de la ciudad, gimnasio y guardia elegidos", await seen(candidata) && await busqueda.locator("[name=q]").inputValue() === "");
for (const [tipo, nombre] of [["FIGHT", `Retar a Bea Servicios${rnd}`], ["SPARRING", `Proponer un sparring a Bea Servicios${rnd}`]]) {
  await candidata.getByRole("link", { name: nombre, exact: true }).click();
  await ana.p.waitForURL(u => u.pathname.endsWith("/proponer") && u.searchParams.get("tipo") === tipo);
  check(`el candidato elegido permite abrir ${tipo === "FIGHT" ? "reto oficial" : "sparring"}`, await seen(ana.p.locator(`input[name=kind][value=${tipo}]`)) && await ana.p.locator(`input[name=kind][value=${tipo}]`).isChecked());
  await ana.p.goto(B + `/propuestas?provincia=Valencia&guardia=ZURDO&ciudad=Valencia&gimnasioId=${gym.id}`); await ana.p.waitForURL(u => u.searchParams.get("gimnasioId") === gym.id);
}
// Revisión de la búsqueda en móvil real, con los dos temas y filtros abiertos.
for (const tema of ["claro", "oscuro"]) {
  await ana.p.evaluate(t => localStorage.setItem("lona:tema", t), tema); await ana.p.reload();
  await ana.p.waitForFunction(t => document.documentElement.dataset.tema === t, tema);
  check(`búsqueda a 390 px en tema ${tema} conserva los controles y no desborda`, await seen(busqueda.locator("select[name=ciudad]")) && await seen(busqueda.locator("select[name=gimnasioId]")) && await ana.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await axe(ana.p, `Búsqueda móvil ${tema}`);
  await ana.p.screenshot({ path: `test-results/sparring-${tema}.png`, fullPage: true });
}
await ana.p.goto(B + "/mi-panel");
check("el panel del peleador tiene «Retar o proponer sparring» y «Mis propuestas»", (await acciones(ana.p)).includes("Retos y sparrings") && (await acciones(ana.p)).length === 4);
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
check("el panel de quien la recibe cuenta las propuestas pendientes", (await bea.p.locator(".accion-principal", { hasText: "Retos y sparrings" }).locator(".aviso-accion").innerText()).startsWith("2"));
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
