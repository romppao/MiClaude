import type { Prisma } from "@prisma/client";
import { HORAS_PARA_CONTAR_DECLARADO } from "./record-time";

/** Filtro común de base de datos: confirmados/verificados cuentan al instante; declaraciones, al cumplir 24 horas. */
export function boutsQueCuentan(now: Date = new Date()): Prisma.BoutWhereInput {
  return {
    AND: [
      { verification: { not: "DISPUTED" } },
      { event: { status: { notIn: ["CANCELLED", "PENDING_AUTHORIZATION", "REJECTED"] } } },
      { OR: [{ verification: { not: "SELF_REPORTED" } }, { createdAt: { lte: new Date(now.getTime() - HORAS_PARA_CONTAR_DECLARADO * 60 * 60 * 1000) } }] },
    ],
  };
}
