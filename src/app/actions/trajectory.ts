// Trayectoria declarada y respaldo opcional. Cada punto de entrada comprueba sus permisos.
"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { SupportKind, Discipline, Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { requireAdmin } from "../../lib/accounts/permissions";
import { canEndorse, requireSupportActor } from "../../lib/accounts/backing";
import { audit } from "../../lib/common/audit";
import { safeHttpUrl } from "../../lib/common/url";
import { dayKey, parseBirthDate, todayMadrid } from "../../lib/common/dates";
import { divisionEligible } from "../../lib/common/competition";
import {
  isDiscipline,
  parseCompetitionChoice,
} from "../../lib/common/disciplines";
import {
  AURA_POLICY,
  SUPPORT_OPTIONS,
  effectiveSupport,
  supportRank,
} from "../../lib/aura/trajectory";
import { Rechazo, checkLengths, go, guard, returnTo, str } from "./shared";

const ownBack = "/mi-ficha/trayectoria";
const reviewBack = "/respaldar";
function source(f: FormData, back: string) {
  checkLengths(f, back, { evidenceUrl: 1000, authority: 160, note: 500 });
  const evidenceUrl = safeHttpUrl(str(f, "evidenceUrl"));
  const note = str(f, "note");
  if (!evidenceUrl || !note) go(back, { problema: "respaldo_fuente_falta" });
  return { evidenceUrl, note };
}
function version(f: FormData, stored: Date, back: string) {
  if (str(f, "version") !== stored.toISOString())
    go(back, { problema: "respaldo_cambiado" });
}

// Bloquea también la acreditación: una retirada concurrente no puede conceder un respaldo nuevo.
async function checkCurrentAccreditation(
  tx: Prisma.TransactionClient,
  actor: Awaited<ReturnType<typeof requireSupportActor>>,
) {
  if (actor.user.role === "ADMIN") return;
  const original = actor.accreditation!;
  await tx.$queryRaw`SELECT id FROM "SupportAccreditation" WHERE id=${original.id} FOR UPDATE`;
  const current = await tx.supportAccreditation.findUnique({
    where: { id: original.id },
  });
  if (
    !current?.active ||
    current.userId !== actor.user.id ||
    current.updatedAt.getTime() !== original.updatedAt.getTime()
  )
    throw new Rechazo("respaldo_sin_permiso");
}

