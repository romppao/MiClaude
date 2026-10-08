// Moderación: decisiones de la moderación (combates en revisión, reclamaciones, organizadores, sello de gimnasios, avisos).
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { boutVersion } from "../../lib/bouts/rules";
import { WITHOUT_BOUT_BACKING } from "../../lib/aura/trajectory";
import { db } from "../../lib/common/db";
import { requireAdmin } from "../../lib/accounts/permissions";
import { APP_URL } from "../../lib/common/mail";
import { audit } from "../../lib/common/audit";
import { notifyDecision } from "../../lib/community/notify";
import { anonymizeFighter } from "../../lib/fighters/anonymize";
import { LIMITS, oneLine } from "../../lib/common/text";
import { Rechazo, fullNameSlug, go, guard, listFighters, returnTo, str } from "./shared";

/** Cola de moderación de combates: verificar, rechazar o restaurar uno rechazado. Solo moderadores. */
export async function adminDecide(f: FormData) {
  const admin = await requireAdmin();
  const back = returnTo(f, "/moderacion");
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") } });
  if (!bout) go(back, { problema: "no_existe" });
  const decision = str(f, "decision");
  if (str(f, "version") !== boutVersion(bout)) go(back, { problema: "combate_cambiado" });
  const plan =
    decision === "verify" && bout.verification !== "VERIFIED" ? { next: "VERIFIED" as const, aviso: "moderacion_verificado" }
    : decision === "dispute" && bout.verification !== "DISPUTED" ? { next: "DISPUTED" as const, aviso: "moderacion_rechazado" }
    : decision === "restore" && bout.verification === "DISPUTED" ? { next: "SELF_REPORTED" as const, aviso: "moderacion_restaurado" }
    : null;
  if (!plan) go(back, { problema: "moderacion_estado" });
  await guard(back, () => db.$transaction(async (tx) => {
    // Solo si el combate sigue en el estado que vio quien decide (el rival o otra persona de moderación pueden haberlo cambiado entretanto).
    if ((await tx.bout.updateMany({ where: { id: bout.id, verification: bout.verification, result: bout.result, method: bout.method, endRound: bout.endRound }, data: { ...WITHOUT_BOUT_BACKING, verification: plan.next } })).count === 0) throw new Rechazo("combate_cambiado");
    if (plan.next === "VERIFIED") await listFighters(tx, [bout.fighterAId, bout.fighterBId]);
    await audit({ userId: admin.id, entity: "BOUT", entityId: bout.id, action: `ADMIN_${plan.next}`, before: { verification: bout.verification }, after: { verification: plan.next } }, tx);
  }));
  revalidatePath("/", "layout");
  go(back, { aviso: plan.aviso });
}

export async function decideClaim(f: FormData) {
  const admin = await requireAdmin();
  const back = returnTo(f, "/moderacion");
  const claim = await db.claimRequest.findUnique({ where: { id: str(f, "claimId") }, include: { fighter: true } });
  if (!claim || claim.status !== "PENDING") go(back, { problema: "no_existe" });
  if (!["approve", "reject"].includes(str(f, "decision"))) go(back, { problema: "decision_no_valida" });
  const wantsApprove = str(f, "decision") === "approve";
  const note = str(f, "note").slice(0, LIMITS.note) || null;
  if (!wantsApprove && !note) go(back, { problema: "motivo_falta" }); // quien recibe un «no» tiene derecho a saber por qué
  const approved = await guard(back, () => db.$transaction(async (tx) => {
    let ok = false;
    // Asignación condicional: si dos moderadores aprueban a la vez, solo una gana; y una persona no puede tener dos fichas.
    if (wantsApprove && !(await tx.fighter.findFirst({ where: { userId: claim.userId } }))) {
      ok = (await tx.fighter.updateMany({ where: { id: claim.fighterId, userId: null, hiddenAt: null }, data: { userId: claim.userId, listed: true } })).count === 1;
    }
    // Se borra el texto con el que la persona justificó su identidad: ya no hace falta y no debe conservarse.
    // Una aprobación imposible (la ficha ya tiene titular o la persona ya tiene otra ficha) no rechaza en silencio: la solicitud sigue pendiente y quien modera
    // decide con la causa a la vista (puede rechazarla explicando el motivo, que se le envía por correo).
    if (wantsApprove && !ok) throw new Rechazo("reclamacion_no_aprobable");
    // Solo si sigue pendiente: si otra persona de moderación decidió a la vez, esta decisión se descarta entera (no se pisa ni se envía un correo contradictorio).
    if ((await tx.claimRequest.updateMany({ where: { id: claim.id, status: "PENDING" }, data: { status: ok ? "APPROVED" : "REJECTED", message: null, reviewNote: note, reviewedAt: new Date() } })).count === 0) throw new Rechazo("solicitud_cambiada");
    if (ok) {
      await fullNameSlug(tx, claim.fighterId);
      await tx.claimRequest.updateMany({ where: { fighterId: claim.fighterId, id: { not: claim.id }, status: "PENDING" }, data: { status: "REJECTED", message: null } });
      // Quien reclama una ficha no puede conservar el aura ni el seguimiento que dio a esa misma persona antes de ser ella.
      await tx.aura.deleteMany({ where: { userId: claim.userId, bout: { OR: [{ fighterAId: claim.fighterId }, { fighterBId: claim.fighterId }] } } });
      await tx.follow.deleteMany({ where: { userId: claim.userId, fighterId: claim.fighterId } });
    }
    await audit({ userId: admin.id, entity: "CLAIM", entityId: claim.id, action: ok ? "APPROVED" : "REJECTED", after: { userId: claim.userId, fighterId: claim.fighterId, requestedApproval: wantsApprove } }, tx);
    return ok;
  }));
  revalidatePath("/", "layout");
  const nombreFicha = `${claim.fighter.firstName} ${claim.fighter.lastName}`;
  after(async () => {
    await notifyDecision(claim.userId, approved ? "Tu solicitud de ficha en Ring España ha sido aprobada" : "Tu solicitud de ficha en Ring España no se ha aprobado",
      approved ? `Un moderador ha aprobado tu solicitud: la ficha de ${nombreFicha} ya es tuya. Puedes verla y corregir sus datos aquí: ${APP_URL}/mi-ficha`
        : `Un moderador no ha podido aprobar tu solicitud para reclamar la ficha de ${nombreFicha}.${note ? ` Motivo: ${oneLine(note)}.` : ""}\n\nSi crees que es un error, puedes enviar otra solicitud con más información aquí: ${APP_URL}/mi-ficha`);
  });
  go(back, { aviso: approved ? "reclamacion_aprobada" : "reclamacion_rechazada" });
}

