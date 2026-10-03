import type {
  AchievementScope,
  Discipline,
  FighterAchievement,
  Level,
  SupportKind,
} from "@prisma/client";
import { lookup } from "../common/safe";

/** Escala inicial v1, centralizada. No es una clasificación deportiva oficial. */
export const AURA_POLICY = {
  version: 1,
  titlePoints: { REGIONAL: 20, NATIONAL: 50, INTERNATIONAL: 80 },
  supportPercent: {
    DECLARED: 0,
    DOCUMENT: 25,
    TRAINER: 50,
    ORGANIZER: 50,
    FEDERATION: 100,
  },
  boutSupportPoints: {
    DECLARED: 0,
    DOCUMENT: 1,
    TRAINER: 2,
    ORGANIZER: 2,
    FEDERATION: 3,
  },
  maxBoutSupportPerCategory: 40,
  maxAchievements: 30,
} as const;
export const SCOPE_LABEL: Record<AchievementScope, string> = {
  REGIONAL: "Campeón autonómico",
  NATIONAL: "Campeón nacional",
  INTERNATIONAL: "Campeón internacional",
};
export const SUPPORT_LABEL: Record<SupportKind, string> = {
  DECLARED: "Declarado por el deportista",
  DOCUMENT: "Documentación comprobada",
  TRAINER: "Respaldado por entrenador acreditado",
  ORGANIZER: "Respaldado por organizador acreditado",
  FEDERATION: "Verificado por federación acreditada",
};
export const SUPPORT_ORDER: SupportKind[] = [
  "DECLARED",
  "DOCUMENT",
  "TRAINER",
  "ORGANIZER",
  "FEDERATION",
];
export const SUPPORT_OPTIONS: SupportKind[] = [
  "DOCUMENT",
  "TRAINER",
  "ORGANIZER",
  "FEDERATION",
];
export type SupportedAchievement = FighterAchievement & {
  supportAccreditation?: { active: boolean; userId: string | null } | null;
};
export type CategoryChoice = {
  discipline: Discipline;
  level: Level;
  divisionId?: string | null;
  weightClass: string | null;
};
export const auraCategoryKey = (g: CategoryChoice) =>
  `${g.discipline}|${g.level}|${g.divisionId ?? ""}|${g.weightClass ?? ""}`;
export function supportRank(kind: SupportKind) {
  return kind === "FEDERATION"
    ? 3
    : kind === "TRAINER" || kind === "ORGANIZER"
      ? 2
      : kind === "DOCUMENT"
        ? 1
        : 0;
}
export function effectiveSupport(value: {
  supportKind: SupportKind | null;
  supportAccreditationId?: string | null;
  supportAccreditation?: { active: boolean; userId: string | null } | null;
}): SupportKind {
  if (
    value.supportAccreditationId &&
    (!value.supportAccreditation?.active || !value.supportAccreditation.userId)
  )
    return "DECLARED";
  return value.supportKind ?? "DECLARED";
}
export function achievementPoints(value: SupportedAchievement) {
  if (value.withdrawnAt || value.rejectedAt)
    return { trajectory: 0, backing: 0, total: 0, declared: false };
  const trajectory = lookup(AURA_POLICY.titlePoints, value.scope) ?? 0;
  const kind = effectiveSupport(value);
  const backing = Math.floor(
    (trajectory * (lookup(AURA_POLICY.supportPercent, kind) ?? 0)) / 100,
  );
  return {
    trajectory,
    backing,
    total: trajectory + backing,
    declared: kind === "DECLARED",
  };
}
/** El mayor aporte de un único título por categoría; repetir títulos o subir de respaldo no acumula bonificaciones. */
export function trajectoryByCategory(values: SupportedAchievement[]) {
  const groups = new Map<
    string,
    {
      achievement: SupportedAchievement;
      trajectory: number;
      backing: number;
      total: number;
      declared: boolean;
    }
  >();
  for (const achievement of values) {
    const points = achievementPoints(achievement);
    if (!points.total) continue;
    const key = auraCategoryKey(achievement),
      previous = groups.get(key);
    if (
      !previous ||
      points.total > previous.total ||
      (points.total === previous.total && points.backing > previous.backing)
    )
      groups.set(key, { achievement, ...points });
  }
  return groups;
}
export function boutBackingPoints(
  value: Parameters<typeof effectiveSupport>[0],
) {
  return lookup(AURA_POLICY.boutSupportPoints, effectiveSupport(value)) ?? 0;
}

/** Cambiar el hecho o su fuente invalida cualquier respaldo concedido anteriormente. */
export const WITHOUT_BOUT_BACKING = {
  supportKind: null,
  supportAuthority: null,
  supportNote: null,
  supportReviewedAt: null,
  supportReviewedById: null,
  supportAccreditationId: null,
} as const;