export async function saveAchievement(f: FormData) {
  const user = await requireVerifiedUser();
  const me = user.fighter;
  if (!me) go("/mi-ficha", { problema: "sin_permiso" });
  checkLengths(f, ownBack, {
    championship: 160,
    organization: 160,
    evidenceUrl: 1000,
  });
  const championship = str(f, "championship"),
    organization = str(f, "organization");
  const scope = str(f, "scope");
  if (
    !championship ||
    !organization ||
    !["REGIONAL", "NATIONAL", "INTERNATIONAL"].includes(scope)
  )
    go(ownBack, { problema: "logro_datos" });
  const awardedOn = parseBirthDate(str(f, "awardedOn"));
  if (!awardedOn || dayKey(awardedOn) > todayMadrid() || (me.birthDate && dayKey(awardedOn) < dayKey(me.birthDate)))
    go(ownBack, { problema: "logro_fecha" });
  const choice = parseCompetitionChoice(
    str(f, "discipline"),
    str(f, "level"),
    str(f, "weightClass"),
    str(f, "divisionId"),
  );
  if (
    !choice ||
    !me.disciplines.some((d) => d.discipline === choice.discipline)
  )
    go(ownBack, { problema: "disciplina_no_valida" });
  if (
    choice.divisionId &&
    !divisionEligible(choice.divisionId, me.birthDate, awardedOn)
  )
    go(ownBack, { problema: "categoria_edad_combate" });
  const rawUrl = str(f, "evidenceUrl"),
    evidenceUrl = rawUrl ? safeHttpUrl(rawUrl) : null;
  if (rawUrl && !evidenceUrl) go(ownBack, { problema: "url_invalida" });
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  // El mismo campeonato/año/categoría no puede duplicarse cambiando la puntuación o el ámbito.
  const declarationKey = createHash("sha256")
    .update(
      JSON.stringify([
        normalize(championship),
        normalize(organization),
        awardedOn.getUTCFullYear(),
        choice.discipline,
        choice.level,
        choice.divisionId,
        choice.weightClass,
      ]),
    )
    .digest("hex");
  const id = str(f, "achievementId");
  const previous = id
    ? await db.fighterAchievement.findUnique({ where: { id } })
    : null;
  if (
    id &&
    (!previous ||
      previous.fighterId !== me.id ||
      previous.rejectedAt ||
      previous.withdrawnAt)
  )
    go(ownBack, { problema: "sin_permiso" });
  if (previous) version(f, previous.updatedAt, ownBack);
  const patch = {
    championship,
    organization,
    awardedOn,
    scope: scope as "REGIONAL" | "NATIONAL" | "INTERNATIONAL",
    ...choice,
    declarationKey,
    evidenceUrl,
    supportKind: "DECLARED" as const,
    supportAuthority: null,
    supportNote: null,
    supportReviewedAt: null,
    supportReviewedById: null,
    supportAccreditationId: null,
    reviewRequestedAt: evidenceUrl ? new Date() : null,
  };
  await guard(ownBack, () =>
    db.$transaction(async (tx) => {
      // Serializa altas/correcciones para que el límite tampoco se salte con peticiones simultáneas.
      await tx.$queryRaw`SELECT id FROM "Fighter" WHERE id=${me.id} FOR UPDATE`;
      if (
        await tx.fighterAchievement.findFirst({
          where: {
            fighterId: me.id,
            declarationKey,
            ...(id && { id: { not: id } }),
          },
        })
      )
        throw new Rechazo("logro_duplicado");
      if (
        !id &&
        (await tx.fighterAchievement.count({ where: { fighterId: me.id } })) >=
          AURA_POLICY.maxAchievements
      )
        throw new Rechazo("logro_limite");
      let savedId = id;
      if (previous) {
        if (
          !(
            await tx.fighterAchievement.updateMany({
              where: {
                id,
                fighterId: me.id,
                updatedAt: previous.updatedAt,
                rejectedAt: null,
                withdrawnAt: null,
              },
              data: patch,
            })
          ).count
        )
          throw new Rechazo("respaldo_cambiado");
      } else
        savedId = (
          await tx.fighterAchievement.create({
            data: { fighterId: me.id, ...patch },
          })
        ).id;
      await audit(
        {
          userId: user.id,
          entity: "ACHIEVEMENT",
          entityId: savedId,
          action: previous ? "UPDATED" : "CREATED",
          before: previous
            ? {
                supportKind: previous.supportKind,
                championship: previous.championship,
              }
            : undefined,
          after: patch,
        },
        tx,
      );
    }),
  );
  revalidatePath("/", "layout");
  go(ownBack, { aviso: "logro_guardado" });
}

export async function withdrawAchievement(f: FormData) {
  const user = await requireVerifiedUser();
  const a = await db.fighterAchievement.findUnique({
    where: { id: str(f, "achievementId") },
  });
  if (!a || a.fighterId !== user.fighter?.id)
    go(ownBack, { problema: "sin_permiso" });
  version(f, a.updatedAt, ownBack);
  await guard(ownBack, () =>
    db.$transaction(async (tx) => {
      if (
        !(
          await tx.fighterAchievement.updateMany({
            where: { id: a.id, updatedAt: a.updatedAt },
            data: { withdrawnAt: new Date(), reviewRequestedAt: null },
          })
        ).count
      )
        throw new Rechazo("respaldo_cambiado");
      await audit(
        {
          userId: user.id,
          entity: "ACHIEVEMENT",
          entityId: a.id,
          action: "WITHDRAWN",
        },
        tx,
      );
    }),
  );
  revalidatePath("/", "layout");
  go(ownBack, { aviso: "logro_retirado" });
}

