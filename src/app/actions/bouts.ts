// Combates: registrar un combate, poner el resultado de los propios, responder al rival y adjuntar evidencia.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { slugName, slugify } from "../../lib/common/labels";
import { audit } from "../../lib/common/audit";
import { safeHttpUrl } from "../../lib/common/url";
import { internalPath } from "../../lib/common/paths";
import { dayKey, eventDayReached, parseDay, todayMadrid } from "../../lib/common/dates";
import { isDiscipline } from "../../lib/common/disciplines";
import { findNameCandidates } from "../../lib/fighters/fighters";
import { boutVersion, pairKey, validateOutcome } from "../../lib/bouts/rules";
import { boutQuery } from "../../lib/bouts/form";
import { notifyAuthorOfAnswer, notifyRivalOfBout } from "../../lib/community/notify";
import { LIMITS } from "../../lib/common/text";
import { checkLengths, coherenceFlagsFor, ensureDiscipline, go, guard, intOrNull, listFighters, readProvince, Rechazo, str, uniqueSlug } from "./shared";

const MAX_BOUTS_PER_DAY = 10;

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
  // Toda comprobación que no depende del rival va ANTES del paso de «¿quién es tu rival?»: un error posterior perdería lo escrito.
  const evidenceUrl = safeHttpUrl(str(f, "evidenceUrl"));
  if (str(f, "evidenceUrl") && !evidenceUrl) go(back, { problema: "url_invalida" });

  // Resultado: solo si el día del combate ya ha llegado; se valida contra la disciplina. Nada se descarta en silencio.
  const past = eventDayReached(date);
  let result: Extract<ReturnType<typeof validateOutcome>, { ok: true }> | null = null;
  // El día del combate todavía puede no haberse celebrado (esta noche): hoy se admite sin resultado y se añade después; los días anteriores lo exigen.
  if (past && !(dayKey(date) === todayMadrid() && !str(f, "outcome"))) {
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
    // Como en la pantalla de elección: la propia ficha del peleador no cuenta como candidata (si fuera la única, se perdería el combate en una redirección muda).
    if ((await findNameCandidates(oppFirst, oppLast)).some((c) => c.id !== me.id)) {
      go(`/mi-ficha/rival?${boutQuery((k) => str(f, k))}`);
    }
  }
  if (rivalExisting && rivalExisting.id === me.id) go(back, { problema: "combate_mismo" });

  const slugBase = slugName(eventName, dayKey(date));

  // Si la persona venía de elegir entre homónimos, un error posterior la devuelve a esa pantalla con sus datos (no a un formulario vacío).
  const retry = rivalId ? `/mi-ficha/rival?${boutQuery((k) => str(f, k))}` : back;
  const created = await guard(retry, () =>
    db.$transaction(async (tx) => {
      // El tope diario se vuelve a comprobar dentro de la transacción y con un bloqueo: peticiones simultáneas no pueden saltárselo.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`combate:${user.id}`}))`;
      if ((await tx.auditLog.count({ where: { userId: user.id, entity: "BOUT", action: "CREATED", createdAt: { gte: new Date(Date.now() - 864e5) } } })) >= MAX_BOUTS_PER_DAY) throw new Rechazo("combate_limite_dia");
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
          data: { slug: await uniqueSlug(slugify(`${oppFirst} ${oppLast.charAt(0)}`), async (s) => !!(await tx.fighter.findUnique({ where: { slug: s } })), "peleador"), firstName: oppFirst, lastName: oppLast, level: "AMATEUR", listed: false },
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
  after(() => notifyRivalOfBout(created.id)); // el rival, si tiene cuenta, se entera de que debe responder
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
  // El autor puede poner el resultado mientras esté pendiente de confirmar, o si el rival solo confirmó el combate cuando aún no tenía resultado.
  const soloEmparejamientoConfirmado = bout.verification === "CONFIRMED" && !bout.result;
  if (bout.createdById !== user.id || (bout.verification !== "SELF_REPORTED" && !soloEmparejamientoConfirmado)) go(back, { problema: "sin_permiso" });
  if (!eventDayReached(bout.event.date)) go(back, { problema: "resultado_futuro" });
  const v = validateOutcome({ discipline: bout.event.discipline, outcome: str(f, "outcome"), method: str(f, "method"), endRound: intOrNull(f, "endRound"), rounds: bout.rounds });
  if (!v.ok) go(back, { problema: v.problema });
  await guard(back, () => db.$transaction(async (tx) => {
    // Solo se escribe si el combate sigue como lo leímos (nadie lo confirmó ni lo rechazó mientras tanto).
    const r = await tx.bout.updateMany({
      where: { id: bout.id, verification: bout.verification, result: bout.result },
      // El rival solo había confirmado el combate, no este resultado: vuelve a «pendiente de confirmar» para que lo confirme.
      data: { result: v.result, method: v.method, endRound: v.endRound, ...(soloEmparejamientoConfirmado ? { verification: "SELF_REPORTED" as const } : {}) },
    });
    if (r.count === 0) throw new Rechazo("combate_cambiado");
    await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "RESULT_SET_BY_AUTHOR", before: { result: bout.result, method: bout.method, verification: bout.verification }, after: { result: v.result, method: v.method, endRound: v.endRound, verification: soloEmparejamientoConfirmado ? "SELF_REPORTED" : bout.verification } }, tx);
  }));
  revalidatePath("/", "layout");
  go(back, { aviso: soloEmparejamientoConfirmado ? "resultado_guardado_confirmar" : "resultado_guardado" });
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
  const motivo = str(f, "motivo").slice(0, LIMITS.note);
  // Quien dice «no es correcto» explica por qué: lo necesitan el autor (para corregirlo) y moderación (para decidir).
  if (next === "DISPUTED" && !motivo) go(back, { problema: "rival_motivo_falta" });
  // La confirmación solo vale para el resultado que el rival tenía delante: si el autor lo corrigió entretanto, debe revisarlo de nuevo.
  if (next === "CONFIRMED" && str(f, "version") !== boutVersion(bout)) go(back, { problema: "combate_cambiado" });
  await guard(back, () => db.$transaction(async (tx) => {
    const r = await tx.bout.updateMany({ where: { id: bout.id, verification: "SELF_REPORTED", result: bout.result, method: bout.method, endRound: bout.endRound }, data: { verification: next } });
    if (r.count === 0) throw new Rechazo("combate_cambiado");
    if (next === "CONFIRMED") await listFighters(tx, [bout.fighterAId, bout.fighterBId]);
    await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: `RIVAL_${next}`, before: { verification: bout.verification }, after: { verification: next, ...(next === "DISPUTED" ? { motivo } : {}) } }, tx);
  }));
  revalidatePath("/", "layout");
  after(() => notifyAuthorOfAnswer(bout.id, next === "CONFIRMED", motivo));
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

