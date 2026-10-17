// Denunciar una invitación y pausar el envío (plan aprobado el 17-10-2026): el peleador denuncia desde la propia invitación (se cierra sin compartir
// contacto); con tres denuncias de personas distintas el envío de esa cuenta queda en pausa; moderación decide, suspende con motivo o levanta la pausa.
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, btn, check, seen, sql, hacerAdmin, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};
const apellido = `Denuncia${rnd}`;
async function peleador(nombre) {
  const u = await newUser(nombre, "FIGHTER");
  await u.p.setViewportSize({ width: 390, height: 844 });
  await u.p.goto(B + "/mi-ficha");
  await u.p.fill("[name=firstName]", nombre); await u.p.fill("[name=lastName]", apellido);
  await u.p.selectOption("select[name=discipline]", "KICKBOXING"); await u.p.selectOption("select[name=province]", "Valencia");
  await btn(u.p, "Crear mi ficha"); await u.p.locator(".notice-ok").waitFor();
  const f = await db.fighter.findFirstOrThrow({ where: { firstName: nombre, lastName: apellido } });
  sql(`update "Fighter" set "birthDate"='1995-05-05' where id='${f.id}';`);
  return { ...u, f };
}
const abrirInvitaciones = (p) => p.goto(B + "/propuestas#pestana-invitaciones");

// 1) Quien envía: un entrenador con tres invitaciones pendientes a tres peleadores distintos.
const abusa = await newUser("Abusa", "FAN");
sql(`update "User" set role='TRAINER' where email='${abusa.email}';`);
await abusa.p.setViewportSize({ width: 390, height: 844 });
const remitente = await db.user.findUniqueOrThrow({ where: { email: abusa.email } });
const receptores = [await peleador("Uno"), await peleador("Dos"), await peleador("Tres")];
const invitaciones = [];
for (const r of receptores) invitaciones.push(await db.invitation.create({ data: { fromUserId: remitente.id, toFighterId: r.f.id, kind: "TRAIN", message: `Hola ${r.f.firstName}, entrena conmigo ${rnd}`, expiresAt: new Date(Date.now() + 14 * 864e5) } }));

// 2) Denunciar desde la propia invitación.
const [uno, dos, tres] = receptores;
await abrirInvitaciones(uno.p);
check("la invitación recibida ofrece denunciarla", await seen(uno.p.getByText("Denunciar esta invitación")));
await uno.p.getByText("Denunciar esta invitación").click();
check("los motivos son los de una invitación", (await uno.p.locator("select[name=reason] option").allInnerTexts()).some((t) => /no solicitado|insistente/i.test(t)));
await axe(uno.p, "Invitación con el formulario de denuncia abierto");
await uno.p.selectOption("select[name=reason]", "NO_SOLICITADO");
await uno.p.fill("input[name=message]", `Abuso ${rnd} uno`);
await btn(uno.p, "Enviar la denuncia");
check("se confirma que se ha recibido", await seen(uno.p.locator(".notice-ok", { hasText: "Hemos recibido tu aviso" })));
check("la invitación denunciada se cierra y no comparte contacto", (await db.invitation.findUniqueOrThrow({ where: { id: invitaciones[0].id } })).status === "DECLINED");
check("con una sola denuncia, el envío no se pausa", !(await db.user.findUniqueOrThrow({ where: { id: remitente.id } })).invitationsSuspendedAt);

await abrirInvitaciones(dos.p);
await dos.p.getByText("Denunciar esta invitación").click();
await dos.p.selectOption("select[name=reason]", "ACOSO");
await dos.p.fill("input[name=message]", `Abuso ${rnd} dos`);
await btn(dos.p, "Enviar la denuncia");
await dos.p.locator(".notice-ok").waitFor();
check("con dos denuncias tampoco", !(await db.user.findUniqueOrThrow({ where: { id: remitente.id } })).invitationsSuspendedAt);

