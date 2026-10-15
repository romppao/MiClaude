// Invitaciones de miembros: consentimiento real, permisos, datos cambiados y bloqueos en ambos sentidos.
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, check, terminarDiagnosticos } from "./ayudas.mjs";
const db = new PrismaClient();
const owner = await newUser("TitularInvita");
const fighterAccount = await newUser("PeleadorInvitado", "FIGHTER");
const trainerAccount = await newUser("EntrenadorInvitado", "TRAINER");
const stranger = await newUser("AjenoInvita");
const account = a => db.user.findUniqueOrThrow({ where: { email: a.email } });
const [titular, peleador, entrenador, ajeno] = await Promise.all([owner, fighterAccount, trainerAccount, stranger].map(account));
const gym = await db.gym.create({ data: { name: `Club Invitación ${rnd}`, slug: `club-invitacion-${rnd}`, city: "Madrid", province: "Madrid", ownerUserId: titular.id } });
const fighter = await db.fighter.create({ data: { firstName: "InvitadoGym", lastName: String(rnd), slug: `invitado-gym-${rnd}`, userId: peleador.id } });
const trainer = await db.trainer.create({ data: { name: `InvitadoGym Entrenador ${rnd}`, slug: `entrenador-invitado-${rnd}` } });
// También se admite al entrenador cuyo perfil visual asignó moderación, sin userId en Trainer.
await db.profile.create({ data: { kind: "entrenador", entityId: trainer.id, ownerId: entrenador.id } });
const search = () => owner.p.goto(B + `/mis-gimnasios?gimnasio=${gym.id}&miembros=InvitadoGym`);
const candidate = id => owner.p.locator('form', { has: owner.p.locator(`input[name=memberId][value="${id}"]`) });
const received = (a, id) => a.p.locator('article', { has: a.p.locator(`input[name=invitationId][value="${id}"]`) });
async function invite(id) {
  await search(); await candidate(id).getByRole("button", { name: "Invitar a vincularse", exact: true }).click();
  await owner.p.locator('.notice-ok').waitFor();
  return db.gymMemberInvitation.findFirstOrThrow({ where: { gymId: gym.id, status: "PENDING", OR: [{ fighterId: id }, { trainerId: id }] }, orderBy: { createdAt: "desc" } });
}
async function answer(a, invitation, name) {
  await a.p.goto(B + "/mis-gimnasios#invitaciones");
  await received(a, invitation.id).getByRole("button", { name, exact: true }).click();
}
const invitation = await invite(fighter.id);
check("invitar no altera la ficha y deja un aviso privado", (await db.fighter.findUniqueOrThrow({ where: { id: fighter.id } })).gymId === null && await db.notification.count({ where: { userId: peleador.id, kind: "GYM_MEMBER" } }) === 1);
await search(); await candidate(fighter.id).getByRole("button", { name: "Invitar a vincularse", exact: true }).click();
await owner.p.locator('.notice-bad').waitFor();
check("un doble envío no duplica la invitación", await db.gymMemberInvitation.count({ where: { gymId: gym.id, fighterId: fighter.id, status: "PENDING" } }) === 1);
await answer(fighterAccount, invitation, "Aceptar vinculación"); await fighterAccount.p.locator('.notice-ok').waitFor();
check("el peleador acepta y entonces cambia su gimnasio", (await db.fighter.findUniqueOrThrow({ where: { id: fighter.id } })).gymId === gym.id && (await db.gymMemberInvitation.findUniqueOrThrow({ where: { id: invitation.id } })).status === "ACCEPTED");
const declined = await invite(trainer.id);
await answer(trainerAccount, declined, "Rechazar vinculación"); await trainerAccount.p.locator('.notice-ok').waitFor();
check("el entrenador rechaza sin cambiar su ficha", (await db.trainer.findUniqueOrThrow({ where: { id: trainer.id } })).gymId === null && (await db.gymMemberInvitation.findUniqueOrThrow({ where: { id: declined.id } })).status === "DECLINED");
const acceptedTrainer = await invite(trainer.id);
await answer(trainerAccount, acceptedTrainer, "Aceptar vinculación"); await trainerAccount.p.locator('.notice-ok').waitFor();
check("el titular del perfil visual también puede aceptar", (await db.trainer.findUniqueOrThrow({ where: { id: trainer.id } })).gymId === gym.id);
await db.trainer.update({ where: { id: trainer.id }, data: { gymId: null } });
const cancelled = await invite(trainer.id);
await trainerAccount.p.goto(B + "/mis-gimnasios#invitaciones");
await owner.p.goto(B + "/mis-gimnasios#invitaciones");
await received(owner, cancelled.id).getByRole("button", { name: "Cancelar invitación", exact: true }).click(); await owner.p.locator('.notice-ok').waitFor();
await received(trainerAccount, cancelled.id).getByRole("button", { name: "Aceptar vinculación", exact: true }).click(); await trainerAccount.p.locator('.notice-bad').waitFor();
check("una pantalla antigua no acepta una invitación cancelada", (await db.trainer.findUniqueOrThrow({ where: { id: trainer.id } })).gymId === null);
const blocked = await invite(trainer.id);
await db.block.create({ data: { blockerId: entrenador.id, blockedId: titular.id } });
await answer(trainerAccount, blocked, "Aceptar vinculación"); await trainerAccount.p.locator('.notice-bad').waitFor();
check("bloquear después de invitar impide aceptar", (await db.trainer.findUniqueOrThrow({ where: { id: trainer.id } })).gymId === null);
await db.gymMemberInvitation.update({ where: { id: blocked.id }, data: { status: "CANCELLED" } });
await search(); await candidate(trainer.id).getByRole("button", { name: "Invitar a vincularse", exact: true }).click(); await owner.p.locator('.notice-bad').waitFor();
check("un bloqueo inverso impide invitar", await db.gymMemberInvitation.count({ where: { gymId: gym.id, trainerId: trainer.id, status: "PENDING" } }) === 0);
await db.block.deleteMany({ where: { blockerId: entrenador.id, blockedId: titular.id } });
const stale = await invite(trainer.id);
await trainerAccount.p.goto(B + "/mis-gimnasios#invitaciones");
await db.gym.update({ where: { id: gym.id }, data: { ownerUserId: ajeno.id } });
await received(trainerAccount, stale.id).getByRole("button", { name: "Aceptar vinculación", exact: true }).click(); await trainerAccount.p.locator('.notice-bad').waitFor();
check("el titular anterior no conserva invitaciones válidas tras una cesión", (await db.trainer.findUniqueOrThrow({ where: { id: trainer.id } })).gymId === null);
const response = await fighterAccount.p.request.get(B + "/mi-cuenta/datos"); const exported = await response.json();
check("la descarga incluye solo las invitaciones de la cuenta", response.ok() && exported.invitacionesDeMiembroDeGimnasio.some(i => i.gimnasio === gym.name && i.estado === "ACCEPTED"));
await terminarDiagnosticos(); await db.$disconnect(); await browser.close();