/**
 * El autor retira un combate que registró por error. Solo mientras está pendiente de confirmar (si el rival ya respondió o moderación ya lo tocó,
 * se avisa de un error desde la ficha pública) y sin aura. Si la velada o la ficha provisional del rival solo existían por este combate, también se retiran.
 */
export async function removeMyBout(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/mi-ficha";
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  if (!bout) go(back, { problema: "no_existe" });
  if (bout.createdById !== user.id) go(back, { problema: "sin_permiso" });
  if (bout.verification !== "SELF_REPORTED") go(back, { problema: "combate_no_quitable" });
  await guard(back, () => db.$transaction(async (tx) => {
    if ((await tx.aura.count({ where: { boutId: bout.id } })) > 0) throw new Rechazo("combate_no_quitable");
    if ((await tx.bout.deleteMany({ where: { id: bout.id, verification: "SELF_REPORTED" } })).count === 0) throw new Rechazo("combate_no_quitable");
    await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "REMOVED_BY_AUTHOR", before: { eventId: bout.eventId, fighterAId: bout.fighterAId, fighterBId: bout.fighterBId, result: bout.result } }, tx);
    // Lo que solo existía por este combate se retira con él: la velada que creó esta persona y la ficha provisional de su rival (sin titular, sin más combates ni solicitudes ni seguidores).
    await tx.event.deleteMany({ where: { id: bout.eventId, createdById: user.id, organizerId: null, bouts: { none: {} } } });
    await tx.fighter.deleteMany({ where: { id: { in: [bout.fighterAId, bout.fighterBId] }, listed: false, userId: null, boutsAsA: { none: {} }, boutsAsB: { none: {} }, claimRequests: { none: {} }, followers: { none: {} } } });
  }));
  revalidatePath("/", "layout");
  go(back, { aviso: "combate_quitado" });
}
