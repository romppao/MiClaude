import { redirect } from "next/navigation";
import type { Discipline, SupportKind } from "@prisma/client";
import { requireVerifiedUser } from "./auth";
import { db } from "../common/db";

export async function requireSupportActor(next?: string) {
  const user = await requireVerifiedUser(next);
  const accreditation = await db.supportAccreditation.findUnique({
    where: { userId: user.id },
  });
  if (
    user.role !== "ADMIN" &&
    (!accreditation?.active ||
      !["TRAINER", "ORGANIZER", "FEDERATION"].includes(accreditation.kind))
  )
    redirect("/mi-cuenta?problema=respaldo_sin_permiso");
  return { user, accreditation };
}
/** Ningún perfil visual ni rol de organizador concede por sí solo permiso para conceder bonificaciones. */
export function canEndorse(
  actor: {
    user: { id: string; role: string };
    accreditation: {
      active: boolean;
      kind: SupportKind;
      disciplines: Discipline[];
    } | null;
  },
  discipline: Discipline,
  ownerId: string | null | undefined,
  kind: SupportKind,
) {
  if (ownerId === actor.user.id || kind === "DECLARED") return false;
  if (actor.user.role === "ADMIN")
    return ["DOCUMENT", "TRAINER", "ORGANIZER", "FEDERATION"].includes(kind);
  return (
    !!actor.accreditation?.active &&
    actor.accreditation.kind === kind &&
    actor.accreditation.disciplines.includes(discipline)
  );
}
