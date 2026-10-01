// Comunidad: avisos de error de los usuarios y seguir a peleadores.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "../../lib/common/db";
import { getUser, requireVerifiedUser } from "../../lib/accounts/auth";
import { audit } from "../../lib/common/audit";
import { internalPath, loginPath } from "../../lib/common/paths";
import { MAX_REPORTS_PER_DAY, REASONS_BY_ENTITY, REPORT_ENTITIES, REPORT_REASONS, type ReportEntity } from "../../lib/community/reports";
import { hasOwn } from "../../lib/common/safe";
import { LIMITS } from "../../lib/common/text";
import { go, str, withLock } from "./shared";

/** Cualquier usuario registrado puede avisar de un dato que cree incorrecto. Lo revisa un moderador. */
export async function createReport(f: FormData) {
  const user = await requireVerifiedUser();
  const back = internalPath(str(f, "back"));
  const entity = str(f, "entity");
  const entityId = str(f, "entityId");
  const reason = str(f, "reason");
  if (str(f, "message").length > LIMITS.message) go(back, { problema: "texto_largo" });
  if (!(REPORT_ENTITIES as readonly string[]).includes(entity) || !hasOwn(REPORT_REASONS, reason) || !REASONS_BY_ENTITY[entity as ReportEntity].includes(reason)) go(back, { problema: "reporte_datos" });
  const exists =
    entity === "BOUT" ? await db.bout.findUnique({ where: { id: entityId } })
    : entity === "FIGHTER" ? await db.fighter.findUnique({ where: { id: entityId } })
    : await db.aura.findFirst({ where: { id: entityId, hiddenAt: null } });
  if (!exists) go(back, { problema: "reporte_datos" });
  const status = await withLock(`report:${user.id}`, async (tx) => {
    if (await tx.report.findFirst({ where: { userId: user.id, entity, entityId, status: "OPEN" } })) return "repetido" as const;
    if ((await tx.report.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 864e5) } } })) >= MAX_REPORTS_PER_DAY) return "limite" as const;
    const report = await tx.report.create({ data: { userId: user.id, entity, entityId, reason, message: str(f, "message") || null } });
    await audit({ userId: user.id, entity: "REPORT", entityId: report.id, action: "CREATED", after: { entity, entityId, reason } }, tx);
    return "ok" as const;
  });
  if (status === "repetido") go(back, { problema: "reporte_repetido" });
  if (status === "limite") go(back, { problema: "reporte_limite" });
  go(back, { aviso: "reporte_enviado" });
}

export async function toggleFollow(f: FormData) {
  const back = internalPath(str(f, "back"));
  const user = await getUser();
  if (!user) redirect(loginPath(back));
  const fighter = await db.fighter.findFirst({ where: { id: str(f, "fighterId"), hiddenAt: null } });
  if (!fighter) go(back, { problema: "seguir_no_existe" });
  if (user.fighter?.id === fighter.id) go(back, { problema: "seguir_propio" });
  // Idempotente: dos pulsaciones seguidas no producen un error, y el resultado es siempre coherente.
  const removed = await db.follow.deleteMany({ where: { userId: user.id, fighterId: fighter.id } });
  if (removed.count === 0) await db.follow.createMany({ data: [{ userId: user.id, fighterId: fighter.id }], skipDuplicates: true });
  revalidatePath("/", "layout");
  go(back, { aviso: removed.count > 0 ? "siguiendo_quitado" : "siguiendo" });
}
