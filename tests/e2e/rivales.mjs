// Buscar a quién retar o con quién hacer sparring con filtros (petición del fundador, 9 de octubre de 2026: «quiero pelear contra un
// contrincante que sé que está en tal gimnasio pero no me sé su nombre […] un sparring con un par de filtros: que tenga X peleas, que
// sea zurdo…»), y la inscripción visible para el peleador aunque esté cerrada.
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, btn, check, seen, sql, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};
const apellido = `Rival${rnd}`;
async function peleador(nombre, provincia) {
  const u = await newUser(nombre, "FIGHTER");
  await u.p.setViewportSize({ width: 390, height: 844 });
  await u.p.goto(B + "/mi-ficha");
  await u.p.fill("[name=firstName]", nombre); await u.p.fill("[name=lastName]", apellido);
  await u.p.selectOption("select[name=discipline]", "MUAYTHAI"); await u.p.selectOption("select[name=province]", provincia);
  await btn(u.p, "Crear mi ficha"); await u.p.locator(".notice-ok").first().waitFor();
  const f = await db.fighter.findFirstOrThrow({ where: { firstName: nombre, lastName: apellido } });
  return { ...u, f };
}
const yo = await peleador("Yago", "Valencia");
const zurda = await peleador("Zurda", "Valencia");
const diestra = await peleador("Diestra", "Valencia");
const lejana = await peleador("Lejana", "Cádiz");
const gimnasio = `Club Rivales ${rnd}`;
sql(`insert into "Gym"(id, slug, name, city, province) values ('gym${rnd}', 'club-rivales-${rnd}', '${gimnasio}', 'Valencia', 'Valencia');
update "Fighter" set "gymId"='gym${rnd}', stance='ZURDO', "birthDate"='1999-01-01' where id='${zurda.f.id}';
update "Fighter" set "gymId"='gym${rnd}', stance='ORTODOXO', "birthDate"='1985-01-01' where id='${diestra.f.id}';
update "Fighter" set stance='ZURDO', "birthDate"='2000-01-01' where id='${lejana.f.id}';
update "FighterDiscipline" set "priorTotal"=5 where "fighterId"='${zurda.f.id}';
update "FighterDiscipline" set "priorTotal"=12 where "fighterId"='${lejana.f.id}';`);

const nombres = async () => (await yo.p.locator("#proponer article strong").allInnerTexts()).map((t) => t.split(" ")[0]).sort();
// 1) Sin filtros: sugerencias de su disciplina.
await yo.p.goto(B + "/propuestas");
check("sin filtros, sugiere «Peleadores parecidos a ti»", await seen(yo.p.getByRole("heading", { name: "Peleadores parecidos a ti" })));
await axe(yo.p, "Buscar rival o sparring");
// 2) Por gimnasio, sin saber el nombre.
await yo.p.fill("#proponer [name=gimnasio]", gimnasio);
await yo.p.getByRole("button", { name: "Aplicar filtros" }).click(); await yo.p.waitForURL("**gimnasio=**");
check("busca por gimnasio sin saber el nombre", JSON.stringify(await nombres()) === JSON.stringify(["Diestra", "Zurda"]));
// 3) Gimnasio + guardia zurda (en «Más filtros»).
await yo.p.locator("summary", { hasText: "Más filtros" }).click();
await yo.p.selectOption("#proponer select[name=guardia]", "ZURDO");
await yo.p.getByRole("button", { name: "Aplicar filtros" }).click(); await yo.p.waitForURL("**guardia=ZURDO**");
check("filtra por guardia: solo la zurda de ese gimnasio", JSON.stringify(await nombres()) === JSON.stringify(["Zurda"]));
check("el filtro se ve en «Estás viendo» y se puede quitar", await seen(yo.p.getByRole("group", { name: "Filtros aplicados" }).getByText("Guardia: zurdo")));
const tarjeta = yo.p.locator("#proponer article", { hasText: "Zurda" });
check("la tarjeta enseña gimnasio, combates (récord amateur privado), guardia y edad", await seen(tarjeta.getByText(gimnasio)) && await seen(tarjeta.getByText(/5 combates · guardia zurdo · \d+ años/)));
// 4) Por número de combates y edad, en toda España.
await yo.p.goto(B + `/propuestas?q=${apellido}&mincomb=4`);
check("filtra por número de combates (4 o más)", JSON.stringify(await nombres()) === JSON.stringify(["Lejana", "Zurda"]));
await yo.p.goto(B + `/propuestas?q=${apellido}&maxedad=30&orden=combates`);
const orden = (await yo.p.locator("#proponer article strong").allInnerTexts()).map((t) => t.split(" ")[0]);
check("filtra por edad y ordena por más combates", JSON.stringify(orden) === JSON.stringify(["Lejana", "Zurda"]));
await yo.p.goto(B + `/propuestas?q=${apellido}`);
check("no se sugiere a sí mismo", !(await nombres()).includes("Yago"));
// 5) Desde el resultado se reta o se propone sparring.
await yo.p.goto(B + `/propuestas?gimnasio=${encodeURIComponent(gimnasio)}&guardia=ZURDO`);
await yo.p.getByRole("link", { name: `Proponer un sparring a Zurda ${apellido}` }).click(); await yo.p.waitForURL("**/proponer?tipo=SPARRING");
check("desde el resultado se abre la propuesta de sparring a esa peleadora", await yo.p.locator("input[name=kind][value=SPARRING]").isChecked());

// 6) Inscripción: un evento futuro con la inscripción cerrada lo explica al peleador.
const org = await newUser("Cerrado", "FAN"); sql(`update "User" set role='ORGANIZER' where email='${org.email}';`);
await org.p.goto(B + "/organizador");
await org.p.fill("[name=name]", `Velada Cerrada ${rnd}`); await org.p.fill("[name=date]", new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10));
await org.p.selectOption("select[name=discipline]", "MUAYTHAI"); await org.p.fill("[name=city]", "Valencia"); await org.p.selectOption("select[name=province]", "Valencia");
await org.p.locator("input[name=inscripcion]").uncheck();
await btn(org.p, "Crear el evento"); await org.p.waitForURL((u) => /\/organizador\/[^/]+$/.test(u.pathname));
const slug = new URL(org.p.url()).pathname.split("/").pop();
await yo.p.goto(B + `/veladas/${slug}`);
check("con la inscripción cerrada, el peleador ve por qué no hay botón", await seen(yo.p.getByRole("heading", { name: "Inscripción de peleadores: cerrada" })) && await yo.p.getByRole("link", { name: "Solicitar participar" }).count() === 0);
await org.p.goto(B + `/veladas/${slug}`);
await org.p.getByRole("link", { name: "Abrir la inscripción" }).click(); await org.p.waitForURL(`**/organizador/${slug}**`);
await org.p.locator("#inscripcion").getByRole("button", { name: "Abrir la inscripción" }).click();
await org.p.locator(".notice-ok", { hasText: "Inscripción abierta" }).first().waitFor();
await yo.p.goto(B + `/veladas/${slug}`);
check("cuando el organizador la abre, el peleador ve «Solicitar participar»", await seen(yo.p.getByRole("link", { name: "Solicitar participar" })));

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
