import Link from "next/link";
import { requireSupportActor } from "../../lib/accounts/backing";
import { db } from "../../lib/common/db";
import {
  SUPPORT_LABEL,
  SUPPORT_OPTIONS,
  SCOPE_LABEL,
  effectiveSupport,
} from "../../lib/aura/trajectory";
import Paginacion from "../components/Paginacion";
import VerificationTag from "../components/VerificationTag";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import { divisionLabel } from "../../lib/common/competition";
import { DISCIPLINE_LABEL, levelName, weightClassLabel } from "../../lib/common/disciplines";
import { calendarDayStart } from "../../lib/common/dates";
import { fmtDate } from "../../lib/common/labels";
import { endorseBout, reviewAchievement } from "../actions/trajectory";
import { safeHttpUrl } from "../../lib/common/url";
import { Prisma } from "@prisma/client";
import { oneParam, lookup } from "../../lib/common/safe";

export const metadata = { title: "Respaldar resultados y títulos" };
export const dynamic = "force-dynamic";
export default async function Backing({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireSupportActor("/respaldar");
  const admin = actor.user.role === "ADMIN";
  const raw = await searchParams;
  const q = oneParam(raw.q)?.trim().slice(0, 160) ?? "";
  const ds = admin
    ? {}
    : { discipline: { in: actor.accreditation!.disciplines } };
  const achievementWhere: Prisma.FighterAchievementWhereInput = {
    ...ds, withdrawnAt: null, ...(!admin && { rejectedAt: null }),
    ...(q && { championship: { contains: q, mode: "insensitive" } }),
    fighter: { listed: true, hiddenAt: null, NOT: { userId: actor.user.id } },
  };
  const boutWhere: Prisma.BoutWhereInput = {
    result: { not: null }, verification: { not: "DISPUTED" },
    event: { ...ds, date: { lt: new Date(calendarDayStart().getTime() + 864e5) }, status: { not: "CANCELLED" }, ...(q && { name: { contains: q, mode: "insensitive" } }) },
    fighterA: { hiddenAt: null, OR: [{ userId: null }, { userId: { not: actor.user.id } }] },
    fighterB: { hiddenAt: null, OR: [{ userId: null }, { userId: { not: actor.user.id } }] },
  };
  const [titleCount, boutCount] = await Promise.all([
    db.fighterAchievement.count({ where: achievementWhere }), db.bout.count({ where: boutWhere }),
  ]);
  const titlePage = pageWindow(titleCount, pageNumber(raw.titulos), 50);
  const boutPage = pageWindow(boutCount, pageNumber(raw.combates), 50);
  const params = { q: q || undefined, titulos: titlePage.current > 1 ? String(titlePage.current) : undefined, combates: boutPage.current > 1 ? String(boutPage.current) : undefined };
  const query = new URLSearchParams(Object.entries(params).filter((v): v is [string,string] => !!v[1])).toString();
  const back = `/respaldar${query ? `?${query}` : ""}`;
  const [achievements, bouts] = await Promise.all([
    db.fighterAchievement.findMany({ where: achievementWhere, include: { fighter: true, supportAccreditation: true }, take: titlePage.take, skip: titlePage.skip,
      orderBy: [{ reviewRequestedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }, { id: "asc" }] }),
    db.bout.findMany({ where: boutWhere, include: { event: true, fighterA: true, fighterB: true, supportAccreditation: true }, take: boutPage.take, skip: boutPage.skip,
      orderBy: [{ event: { date: "desc" } }, { id: "asc" }] }),
  ]);
  // Una solicitud repetida no puede desplazar la fuente más reciente de otros títulos de esta página.
  const requests = achievements.length ? await db.$queryRaw<{ entityId: string; after: Prisma.JsonValue | null }[]>(Prisma.sql`
    SELECT DISTINCT ON ("entityId") "entityId", "after" FROM "AuditLog"
    WHERE entity='ACHIEVEMENT' AND action='REVIEW_REQUESTED' AND "entityId" IN (${Prisma.join(achievements.map(a => a.id))})
    ORDER BY "entityId", "createdAt" DESC, id DESC
  `) : [];
  const latest = new Map<string, (typeof requests)[number]>();
  for (const r of requests)
    if (!latest.has(r.entityId)) latest.set(r.entityId, r);
  const request = (value: Prisma.JsonValue | null) => {
    const object =
      value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const raw = lookup(object, "evidenceUrl"),
      note = lookup(object, "note");
    const url = typeof raw === "string" ? safeHttpUrl(raw) : null;
    return (
      <>
        {url && (
          <p>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Consultar fuente solicitada
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </p>
        )}
        {typeof note === "string" && <p>{note}</p>}
      </>
    );
  };
  const fields = (url: string | null) => (
    <>
      {admin ? (
        <>
          <label className="field">
            <span>Tipo de respaldo comprobado</span>
            <select name="supportKind">
              {SUPPORT_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {SUPPORT_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Entidad o persona que respalda este hecho</span>
            <input name="authority" required maxLength={160} />
          </label>
        </>
      ) : (
        <p>
          {SUPPORT_LABEL[actor.accreditation!.kind]} ·{" "}
          {actor.accreditation!.name}
        </p>
      )}
      <label className="field">
        <span>Fuente que prueba este resultado o título</span>
        <input
          name="evidenceUrl"
          type="url"
          required
          maxLength={1000}
          defaultValue={url ?? ""}
        />
      </label>
      <label className="field">
        <span>Qué se ha comprobado</span>
        <input name="note" required maxLength={500} />
      </label>
    </>
  );
  return (
    <>
      <h1>Respaldar resultados y títulos</h1>
      <p>
        <Link href="/mi-cuenta">Volver a mi cuenta</Link>
        {admin && (
          <>
            {" "}
            ·{" "}
            <Link href="/moderacion/acreditaciones">
              Gestionar acreditaciones
            </Link>{" "}
            · <Link href="/moderacion">Moderación</Link>
          </>
        )}
      </p>
      <p>
        El respaldo es opcional. Comprueba el hecho concreto y la identidad de
        su fuente; un cartel de anuncio no demuestra el resultado. No puedes
        respaldar tus propios títulos o combates.
      </p>
      <form className="search">
        <label className="field">
          <span>Buscar campeonato o velada</span>
          <input name="q" defaultValue={q} maxLength={160} />
        </label>
        <button>Buscar hechos para respaldar</button>
      </form>
      <h2 id="titulos">Títulos declarados ({titleCount})</h2>
      <Paginacion ruta="/respaldar" params={params} parametro="titulos" ancla="titulos" etiqueta="Páginas de títulos para respaldar" actual={titlePage.current} paginas={titlePage.pages} desde={titlePage.from} hasta={titlePage.to} total={titlePage.total} unidad={["título", "títulos"]} />
      {!achievements.length && (
        <p>No hay títulos disponibles para respaldar.</p>
      )}
      {achievements.map((a) => (
        <section key={a.id} className="card">
          <h3>
            {a.championship} · {a.fighter.firstName} {a.fighter.lastName}
          </h3>
          <p>
            {SCOPE_LABEL[a.scope]} · {a.organization} ·{" "}
            {DISCIPLINE_LABEL[a.discipline]} · {fmtDate(a.awardedOn)} ·{" "}
            {a.rejectedAt
              ? "Excluido por moderación"
              : SUPPORT_LABEL[effectiveSupport(a)]}
          </p>
          <p>{levelName(a.level)} · {divisionLabel(a.divisionId)}{a.weightClass ? ` · ${weightClassLabel(a.discipline, a.level, a.weightClass, a.divisionId)}` : " · Peso sin confirmar"}</p>
          {a.reviewRequestedAt && latest.get(a.id) && (
            <details>
              <summary>Fuente aportada en la solicitud de revisión</summary>
              {request(latest.get(a.id)!.after)}
            </details>
          )}
          <form action={reviewAchievement} className="search">
            <input type="hidden" name="achievementId" value={a.id} />
            <input type="hidden" name="back" value={`${back}#titulos`} />
            <input
              type="hidden"
              name="version"
              value={a.updatedAt.toISOString()}
            />
            {fields(a.evidenceUrl)}
            <button name="decision" value="endorse">
              Respaldar este título
            </button>
          </form>
          {admin && (
            <form action={reviewAchievement} className="search">
              <input type="hidden" name="achievementId" value={a.id} />
              <input type="hidden" name="back" value={`${back}#titulos`} />
              <input
                type="hidden"
                name="version"
                value={a.updatedAt.toISOString()}
              />
              <label className="field">
                <span>Motivo de la decisión de moderación</span>
                <input name="note" required maxLength={500} />
              </label>
              {!a.rejectedAt ? <button className="secondary" name="decision" value="reject">
                Excluir título indicando el motivo
              </button> : <button className="secondary" name="decision" value="restore">
                Restaurar como declarado
              </button>}
            </form>
          )}
        </section>
      ))}
      <h2 id="combates">Resultados de combates ({boutCount})</h2>
      <Paginacion ruta="/respaldar" params={params} parametro="combates" ancla="combates" etiqueta="Páginas de resultados para respaldar" actual={boutPage.current} paginas={boutPage.pages} desde={boutPage.from} hasta={boutPage.to} total={boutPage.total} unidad={["combate", "combates"]} />
      {!bouts.length && <p>No hay resultados disponibles para respaldar.</p>}
      {bouts.map((b) => (
        <details key={b.id} className="card">
          <summary>
            {b.fighterA.firstName} {b.fighterA.lastName} contra{" "}
            {b.fighterB.firstName} {b.fighterB.lastName} · {b.event.name}
          </summary>
          <p>
            {DISCIPLINE_LABEL[b.event.discipline]} · {fmtDate(b.event.date)} ·{" "}
            {b.result === "DRAW"
              ? "Empate"
              : b.result === "NO_CONTEST"
                ? "Sin decisión"
                : `Gana ${b.result === "A_WIN" ? b.fighterA.firstName : b.fighterB.firstName}`}
          </p>
          <p>{levelName(b.event.level)} · {divisionLabel(b.divisionId)}{b.weightClass ? ` · ${weightClassLabel(b.event.discipline, b.event.level, b.weightClass, b.divisionId)}` : " · Peso sin confirmar"}</p>
          <VerificationTag verification={b.verification} backing={b} />
          <form action={endorseBout} className="search">
            <input type="hidden" name="boutId" value={b.id} />
            <input type="hidden" name="back" value={`${back}#combates`} />
            <input
              type="hidden"
              name="version"
              value={JSON.stringify([
                b.result,
                b.method,
                b.endRound,
                b.verification,
                b.supportReviewedAt?.toISOString() ?? null,
              ])}
            />
            {fields(b.evidenceUrl)}
            <button>Respaldar este resultado</button>
          </form>
        </details>
      ))}
    </>
  );
}
