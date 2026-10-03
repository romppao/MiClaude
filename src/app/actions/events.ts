// Veladas y organizadores: pedir ser organizador, crear veladas, montar el cartel y poner resultados.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import type { Discipline } from "@prisma/client";
import { db } from "../../lib/common/db";
import { requireOrganizer } from "../../lib/accounts/permissions";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { slugify } from "../../lib/common/labels";
import { audit } from "../../lib/common/audit";
import { safeHttpUrl } from "../../lib/common/url";
import { dayKey, eventDayReached, parseDay } from "../../lib/common/dates";
import { divisionById, divisionEligible, knownBoxingAgeEligible } from "../../lib/common/competition";
import { isDiscipline, parseCompetitionChoice } from "../../lib/common/disciplines";
import { notifyFollowersOfBout } from "../../lib/community/notify";
import { pairKey, validateOutcome } from "../../lib/bouts/rules";
import { LIMITS } from "../../lib/common/text";
import { Rechazo, checkLengths, coherenceFlagsFor, ensureDiscipline, go, guard, intOrNull, listFighters, ownEvent, readProvince, str, uniqueSlug } from "./shared";

export async function requestOrganizer(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/organizador";
  checkLengths(f, back, { orgName: LIMITS.orgName, message: LIMITS.message });
  const orgName = str(f, "orgName");
  if (!orgName) go(back, { problema: "nombre_organizacion" });
  const message = str(f, "message") || null;
  if (!message) go(back, { problema: "organizador_sin_datos" });
  await db.organizerRequest.upsert({
    where: { userId: user.id },
    create: { userId: user.id, orgName, message },
    update: { orgName, message, status: "PENDING" },
  });
  go(back, { aviso: "solicitud_enviada" });
}

export async function createEvent(f: FormData) {
  const user = await requireOrganizer();
  const back = "/organizador";
  checkLengths(f, back, { name: LIMITS.eventName, venue: LIMITS.venue, city: LIMITS.city, promoter: LIMITS.promoter, ticketUrl: LIMITS.url });
  const name = str(f, "name");
  if (!name) go(back, { problema: "velada_datos" });
  const date = parseDay(str(f, "date"));
  if (!date) go(back, { problema: "fecha_invalida" });
  const level = str(f, "level") === "PRO" ? "PRO" : "AMATEUR";
  const disciplineRaw = str(f, "discipline");
  const discipline: Discipline = isDiscipline(disciplineRaw) ? disciplineRaw : "BOXEO";
  const province = readProvince(f, "province", back, "Madrid");
  const ticketRaw = str(f, "ticketUrl");
  const ticketUrl = ticketRaw ? safeHttpUrl(ticketRaw) : null;
  if (ticketRaw && !ticketUrl) go(back, { problema: "url_invalida" });
  const base = slugify(`${name} ${dayKey(date)}`) || `velada-${dayKey(date)}`;
  if (await db.event.findFirst({ where: { organizerId: user.id, slug: { startsWith: base }, name, date } })) go(back, { problema: "velada_duplicada" });
  const created = await guard(back, async () => {
    const slug = await uniqueSlug(base, async (s) => !!(await db.event.findUnique({ where: { slug: s } })));
    return db.event.create({
      data: {
        slug, name, date, discipline, level, venue: str(f, "venue") || "Por confirmar", city: str(f, "city") || province, province,
        promoter: str(f, "promoter") || null, ticketUrl, organizerId: user.id, createdById: user.id,
      },
    });
  });
  await audit({ userId: user.id, entity: "EVENT", entityId: created.id, action: "CREATED", after: { name, date, level, discipline } });
  revalidatePath("/", "layout");
  go(`/organizador/${created.slug}`, { aviso: "velada_creada" });
}

