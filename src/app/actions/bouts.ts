// Combates: registrar un combate, poner el resultado de los propios, responder al rival y adjuntar evidencia.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { slugify } from "../../lib/common/labels";
import { audit } from "../../lib/common/audit";
import { safeHttpUrl } from "../../lib/common/url";
import { internalPath } from "../../lib/common/paths";
import { dayKey, eventDayReached, parseDay } from "../../lib/common/dates";
import { isDiscipline } from "../../lib/common/disciplines";
import { findNameCandidates } from "../../lib/fighters/fighters";
import { pairKey, validateOutcome } from "../../lib/bouts/rules";
import { LIMITS } from "../../lib/common/text";
import { checkLengths, coherenceFlagsFor, ensureDiscipline, go, guard, intOrNull, readProvince, Rechazo, str, uniqueSlug } from "./shared";

const MAX_BOUTS_PER_DAY = 10;

/** Campos del formulario «Registrar un combate» que se reenvían al elegir al rival. */
const BOUT_FIELDS = ["discipline", "eventName", "date", "venue", "city", "province", "oppFirst", "oppLast", "outcome", "method", "rounds", "endRound", "evidenceUrl"] as const;

/**
 * El peleador registra un combate propio. Queda «pendiente de confirmar» hasta que el rival lo confirme o un moderador lo verifique.
 * Todo se valida antes de guardar y se guarda en una sola transacción: no quedan velada ni rival a medias si algo falla.
 */
export async function addBout(f: FormData) {
  const user = await requireVerifiedUser();
  const me = user.fighter;
  const back = "/mi-ficha";
  if (!me) redirect(back);
  checkLengths(f, back, { eventName: LIMITS.eventName, venue: LIMITS.venue, city: LIMITS.city, oppFirst: LIMITS.firstName, oppLast: LIMITS.lastName, evidenceUrl: LIMITS.url });

  const eventName = str(f, "eventName");
  const oppFirst = str(f, "oppFirst");
  const oppLast = str(f, "oppLast");
  if (!eventName || !oppFirst || !oppLast) go(back, { problema: "combate_datos" });
  const date = parseDay(str(f, "date"));
  if (!date) go(back, { problema: "fecha_invalida" });
  const disciplineRaw = str(f, "discipline");
  const myDiscipline = isDiscipline(disciplineRaw) ? me.disciplines.find((d) => d.discipline === disciplineRaw) : undefined;
  if (!myDiscipline) go(back, { problema: "combate_sin_disciplina" });
  const discipline = myDiscipline.discipline;
  const province = readProvince(f, "province", back, me.province);
  const city = str(f, "city") || me.city || province;
  const rounds = (() => { const n = intOrNull(f, "rounds"); return n && n <= 12 ? n : null; })();

  // Resultado: solo si el día del combate ya ha llegado; se valida contra la disciplina. Nada se descarta en silencio.
  const past = eventDayReached(date);
  let result: Extract<ReturnType<typeof validateOutcome>, { ok: true }> | null = null;
  if (past) {
    const v = validateOutcome({ discipline, outcome: str(f, "outcome"), method: str(f, "method"), endRound: intOrNull(f, "endRound"), rounds });
    if (!v.ok) go(back, { problema: v.problema });
    result = v;
  } else if (str(f, "outcome")) {
    go(back, { problema: "combate_futuro_resultado" });
  }

  const doneToday = await db.auditLog.count({ where: { userId: user.id, entity: "BOUT", action: "CREATED", createdAt: { gte: new Date(Date.now() - 864e5) } } });
  if (doneToday >= MAX_BOUTS_PER_DAY) go(back, { problema: "combate_limite_dia" });

  // Rival: se elige por identificador. Si ya hay fichas con ese nombre, se le pide a la persona que elija cuál es (o que cree una nueva).
  const rivalId = str(f, "rivalId");
  let rivalExisting: { id: string } | null = null;
  if (rivalId && rivalId !== "nuevo") {
    rivalExisting = await db.fighter.findFirst({ where: { id: rivalId, hiddenAt: null }, select: { id: true } });
    if (!rivalExisting) go(back, { problema: "no_existe" });
  } else if (!rivalId) {
    if ((await findNameCandidates(oppFirst, oppLast)).length > 0) {
      const qs = new URLSearchParams();
      for (const k of BOUT_FIELDS) if (str(f, k)) qs.set(k, str(f, k));
      go(`/mi-ficha/rival?${qs.toString()}`);
    }
  }
  if (rivalExisting && rivalExisting.id === me.id) go(back, { problema: "combate_mismo" });

  const slugBase = slugify(`${eventName} ${dayKey(date)}`) || `velada-${dayKey(date)}`;
  const evidenceUrl = safeHttpUrl(str(f, "evidenceUrl"));
  if (str(f, "evidenceUrl") && !evidenceUrl) go(back, { problema: "url_invalida" });

  const created = await guard(back, () =>
    db.$transaction(async (tx) => {
      let event = await tx.event.findUnique({ where: { slug: slugBase } });
      if (event) {
        if (event.discipline !== discipline) throw new Rechazo("combate_disciplina");
        if (event.organizerId) throw new Rechazo("combate_velada_oficial"); // no se cuelgan combates propios en la velada oficial de otro
      } else {
        event = await tx.event.create({
          data: { slug: slugBase, name: eventName, date, discipline, level: "AMATEUR", venue: str(f, "venue") || "Por confirmar", city, province, status: past ? "COMPLETED" : "SCHEDULED", createdById: user.id },
        });
      }
      const rival = rivalExisting
        ?? (await tx.fighter.create({
          // Ficha creada por un tercero: sin ciudad ni provincia inventadas y sin publicar hasta que su titular la reclame o el combate se confirme.
          data: { slug: await uniqueSlug(slugify(`${oppFirst} ${oppLast}`), async (s) => !!(await tx.fighter.findUnique({ where: { slug: s } })), "peleador"), firstName: oppFirst, lastName: oppLast, level: "AMATEUR", listed: false },
        }));
      await ensureDiscipline(tx, rival.id, discipline);
      const flags = await coherenceFlagsFor(tx, event.date, discipline, [me.id, rival.id]);
      const bout = await tx.bout.create({
        data: {
          flags, eventId: event.id, fighterAId: me.id, fighterBId: rival.id, pairKey: pairKey(me.id, rival.id),
          result: result?.result ?? null, method: result?.method ?? null, endRound: result?.endRound ?? null, rounds,
          weightClass: myDiscipline.weightClass, verification: "SELF_REPORTED", createdById: user.id, evidenceUrl,
        },
      });
      await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "CREATED", after: { result: bout.result, method: bout.method, verification: "SELF_REPORTED", evidenceUrl, flags } }, tx);
      return bout;
    }),
    "combate_duplicado",
  );
  revalidatePath("/", "layout");
  go(back, { aviso: created.result ? "combate_registrado" : "combate_registrado_futuro" });
}

