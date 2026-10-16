// Cesión consentida por correo: misma respuesta con/sin cuenta, enlace de un uso y bloqueos.
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, check, esperarCorreo, terminarDiagnosticos } from "./ayudas.mjs";
const db = new PrismaClient();
const owner = await newUser("TitularCede");
const next = await newUser("AceptaCesion");
const stranger = await newUser("AjenoCesion");
const [titular, destinatario] = await Promise.all([owner, next].map(a => db.user.findUniqueOrThrow({ where: { email: a.email } })));
async function club(sufijo) { return db.gym.create({ data: { name: `Club Cesión ${sufijo} ${rnd}`, slug: `club-cesion-${sufijo}-${rnd}`, city: "Madrid", province: "Madrid", ownerUserId: titular.id } }); }
async function invite(gym, email) {
  await owner.p.goto(B + `/mis-gimnasios?gimnasio=${gym.id}`);
  const form = owner.p.locator('form', { has: owner.p.getByRole("button", { name: "Invitar a aceptar la cesión", exact: true }) });
  await form.locator('[name=email]').fill(email); await form.getByRole("button", { name: "Invitar a aceptar la cesión", exact: true }).click();
  await owner.p.locator('.notice-ok').waitFor(); return owner.p.locator('.notice-ok').innerText();
}
async function link(email, gym) {
  const mail = await esperarCorreo(email, gym.name);
  const found = mail?.match(/https?:\/\/\S+\/mis-gimnasios\?cesion=[a-f0-9]{64}/)?.[0];
  if (!found) throw new Error(`No llegó un enlace de cesión a ${email}`);
  return found;
}
const gym = await club("con-cuenta");
const knownResponse = await invite(gym, next.email);
const url = await link(next.email, gym);
check("invitar no cede el gimnasio", (await db.gym.findUniqueOrThrow({ where: { id: gym.id } })).ownerUserId === titular.id);
await stranger.p.goto(url);
check("otra cuenta no puede usar el enlace", await stranger.p.getByRole("button", { name: "Aceptar cesión de gimnasio", exact: true }).count() === 0);
await next.p.goto(url);
const stale = await next.p.context().newPage(); await stale.goto(url);
await next.p.getByRole("button", { name: "Aceptar cesión de gimnasio", exact: true }).click(); await next.p.locator('.notice-ok').waitFor();
check("la aceptación cambia gimnasio y perfil de gestión juntos", (await db.gym.findUniqueOrThrow({ where: { id: gym.id } })).ownerUserId === destinatario.id && (await db.profile.findUniqueOrThrow({ where: { kind_entityId: { kind: "gimnasio", entityId: gym.id } } })).ownerId === destinatario.id);
check("ambas personas reciben confirmación por la cola de correo", !!(await esperarCorreo(owner.email, "Se ha aceptado la cesión")) && !!(await esperarCorreo(next.email, "Se ha aceptado la cesión")));
await stale.getByRole("button", { name: "Aceptar cesión de gimnasio", exact: true }).click(); await stale.locator('.notice-bad').waitFor();
check("la invitación solo puede aceptarse una vez", await db.auditLog.count({ where: { entity: "GYM", entityId: gym.id, action: "GYM_TRANSFERRED" } }) === 1);
await stale.close();
const futureGym = await club("sin-cuenta");
const futureEmail = `futurocesion${rnd}@test.es`;
const unknownResponse = await invite(futureGym, futureEmail);
check("la respuesta visible es idéntica con y sin cuenta", unknownResponse === knownResponse);
const futureUrl = await link(futureEmail, futureGym);
const future = await newUser("FuturoCesion"); await future.p.goto(futureUrl);
await future.p.getByRole("button", { name: "Aceptar cesión de gimnasio", exact: true }).click(); await future.p.locator('.notice-ok').waitFor();
check("un correo sin cuenta puede crearla, confirmarla y aceptar después", (await db.gym.findUniqueOrThrow({ where: { id: futureGym.id } })).ownerUserId === (await db.user.findUniqueOrThrow({ where: { email: future.email } })).id);
const blockedGym = await club("bloqueo");
await db.block.create({ data: { blockerId: titular.id, blockedId: destinatario.id } });
check("el bloqueo tampoco revela si existe la cuenta", await invite(blockedGym, next.email) === knownResponse);
check("un bloqueo impide guardar una invitación y contactar", await db.gymTransferInvitation.count({ where: { gymId: blockedGym.id } }) === 0);
await db.block.deleteMany({ where: { blockerId: titular.id, blockedId: destinatario.id } });
await invite(blockedGym, next.email); const blockedUrl = await link(next.email, blockedGym); await next.p.goto(blockedUrl);
await db.block.create({ data: { blockerId: destinatario.id, blockedId: titular.id } });
await next.p.getByRole("button", { name: "Aceptar cesión de gimnasio", exact: true }).click(); await next.p.locator('.notice-bad').waitFor();
check("un bloqueo posterior en el otro sentido impide aceptar", (await db.gym.findUniqueOrThrow({ where: { id: blockedGym.id } })).ownerUserId === titular.id);
await db.block.deleteMany({ where: { blockerId: destinatario.id, blockedId: titular.id } });
const cancelledGym = await club("cancelacion"); await invite(cancelledGym, next.email); const cancelledUrl = await link(next.email, cancelledGym); await next.p.goto(cancelledUrl);
const invitation = await db.gymTransferInvitation.findFirstOrThrow({ where: { gymId: cancelledGym.id, status: "PENDING" } });
await owner.p.goto(B + "/mis-gimnasios");
await owner.p.locator('article', { has: owner.p.locator(`input[name=invitationId][value="${invitation.id}"]`) }).getByRole("button", { name: "Cancelar cesión", exact: true }).click(); await owner.p.locator('.notice-ok').waitFor();
await next.p.getByRole("button", { name: "Aceptar cesión de gimnasio", exact: true }).click(); await next.p.locator('.notice-bad').waitFor();
check("cancelar impide aceptar desde una pantalla antigua", (await db.gym.findUniqueOrThrow({ where: { id: cancelledGym.id } })).ownerUserId === titular.id);
const expiredGym = await club("caducada"); await invite(expiredGym, next.email); const expiredUrl = await link(next.email, expiredGym); await next.p.goto(expiredUrl);
await db.gymTransferInvitation.updateMany({ where: { gymId: expiredGym.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
await next.p.getByRole("button", { name: "Aceptar cesión de gimnasio", exact: true }).click(); await next.p.locator('.notice-bad').waitFor();
check("la caducidad se comprueba también al responder", (await db.gym.findUniqueOrThrow({ where: { id: expiredGym.id } })).ownerUserId === titular.id);
await terminarDiagnosticos(); await db.$disconnect(); await browser.close();