/** Añade un combate al cartel. Lo introduce el organizador del evento, así que nace VERIFIED. */
export async function addCartelBout(f: FormData) {
  const user = await requireOrganizer();
  const event = await ownEvent(str(f, "eventId"), user);
  const back = `/organizador/${event.slug}`;
  checkLengths(f, back, { evidenceUrl: LIMITS.url });
  // Cada esquina se elige de una lista que lleva el identificador de la ficha (no un texto que haya que escribir igual).
  const [a, b] = await Promise.all([
    db.fighter.findFirst({ where: { id: str(f, "fighterA"), hiddenAt: null }, include: { disciplines: true } }),
    db.fighter.findFirst({ where: { id: str(f, "fighterB"), hiddenAt: null }, include: { disciplines: true } }),
  ]);
  if (!a || !b || a.id === b.id) go(back, { problema: "cartel_boxeadores" });
  const rounds = intOrNull(f, "rounds");
  const weightClassRaw = str(f, "weightClass");
  const category = parseCompetitionChoice(event.discipline, event.level, weightClassRaw, str(f, "divisionId"));
  if (!category) go(back, { problema: "cartel_categoria" });
  for (const fighter of [a,b]) {
    if (!knownBoxingAgeEligible(event.discipline, event.level, fighter.birthDate, event.date)) go(back, { problema: "categoria_edad_combate" });
    const current = divisionById(fighter.disciplines.find(d=>d.discipline===event.discipline)?.divisionId);
    if (current && !current.combat && (!current.year || current.year===event.date.getUTCFullYear())) go(back, { problema: "categoria_sin_combate" });
    if (category.divisionId && !divisionEligible(category.divisionId, fighter.birthDate, event.date)) go(back, { problema: "categoria_edad_combate" });
  }
  const evidenceRaw = str(f, "evidenceUrl");
  const evidenceUrl = evidenceRaw ? safeHttpUrl(evidenceRaw) : null;
  if (evidenceRaw && !evidenceUrl) go(back, { problema: "url_invalida" });

  const created = await guard(back, () =>
    db.$transaction(async (tx) => {
      // Aparecer en un cartel oficial hace pública la ficha del peleador.
      await listFighters(tx, [a.id, b.id]);
      await Promise.all([ensureDiscipline(tx, a.id, event.discipline), ensureDiscipline(tx, b.id, event.discipline)]);
      const flags = await coherenceFlagsFor(tx, event.date, event.discipline, [a.id, b.id]);
      const order = await tx.bout.count({ where: { eventId: event.id } });
      const bout = await tx.bout.create({
        data: { flags, eventId: event.id, fighterAId: a.id, fighterBId: b.id, pairKey: pairKey(a.id, b.id), order: order + 1, weightClass: category.weightClass, divisionId: category.divisionId, rounds: rounds && rounds <= 12 ? rounds : null, verification: "VERIFIED", createdById: user.id, evidenceUrl },
      });
      await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "CREATED_BY_ORGANIZER", after: { eventId: event.id, fighterA: a.slug, fighterB: b.slug, divisionId: category.divisionId, weightClass: category.weightClass, evidenceUrl } }, tx);
      return bout;
    }),
    "cartel_duplicado",
  );
  revalidatePath("/", "layout");
  // Solo combates de organizador y futuros. Se avisa después de responder: un fallo del correo no debe afectar a un combate ya guardado.
  after(async () => {
    try { await notifyFollowersOfBout(created.id); } catch (e) { console.error(`[avisos] no se pudieron enviar los avisos del combate: ${e instanceof Error ? e.message : String(e)}`); }
  });
  go(back, { aviso: "cartel_anadido" });
}

export async function setBoutResult(f: FormData) {
  const user = await requireOrganizer();
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  if (!bout) go("/organizador", { problema: "no_existe" });
  const event = await ownEvent(bout.eventId, user);
  const back = `/organizador/${event.slug}`;
  if (!eventDayReached(event.date)) go(back, { problema: "resultado_futuro" });
  if (bout.verification === "DISPUTED" && user.role !== "ADMIN") go(back, { problema: "resultado_disputado" });
  const v = validateOutcome({ discipline: event.discipline, outcome: str(f, "outcome"), method: str(f, "method"), endRound: intOrNull(f, "endRound"), rounds: bout.rounds });
  if (!v.ok) go(back, { problema: v.problema });
  // Solo se eleva a «verificado» lo que ha creado el propio organizador (o un moderador): un combate ajeno conserva su estado.
  const verification = user.role === "ADMIN" || bout.createdById === user.id ? "VERIFIED" : bout.verification;
  await db.$transaction(async (tx) => {
    await tx.bout.update({ where: { id: bout.id }, data: { result: v.result, method: v.method, endRound: v.endRound, verification } });
    await tx.event.update({ where: { id: event.id }, data: { status: "COMPLETED" } });
    if (verification === "VERIFIED") await listFighters(tx, [bout.fighterAId, bout.fighterBId]);
    await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "RESULT_SET", before: { result: bout.result, method: bout.method, endRound: bout.endRound, verification: bout.verification }, after: { result: v.result, method: v.method, endRound: v.endRound, verification } }, tx);
  });
  revalidatePath("/", "layout");
  go(back, { aviso: "resultado_guardado" });
}

