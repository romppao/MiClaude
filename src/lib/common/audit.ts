import type { Prisma } from "@prisma/client";
import { db } from "./db";

type Client = Prisma.TransactionClient | typeof db;

/** Registra un cambio relevante. Se puede pasar el cliente de una transacción para que el registro sea atómico con el cambio. */
export function audit(
  entry: { userId?: string | null; entity: string; entityId: string; action: string; before?: unknown; after?: unknown },
  client: Client = db,
) {
  return client.auditLog.create({
    data: {
      userId: entry.userId ?? null, entity: entry.entity, entityId: entry.entityId, action: entry.action,
      before: entry.before === undefined ? undefined : (entry.before as Prisma.InputJsonValue),
      after: entry.after === undefined ? undefined : (entry.after as Prisma.InputJsonValue),
    },
  });
}
