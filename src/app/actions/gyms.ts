// Directorio de gimnasios: altas, propiedad revisada y edición autorizada. Ninguna acción envía campañas.
"use server";

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
import { sendMail } from "../../lib/common/mail";
import { str, go, checkLengths, readProvince, guard, Rechazo, withLock, uniqueSlug } from "./shared";

/** Alta manual: moderación publica; las demás cuentas aportan prueba y quedan en revisión, sin autoasignarse propiedad. */
export async function saveGym(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const id = str(f, "gymId");
  const back = "/mis-gimnasios";
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
    if (!g) throw new Rechazo("no_existe");
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
  const back = "/moderacion/gimnasios";
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
      await tx.gym.update({ where: { id: gym.id }, data: { ownerUserId: claim.userId, claimedAt: now, verifiedAt: now, verifiedNote: note, source: "PROPIETARIO", status: excludedGymProvince(gym.province) ? "PENDING" : "PUBLISHED" } });
      await tx.profile.upsert({ where: { kind_entityId: { kind: "gimnasio", entityId: gym.id } }, create: { kind: "gimnasio", entityId: gym.id, ownerId: claim.userId }, update: { ownerId: claim.userId } });
    }
    await audit({ userId: admin.id, entity: "GYM", entityId: gym.id, action: decision === "approve" ? "GYM_CLAIM_APPROVED" : "GYM_CLAIM_REJECTED", after: { claimId: claim.id } }, tx);
    return decision;
  }));
  if (result !== "conflict") after(() => sendMail(claim.user.email, "Tu reclamación de gimnasio en Lona", result === "approve" ? "Moderación ha aprobado tu reclamación. Puedes gestionar el gimnasio desde Mis gimnasios." : `Moderación ha rechazado la reclamación: ${note}`));
  revalidatePath("/", "layout"); go(back, { aviso: result === "conflict" ? "gimnasio_conflicto" : "gimnasio_decidido" });
}

/** Cede a una cuenta ya verificada; nunca modifica permisos de moderación. */
export async function transferGym(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const back = "/mis-gimnasios";
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
  revalidatePath("/", "layout"); go(back, { aviso: "gimnasio_cedido" });
}

/** Vincula una ficha pública al club o retira una ya vinculada; todas las modificaciones quedan auditadas. */
export async function setGymMember(f: FormData) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const back = "/mis-gimnasios";
  const kind = str(f, "kind"), decision = str(f, "decision");
  if (!["fighter", "trainer"].includes(kind) || !["link", "unlink"].includes(decision)) go(back, { problema: "opcion_invalida" });
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