await abrirInvitaciones(tres.p);
await tres.p.getByText("Denunciar esta invitación").click();
await tres.p.selectOption("select[name=reason]", "INAPROPIADO");
await tres.p.fill("input[name=message]", `Abuso ${rnd} tres`);
await btn(tres.p, "Enviar la denuncia");
await tres.p.locator(".notice-ok").waitFor();
check("con tres denuncias de personas distintas, el envío queda en pausa", !!(await db.user.findUniqueOrThrow({ where: { id: remitente.id } })).invitationsSuspendedAt);

// 3) Lo que ve quien envía: se le explica y no puede invitar.
await abusa.p.goto(B + "/invitaciones");
check("«Mis invitaciones» explica que el envío está en pausa", await seen(abusa.p.locator(".notice-bad", { hasText: "está en pausa mientras moderación revisa avisos" })));
await abusa.p.goto(B + `/peleadores/${uno.f.slug}/invitar`);
check("y el formulario de invitar tampoco se ofrece", await seen(abusa.p.locator(".notice-bad", { hasText: "está en pausa" })) && (await abusa.p.getByRole("button", { name: "Enviar la invitación" }).count()) === 0);
await abusa.p.goto(B + "/avisos");
check("le llega un aviso, sin decir quién denunció", await seen(abusa.p.getByText("Hemos pausado el envío de tus invitaciones mientras moderación revisa varios avisos")) && !(await abusa.p.locator("main").innerText()).includes(uno.f.firstName));

// 4) Moderación: ve las denuncias con su contexto, suspende con motivo y levanta la pausa.
const mod = await newUser("ModeraAbuso", "FAN"); hacerAdmin(mod.email);
await mod.p.setViewportSize({ width: 390, height: 844 });
await mod.p.goto(B + "/moderacion");
const tarjeta = (n) => mod.p.locator('article[data-cola="avisos"]', { hasText: `Abuso ${rnd} ${n}` });
check("la bandeja enseña quién invitó, a quién y qué decía", await seen(tarjeta("uno").getByText(`Hola ${uno.f.firstName}, entrena conmigo ${rnd}`)) && (await tarjeta("uno").innerText()).includes(abusa.email));
check("y que el envío de esa cuenta está en pausa", await seen(tarjeta("uno").getByText("está en pausa")));
await tarjeta("uno").getByRole("button", { name: "Resolver y suspender el envío de invitaciones" }).click();
check("suspender sin motivo no se deja (se le comunica a quien lo sufre)", await seen(mod.p.locator(".notice-bad", { hasText: "anota el motivo" })));
await tarjeta("uno").locator("input[name=note]").fill("Tres personas distintas avisaron de mensajes no solicitados");
await tarjeta("uno").getByRole("button", { name: "Resolver y suspender el envío de invitaciones" }).click();
await mod.p.locator(".notice-ok").waitFor();
check("queda anotado en el historial", (await db.auditLog.count({ where: { action: "INVITATIONS_SUSPENDED", entityId: remitente.id } })) === 1);
await abusa.p.goto(B + "/avisos");
check("quien envía recibe el motivo de la suspensión", await seen(abusa.p.getByText("Tres personas distintas avisaron de mensajes no solicitados")));

await mod.p.goto(B + "/moderacion");
await tarjeta("dos").getByRole("button", { name: "Levantar la pausa de invitaciones" }).click();
await mod.p.locator(".notice-ok", { hasText: "vuelve a poder enviar invitaciones" }).waitFor();
check("moderación puede levantar la pausa", !(await db.user.findUniqueOrThrow({ where: { id: remitente.id } })).invitationsSuspendedAt);
await abusa.p.goto(B + `/peleadores/${uno.f.slug}/invitar`);
check("y quien enviaba vuelve a ver el formulario de invitar", await seen(abusa.p.getByRole("button", { name: "Enviar la invitación" })));
await abusa.p.goto(B + "/avisos");
check("con aviso de que ya puede invitar", await seen(abusa.p.getByText("ha levantado la pausa de tus invitaciones")));

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
if (process.exitCode) console.error("Denuncia de invitaciones: hay comprobaciones fallidas");