/** Corrige los datos de una velada propia (nombre, fecha, lugar, promotor, entradas). La disciplina solo se cambia mientras el cartel está vacío. */
export async function updateEvent(f: FormData) {
  const user = await requireOrganizer();
  const event = await ownEvent(str(f, "eventId"), user);
  const back = `/organizador/${event.slug}`;
  checkLengths(f, back, { name: LIMITS.eventName, venue: LIMITS.venue, city: LIMITS.city, promoter: LIMITS.promoter, ticketUrl: LIMITS.url });
  const name = str(f, "name");
  if (!name) go(back, { problema: "velada_datos" });
  const date = parseDay(str(f, "date"));
  if (!date) go(back, { problema: "fecha_invalida" });
  const province = readProvince(f, "province", back, event.province);
  const ticketRaw = str(f, "ticketUrl");
  const ticketUrl = ticketRaw ? safeHttpUrl(ticketRaw) : null;
  if (ticketRaw && !ticketUrl) go(back, { problema: "url_invalida" });
  const disciplineRaw = str(f, "discipline");
  const discipline: Discipline = isDiscipline(disciplineRaw) ? disciplineRaw : event.discipline;
  const data = { name, date, discipline, venue: str(f, "venue") || "Por confirmar", city: str(f, "city") || province, province, promoter: str(f, "promoter") || null, ticketUrl };
  await guard(back, () => db.$transaction(async (tx) => {
    // Los métodos de terminar combate y las categorías dependen de la disciplina: no se cambia con combates en el cartel.
    if (discipline !== event.discipline && (await tx.bout.count({ where: { eventId: event.id } })) > 0) throw new Rechazo("velada_disciplina_con_cartel");
    const bouts = await tx.bout.findMany({ where: { eventId: event.id }, include: { fighterA: true, fighterB: true } });
    if (bouts.some(b => !knownBoxingAgeEligible(event.discipline,event.level,b.fighterA.birthDate,date) || !knownBoxingAgeEligible(event.discipline,event.level,b.fighterB.birthDate,date) || (b.divisionId !== null && (!divisionEligible(b.divisionId, b.fighterA.birthDate, date) || !divisionEligible(b.divisionId, b.fighterB.birthDate, date))))) throw new Rechazo("categoria_edad_combate");
    await tx.event.update({ where: { id: event.id }, data });
    await audit({ userId: user.id, entity: "EVENT", entityId: event.id, action: "UPDATED", before: { name: event.name, date: event.date, discipline: event.discipline, venue: event.venue, city: event.city, province: event.province }, after: { name, date, discipline, venue: data.venue, city: data.city, province } }, tx);
  }));
  revalidatePath("/", "layout");
  go(back, { aviso: "velada_actualizada" });
}

/** Cancela una velada propia (sigue visible, marcada como cancelada, y sus combates dejan de contar) o la vuelve a abrir. */
export async function setEventStatus(f: FormData) {
  const user = await requireOrganizer();
  const event = await ownEvent(str(f, "eventId"), user);
  const back = `/organizador/${event.slug}`;
  const cancelar = str(f, "decision") === "cancel";
  const status = cancelar ? "CANCELLED" : eventDayReached(event.date) ? "COMPLETED" : "SCHEDULED";
  if (status === event.status) go(back, { problema: "moderacion_estado" });
  await db.$transaction([
    db.event.update({ where: { id: event.id }, data: { status } }),
    audit({ userId: user.id, entity: "EVENT", entityId: event.id, action: cancelar ? "CANCELLED" : "REOPENED", before: { status: event.status }, after: { status } }, db),
  ]);
  revalidatePath("/", "layout");
  go(back, { aviso: cancelar ? "velada_cancelada" : "velada_reabierta" });
}

/** Quita un combate del cartel de una velada propia. Si el público ya le ha dado aura no se quita (habría que borrar su apoyo): se cancela la velada o se corrige el resultado. */
export async function removeCartelBout(f: FormData) {
  const user = await requireOrganizer();
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") } });
  if (!bout) go("/organizador", { problema: "no_existe" });
  const event = await ownEvent(bout.eventId, user);
  const back = `/organizador/${event.slug}`;
  await guard(back, () => db.$transaction(async (tx) => {
    if ((await tx.aura.count({ where: { boutId: bout.id } })) > 0) throw new Rechazo("cartel_con_aura");
    await tx.bout.delete({ where: { id: bout.id } });
    await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "REMOVED_FROM_CARTEL", before: { eventId: event.id, fighterAId: bout.fighterAId, fighterBId: bout.fighterBId, verification: bout.verification } }, tx);
  }));
  revalidatePath("/", "layout");
  go(back, { aviso: "cartel_quitado" });
}