export async function decideOrganizer(f: FormData) {
  const admin = await requireAdmin();
  const back = returnTo(f, "/moderacion");
  const req = await db.organizerRequest.findUnique({ where: { id: str(f, "requestId") }, include: { user: true } });
  if (!req || req.status !== "PENDING") go(back, { problema: "no_existe" });
  if (!["approve", "reject"].includes(str(f, "decision"))) go(back, { problema: "decision_no_valida" });
  const approve = str(f, "decision") === "approve";
  const note = str(f, "note").slice(0, LIMITS.note) || null;
  // El sello de organizador se apoya en una evidencia: se anota qué se ha comprobado al aprobar y el motivo al rechazar (quien recibe un «no» tiene derecho a saber por qué).
  if (!note) go(back, { problema: approve ? "evidencia_falta" : "motivo_falta" });
  await guard(back, () => db.$transaction(async (tx) => {
    // Solo si sigue pendiente y con los mismos datos que vio quien decide (el solicitante podría haberlos cambiado mientras tanto).
    if ((await tx.organizerRequest.updateMany({ where: { id: req.id, status: "PENDING", orgName: req.orgName, message: req.message }, data: { status: approve ? "APPROVED" : "REJECTED", reviewNote: note, reviewedAt: new Date(), message: null } })).count === 0) throw new Rechazo("solicitud_cambiada");
    // Los permisos de organizador salen del rol: se concede a cualquier persona que no sea ya moderadora (un peleador también puede organizar).
    if (approve && req.user.role !== "ADMIN") await tx.user.update({ where: { id: req.userId }, data: { role: "ORGANIZER" } });
    // Una federación aprobada tiene desde ese momento su perfil en el directorio y a su solicitante como titular (puede editarlo sin más pasos).
    if (approve && req.kind === "FEDERACION") {
      const profileId = randomUUID();
      await tx.profile.create({ data: { kind: "federacion", entityId: profileId, name: req.orgName, website: req.website, ownerId: req.userId } });
      await audit({ userId: admin.id, entity: "PROFILE", entityId: profileId, action: "FEDERATION_CREATED", after: { name: req.orgName, ownerId: req.userId, fromRequest: req.id } }, tx);
    }
    await audit({ userId: admin.id, entity: "ORGANIZER", entityId: req.id, action: approve ? "APPROVED" : "REJECTED", after: { userId: req.userId, orgName: req.orgName, note } }, tx);
  }));
  revalidatePath("/", "layout");
  after(async () => {
    await notifyDecision(req.userId, approve ? "Ya puedes publicar veladas en Ring España" : "Tu solicitud de organizador en Ring España no se ha aprobado",
      approve ? `Un moderador ha aprobado tu solicitud como organizador de «${oneLine(req.orgName)}». Ya puedes crear veladas y montar sus carteles aquí: ${APP_URL}/organizador${req.kind === "FEDERACION" ? `\n\nTu federación ya tiene su perfil en el directorio: puedes completarlo desde Mi cuenta o en ${APP_URL}/federaciones` : ""}`
        : `Un moderador no ha podido aprobar tu solicitud como organizador de «${oneLine(req.orgName)}».${note ? ` Motivo: ${oneLine(note)}.` : ""}\n\nPuedes enviar otra solicitud con más información aquí: ${APP_URL}/organizador`);
  });
  go(back, { aviso: approve ? "organizador_aprobado" : "organizador_rechazado" });
}

