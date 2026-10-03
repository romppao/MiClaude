// Colas grandes, orden estable, contexto al decidir y datos leídos antes de verificar.
// Los datos ficticios de volumen se crean solo en la base de pruebas y se retiran al terminar.
import { PrismaClient } from "@prisma/client";
import AxeBuilder from "@axe-core/playwright";
import { B, rnd, browser, check, newUser, hacerAdmin, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const prefix = `pulido_${rnd}_`;
const id = (kind, n) => `${prefix}${kind}${String(n).padStart(3, "0")}`;
const at = n => new Date(rnd - 14 * 864e5 + n * 1000);
const count = 105;
const indexes = Array.from({ length: count }, (_, i) => i);
const admin = await newUser("ModeradoraPulido"); hacerAdmin(admin.email);
const fan = await newUser("AvisosPulido");
const reporter = await db.user.findUniqueOrThrow({ where: { email: fan.email } });
const p = admin.p;
const next = nav => nav.getByRole("link", { name: "Página siguiente →", exact: true });
const rows = name => p.locator(`input[name=${name}]`);
const card = (name, value) => p.locator("section.card, div.card").filter({ has: p.locator(`input[name=${name}][value="${value}"]`) });

try {
  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  await visitor.goto(B + "/respaldar");
  await visitor.getByRole("heading", { name: "Entrar en tu cuenta", exact: true }).waitFor();
  check("respaldar sin sesión explica el acceso y conserva la pantalla a la que volver", new URL(visitor.url()).searchParams.get("next") === "/respaldar" && new URL(visitor.url()).searchParams.get("problema") === "sin_sesion" && await visitor.locator("input[name=next]").inputValue() === "/respaldar");
  await visitor.locator("input[name=email]").fill(admin.email);
  await visitor.locator("input[name=password]").fill("contraseña123");
  await visitor.getByRole("button", { name: "Entrar en mi cuenta", exact: true }).click();
  await visitor.waitForURL("**/respaldar");
  await visitor.getByRole("heading", { name: "Respaldar resultados y títulos", exact: true }).waitFor();
  check("quien puede respaldar vuelve a esa pantalla después de entrar", new URL(visitor.url()).pathname === "/respaldar");
  await visitorContext.close();
  await db.user.createMany({ data: indexes.map(i => ({ id: id("u", i), email: `${id("u", i)}@example.test`, name: `Persona ficticia ${i}`, passwordHash: "cuenta-ficticia-sin-acceso", role: "FIGHTER", emailVerifiedAt: at(i) })) });
  await db.fighter.createMany({ data: indexes.map(i => ({ id: id("f", i), slug: id("f", i), firstName: "Deportista", lastName: `Ficticio ${i}`, userId: id("u", i), province: "Valencia", createdAt: at(i) })) });
  await db.fighterDiscipline.createMany({ data: indexes.map(i => ({ fighterId: id("f", i), discipline: "BOXEO", level: "AMATEUR", weightClass: "M70" })) });
  await db.gym.createMany({ data: indexes.map(i => ({ id: id("g", i), slug: id("g", i), name: `${prefix} Gimnasio ${String(i).padStart(3, "0")}`, city: "Valencia", province: "Valencia" })) });
  await db.report.createMany({ data: indexes.map(i => ({ id: id("r", i), userId: reporter.id, entity: "FIGHTER", entityId: id("f", i), reason: "DATOS", message: `${prefix} Aviso ${i}`, createdAt: at(i) })) });
  await db.claimRequest.createMany({ data: indexes.map(i => ({ id: id("c", i), userId: reporter.id, fighterId: id("f", i), message: "Solicitud ficticia histórica", createdAt: at(i) })) });
  await db.organizerRequest.createMany({ data: indexes.map(i => ({ id: id("o", i), userId: id("u", i), orgName: `${prefix} Organización ${i}`, message: "Solicitud ficticia histórica", createdAt: at(i) })) });
  await db.supportAccreditation.createMany({ data: indexes.map(i => ({ id: id("a", i), userId: id("u", i), kind: "FEDERATION", name: `${prefix} Federación ${i}`, disciplines: ["BOXEO"], evidenceUrl: "https://example.com/identidad", note: "Identidad ficticia de prueba", active: i !== 0, createdAt: at(i) })) });
  await db.fighterAchievement.createMany({ data: indexes.map(i => ({ id: id("t", i), fighterId: id("f", i), championship: `${prefix} Campeonato ${i}`, organization: "Organización ficticia", scope: "NATIONAL", awardedOn: at(0), discipline: "BOXEO", level: "AMATEUR", weightClass: "M70", declarationKey: id("t", i), supportKind: i === 104 ? "FEDERATION" : "DECLARED", supportAccreditationId: i === 104 ? id("a", 0) : null, reviewRequestedAt: at(i), createdAt: at(i) })) });
  await db.event.createMany({ data: ["s", "n", "d"].map(kind => ({ id: id(`e${kind}`, 0), slug: id(`e${kind}`, 0), name: `${prefix} Velada ${kind}`, date: at(0), discipline: "BOXEO", level: "AMATEUR", venue: "Recinto ficticio", city: "Valencia", province: "Valencia" })) });
  await db.bout.createMany({ data: ["s", "n", "d"].flatMap(kind => indexes.slice(1).map(i => ({ id: id(`b${kind}`, i), eventId: id(`e${kind}`, 0), fighterAId: id("f", 0), fighterBId: id("f", i), result: "A_WIN", method: "UD", verification: kind === "d" ? "DISPUTED" : "SELF_REPORTED", flags: kind === "s" ? ["MISMO_DIA"] : [], pairKey: `${id("f", 0)}:${id("f", i)}` }))) });
  await db.auditLog.createMany({ data: indexes.concat(Array.from({ length: 246 }, (_, i) => i + 105)).map(i => ({ id: id("l", i), entity: "ACHIEVEMENT", entityId: id("t", 104), action: "REVIEW_REQUESTED", after: { evidenceUrl: "https://example.com/acta", note: `Solicitud ficticia ${i}` }, createdAt: at(1001 + i) })) });
  await db.auditLog.create({ data: { id: id("singular", 0), entity: "ACHIEVEMENT", entityId: id("t", 103), action: "REVIEW_REQUESTED", after: { evidenceUrl: "https://example.com/otra-acta", note: "Fuente singular que no debe desaparecer" }, createdAt: at(1000) } });

  const totals = await Promise.all([
    db.report.count({ where: { status: "OPEN" } }), db.claimRequest.count({ where: { status: "PENDING" } }), db.organizerRequest.count({ where: { status: "PENDING" } }), db.gym.count(),
    db.bout.count({ where: { verification: { in: ["SELF_REPORTED", "CONFIRMED"] }, flags: { isEmpty: false } } }),
    db.bout.count({ where: { verification: { in: ["SELF_REPORTED", "CONFIRMED"] }, flags: { isEmpty: true } } }),
    db.bout.count({ where: { verification: "DISPUTED" } }),
  ]);
  const thirdSize = n => Math.min(50, n - 100);
  await p.goto(B + "/moderacion");
  for (const [field, nav] of [["reportId", "avisos"], ["claimId", "reclamaciones"], ["requestId", "solicitudes de organizador"], ["gymId", "gimnasios"]]) {
    check(`${nav}: muestra el total y permite acceder a las siguientes páginas`, await rows(field).count() === 50 && await next(p.getByRole("navigation", { name: `Páginas de ${nav}`, exact: true })).count() === 1);
  }
  for (const name of ["combates con señales", "combates sin señales", "combates en revisión"]) {
    check(`${name}: también tiene paginación propia`, await next(p.getByRole("navigation", { name: `Páginas de ${name}`, exact: true })).count() === 1);
  }
  const keys = ["avisos", "reclamaciones", "organizadores", "gimnasios", "senales", "combates", "revision"];
  await p.goto(B + `/moderacion?${keys.map(k => `${k}=3`).join("&")}`);
  check("todas las colas permiten llegar a registros posteriores al antiguo límite de 100", await rows("reportId").count() === thirdSize(totals[0]) && await rows("claimId").count() === thirdSize(totals[1]) && await rows("requestId").count() === thirdSize(totals[2]) && await rows("gymId").count() === thirdSize(totals[3]) && await rows("boutId").count() === totals.slice(4).reduce((sum,n) => sum + thirdSize(n), 0));
  const href = await p.getByRole("navigation", { name: "Páginas de avisos", exact: true }).getByRole("link", { name: "← Página anterior" }).getAttribute("href");
  check("cambiar una cola conserva las páginas de las demás y lleva a su sección", href.includes("avisos=2") && href.includes("gimnasios=3") && href.endsWith("#avisos"));
  const reportOrder = await db.report.findMany({ where: { status: "OPEN" }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true } });
  const reportPage = Math.floor(reportOrder.findIndex(r => r.id === id("r", 104)) / 50) + 1;
  await p.goto(B + `/moderacion?${keys.map(k => `${k}=${k === "avisos" ? reportPage : 3}`).join("&")}`);
  const twin = await p.context().newPage(); await twin.goto(p.url());
  const reportRow = p.locator("tr").filter({ has: p.locator(`input[name=reportId][value="${id("r", 104)}"]`) });
  await reportRow.getByRole("button", { name: /Cerrar: no hay error/ }).click();
  await p.locator(".notice-ok").waitFor();
  check("resolver un caso conserva páginas y sección", p.url().includes(`avisos=${reportPage}`) && p.url().includes("gimnasios=3") && p.url().includes("seccion=avisos") && await p.getByRole("link", { name: "Volver a los avisos", exact: true }).count() === 1);
  await p.waitForFunction(() => document.activeElement?.classList.contains("notice-ok"));
  await p.waitForFunction(() => { const r = document.querySelector(".notice-ok")?.getBoundingClientRect(); return r && r.top >= 0 && r.bottom <= innerHeight; });
  check("el aviso queda visible y enfocado aunque la cola esté lejos de la cabecera", await p.locator(".notice-ok").evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
  await twin.locator("tr").filter({ has: twin.locator(`input[name=reportId][value="${id("r", 104)}"]`) }).getByRole("button", { name: /Cerrar: no hay error/ }).click();
  await twin.locator(".notice-bad").waitFor();
  check("una pantalla antigua no escribe otra resolución del mismo aviso", await db.auditLog.count({ where: { entity: "REPORT", entityId: id("r", 104) } }) === 1);
  await twin.close();

  const boutId = id("bn", 104);
  const boutOrder = await db.bout.findMany({ where: { verification: { in: ["SELF_REPORTED", "CONFIRMED"] }, flags: { isEmpty: true } }, orderBy: [{ event: { date: "desc" } }, { id: "asc" }], select: { id: true } });
  const boutPage = Math.floor(boutOrder.findIndex(b => b.id === boutId) / 50) + 1;
  await p.goto(B + `/moderacion?combates=${boutPage}`);
  const boutRow = p.locator("tr").filter({ has: p.locator(`input[name=boutId][value="${boutId}"]`) });
  await db.bout.update({ where: { id: boutId }, data: { result: "B_WIN" } });
  await boutRow.getByRole("button", { name: /^Verificar combate:/ }).click();
  await p.locator(".notice-bad", { hasText: "El combate ha cambiado" }).waitFor();
  check("moderación no verifica un resultado cambiado después de abrir la página", (await db.bout.findUniqueOrThrow({ where: { id: boutId } })).verification === "SELF_REPORTED");

  await p.goto(B + `/respaldar?q=${prefix}&combates=2`);
  check("la cola de respaldos también permite recorrer todos los títulos", await next(p.getByRole("navigation", { name: "Páginas de títulos para respaldar" })).count() === 1 && await rows("achievementId").count() === 100);
  const title104 = card("achievementId", id("t", 104));
  check("un respaldo retirado se identifica como declaración en la revisión", await title104.locator("p").filter({ hasText: "Declarado por el deportista" }).count() === 1);
  check("quien revisa ve el nivel y la categoría del hecho", (await title104.innerText()).includes("Amateur") && (await title104.innerText()).includes("70"));
  const title103 = card("achievementId", id("t", 103));
  check("un título activo ofrece exclusión, sin una restauración que retire su respaldo por error", await title103.getByRole("button", { name: "Restaurar como declarado" }).count() === 0 && await title103.getByRole("button", { name: "Excluir título indicando el motivo" }).count() === 1);
  await title103.getByText("Fuente aportada en la solicitud de revisión", { exact: true }).click();
  check("muchas solicitudes de un título no ocultan la fuente de otros", (await title103.innerText()).includes("Fuente singular que no debe desaparecer"));
  const nextTitle = await next(p.getByRole("navigation", { name: "Páginas de títulos para respaldar" })).getAttribute("href");
  check("la paginación de títulos conserva la búsqueda y la página de combates", nextTitle.includes(`q=${prefix}`) && nextTitle.includes("combates=2") && nextTitle.includes("titulos=2"));
  await p.goto(B + `/respaldar?q=${prefix}&titulos=3&combates=2`);
  const oldTitle = card("achievementId", id("t", 0));
  const reject = oldTitle.locator("form").filter({ has: p.getByRole("button", { name: "Excluir título indicando el motivo" }) });
  await reject.locator("input[name=note]").fill("Exclusión ficticia de prueba");
  await reject.getByRole("button", { name: "Excluir título indicando el motivo" }).click();
  await p.locator(".notice-ok").waitFor();
  await oldTitle.getByText("Excluido por moderación", { exact: false }).waitFor();
  check("un título excluido ofrece restauración en lugar de otra exclusión", await oldTitle.getByRole("button", { name: "Restaurar como declarado" }).count() === 1 && await oldTitle.getByRole("button", { name: "Excluir título indicando el motivo" }).count() === 0);
  check("la decisión sobre un título conserva búsqueda, ambas páginas y sección", p.url().includes(`q=${prefix}`) && p.url().includes("titulos=3") && p.url().includes("combates=2") && p.url().includes("seccion=titulos") && await p.getByRole("link", { name: "Volver a los títulos", exact: true }).count() === 1);
  check("la búsqueda de combates permite llegar a los antiguos después del límite", await p.locator("details.card").count() === 50);

  await p.goto(B + `/moderacion/acreditaciones?q=${prefix}&pagina=3`);
  check("acreditaciones permite buscar y llegar a la última página", await p.locator("div.card").count() === 5);
  const accreditation = card("email", `${id("u", 1)}@example.test`);
  await accreditation.getByRole("button", { name: "Retirar acreditación" }).click();
  await p.locator(".notice-ok").waitFor();
  await accreditation.getByRole("button", { name: "Reactivar acreditación comprobada" }).waitFor();
  check("retirar una acreditación conserva la búsqueda y la página", p.url().includes(`q=${prefix}`) && p.url().includes("pagina=3") && await accreditation.getByRole("button", { name: "Reactivar acreditación comprobada" }).count() === 1);
  await p.goto(B + "/moderacion/acreditaciones?q=no-existe-esta-acreditacion");
  check("una búsqueda vacía ofrece un mensaje y una forma de quitar el filtro", await p.getByText("No hay acreditaciones con esta búsqueda.", { exact: true }).count() === 1 && await p.getByRole("link", { name: "Quitar búsqueda" }).count() === 1);
  await p.goto(B + `/moderacion/historial?entity=ACHIEVEMENT&id=${id("t", 104)}&pagina=8`);
  check("el historial permite consultar cambios posteriores al antiguo límite de 200", (await p.locator("main").innerText()).includes("Mostrando del 351 al 351 de 351 cambios") && await p.locator("tbody tr").count() === 1);
  await p.goto(B + "/moderacion?avisos=constructor&revision=9999");
  check("parámetros inválidos o fuera de rango no rompen las colas", await rows("reportId").count() === 50 && await rows("boutId").count() === 100 + (totals[6] % 50 || 50));
  const a11y = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  check("las colas con paginación y nombres diferenciados no añaden incumplimientos axe", a11y.violations.length === 0);
} finally {
  // Solo nuestros identificadores: nunca borrar ejemplos ni datos de otros guiones.
  await db.report.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.claimRequest.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.organizerRequest.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.auditLog.deleteMany({ where: { OR: [{ id: { startsWith: prefix } }, { entityId: { startsWith: prefix } }] } });
  await db.bout.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.event.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.fighterAchievement.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.supportAccreditation.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.fighter.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.gym.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.user.deleteMany({ where: { id: { startsWith: prefix } } });
  await terminarDiagnosticos();
  await db.$disconnect();
  await browser.close();
}
