// Directorio de gimnasios: altas, propiedad revisada y edición autorizada. Ninguna acción envía campañas.
"use server";

import { createHash, randomBytes } from "node:crypto";
import { hayBloqueo } from "../../lib/community/bloqueos";
import { allow, HORA } from "../../lib/accounts/ratelimit";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import type { GymStatus } from "@prisma/client";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { requireAdmin } from "../../lib/accounts/permissions";
import { audit } from "../../lib/common/audit";
import { excludedGymProvince } from "../../lib/common/gym-policy";
import { safeHttpUrl } from "../../lib/common/url";
import { isEmail, oneLine } from "../../lib/common/text";
import { DISCIPLINE_ORDER } from "../../lib/common/disciplines";
import { slugName } from "../../lib/common/labels";
import { ubicarGimnasio } from "../../lib/common/geo";
import { APP_URL, sendMail } from "../../lib/common/mail";
import { putNotification } from "../../lib/community/notifications";
import { str, go, checkLengths, readProvince, guard, Rechazo, withLock, uniqueSlug, returnTo } from "./shared";

/** Alta manual: moderación publica; las demás cuentas aportan prueba y quedan en revisión, sin autoasignarse propiedad. */
export async function saveGym(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const id = str(f, "gymId");
  const back = returnTo(f, str(f, "back").split(/[?#]/)[0] === "/moderacion" ? "/moderacion" : "/mis-gimnasios");
  const before = id ? await db.gym.findUnique({ where: { id } }) : null;
  if (id && (!before || (user.role !== "ADMIN" && before.ownerUserId !== user.id))) go(back, { problema: "sin_permiso" });
  checkLengths(f, back, { name: 150, city: 100, address: 200, phone: 30, email: 200, website: 500, instagram: 500, evidence: 2000, evidenceUrl: 500, note: 1000 });
  const name = oneLine(str(f, "name")), city = oneLine(str(f, "city"));
  if (!name || !city) go(back, { problema: "nombre_ficha" });
  const province = readProvince(f, "province", back);
  const website = str(f, "website") ? safeHttpUrl(str(f, "website")) : null;
  const instagram = str(f, "instagram") ? safeHttpUrl(str(f, "instagram")) : null;
  if ((str(f, "website") && !website) || (str(f, "instagram") && (!instagram || !["instagram.com", "www.instagram.com"].includes(new URL(instagram).hostname)))) go(back, { problema: "enlace_invalido" });
  const phone = str(f, "phone") || null, email = str(f, "email").toLowerCase() || null;
  if ((phone && !/^\+?[\d .()-]{6,30}$/.test(phone)) || (email && !isEmail(email))) go(back, { problema: "gimnasio_contacto" });
  const evidence = str(f, "evidence"), evidenceUrl = str(f, "evidenceUrl") ? safeHttpUrl(str(f, "evidenceUrl")) : null;
  if (!id && user.role !== "ADMIN" && (evidence.length < 10 || (str(f, "evidenceUrl") && !evidenceUrl))) go(back, { problema: "gimnasio_prueba" });
  const requested = str(f, "status");
  // Retirar un gimnasio no se deshace desde aquí (volver a publicarlo pasa por revisión): se confirma antes (principio 9).
  if (requested === "REMOVED" && user.role !== "ADMIN" && str(f, "confirmar") !== "si") go(back, { problema: "gimnasio_retirar_confirmar" });
  if (requested && !["PUBLISHED", "PENDING", "REMOVED"].includes(requested)) go(back, { problema: "opcion_invalida" });
  const status: GymStatus = requested === "REMOVED" ? "REMOVED" : excludedGymProvince(province) ? "PENDING" : user.role === "ADMIN" ? (requested === "PENDING" ? "PENDING" : "PUBLISHED") : before?.status === "PUBLISHED" ? "PUBLISHED" : "PENDING";
  const address = str(f, "address") || null;
  const changed = before && (before.address !== address || before.city !== city || before.province !== province);
  const data = { name, city, province, address, phone, email, website, instagram, disciplines: DISCIPLINE_ORDER.filter((d) => f.getAll("disciplina").includes(d)), status, source: before?.ownerUserId ? "PROPIETARIO" as const : "MANUAL" as const, reviewNote: excludedGymProvince(province) ? "Provincia excluida del directorio por decisión del fundador; revisar sin publicar." : str(f, "note") || null, ...(changed ? { lat: null, lng: null, geoSource: null, geocodedAt: null } : {}) };
  const gym = await guard(back, () => withLock(`gym:${id || name}`, async (tx) => {
    if (id && user.role !== "ADMIN") {
      const current = await tx.gym.findUnique({ where: { id } });
      if (current?.ownerUserId !== user.id) throw new Rechazo("sin_permiso");
    }
    const slug = id ? undefined : await uniqueSlug(slugName(name, city), async (s) => !!(await tx.gym.findUnique({ where: { slug: s }, select: { id: true } })));
    const g = id ? await tx.gym.update({ where: { id }, data }) : await tx.gym.create({ data: { ...data, slug: slug! } });
    if (!id && user.role !== "ADMIN") await tx.gymClaimRequest.create({ data: { userId: user.id, gymId: g.id, evidence, evidenceUrl } });
    await audit({ userId: user.id, entity: "GYM", entityId: g.id, action: id ? "GYM_UPDATED" : "GYM_CREATED", before: before ? { name: before.name, status: before.status } : undefined, after: { name, status } }, tx);
    return g;
  }));
  if (!id || changed) after(() => ubicarGimnasio(gym.id));
  revalidatePath("/", "layout");
  go(back, { aviso: "gimnasio_guardado" });
}

/** No pide DNI: solo explicación y enlace profesional. Una propiedad existente se trata como conflicto. */
export async function requestGymClaim(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const back = "/mis-gimnasios";
  checkLengths(f, back, { evidence: 2000, evidenceUrl: 500 });
  const evidence = str(f, "evidence"), evidenceUrl = str(f, "evidenceUrl") ? safeHttpUrl(str(f, "evidenceUrl")) : null;
  if (evidence.length < 10 || (str(f, "evidenceUrl") && !evidenceUrl)) go(back, { problema: "gimnasio_prueba" });
  await guard(back, () => withLock(`gym:${str(f, "gymId")}`, async (tx) => {
    const g = await tx.gym.findUnique({ where: { id: str(f, "gymId") } });
    // Solo gimnasios del directorio: ni retirados por moderación ni los ficticios del seed (revisión de Claude, 15-10-2026).
    if (!g || g.status === "REMOVED" || g.isFictional) throw new Rechazo("no_existe");
    if (g.ownerUserId === user.id) throw new Rechazo("gimnasio_ya_tuyo");
    if (await tx.gymClaimRequest.findFirst({ where: { gymId: g.id, userId: user.id, status: { in: ["PENDING", "CONFLICT"] } } })) throw new Rechazo("gimnasio_solicitud_repetida");
    const claim = await tx.gymClaimRequest.create({ data: { userId: user.id, gymId: g.id, evidence, evidenceUrl, status: g.ownerUserId ? "CONFLICT" : "PENDING" } });
    await audit({ userId: user.id, entity: "GYM", entityId: g.id, action: "GYM_CLAIM_REQUESTED", after: { claimId: claim.id, conflict: !!g.ownerUserId } }, tx);
  }));
  revalidatePath("/", "layout"); go(back, { aviso: "gimnasio_reclamado" });
}

/** Decisión reservada a moderación; bloqueo por gimnasio y comprobación de propiedad dentro de la transacción. */
export async function decideGymClaim(f: FormData) {
  const admin = await requireAdmin();
  const back = returnTo(f, str(f, "back").split(/[?#]/)[0] === "/moderacion" ? "/moderacion" : "/moderacion/gimnasios");
  const decision = str(f, "decision"), note = str(f, "note");
  checkLengths(f, back, { note: 1000 });
  if (!["approve", "reject"].includes(decision)) go(back, { problema: "opcion_invalida" });
  if (note.length < 10) go(back, { problema: "gimnasio_nota" });
  const claim = await db.gymClaimRequest.findUnique({ where: { id: str(f, "claimId") }, include: { user: { select: { email: true, emailVerifiedAt: true } } } });
  if (!claim) go(back, { problema: "no_existe" });
  const result = await guard(back, () => withLock(`gym:${claim.gymId}`, async (tx) => {
    const current = await tx.gymClaimRequest.findUnique({ where: { id: claim.id } });
    if (!current || !["PENDING", "CONFLICT"].includes(current.status)) throw new Rechazo("solicitud_cambiada");
    const gym = await tx.gym.findUniqueOrThrow({ where: { id: claim.gymId } });
    if (decision === "approve" && gym.ownerUserId && gym.ownerUserId !== claim.userId) {
      await tx.gymClaimRequest.update({ where: { id: claim.id }, data: { status: "CONFLICT", note } });
      await audit({ userId: admin.id, entity: "GYM", entityId: gym.id, action: "GYM_CLAIM_CONFLICT", after: { claimId: claim.id } }, tx);
      return "conflict";
    }
    if (decision === "approve" && !claim.user.emailVerifiedAt) throw new Rechazo("titular_invalido");
    const now = new Date();
    await tx.gymClaimRequest.update({ where: { id: claim.id }, data: { status: decision === "approve" ? "APPROVED" : "REJECTED", note, reviewedAt: now, reviewedById: admin.id, evidence: "", evidenceUrl: null } });
    if (decision === "approve") {
      // Confirmar quién es el titular no da el sello de verificado (eso es setGymVerified) ni devuelve al directorio un gimnasio retirado.
      await tx.gym.update({ where: { id: gym.id }, data: { ownerUserId: claim.userId, claimedAt: now, source: "PROPIETARIO", status: gym.status === "REMOVED" ? "REMOVED" : excludedGymProvince(gym.province) ? "PENDING" : "PUBLISHED" } });
      await tx.profile.upsert({ where: { kind_entityId: { kind: "gimnasio", entityId: gym.id } }, create: { kind: "gimnasio", entityId: gym.id, ownerId: claim.userId }, update: { ownerId: claim.userId } });
    }
    await audit({ userId: admin.id, entity: "GYM", entityId: gym.id, action: decision === "approve" ? "GYM_CLAIM_APPROVED" : "GYM_CLAIM_REJECTED", after: { claimId: claim.id } }, tx);
    return decision;
  }));
  if (result !== "conflict") after(() => sendMail(claim.user.email, "Tu reclamación de gimnasio en Lona", result === "approve" ? "Moderación ha aprobado tu reclamación. Puedes gestionar el gimnasio desde Mis gimnasios." : `Moderación ha rechazado la reclamación: ${note}`));
  revalidatePath("/", "layout"); go(back, { aviso: result === "conflict" ? "gimnasio_conflicto" : "gimnasio_decidido" });
}

/**
 * Cede el gimnasio a otra cuenta con el correo confirmado. Solo moderación (revisión de Claude, 15-10-2026): si lo hacía el propio titular,
 * la respuesta revelaba si un correo tenía cuenta y la otra persona recibía un gimnasio sin aceptarlo. El titular lo pide a moderación.
 */
export async function transferGym(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const back = "/mis-gimnasios";
  if (user.role !== "ADMIN") go(back, { problema: "gimnasio_cesion_moderacion" });
  checkLengths(f, back, { email: 200 });
  const next = await db.user.findUnique({ where: { email: str(f, "email").toLowerCase() } });
  if (!next?.emailVerifiedAt) go(back, { problema: "titular_invalido" });
  await guard(back, () => withLock(`gym:${str(f, "gymId")}`, async (tx) => {
    const gym = await tx.gym.findUnique({ where: { id: str(f, "gymId") } });
    if (!gym || (gym.ownerUserId !== user.id && user.role !== "ADMIN")) throw new Rechazo("sin_permiso");
    await tx.gym.update({ where: { id: gym.id }, data: { ownerUserId: next.id, claimedAt: new Date(), source: "PROPIETARIO" } });
    await tx.profile.upsert({ where: { kind_entityId: { kind: "gimnasio", entityId: gym.id } }, create: { kind: "gimnasio", entityId: gym.id, ownerId: next.id }, update: { ownerId: next.id } });
    await audit({ userId: user.id, entity: "GYM", entityId: gym.id, action: "GYM_TRANSFERRED", before: { ownerUserId: gym.ownerUserId }, after: { ownerUserId: next.id } }, tx);
  }));
  after(() => sendMail(next.email, "Ahora gestionas un gimnasio en Lona", `Hola ${oneLine(next.name)},\n\nModeración te ha cedido la gestión de un gimnasio en Lona. Puedes verlo y editarlo en «Mis gimnasios».\n\nSi no lo esperabas, responde a este correo o avísanos y lo revisaremos.\n`));
  revalidatePath("/", "layout"); go(back, { aviso: "gimnasio_cedido" });
}

/** Vincula una ficha pública al club o retira una ya vinculada; todas las modificaciones quedan auditadas. */
export async function setGymMember(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const back = "/mis-gimnasios";
  const kind = str(f, "kind"), decision = str(f, "decision");
  if (!["fighter", "trainer"].includes(kind) || !["link", "unlink"].includes(decision)) go(back, { problema: "opcion_invalida" });
  // Vincular cambia la ficha pública de otra persona: solo moderación. Cada cual elige su gimnasio desde su ficha (revisión de Claude, 15-10-2026).
  if (decision === "link" && user.role !== "ADMIN") go(back, { problema: "sin_permiso" });
  await guard(back, () => withLock(`gym:${str(f, "gymId")}`, async (tx) => {
    const gym = await tx.gym.findUnique({ where: { id: str(f, "gymId") } });
    if (!gym || (gym.ownerUserId !== user.id && user.role !== "ADMIN")) throw new Rechazo("sin_permiso");
    const id = str(f, "memberId");
    const where = { id, ...(decision === "unlink" ? { gymId: gym.id } : {}) };
    const result = kind === "fighter" ? await tx.fighter.updateMany({ where: { ...where, listed: true, hiddenAt: null }, data: { gymId: decision === "link" ? gym.id : null } }) : await tx.trainer.updateMany({ where, data: { gymId: decision === "link" ? gym.id : null } });
    if (result.count !== 1) throw new Rechazo("no_existe");
    await audit({ userId: user.id, entity: kind === "fighter" ? "FIGHTER" : "TRAINER", entityId: id, action: "GYM_MEMBERSHIP_CHANGED", after: { gymId: decision === "link" ? gym.id : null } }, tx);
  }));
  revalidatePath("/", "layout"); go(back, { aviso: "gimnasio_vinculo" });
}

/** El titular propone una cesión. No informa de si el correo tiene cuenta ni cambia la propiedad. */
export async function inviteGymTransfer(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const back = "/mis-gimnasios";
  checkLengths(f, back, { email: 200, gymId: 40 });
  const email = str(f, "email").toLowerCase(), gymId = str(f, "gymId");
  if (!isEmail(email)) go(back, { problema: "gimnasio_cesion_correo" });
  const token = randomBytes(32).toString("hex");
  const result = await guard(back, () => withLock(`gym:${gymId}`, async (tx) => {
    const gym = await tx.gym.findUnique({ where: { id: gymId } });
    if (!gym || gym.ownerUserId !== user.id || gym.status === "REMOVED" || gym.isFictional) throw new Rechazo("sin_permiso");
    const recipient = await tx.user.findUnique({ where: { email }, select: { id: true } });
    // La misma respuesta para correo registrado, no registrado, propio o bloqueado. No se contacta con una cuenta bloqueada.
    if (email === user.email || await hayBloqueo(user.id, recipient?.id, tx)) return null;
    if (!(await allow(`gym-transfer:${user.id}:${gym.id}`, 5, 24 * HORA))) return null;
    await tx.gymTransferInvitation.updateMany({ where: { gymId, status: "PENDING" }, data: { status: "CANCELLED", answeredAt: new Date() } });
    const invitation = await tx.gymTransferInvitation.create({ data: { gymId, senderId: user.id, recipientEmail: email, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 14 * 864e5) } });
    await audit({ userId: user.id, entity: "GYM", entityId: gym.id, action: "GYM_TRANSFER_INVITED", after: { invitationId: invitation.id } }, tx);
    return { name: gym.name };
  }));
  // Fuera de la respuesta HTTP: ni el contenido ni el destino dependen de que exista una cuenta.
  if (result) after(async () => {
    const link = `${APP_URL}/mis-gimnasios?cesion=${token}`;
    await sendMail(email, "Invitación para gestionar un gimnasio en Lona", `Te invitan a gestionar ${oneLine(result.name)}. La propiedad no cambiará hasta que aceptes.\n\nEntra o crea una cuenta con este mismo correo y confírmalo; después abre ${link}\n\nEl enlace caduca en 14 días. Si no lo esperabas, puedes ignorarlo o rechazarlo desde la aplicación.`);
  });
  revalidatePath("/", "layout"); go(back, { aviso: "gimnasio_cesion_invitada" });
}

/** Solo el correo destinatario confirmado, con el enlace secreto, acepta o rechaza; la escritura es atómica y vuelve a comprobar bloqueos. */
export async function answerGymTransfer(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const back = "/mis-gimnasios";
  const token = str(f, "token"), decision = str(f, "decision");
  if (!/^[a-f0-9]{64}$/.test(token) || !["accept", "decline"].includes(decision)) go(back, { problema: "opcion_invalida" });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitation = await db.gymTransferInvitation.findUnique({ where: { tokenHash } });
  if (!invitation || invitation.recipientEmail !== user.email.toLowerCase()) go(back, { problema: "no_existe" });
  const result = await guard(back, () => withLock(`gym:${invitation.gymId}`, async (tx) => {
    const current = await tx.gymTransferInvitation.findUnique({ where: { id: invitation.id }, include: { sender: { select: { email: true } } } });
    if (!current || current.recipientEmail !== user.email.toLowerCase() || current.status !== "PENDING" || current.expiresAt <= new Date()) throw new Rechazo("solicitud_cambiada");
    const gym = await tx.gym.findUnique({ where: { id: current.gymId } });
    if (!gym || gym.ownerUserId !== current.senderId || gym.status === "REMOVED") throw new Rechazo("solicitud_cambiada");
    if (await hayBloqueo(current.senderId, user.id, tx)) throw new Rechazo("bloqueo_contacto");
    if (decision === "accept") {
      const saved = await tx.gym.updateMany({ where: { id: gym.id, ownerUserId: current.senderId }, data: { ownerUserId: user.id, claimedAt: new Date(), source: "PROPIETARIO" } });
      if (saved.count !== 1) throw new Rechazo("solicitud_cambiada");
      await tx.profile.upsert({ where: { kind_entityId: { kind: "gimnasio", entityId: gym.id } }, create: { kind: "gimnasio", entityId: gym.id, ownerId: user.id }, update: { ownerId: user.id } });
    }
    const saved = await tx.gymTransferInvitation.updateMany({ where: { id: current.id, status: "PENDING" }, data: { status: decision === "accept" ? "ACCEPTED" : "DECLINED", answeredAt: new Date() } });
    if (saved.count !== 1) throw new Rechazo("solicitud_cambiada");
    if (decision === "accept") await tx.gymTransferInvitation.updateMany({ where: { gymId: gym.id, status: "PENDING" }, data: { status: "CANCELLED", answeredAt: new Date() } });
    await audit({ userId: user.id, entity: "GYM", entityId: gym.id, action: decision === "accept" ? "GYM_TRANSFERRED" : "GYM_TRANSFER_DECLINED", before: { ownerUserId: current.senderId }, after: { invitationId: current.id, ...(decision === "accept" ? { ownerUserId: user.id } : {}) } }, tx);
    return { gymName: gym.name, senderEmail: current.sender.email };
  }));
  after(async () => {
    const text = decision === "accept" ? `Se ha aceptado la cesión de ${oneLine(result.gymName)}. La cuenta con correo ${user.email} gestiona ahora el gimnasio. Puedes consultar el estado en ${APP_URL}/mis-gimnasios.` : `Se ha rechazado la cesión de ${oneLine(result.gymName)}. La propiedad no ha cambiado.`;
    await Promise.all([sendMail(result.senderEmail, "Respuesta a la cesión de gimnasio en Lona", text), sendMail(user.email, "Tu respuesta a la cesión de gimnasio en Lona", text)]);
  });
  revalidatePath("/", "layout"); go(back, { aviso: decision === "accept" ? "gimnasio_cesion_aceptada" : "gimnasio_cesion_rechazada" });
}

/** El titular retira la invitación pendiente; nunca altera la propiedad. */
export async function cancelGymTransfer(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const back = "/mis-gimnasios";
  const invitation = await db.gymTransferInvitation.findFirst({ where: { id: str(f, "invitationId"), senderId: user.id } });
  if (!invitation) go(back, { problema: "no_existe" });
  await guard(back, () => withLock(`gym:${invitation.gymId}`, async (tx) => {
    const result = await tx.gymTransferInvitation.updateMany({ where: { id: invitation.id, senderId: user.id, status: "PENDING" }, data: { status: "CANCELLED", answeredAt: new Date() } });
    if (result.count !== 1) throw new Rechazo("solicitud_cambiada");
    await audit({ userId: user.id, entity: "GYM", entityId: invitation.gymId, action: "GYM_TRANSFER_CANCELLED", after: { invitationId: invitation.id } }, tx);
  }));
  revalidatePath("/", "layout"); go(back, { aviso: "gimnasio_cesion_cancelada" });
}

/** Titular actual de una ficha: el perfil visual del entrenador también puede tener titular asignado por moderación. */
async function gymMember(tx: import("@prisma/client").Prisma.TransactionClient, kind: string, id: string) {
  if (kind === "fighter") {
    const f = await tx.fighter.findFirst({ where: { id, listed: true, hiddenAt: null }, select: { userId: true, gymId: true } });
    return f;
  }
  const t = await tx.trainer.findUnique({ where: { id }, select: { userId: true, gymId: true } });
  if (!t) return null;
  const profile = t.userId ? null : await tx.profile.findUnique({ where: { kind_entityId: { kind: "entrenador", entityId: id } }, select: { ownerId: true } });
  return { gymId: t.gymId, userId: t.userId ?? profile?.ownerId ?? null };
}

/** El titular invita sin cambiar la ficha ajena; la persona tendrá que aceptar en Mis gimnasios. Moderación conserva setGymMember. */
export async function inviteGymMember(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const back = "/mis-gimnasios";
  const kind = str(f, "kind"), id = str(f, "memberId"), gymId = str(f, "gymId");
  if (!["fighter", "trainer"].includes(kind) || id.length > 40 || gymId.length > 40) go(back, { problema: "opcion_invalida" });
  await guard(back, () => withLock(`gym:${gymId}`, async (tx) => {
    const gym = await tx.gym.findUnique({ where: { id: gymId } });
    if (!gym || gym.ownerUserId !== user.id || gym.status !== "PUBLISHED" || gym.isFictional) throw new Rechazo("sin_permiso");
    const member = await gymMember(tx, kind, id);
    if (!member?.userId || member.gymId === gym.id) throw new Rechazo("gimnasio_miembro_invalido");
    if (await hayBloqueo(user.id, member.userId, tx)) throw new Rechazo("bloqueo_contacto");
    const recipient = await tx.user.findUnique({ where: { id: member.userId }, select: { emailVerifiedAt: true } });
    if (!recipient?.emailVerifiedAt) throw new Rechazo("gimnasio_miembro_invalido");
    const target = kind === "fighter" ? { fighterId: id } : { trainerId: id };
    if (await tx.gymMemberInvitation.findFirst({ where: { gymId, ...target, status: "PENDING", expiresAt: { gt: new Date() } } })) throw new Rechazo("gimnasio_invitacion_repetida");
    const created = await tx.gymMemberInvitation.create({ data: { gymId, senderId: user.id, recipientId: member.userId, ...target, previousGymId: member.gymId, expiresAt: new Date(Date.now() + 14 * 864e5) } });
    await audit({ userId: user.id, entity: "GYM", entityId: gym.id, action: "GYM_MEMBER_INVITED", after: { invitationId: created.id } }, tx);
    await putNotification(member.userId, "GYM_MEMBER", "Un gimnasio te invita a vincular tu ficha", "/mis-gimnasios#invitaciones", `gym-member:${created.id}`, tx);
    return created;
  }));
  revalidatePath("/", "layout");
  go(back, { aviso: "gimnasio_invitacion_enviada" });
}

/** Solo quien recibió la invitación decide. Propiedad, bloqueos y afiliación se vuelven a comprobar dentro de la transacción. */
export async function answerGymMemberInvitation(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const back = "/mis-gimnasios#invitaciones";
  const decision = str(f, "decision");
  if (decision !== "accept" && decision !== "decline") go(back, { problema: "decision_no_valida" });
  const invitation = await db.gymMemberInvitation.findFirst({ where: { id: str(f, "invitationId"), recipientId: user.id } });
  if (!invitation) go(back, { problema: "no_existe" });
  await guard(back, () => withLock(`gym:${invitation.gymId}`, async (tx) => {
    const current = await tx.gymMemberInvitation.findUnique({ where: { id: invitation.id } });
    if (!current || current.recipientId !== user.id || current.status !== "PENDING" || current.expiresAt <= new Date()) throw new Rechazo("solicitud_cambiada");
    const gym = await tx.gym.findUnique({ where: { id: current.gymId } });
    if (!gym || gym.ownerUserId !== current.senderId || gym.status !== "PUBLISHED") throw new Rechazo("solicitud_cambiada");
    if (await hayBloqueo(user.id, current.senderId, tx)) throw new Rechazo("bloqueo_contacto");
    const kind = current.fighterId ? "fighter" : "trainer", id = (current.fighterId ?? current.trainerId)!;
    const member = await gymMember(tx, kind, id);
    if (!member || member.userId !== user.id) throw new Rechazo("sin_permiso");
    if (decision === "accept") {
      // Escritura condicionada: ni otra invitación ni una edición posterior pueden quedar sobrescritas.
      const where = { id, gymId: current.previousGymId };
      const saved = kind === "fighter" ? await tx.fighter.updateMany({ where: { ...where, userId: user.id, listed: true, hiddenAt: null }, data: { gymId: gym.id } }) : await tx.trainer.updateMany({ where, data: { gymId: gym.id } });
      if (saved.count !== 1) throw new Rechazo("solicitud_cambiada");
    }
    const saved = await tx.gymMemberInvitation.updateMany({ where: { id: current.id, status: "PENDING" }, data: { status: decision === "accept" ? "ACCEPTED" : "DECLINED", answeredAt: new Date() } });
    if (saved.count !== 1) throw new Rechazo("solicitud_cambiada");
    await audit({ userId: user.id, entity: "GYM", entityId: gym.id, action: decision === "accept" ? "GYM_MEMBER_ACCEPTED" : "GYM_MEMBER_DECLINED", after: { invitationId: current.id } }, tx);
    await putNotification(current.senderId, "GYM_MEMBER", decision === "accept" ? "Han aceptado una invitación de tu gimnasio" : "Han rechazado una invitación de tu gimnasio", `/mis-gimnasios?gimnasio=${gym.id}`, `gym-member-answer:${current.id}`, tx);
  }));
  revalidatePath("/", "layout"); go(back, { aviso: "gimnasio_invitacion_respondida" });
}

/** El remitente cancela una invitación pendiente; no se altera ninguna afiliación. */
export async function cancelGymMemberInvitation(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const back = "/mis-gimnasios";
  const invitation = await db.gymMemberInvitation.findFirst({ where: { id: str(f, "invitationId"), senderId: user.id } });
  if (!invitation) go(back, { problema: "no_existe" });
  await guard(back, () => withLock(`gym:${invitation.gymId}`, async (tx) => {
    const current = await tx.gymMemberInvitation.findFirst({ where: { id: str(f, "invitationId"), senderId: user.id, status: "PENDING" } });
    if (!current) throw new Rechazo("no_existe");
    await tx.gymMemberInvitation.update({ where: { id: current.id }, data: { status: "CANCELLED", answeredAt: new Date() } });
    await audit({ userId: user.id, entity: "GYM", entityId: current.gymId, action: "GYM_MEMBER_CANCELLED", after: { invitationId: current.id } }, tx);
  }));
  revalidatePath("/", "layout"); go(back, { aviso: "gimnasio_invitacion_cancelada" });
}
