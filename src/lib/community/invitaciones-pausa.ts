import type { Prisma } from "@prisma/client";
import { DENUNCIAS_PARA_PAUSAR_INVITACIONES } from "./reports";

/** ¿Hay denuncias suficientes, de personas distintas, para pausar el envío de invitaciones de una cuenta hasta que lo revise moderación? */
export const debePausarse = (denunciantesAbiertos: number): boolean => denunciantesAbiertos >= DENUNCIAS_PARA_PAUSAR_INVITACIONES;

/** Cuántas personas distintas tienen abierta una denuncia sobre invitaciones enviadas por esta cuenta. */
export async function denunciantesAbiertos(tx: Prisma.TransactionClient, remitenteId: string): Promise<number> {
  const ids = (await tx.invitation.findMany({ where: { fromUserId: remitenteId }, select: { id: true } })).map((i) => i.id);
  if (!ids.length) return 0;
  const filas = await tx.report.findMany({ where: { entity: "INVITACION", entityId: { in: ids }, status: "OPEN", userId: { not: null } }, select: { userId: true }, distinct: ["userId"] });
  return filas.length;
}

/**
 * Pone en pausa el envío de invitaciones de una cuenta y retira las que esperaban respuesta (nadie más recibe lo que quizá no es bienvenido
 * mientras se revisa). Devuelve si la pausa es nueva: false si la cuenta ya estaba en pausa. Productor interno: el llamante comprueba permisos.
 */
export async function pausarInvitaciones(tx: Prisma.TransactionClient, remitenteId: string): Promise<boolean> {
  const ahora = new Date();
  const nueva = (await tx.user.updateMany({ where: { id: remitenteId, invitationsSuspendedAt: null }, data: { invitationsSuspendedAt: ahora } })).count === 1;
  await tx.invitation.updateMany({ where: { fromUserId: remitenteId, status: "PENDING" }, data: { status: "WITHDRAWN", answeredAt: ahora } });
  return nueva;
}
