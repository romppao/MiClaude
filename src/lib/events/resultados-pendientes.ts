import type { Prisma } from "@prisma/client";

/** Veladas en las que ya no se anotan resultados: canceladas o rechazadas por moderación. */
const SIN_RESULTADOS = ["CANCELLED", "REJECTED"] as const;

/** Veladas de un organizador ya celebradas (antes de `hoy`) con algún combate sin resultado. */
export function veladasConResultadosPendientes(organizerId: string, hoy: Date): Prisma.EventWhereInput {
  return { organizerId, date: { lt: hoy }, status: { notIn: [...SIN_RESULTADOS] }, bouts: { some: { result: null } } };
}

/**
 * Resumen para el panel de la entidad: el total de combates sin resultado de TODAS sus veladas celebradas (antes solo contaba la última)
 * y las primeras `max` veladas para enlazarlas; `resto` son las que no caben en el aviso.
 */
export function resumenResultadosPendientes<T extends { _count: { bouts: number } }>(veladas: T[], max = 3): { total: number; visibles: T[]; resto: number } {
  const conPendientes = veladas.filter((v) => v._count.bouts > 0);
  return { total: conPendientes.reduce((n, v) => n + v._count.bouts, 0), visibles: conPendientes.slice(0, max), resto: Math.max(0, conPendientes.length - max) };
}
