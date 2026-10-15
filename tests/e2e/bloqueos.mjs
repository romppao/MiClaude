// Bloquear a otro usuario (Apple 1.2) y avisos de contenido con y sin cuenta, con la decisión por correo (DSA, arts. 16 y 17). Ver docs/LEGAL.md.
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, btn, check, seen, esperarCorreo, hacerAdmin, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};
async function peleador(nombre) {
  const u = await newUser(nombre, "FIGHTER");
  await u.p.goto(B + "/mi-ficha");
  await u.p.fill("[name=firstName]", nombre); await u.p.fill("[name=lastName]", `Bloqueos${rnd}`);
  await u.p.selectOption("select[name=discipline]", "KICKBOXING"); await u.p.selectOption("select[name=province]", "Sevilla");
  await btn(u.p, "Crear mi ficha"); await u.p.locator(".notice-ok").waitFor();
  const f = await db.fighter.findFirstOrThrow({ where: { firstName: nombre, lastName: `Bloqueos${rnd}` } });
  const user = await db.user.findUniqueOrThrow({ where: { email: u.email } });
  return { ...u, f, user };
}

// Preparación: Lola recibe un sparring de Nora y un comentario de aura de Tito en un combate suyo.
const lola = await peleador("Lola");
const nora = await peleador("Nora");
const tito = await newUser("Tito");
const titoId = (await db.user.findUniqueOrThrow({ where: { email: tito.email } })).id;
await db.fightProposal.create({ data: { kind: "SPARRING", fromId: nora.f.id, toId: lola.f.id, discipline: "KICKBOXING", message: `Hola ${rnd}` } });
const velada = await db.event.create({ data: { slug: `bloqueos-${rnd}`, name: `Velada bloqueos ${rnd}`, date: new Date(Date.now() - 30 * 864e5), level: "AMATEUR", venue: "Pabellón", city: "Sevilla", province: "Sevilla", discipline: "KICKBOXING" } });
const combate = await db.bout.create({ data: { eventId: velada.id, fighterAId: lola.f.id, fighterBId: nora.f.id, result: "A_WIN", method: "UD" } });
const aura = await db.aura.create({ data: { userId: titoId, fighterId: lola.f.id, boutId: combate.id, comment: `Comentario de Tito ${rnd}` } });

// 1) Lola ve la propuesta y el comentario; bloquea a Nora desde la propuesta recibida.
await lola.p.goto(B + "/propuestas#pestana-recibidas");
check("la propuesta recibida ofrece bloquear a quien la envía", await seen(lola.p.getByText(/^Bloquear a Nora/).first()));
await lola.p.getByText(/^Bloquear a Nora/).first().click();
await lola.p.getByRole("button", { name: /^Bloquear a Nora/ }).first().click();
await lola.p.locator(".notice-ok", { hasText: "Has bloqueado a esta persona" }).waitFor();
check("al bloquear, la propuesta pendiente queda rechazada", (await db.fightProposal.findFirstOrThrow({ where: { fromId: nora.f.id, toId: lola.f.id } })).status === "DECLINED");
check("y ya no aparece entre las recibidas", !(await lola.p.getByText(`Hola ${rnd}`).count()));
check("el bloqueo queda en el historial", (await db.auditLog.count({ where: { userId: lola.user.id, entity: "USER", entityId: nora.user.id, action: "BLOCKED" } })) === 1);

// 2) Nora ya no puede retar a Lola ni seguirla, ni siquiera mandando el formulario a mano.
await nora.p.goto(B + `/peleadores/${lola.f.slug}`);
check("a quien está bloqueada no se le ofrece retar ni proponer sparring", !(await nora.p.getByRole("link", { name: "Retar a combate" }).count()));
check("ni seguir la ficha", !(await nora.p.getByRole("button", { name: "Seguir a este peleador" }).count()));
await nora.p.goto(B + `/peleadores/${lola.f.slug}/proponer?tipo=FIGHT`);
check("y si llega a la pantalla de proponer, se le explica que no puede contactar, sin formulario", await seen(nora.p.getByText("una de las dos ha bloqueado a la otra")) && !(await nora.p.getByRole("button", { name: "Enviar la propuesta" }).count()));
check("y no se crea ninguna propuesta nueva", (await db.fightProposal.count({ where: { fromId: nora.f.id, toId: lola.f.id } })) === 1);

// 3) Lola bloquea a Tito desde su comentario: deja de verlo, pero los demás sí lo ven y el aura sigue contando.
await lola.p.goto(B + `/peleadores/${lola.f.slug}#publico`);
await lola.p.getByRole("tab", { name: "Público" }).click().catch(() => {});
check("cada comentario ajeno ofrece bloquear a su autor", await seen(lola.p.getByText("Bloquear a Tito").first()));
await lola.p.getByText("Bloquear a Tito").first().click();
await lola.p.getByRole("button", { name: "Bloquear a Tito" }).click();
await lola.p.locator(".notice-ok", { hasText: "Has bloqueado a esta persona" }).waitFor();
check("Lola ya no ve el comentario de Tito", !(await lola.p.getByText(`Comentario de Tito ${rnd}`).count()));
const visita = await (await browser.newContext()).newPage();
await visita.goto(B + `/peleadores/${lola.f.slug}`);
await visita.getByRole("tab", { name: "Público" }).click().catch(() => {});
check("los demás lo siguen viendo: bloquear no es retirar", await seen(visita.getByText(`Comentario de Tito ${rnd}`)));
check("y el aura de Tito sigue contando", !!(await db.aura.findUnique({ where: { id: aura.id } })));

