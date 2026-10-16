import type { Prisma } from "@prisma/client";
import { db } from "../common/db";

/**
 * Bloquear a otro usuario (Apple, norma 1.2 de revisión de aplicaciones; docs/LEGAL.md, «Pendiente en la app»).
 *
 * Qué hace un bloqueo de A a B:
 *  - B ya no puede retar ni proponer sparring a A, pedir sus clases ni seguir su ficha (y A tampoco a B: el contacto se corta en los dos sentidos,
 *    para que A no pueda escribir a quien ya no puede contestarle).
 *  - A deja de ver los comentarios de aura, los vídeos y las fotos de B, y sus propuestas y solicitudes.
 *  - Al bloquear se cancelan las propuestas y las solicitudes de clase pendientes entre los dos y se quitan los «seguir» mutuos.
 *  - No borra nada público de B para los demás (eso es cosa de moderación, con un aviso) ni toca el aura ni el récord: bloquear no es castigar.
 *  - A B no se le avisa. Moderación no queda afectada por los bloqueos.
 */

type Cliente = Prisma.TransactionClient | typeof db;

/** Ids de las personas que `userId` ha bloqueado (para ocultarle su contenido). */
export async function bloqueadosPor(userId: string | null | undefined, cliente: Cliente = db): Promise<string[]> {
  if (!userId) return [];
  const filas = await cliente.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } });
  return filas.map((f) => f.blockedId);
}

/** ¿Hay un bloqueo entre las dos personas, en cualquier sentido? Corta el contacto directo (propuestas, clases, seguir). */
export async function hayBloqueo(a: string | null | undefined, b: string | null | undefined, cliente: Cliente = db): Promise<boolean> {
  if (!a || !b || a === b) return false;
  const fila = await cliente.block.findFirst({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] }, select: { blockerId: true } });
  return !!fila;
}

/** Desde dónde se bloquea: lo que la persona ve en pantalla, para no tener que mostrar identificadores de usuario. */
export const ORIGENES_DE_BLOQUEO = ["peleador", "aura", "medio", "propuesta", "solicitud", "invitacion"] as const;
export type OrigenDeBloqueo = (typeof ORIGENES_DE_BLOQUEO)[number];

export function esOrigenDeBloqueo(v: string): v is OrigenDeBloqueo {
  return (ORIGENES_DE_BLOQUEO as readonly string[]).includes(v);
}

/**
 * Averigua a qué cuenta pertenece lo que se quiere bloquear. `quien` es quien bloquea: una propuesta o una solicitud solo valen si son suyas
 * (recibidas o enviadas), así nadie puede tantear a quién pertenece una propuesta ajena. Devuelve null si no hay cuenta detrás.
 */
export async function cuentaDe(origen: OrigenDeBloqueo, id: string, quien: string): Promise<string | null> {
  if (!id || id.length > 40) return null;
  switch (origen) {
    case "peleador": return (await db.fighter.findUnique({ where: { id }, select: { userId: true } }))?.userId ?? null;
    case "aura": return (await db.aura.findUnique({ where: { id }, select: { userId: true } }))?.userId ?? null;
    case "medio": return (await db.mediaItem.findUnique({ where: { id }, select: { uploaderId: true } }))?.uploaderId ?? null;
    case "propuesta": {
      const p = await db.fightProposal.findUnique({ where: { id }, select: { from: { select: { userId: true } }, to: { select: { userId: true } } } });
      if (!p) return null;
      if (p.to.userId === quien) return p.from.userId;
      if (p.from.userId === quien) return p.to.userId;
      return null;
    }
    case "invitacion": {
      // Solo vale una invitación que sea de quien bloquea (recibida o enviada).
      const i = await db.invitation.findUnique({ where: { id }, select: { fromUserId: true, to: { select: { userId: true } } } });
      if (!i) return null;
      if (i.to.userId === quien) return i.fromUserId;
      if (i.fromUserId === quien) return i.to.userId;
      return null;
    }
    case "solicitud": {
      const r = await db.classRequest.findUnique({ where: { id }, select: { userId: true, class: { select: { trainer: { select: { userId: true } } } } } });
      if (!r) return null;
      if (r.class.trainer.userId === quien) return r.userId;
      if (r.userId === quien) return r.class.trainer.userId;
      return null;
    }
  }
}

/**
 * Crea el bloqueo y corta lo que estaba en marcha entre los dos: propuestas y solicitudes pendientes (las recibidas quedan rechazadas y las
 * enviadas, canceladas) y los «seguir» en los dos sentidos. Idempotente: bloquear dos veces no falla.
 */
export async function bloquear(tx: Prisma.TransactionClient, blockerId: string, blockedId: string): Promise<void> {
  await tx.block.createMany({ data: [{ blockerId, blockedId }], skipDuplicates: true });
  const [mio, suyo] = await Promise.all([
    tx.fighter.findUnique({ where: { userId: blockerId }, select: { id: true } }),
    tx.fighter.findUnique({ where: { userId: blockedId }, select: { id: true } }),
  ]);
  if (mio && suyo) {
    const ahora = new Date();
    await tx.fightProposal.updateMany({ where: { fromId: suyo.id, toId: mio.id, status: "PENDING" }, data: { status: "DECLINED", answeredAt: ahora } });
    await tx.fightProposal.updateMany({ where: { fromId: mio.id, toId: suyo.id, status: "PENDING" }, data: { status: "CANCELLED" } });
  }
  const ahoraInv = new Date();
  await tx.invitation.updateMany({ where: { status: "PENDING", fromUserId: blockedId, to: { userId: blockerId } }, data: { status: "DECLINED", answeredAt: ahoraInv } });
  await tx.invitation.updateMany({ where: { status: "PENDING", fromUserId: blockerId, to: { userId: blockedId } }, data: { status: "WITHDRAWN", answeredAt: ahoraInv } });
  await tx.classRequest.updateMany({ where: { userId: blockedId, status: "PENDING", class: { trainer: { userId: blockerId } } }, data: { status: "DECLINED", answeredAt: new Date() } });
  await tx.classRequest.updateMany({ where: { userId: blockerId, status: "PENDING", class: { trainer: { userId: blockedId } } }, data: { status: "CANCELLED" } });
  const correos = await tx.user.findMany({ where: { id: { in: [blockerId, blockedId] } }, select: { id: true, email: true } });
  const correoDe = (id: string) => correos.find(u => u.id === id)?.email ?? "";
  await tx.gymTransferInvitation.updateMany({ where: { status: "PENDING", OR: [{ senderId: blockerId, recipientEmail: correoDe(blockedId) }, { senderId: blockedId, recipientEmail: correoDe(blockerId) }] }, data: { status: "CANCELLED", answeredAt: new Date() } });

  await tx.gymMemberInvitation.updateMany({ where: { status: "PENDING", OR: [{ senderId: blockerId, recipientId: blockedId }, { senderId: blockedId, recipientId: blockerId }] }, data: { status: "CANCELLED", answeredAt: new Date() } });
  if (suyo) await tx.follow.deleteMany({ where: { userId: blockerId, fighterId: suyo.id } });
  if (mio) await tx.follow.deleteMany({ where: { userId: blockedId, fighterId: mio.id } });
}
