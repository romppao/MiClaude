import type { Prisma } from "@prisma/client";
import { boutsQueCuentan } from "../common/record-eligibility";

/** Veladas que el público no ve: canceladas, pendientes de autorizar (fecha pasada) y rechazadas por moderación. */
export const VELADAS_NO_PUBLICAS = ["CANCELLED", "PENDING_AUTHORIZATION", "REJECTED"] as const;

/**
 * Consultas de «Peleadores que sigo». Próximos: combates no suspendidos de veladas públicas. Resultados: solo los que cuentan en el
 * récord (misma regla que el panel, el ránking y las fichas), así no aparecen veladas sin autorizar ni declaraciones de menos de 24 horas.
 */
export function filtrosSiguiendo(fighterIds: string[], now: Date = new Date()): { proximos: Prisma.BoutWhereInput; resultados: Prisma.BoutWhereInput } {
  const deSeguidos: Prisma.BoutWhereInput = { OR: [{ fighterAId: { in: fighterIds } }, { fighterBId: { in: fighterIds } }] };
  return {
    proximos: { AND: [deSeguidos, { verification: { not: "DISPUTED" } }, { event: { status: { notIn: [...VELADAS_NO_PUBLICAS] } } }] },
    resultados: { AND: [deSeguidos, { result: { not: null } }, boutsQueCuentan(now)] },
  };
}