/** Un moderador concede o retira el sello de verificado a un gimnasio, anotando en qué evidencia se basa. */
export async function setGymVerified(f: FormData) {
  const admin = await requireAdmin();
  const back = returnTo(f, "/moderacion");
  const gym = await db.gym.findUnique({ where: { id: str(f, "gymId") } });
  if (!gym) go(back, { problema: "no_existe" });
  if (!["verify", "revoke"].includes(str(f, "decision"))) go(back, { problema: "decision_no_valida" });
  const verify = str(f, "decision") === "verify";
  const note = str(f, "note").slice(0, LIMITS.note) || null;
  if (verify && !note) go(back, { problema: "sello_sin_nota" }); // el sello siempre lleva la evidencia que lo justifica
  await db.$transaction([
    db.gym.update({ where: { id: gym.id }, data: { verifiedAt: verify ? new Date() : null, verifiedNote: verify ? note : null } }),
    audit({ userId: admin.id, entity: "GYM", entityId: gym.id, action: verify ? "VERIFIED" : "VERIFICATION_REVOKED", before: { verifiedAt: gym.verifiedAt, note: gym.verifiedNote }, after: { note } }, db),
  ]);
  revalidatePath("/", "layout");
  go(back, { aviso: verify ? "sello_concedido" : "sello_retirado" });
}

export async function resolveReport(f: FormData) {
  const admin = await requireAdmin();
  const back = returnTo(f, "/moderacion");
  const report = await db.report.findUnique({ where: { id: str(f, "reportId") } });
  if (!report || report.status !== "OPEN") go(back, { problema: "no_existe" });
  const decision = str(f, "decision");
  if (!["resolve", "hide", "dismiss"].includes(decision)) go(back, { problema: "decision_no_valida" });
  const hide = decision === "hide"; // resolver actuando sobre el dato avisado: rechazar el combate, ocultar la ficha o retirar el comentario
  const status = decision === "dismiss" ? "DISMISSED" : "RESOLVED";
  const note = str(f, "note").slice(0, LIMITS.note) || null;
  // Ocultar una ficha borra sus datos personales y no se puede deshacer: exige anotar el motivo, y solo vale para fichas sin titular
  // (si tiene una cuenta, su titular puede corregirla o eliminarla; ocultarla lo dejaría atado a una ficha inservible).
  if (hide && report.entity === "FIGHTER" && !note) go(back, { problema: "ocultar_sin_nota" });
  await guard(back, () => db.$transaction(async (tx) => {
    if (!(await tx.report.updateMany({ where: { id: report.id, status: "OPEN" }, data: { status, resolvedById: admin.id, resolvedAt: new Date(), resolutionNote: note } })).count) throw new Rechazo("solicitud_cambiada");
    if (hide) {
      if (report.entity === "BOUT") await tx.bout.updateMany({ where: { id: report.entityId }, data: { ...WITHOUT_BOUT_BACKING, verification: "DISPUTED" } });
      else if (report.entity === "FIGHTER") {
        const ficha = await tx.fighter.findUnique({ where: { id: report.entityId }, select: { userId: true } });
        if (!ficha) throw new Rechazo("no_existe");
        if (ficha.userId) throw new Rechazo("ficha_con_titular");
        await anonymizeFighter(tx, report.entityId);
      }
      else if (report.entity === "AURA") await tx.aura.updateMany({ where: { id: report.entityId }, data: { hiddenAt: new Date() } });
      else if (report.entity === "MEDIA") await tx.mediaItem.updateMany({ where: { id: report.entityId }, data: { hiddenAt: new Date() } });
    }
    await audit({ userId: admin.id, entity: "REPORT", entityId: report.id, action: hide ? "RESOLVED_AND_HIDDEN" : status, before: { status: report.status }, after: { status, note, target: `${report.entity}:${report.entityId}` } }, tx);
  }));
  revalidatePath("/", "layout");
  go(back, { aviso: hide ? "aviso_resuelto_oculto" : status === "RESOLVED" ? "aviso_resuelto" : "aviso_descartado" });
}
