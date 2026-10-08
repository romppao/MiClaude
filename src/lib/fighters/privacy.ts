import type { Level } from "@prisma/client";

/**
 * Récord amateur privado (decisión del fundador, 7 de octubre de 2026): en el nivel amateur, por defecto el público solo ve cuántos combates
 * lleva el peleador; el récord completo (victorias, derrotas, empates y cómo terminó cada combate) solo si él lo activa en «Mi ficha».
 * En profesional el récord siempre es público. El titular de la ficha siempre ve el suyo.
 */
export function recordHidden(level: Level, recordPublic: boolean, isOwner: boolean): boolean {
  return level === "AMATEUR" && !recordPublic && !isOwner;
}

/** Texto corto del récord como lo ve el público: «12-2-1» o, si está oculto, «14 combates». */
export function shownRecord(r: { w: number; l: number; d: number }, hidden: boolean): string {
  const total = r.w + r.l + r.d;
  return hidden ? `${total} ${total === 1 ? "combate" : "combates"}` : `${r.w}-${r.l}-${r.d}`;
}
