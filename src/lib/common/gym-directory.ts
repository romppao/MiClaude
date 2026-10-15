import type { Prisma } from "@prisma/client";
import { EXCLUDED_GYM_PROVINCES } from "./gym-policy";

/** Mismo criterio para lista, mapa, búsquedas y ficha; producción nunca expone el seed. */
export function publicGyms(): Prisma.GymWhereInput {
  return { status: "PUBLISHED", province: { notIn: [...EXCLUDED_GYM_PROVINCES, ""] }, ...(process.env.DEMO_MODE === "si" ? {} : { isFictional: false }) };
}