// 4) «Mi cuenta» → «Bloqueos»: lista y desbloquear.
await lola.p.goto(B + "/mi-cuenta#pestana-bloqueos");
await lola.p.getByRole("tab", { name: "Bloqueos" }).click().catch(() => {});
check("«Mi cuenta» lista a las dos personas bloqueadas", await seen(lola.p.getByRole("button", { name: /^Desbloquear a Nora/ })) && await seen(lola.p.getByRole("button", { name: /^Desbloquear a Tito/ })));
await axe(lola.p, "Mi cuenta, pestaña Bloqueos");
await lola.p.getByRole("button", { name: /^Desbloquear a Nora/ }).click();
await lola.p.locator(".notice-ok", { hasText: "Has desbloqueado a esta persona" }).waitFor();
check("al desbloquear desaparece el bloqueo", (await db.block.count({ where: { blockerId: lola.user.id, blockedId: nora.user.id } })) === 0);
await nora.p.goto(B + `/peleadores/${lola.f.slug}`);
check("y Nora vuelve a poder retar a Lola", await seen(nora.p.getByRole("link", { name: "Retar a combate" })));

// 5) Aviso sin cuenta (DSA, art. 16): formulario público, acuse de recibo y decisión por correo.
const anonimo = await (await browser.newContext()).newPage();
await anonimo.goto(B + "/");
await anonimo.getByRole("link", { name: "Avisar de un contenido" }).click(); await anonimo.waitForURL("**/avisar");
await axe(anonimo, "Avisar de un contenido");
const correo = `testigo${rnd}@test.es`;
await anonimo.fill("[name=direccion]", "https://otra-web.example/peleadores/x");
await anonimo.selectOption("[name=motivo]", "ILEGAL");
await anonimo.fill("[name=explicacion]", "Hay un comentario con amenazas contra un deportista.");
await anonimo.fill("[name=nombre]", "Testigo"); await anonimo.fill("[name=correo]", correo);
await anonimo.getByText("Declaro que lo que cuento es cierto").click();
await anonimo.getByRole("button", { name: "Enviar el aviso" }).click();
check("una dirección de otra web se rechaza con una explicación", await seen(anonimo.locator(".notice-bad", { hasText: "Solo podemos actuar sobre lo publicado en Lona" })));
check("y no se pierde lo escrito", (await anonimo.inputValue("[name=explicacion]")).includes("amenazas"));
await anonimo.fill("[name=direccion]", `${B}/peleadores/${lola.f.slug}#publico`);
// La declaración de buena fe no se recuerda a propósito: se confirma de nuevo en cada envío.
if (!(await anonimo.isChecked("[name=declaracion]"))) await anonimo.getByText("Declaro que lo que cuento es cierto").click();
await anonimo.getByRole("button", { name: "Enviar el aviso" }).click();
await anonimo.locator(".notice-ok", { hasText: "Hemos recibido tu aviso" }).waitFor();
const aviso = await db.report.findFirstOrThrow({ where: { reporterEmail: correo } });
check("el aviso sin cuenta queda en la cola con la ruta dentro de Lona", aviso.userId === null && aviso.entity === "PAGINA" && aviso.entityId === `/peleadores/${lola.f.slug}#publico`);
check("y se acusa recibo por correo", !!(await esperarCorreo(correo, "Hemos recibido tu aviso")));

// 6) Moderación ve el aviso sin cuenta y lo cierra; también retira el comentario de Tito por un aviso con cuenta.
const mod = await newUser("Moderadora"); hacerAdmin(mod.email);
await db.report.create({ data: { userId: lola.user.id, entity: "AURA", entityId: aura.id, reason: "INAPROPIADO", message: "Me insulta" } });
await mod.p.goto(B + "/moderacion#avisos");
const filaPagina = mod.p.locator("article[data-cola=avisos]", { hasText: `/peleadores/${lola.f.slug}` });
check("moderación ve el aviso sin cuenta, con quién lo envía", await seen(filaPagina.getByText(`Sin cuenta · Testigo · ${correo}`)));
check("un aviso sobre una página no ofrece «retirar» (se actúa desde la página)", !(await filaPagina.getByRole("button", { name: /^Resolver y/ }).count()));
await filaPagina.locator("[name=note]").fill("Hemos retirado el comentario.");
await filaPagina.getByRole("button", { name: /^Cerrar: ya está corregido/ }).click();
await mod.p.locator(".notice-ok", { hasText: "Aviso marcado como resuelto" }).waitFor();
const decision = await esperarCorreo(correo, "Hemos revisado tu aviso");
check("quien avisó sin cuenta recibe la decisión, la nota y cómo reclamar", !!decision && decision.includes("Hemos retirado el comentario.") && decision.includes("resolución extrajudicial"));
const filaAura = mod.p.locator("article[data-cola=avisos]", { hasText: `Comentario de Tito ${rnd}` });
await filaAura.getByRole("button", { name: "Resolver y retirar el comentario" }).click();
await mod.p.locator(".notice-ok", { hasText: "Aviso resuelto y contenido ocultado" }).waitFor();
const motivos = await esperarCorreo(tito.email, "Hemos retirado un contenido tuyo");
check("el autor del comentario recibe los motivos (art. 17): qué, por qué y cómo reclamar", !!motivos && motivos.includes(`Comentario de Tito ${rnd}`) && motivos.includes("ofensivo") && motivos.includes("no usamos sistemas automáticos"));
check("y quien avisó con cuenta, la decisión", !!(await esperarCorreo(lola.email, "Hemos revisado tu aviso")));

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