export async function restoreOwnAchievement(f: FormData) {
  const user = await requireVerifiedUser();
  const a = await db.fighterAchievement.findUnique({
    where: { id: str(f, "achievementId") },
  });
  if (!a || a.fighterId !== user.fighter?.id || !a.withdrawnAt)
    go(ownBack, { problema: "sin_permiso" });
  version(f, a.updatedAt, ownBack);
  await guard(ownBack, () =>
    db.$transaction(async (tx) => {
      if (
        !(
          await tx.fighterAchievement.updateMany({
            where: {
              id: a.id,
              updatedAt: a.updatedAt,
              withdrawnAt: { not: null },
            },
            data: { withdrawnAt: null },
          })
        ).count
      )
        throw new Rechazo("respaldo_cambiado");
      await audit(
        {
          userId: user.id,
          entity: "ACHIEVEMENT",
          entityId: a.id,
          action: "WITHDRAWAL_UNDONE",
        },
        tx,
      );
    }),
  );
  revalidatePath("/", "layout");
  go(ownBack, { aviso: "logro_restaurado" });
}

export async function requestAchievementReview(f: FormData) {
  const user = await requireVerifiedUser();
  const a = await db.fighterAchievement.findUnique({
    where: { id: str(f, "achievementId") },
  });
  if (!a || a.fighterId !== user.fighter?.id || a.withdrawnAt)
    go(ownBack, { problema: "sin_permiso" });
  version(f, a.updatedAt, ownBack);
  const { evidenceUrl, note } = source(f, ownBack);
  await guard(ownBack, () =>
    db.$transaction(async (tx) => {
      // Una fuente nueva se revisa; no sustituye la prueba de un respaldo ya concedido ni vuelve a conceder puntos.
      if (
        !(
          await tx.fighterAchievement.updateMany({
            where: { id: a.id, updatedAt: a.updatedAt },
            data: { reviewRequestedAt: new Date() },
          })
        ).count
      )
        throw new Rechazo("respaldo_cambiado");
      await audit(
        {
          userId: user.id,
          entity: "ACHIEVEMENT",
          entityId: a.id,
          action: "REVIEW_REQUESTED",
          after: { evidenceUrl, note },
        },
        tx,
      );
    }),
  );
  revalidatePath(reviewBack);
  go(ownBack, { aviso: "respaldo_solicitado" });
}