/**
 * El peleador que declaró un combate pendiente puede poner o corregir su resultado cuando el día ya ha llegado
 * (por ejemplo, si lo registró antes de que se celebrara). Sigue «pendiente de confirmar»: no sube de nivel de respaldo.
 */
export async function setMyBoutResult(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/mi-ficha";
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  if (!bout) go(back, { problema: "no_existe" });
  if (bout.createdById !== user.id || bout.verification !== "SELF_REPORTED") go(back, { problema: "sin_permiso" });
  if (!eventDayReached(bout.event.date)) go(back, { problema: "resultado_futuro" });
  const v = validateOutcome({ discipline: bout.event.discipline, outcome: str(f, "outcome"), method: str(f, "method"), endRound: intOrNull(f, "endRound"), rounds: bout.rounds });
  if (!v.ok) go(back, { problema: v.problema });
  await db.$transaction(async (tx) => {
    await tx.bout.update({ where: { id: bout.id }, data: { result: v.result, method: v.method, endRound: v.endRound } });
    await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "RESULT_SET_BY_AUTHOR", before: { result: bout.result, method: bout.method }, after: { result: v.result, method: v.method, endRound: v.endRound } }, tx);
  });
  revalidatePath("/", "layout");
  go(back, { aviso: "resultado_guardado" });
}

/** El rival (si tiene cuenta) confirma o rechaza un combate declarado por el otro peleador. */
export async function respondBout(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/mi-ficha";
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") } });
  const me = user.fighter;
  if (!bout || !me) go(back, { problema: "no_existe" });
  if (bout.verification !== "SELF_REPORTED") go(back, { problema: "moderacion_estado" });
  if (bout.fighterBId !== me.id) go(back, { problema: "sin_permiso" }); // solo el rival del creador
  const next = str(f, "decision") === "confirm" ? "CONFIRMED" : "DISPUTED";
  await db.$transaction(async (tx) => {
    await tx.bout.update({ where: { id: bout.id }, data: { verification: next } });
    if (next === "CONFIRMED") await tx.fighter.updateMany({ where: { id: { in: [bout.fighterAId, bout.fighterBId] } }, data: { listed: true } });
    await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: `RIVAL_${next}`, before: { verification: bout.verification }, after: { verification: next } }, tx);
  });
  revalidatePath("/", "layout");
  go(back, { aviso: next === "CONFIRMED" ? "combate_confirmado" : "combate_rechazado" });
}

/**
 * Añade o cambia el enlace de evidencia (acta, cartel, publicación, vídeo) de un combate.
 * Mientras el combate está pendiente de confirmar lo pueden cambiar quien lo creó y sus participantes;
 * una vez confirmado o verificado, solo el organizador de la velada o un moderador.
 */
export async function setBoutEvidence(f: FormData) {
  const user = await requireVerifiedUser();
  const back = internalPath(str(f, "back"), "/mi-ficha");
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  if (!bout) go(back, { problema: "no_existe" });
  const staff = user.role === "ADMIN" || bout.event.organizerId === user.id;
  const mine = user.fighter?.id;
  const party = bout.createdById === user.id || (!!mine && (mine === bout.fighterAId || mine === bout.fighterBId));
  if (!staff && !party) go(back, { problema: "sin_permiso" });
  if (!staff && bout.verification !== "SELF_REPORTED") go(back, { problema: "evidencia_bloqueada" });
  if (str(f, "evidenceUrl").length > LIMITS.url) go(back, { problema: "texto_largo" });
  const raw = str(f, "evidenceUrl");
  const url = raw ? safeHttpUrl(raw) : null;
  if (raw && !url) go(back, { problema: "url_invalida" });
  await db.$transaction([
    db.bout.update({ where: { id: bout.id }, data: { evidenceUrl: url } }),
    audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "EVIDENCE_SET", before: { evidenceUrl: bout.evidenceUrl }, after: { evidenceUrl: url } }, db),
  ]);
  revalidatePath("/", "layout");
  go(back, { aviso: url ? "evidencia_guardada" : "evidencia_quitada" });
}
