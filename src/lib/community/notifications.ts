import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "../common/db";
import { internalPath } from "../common/paths";
import { registrarFallo } from "../common/fallos";
import { eventDayReached, todayMadrid } from "../common/dates";
import { hayBloqueo } from "./bloqueos";

export type NotificationKind = "GYM_MEMBER" | "BOUT_ANNOUNCED" | "BOUT_RESULT" | "AURA_RECEIVED" | "BOUT_DECLARED" | "PROPOSAL" | "CLASS_REQUEST" | "CLASS_ANSWER" | "REGISTRATION" | "BOUT_VIDEO" | "MEDIA_HIGHLIGHT" | "TICKET" | "INVITATION" | "INVITATION_ANSWER" | "MODERATION";

/** Clave estable por destinatario/hecho. Evita duplicados de reintentos sin revelar identificadores en títulos. */
export const notificationId = (userId: string, key: string) => createHash("sha256").update(`${userId}\0${key}`).digest("hex").slice(0, 32);
export const dailyAuraKey = (fighterId: string, now = new Date()) => `aura:${fighterId}:${todayMadrid(now)}`;
export { notificationCutoff } from "../common/periods";

/** Productor interno, no acción pública: el llamante comprueba permisos. Dentro de una transacción, el aviso se guarda junto al hecho. */
export async function putNotification(userId: string, kind: NotificationKind, title: string, href: string, key: string, tx: Prisma.TransactionClient = db, repeat = false) {
  const data = { userId, kind, title: title.slice(0, 160), href: internalPath(href, "/mi-panel").slice(0, 500) };
  return tx.notification.upsert({ where: { id: notificationId(userId, key) }, create: { id: notificationId(userId, key), ...data }, update: repeat ? { title: data.title, href: data.href, readAt: null } : {} });
}

/** Aviso posterior a una escritura ya confirmada. Un fallo se registra y nunca convierte una operación guardada en un error falso. */
export async function notifyInApp(userId: string, kind: NotificationKind, title: string, href: string, key: string, repeat = false) {
  try { await putNotification(userId, kind, title, href, key, db, repeat); }
  catch (error) { await registrarFallo({ origen: "AVISOS", contexto: "No se pudo guardar un aviso dentro de la aplicación", error }); }
}

/** Los avisos dentro de la app son independientes de la preferencia de correo. No publican resultados, nombres ni récords privados. */
export async function notifyFollowedBout(boutId: string, kind: "BOUT_ANNOUNCED" | "BOUT_RESULT") {
  const bout = await db.bout.findUnique({ where: { id: boutId }, include: { event: true, fighterA: true, fighterB: true } });
  if (!bout || !["SCHEDULED", "COMPLETED"].includes(bout.event.status) || bout.fighterA.hiddenAt || bout.fighterB.hiddenAt || !bout.fighterA.listed || !bout.fighterB.listed) return;
  if (kind === "BOUT_ANNOUNCED" && (bout.event.status !== "SCHEDULED" || eventDayReached(bout.event.date))) return;
  if (kind === "BOUT_RESULT" && (!bout.result || !eventDayReached(bout.event.date) || bout.verification === "DISPUTED")) return;
  const follows = await db.follow.findMany({ where: { fighterId: { in: [bout.fighterAId, bout.fighterBId] } }, select: { userId: true } });
  for (const userId of new Set(follows.map((f) => f.userId))) await notifyInApp(userId, kind,
    kind === "BOUT_ANNOUNCED" ? "Han anunciado un combate de un peleador que sigues" : "Hay un resultado nuevo de un peleador que sigues",
    `/veladas/${bout.event.slug}`, `${kind}:${bout.id}:${kind === "BOUT_RESULT" ? `${bout.result}:${bout.method ?? ""}:${bout.verification}` : ""}`);
}

/** Vídeos vinculados a un combate público: avisa a sus titulares, no a toda la comunidad. */
export async function notifyBoutVideo(mediaId: string) {
  const media = await db.mediaItem.findUnique({ where: { id: mediaId }, include: { event: true, bout: { include: { fighterA: true, fighterB: true } } } });
  if (!media?.bout || media.kind !== "VIDEO" || media.hiddenAt || !["SCHEDULED", "COMPLETED"].includes(media.event.status) || media.bout.eventId !== media.eventId) return;
  // Sin aviso a quien tiene un bloqueo con la persona que lo compartió (lib/community/bloqueos.ts).
  const destinatarios = [media.bout.fighterA.userId, media.bout.fighterB.userId].filter((id): id is string => !!id);
  const libres = (await Promise.all(destinatarios.map(async (id) => (await hayBloqueo(id, media.uploaderId)) ? null : id))).filter((id): id is string => !!id);
  for (const userId of new Set(libres)) await notifyInApp(userId, "BOUT_VIDEO", "Han compartido un vídeo de uno de tus combates", "/mi-panel#videos", `video:${media.id}`);
}