export async function reviewAchievement(f: FormData) {
  const reviewBack = returnTo(f, "/respaldar");
  const actor = await requireSupportActor();
  const a = await db.fighterAchievement.findUnique({
    where: { id: str(f, "achievementId") },
    include: { fighter: true, supportAccreditation: true },
  });
  if (!a || a.withdrawnAt) go(reviewBack, { problema: "no_existe" });
  version(f, a.updatedAt, reviewBack);
  const decision = str(f, "decision");
  if (!["endorse", "reject", "restore"].includes(decision))
    go(reviewBack, { problema: "logro_datos" });
  checkLengths(f, reviewBack, { evidenceUrl: 1000, authority: 160, note: 500 });
  const note = str(f, "note");
  if (!note) go(reviewBack, { problema: "motivo_falta" });
  const evidenceUrl =
    decision === "endorse" ? source(f, reviewBack).evidenceUrl : a.evidenceUrl;
  const kind = (
    actor.user.role === "ADMIN"
      ? str(f, "supportKind")
      : actor.accreditation!.kind
  ) as SupportKind;
  const authority =
    actor.user.role === "ADMIN"
      ? str(f, "authority")
      : actor.accreditation!.name;
  if (decision === "endorse") {
    if (
      !SUPPORT_OPTIONS.includes(kind) ||
      !authority ||
      !canEndorse(actor, a.discipline, a.fighter.userId, kind)
    )
      go(reviewBack, { problema: "respaldo_sin_permiso" });
    if (
      actor.user.role !== "ADMIN" &&
      (a.rejectedAt || supportRank(kind) < supportRank(effectiveSupport(a)))
    )
      go(reviewBack, { problema: "respaldo_sin_permiso" });
  } else if (actor.user.role !== "ADMIN")
    go(reviewBack, { problema: "solo_moderadores" });
  if (decision === "restore" && !a.rejectedAt)
    go(reviewBack, { problema: "logro_no_excluido" });
  const data =
    decision === "endorse"
      ? {
          supportKind: kind,
          supportAuthority: authority,
          supportNote: note,
          evidenceUrl,
          supportReviewedAt: new Date(),
          supportReviewedById: actor.user.id,
          supportAccreditationId:
            actor.user.role === "ADMIN" ? null : actor.accreditation!.id,
          rejectedAt: null,
          rejectionReason: null,
          reviewRequestedAt: null,
        }
      : decision === "reject"
        ? {
            rejectedAt: new Date(),
            rejectionReason: note,
            reviewRequestedAt: null,
          }
        : {
            supportKind: "DECLARED" as const,
            supportAuthority: null,
            supportNote: null,
            supportReviewedAt: null,
            supportReviewedById: null,
            supportAccreditationId: null,
            rejectedAt: null,
            rejectionReason: null,
            reviewRequestedAt: null,
          };
  await guard(reviewBack, () =>
    db.$transaction(async (tx) => {
      await checkCurrentAccreditation(tx, actor);
      if (
        !(
          await tx.fighterAchievement.updateMany({
            where: { id: a.id, updatedAt: a.updatedAt, withdrawnAt: null },
            data,
          })
        ).count
      )
        throw new Rechazo("respaldo_cambiado");
      await audit(
        {
          userId: actor.user.id,
          entity: "ACHIEVEMENT",
          entityId: a.id,
          action: decision.toUpperCase(),
          before: { supportKind: a.supportKind, rejectedAt: a.rejectedAt },
          after: data,
        },
        tx,
      );
    }),
  );
  revalidatePath("/", "layout");
  go(reviewBack, { aviso: "respaldo_guardado" });
}

export async function endorseBout(f: FormData) {
  const reviewBack = returnTo(f, "/respaldar");
  const actor = await requireSupportActor();
  const b = await db.bout.findUnique({
    where: { id: str(f, "boutId") },
    include: {
      event: true,
      fighterA: true,
      fighterB: true,
      supportAccreditation: true,
    },
  });
  if (
    !b ||
    !b.result ||
    b.verification === "DISPUTED" ||
    b.event.status === "CANCELLED" ||
    dayKey(b.event.date) > todayMadrid()
  )
    go(reviewBack, { problema: "respaldo_combate" });
  const kind = (
    actor.user.role === "ADMIN"
      ? str(f, "supportKind")
      : actor.accreditation!.kind
  ) as SupportKind;
  if (
    !SUPPORT_OPTIONS.includes(kind) ||
    !canEndorse(actor, b.event.discipline, b.fighterA.userId, kind) ||
    !canEndorse(actor, b.event.discipline, b.fighterB.userId, kind)
  )
    go(reviewBack, { problema: "respaldo_sin_permiso" });
  if (
    actor.user.role !== "ADMIN" &&
    supportRank(kind) < supportRank(effectiveSupport(b))
  )
    go(reviewBack, { problema: "respaldo_sin_permiso" });
  const { evidenceUrl, note } = source(f, reviewBack);
  const authority =
    actor.user.role === "ADMIN"
      ? str(f, "authority")
      : actor.accreditation!.name;
  if (!authority) go(reviewBack, { problema: "respaldo_fuente_falta" });
  if (
    str(f, "version") !==
    JSON.stringify([
      b.result,
      b.method,
      b.endRound,
      b.verification,
      b.supportReviewedAt?.toISOString() ?? null,
    ])
  )
    go(reviewBack, { problema: "respaldo_cambiado" });
  await guard(reviewBack, () =>
    db.$transaction(async (tx) => {
      await checkCurrentAccreditation(tx, actor);
      await tx.$queryRaw`SELECT id FROM "Event" WHERE id=${b.eventId} FOR UPDATE`;
      const event = await tx.event.findUnique({ where: { id: b.eventId } });
      if (
        !event ||
        event.date.getTime() !== b.event.date.getTime() ||
        event.status === "CANCELLED"
      )
        throw new Rechazo("respaldo_cambiado");
      if (
        !(
          await tx.bout.updateMany({
            where: {
              id: b.id,
              result: b.result,
              method: b.method,
              endRound: b.endRound,
              verification: b.verification,
              supportReviewedAt: b.supportReviewedAt,
            },
            data: {
              verification: "VERIFIED",
              evidenceUrl,
              supportKind: kind,
              supportAuthority: authority,
              supportNote: note,
              supportReviewedById: actor.user.id,
              supportReviewedAt: new Date(),
              supportAccreditationId:
                actor.user.role === "ADMIN" ? null : actor.accreditation!.id,
            },
          })
        ).count
      )
        throw new Rechazo("respaldo_cambiado");
      await audit(
        {
          userId: actor.user.id,
          entity: "BOUT",
          entityId: b.id,
          action: "ENDORSED",
          after: { supportKind: kind, authority, evidenceUrl, note },
        },
        tx,
      );
    }),
  );
  revalidatePath("/", "layout");
  go(reviewBack, { aviso: "respaldo_guardado" });
}

export async function setSupportAccreditation(f: FormData) {
  const admin = await requireAdmin();
  const back = returnTo(f, "/moderacion/acreditaciones");
  checkLengths(f, back, { email: 254, authority: 160 });
  const target = await db.user.findUnique({
    where: { email: str(f, "email").toLowerCase() },
  });
  if (!target?.emailVerifiedAt || target.id === admin.id)
    go(back, { problema: "acreditacion_persona" });
  const previous = await db.supportAccreditation.findUnique({
    where: { userId: target.id },
  });
  if (previous) version(f, previous.updatedAt, back);
  if (str(f, "decision") === "revoke") {
    if (!previous) go(back, { problema: "no_existe" });
    await guard(back, () =>
      db.$transaction(async (tx) => {
        if (
          !(
            await tx.supportAccreditation.updateMany({
              where: { id: previous.id, updatedAt: previous.updatedAt },
              data: { active: false },
            })
          ).count
        )
          throw new Rechazo("respaldo_cambiado");
        await audit(
          {
            userId: admin.id,
            entity: "ACCREDITATION",
            entityId: previous.id,
            action: "REVOKED",
          },
          tx,
        );
      }),
    );
  } else {
    const kind = str(f, "supportKind") as SupportKind,
      name = str(f, "authority");
    const disciplines = [
      ...new Set(
        f
          .getAll("disciplines")
          .filter(
            (d): d is Discipline => typeof d === "string" && isDiscipline(d),
          ),
      ),
    ];
    const { evidenceUrl, note } = source(f, back);
    if (
      !["TRAINER", "ORGANIZER", "FEDERATION"].includes(kind) ||
      !name ||
      !disciplines.length
    )
      go(back, { problema: "acreditacion_datos" });
    await guard(back, () =>
      db.$transaction(async (tx) => {
        if (
          previous &&
          (previous.kind !== kind ||
            previous.name !== name ||
            previous.disciplines.some((d) => !disciplines.includes(d)))
        )
          throw new Rechazo("acreditacion_cambiar");
        const a = previous
          ? (
              await tx.supportAccreditation.updateMany({
                where: { id: previous.id, updatedAt: previous.updatedAt },
                data: { active: true, disciplines, evidenceUrl, note },
              })
            ).count && previous
          : await tx.supportAccreditation.create({
              data: {
                userId: target.id,
                kind,
                name,
                disciplines,
                evidenceUrl,
                note,
                grantedById: admin.id,
              },
            });
        if (!a) throw new Rechazo("respaldo_cambiado");
        await audit(
          {
            userId: admin.id,
            entity: "ACCREDITATION",
            entityId: a.id,
            action: "GRANTED",
            after: { kind, name, disciplines, evidenceUrl, note },
          },
          tx,
        );
      }),
    );
  }
  revalidatePath("/", "layout");
  go(back, { aviso: "acreditacion_guardada" });
}
