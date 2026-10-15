import Link from "next/link";
import { decideGymClaim } from "../actions/gyms";
import { requireAdmin } from "../../lib/accounts/permissions";
import { esCreador } from "../../lib/accounts/creador";
import { db } from "../../lib/common/db";
import { ORIGENES_FALLO } from "../../lib/common/fallos";
import { FLAG_LABEL, type Flag } from "../../lib/fighters/coherence";
import {
  adminDecide,
  decideClaim,
  decideOrganizer,
  resolveReport,
  setGymVerified,
  decidirVeladaPasada,
  actualizarFallo,
} from "../actions/moderation";
import { REPORT_REASONS } from "../../lib/community/reports";
import Paginacion from "../components/Paginacion";
import {
  TIPO_DE_ENTIDAD_ETIQUETA,
  parseTipoDeEntidad,
} from "../../lib/accounts/landing";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import { boutVersion } from "../../lib/bouts/rules";
import { lookup, flatParams } from "../../lib/common/safe";
import {
  METHOD_LABEL,
  VERIFICATION_LABEL,
  fmtDate,
} from "../../lib/common/labels";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { publicUserName } from "../../lib/common/names";
import { VERSION, commitDesplegado } from "../../lib/common/version";

export const metadata = { title: "Moderación" };
export const dynamic = "force-dynamic";

const LIMITE = 50;

type BoutRow = Awaited<ReturnType<typeof cargarCombates>>[number];

function cargarCombates(where: object, take = LIMITE, skip = 0) {
  return db.bout.findMany({
    where,
    take,
    skip,
    orderBy: [{ event: { date: "desc" } }, { id: "asc" }],
    include: {
      event: true,
      fighterA: true,
      fighterB: true,
      createdBy: { select: { name: true, email: true } },
    },
  });
}

/** Resultado tal y como lo declaró quien registró el combate, en palabras. */
function declarado(b: BoutRow) {
  if (!b.result) return "Sin resultado declarado";
  const r =
    b.result === "DRAW"
      ? "Empate"
      : b.result === "NO_CONTEST"
        ? "Sin decisión"
        : `Gana ${b.result === "A_WIN" ? "el rojo" : "el azul"}`;
  return `${r}${b.method && b.result !== "DRAW" && b.result !== "NO_CONTEST" ? ` (${METHOD_LABEL[b.method]}${b.endRound ? `, asalto ${b.endRound}` : ""})` : ""}`;
}

/** Nombre de un combate para los lectores de pantalla: cada botón repetido en una fila lleva su contexto. */
const nombreCombate = (b: {
  fighterA: { firstName: string; lastName: string };
  fighterB: { firstName: string; lastName: string };
  event: { name: string };
}) =>
  `${b.fighterA.firstName} ${b.fighterA.lastName} contra ${b.fighterB.firstName} ${b.fighterB.lastName} en ${b.event.name}`;

export default async function Moderation({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdmin("/moderacion");
  const raw = flatParams(await searchParams);
  const keys = [
    "avisos",
    "reclamaciones",
    "organizadores",
    "gimnasios",
    "senales",
    "combates",
    "revision",
    "veladas",
    "fallos",
    "reclamaciones-gimnasio",
  ] as const;
  const porVerificar = {
    verification: {
      in: ["SELF_REPORTED", "CONFIRMED"] as ("SELF_REPORTED" | "CONFIRMED")[],
    },
  };
  const flagged = { ...porVerificar, flags: { isEmpty: false } };
  const unflagged = { ...porVerificar, flags: { isEmpty: true } };
  const [
    nReports,
    nClaims,
    nOrganizers,
    nGimnasios,
    nFlags,
    nUnflagged,
    nRevision,
    nSinSello,
  ] = await Promise.all([
    db.report.count({ where: { status: "OPEN" } }),
    db.claimRequest.count({ where: { status: "PENDING" } }),
    db.organizerRequest.count({ where: { status: "PENDING" } }),
    db.gym.count(),
    db.bout.count({ where: flagged }),
    db.bout.count({ where: unflagged }),
    db.bout.count({ where: { verification: "DISPUTED" } }),
    db.gym.count({ where: { verifiedAt: null } }),
  ]);
  const [nFallos, nFuentesKo, nPasadas, nGymClaims] = await Promise.all([
    db.appError.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    db.newsSource.count({ where: { active: true, lastError: { not: null } } }),
    db.event.count({
      where: { status: "PENDING_AUTHORIZATION", organizerId: { not: null } },
    }),
    db.gymClaimRequest.count({
      where: { status: { in: ["PENDING", "CONFLICT"] } },
    }),
  ]);
  const counts = [
    nReports,
    nClaims,
    nOrganizers,
    nGimnasios,
    nFlags,
    nUnflagged,
    nRevision,
    nPasadas,
    nFallos,
    nGymClaims,
  ];
  const windows = Object.fromEntries(
    keys.map((k, i) => [k, pageWindow(counts[i], pageNumber(raw[k]), LIMITE)]),
  );
  const pageParams = {
    ...Object.fromEntries(
      keys.map((k) => [
        k,
        windows[k].current > 1 ? String(windows[k].current) : undefined,
      ]),
    ),
  };
  const query = new URLSearchParams(
    Object.entries(pageParams).filter((v): v is [string, string] => !!v[1]),
  ).toString();
  const back = (key: string) => `/moderacion${query ? `?${query}` : ""}#${key}`;
  const paging = (key: string, unidad: [string, string], etiqueta: string) => {
    const w = windows[key];
    return (
      <Paginacion
        ruta="/moderacion"
        params={pageParams}
        parametro={key}
        ancla={key}
        etiqueta={`Páginas de ${etiqueta}`}
        actual={w.current}
        paginas={w.pages}
        desde={w.from}
        hasta={w.to}
        total={w.total}
        unidad={unidad}
      />
    );
  };
  const [
    conSenales,
    sinSenales,
    enRevision,
    reports,
    gyms,
    claims,
    organizers,
  ] = await Promise.all([
    cargarCombates(flagged, windows.senales.take, windows.senales.skip),
    cargarCombates(unflagged, windows.combates.take, windows.combates.skip),
    cargarCombates(
      { verification: "DISPUTED" },
      windows.revision.take,
      windows.revision.skip,
    ),
    db.report.findMany({
      where: { status: "OPEN" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: windows.avisos.take,
      skip: windows.avisos.skip,
    }),
    db.gym.findMany({
      orderBy: [
        { verifiedAt: { sort: "asc", nulls: "first" } },
        { name: "asc" },
        { id: "asc" },
      ],
      take: windows.gimnasios.take,
      skip: windows.gimnasios.skip,
    }),
    db.claimRequest.findMany({
      where: { status: "PENDING" },
      include: { user: true, fighter: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: windows.reclamaciones.take,
      skip: windows.reclamaciones.skip,
    }),
    db.organizerRequest.findMany({
      where: { status: "PENDING" },
      include: { user: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: windows.organizadores.take,
      skip: windows.organizadores.skip,
    }),
  ]);
  const [pasadas, fallos, reclamacionesGym] = await Promise.all([
    db.event.findMany({
      where: { status: "PENDING_AUTHORIZATION", organizerId: { not: null } },
      include: { organizer: { select: { name: true } } },
      orderBy: [{ date: "asc" }, { id: "asc" }],
      take: windows.veladas.take,
      skip: windows.veladas.skip,
    }),
    db.appError.findMany({
      where: { status: { in: ["OPEN", "INVESTIGATING"] } },
      orderBy: [{ lastSeenAt: "desc" }, { id: "asc" }],
      take: windows.fallos.take,
      skip: windows.fallos.skip,
    }),
    db.gymClaimRequest.findMany({
      where: { status: { in: ["PENDING", "CONFLICT"] } },
      include: { gym: true, user: { select: { name: true } } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: windows["reclamaciones-gimnasio"].take,
      skip: windows["reclamaciones-gimnasio"].skip,
    }),
  ]);
  // Por qué el rival dijo «no es correcto» (queda en el historial de cada combate rechazado)
  const rechazos = await db.auditLog.findMany({
    where: {
      entity: "BOUT",
      action: "RIVAL_DISPUTED",
      entityId: { in: enRevision.map((b) => b.id) },
    },
    orderBy: { createdAt: "asc" },
    select: { entityId: true, after: true },
  });
  const motivoDe = new Map(
    rechazos.map((r) => [
      r.entityId,
      (r.after as { motivo?: string } | null)?.motivo ?? "",
    ]),
  );
  const ids = (e: string) =>
    reports.filter((r) => r.entity === e).map((r) => r.entityId);
  const [
    reportedBouts,
    reportedFighters,
    reportedAuras,
    reportedMedia,
    reportedGyms,
  ] = await Promise.all([
    db.bout.findMany({
      where: { id: { in: ids("BOUT") } },
      include: { event: true, fighterA: true, fighterB: true },
    }),
    db.fighter.findMany({ where: { id: { in: ids("FIGHTER") } } }),
    db.aura.findMany({
      where: { id: { in: ids("AURA") } },
      include: { fighter: true, user: { select: { name: true } } },
    }),
    db.mediaItem.findMany({
      where: { id: { in: ids("MEDIA") } },
      select: {
        id: true,
        kind: true,
        caption: true,
        hiddenAt: true,
        videoUrl: true,
        event: { select: { slug: true, name: true } },
        uploader: { select: { name: true } },
      },
    }),
    db.gym.findMany({
      where: { id: { in: ids("GYM") } },
      select: { id: true, name: true },
    }),
  ]);
  // Quien recibe un «no» tiene derecho a saber por qué: el motivo es obligatorio al rechazar y lo ve la persona (en la aplicación y por correo).
  // En los organizadores, la nota es siempre obligatoria: al aprobar recoge la evidencia comprobada, que respalda el sello.
  const aprobarRechazar = (
    action: (f: FormData) => Promise<void>,
    name: string,
    id: string,
    quien: string,
    notaSiempre = false,
  ) => (
    <form
      action={action}
      noValidate={notaSiempre}
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        alignItems: "flex-end",
      }}
    >
      <input type="hidden" name={name} value={id} />
      <input
        type="hidden"
        name="back"
        value={back(name === "claimId" ? "reclamaciones" : "organizadores")}
      />
      <label className="field">
        <span>
          {notaSiempre
            ? "Evidencia comprobada, o motivo si rechazas (obligatorio)"
            : "Motivo (obligatorio si rechazas)"}
        </span>
        <input name="note" maxLength={500} required={notaSiempre} />
      </label>
      <button
        name="decision"
        value="approve"
        aria-label={`Aprobar la solicitud de ${quien}`}
      >
        Aprobar
      </button>
      <button
        name="decision"
        value="reject"
        className="secondary"
        aria-label={`Rechazar la solicitud de ${quien}`}
      >
        Rechazar
      </button>
    </form>
  );

  const boutItem = (
    b: BoutRow,
    queue: string,
    priority: number,
    first = false,
  ) => (
    <li key={`bout-${b.id}`} data-prioridad={priority}>
      <article className="tarjeta" data-cola={queue}>
        {first && <span id={queue} style={{ scrollMarginTop: 80 }} />}
        <span className="pildora">
          {queue === "senales"
            ? "Combate con señales"
            : queue === "revision"
              ? "Combate en revisión"
              : "Combate por verificar"}
        </span>
        <h3>{b.event.name}</h3>
        <p>
          {nombreCombate(b)} · {DISCIPLINE_LABEL[b.event.discipline]} ·{" "}
          {fmtDate(b.event.date)}
        </p>
        <p>
          {declarado(b)} · {VERIFICATION_LABEL[b.verification]}
        </p>
        {b.flags.map((f) => (
          <p key={f}>{lookup(FLAG_LABEL, f as Flag) ?? f}</p>
        ))}
        {b.createdBy && (
          <p>
            {publicUserName(b.createdBy.name)} · {b.createdBy.email}
          </p>
        )}
        {b.evidenceUrl && (
          <a
            className="btn secondary"
            href={b.evidenceUrl}
            rel="noopener noreferrer nofollow ugc"
          >
            Ver evidencia
          </a>
        )}
        {motivoDe.get(b.id) && <p>Motivo del rival: {motivoDe.get(b.id)}</p>}
        <form action={adminDecide}>
          <input type="hidden" name="boutId" value={b.id} />
          <input type="hidden" name="back" value={back(queue)} />
          <input type="hidden" name="version" value={boutVersion(b)} />
          <div className="chips">
            <button
              name="decision"
              value="verify"
              aria-label={`Verificar combate: ${nombreCombate(b)}`}
            >
              Verificar
            </button>
            {queue === "revision" ? (
              <button
                name="decision"
                value="restore"
                className="secondary"
                aria-label={`Restaurar como pendiente el combate: ${nombreCombate(b)}`}
              >
                Restaurar como pendiente
              </button>
            ) : (
              <button
                name="decision"
                value="dispute"
                className="secondary"
                aria-label={`Poner en revisión el combate: ${nombreCombate(b)}`}
              >
                Poner en revisión
              </button>
            )}
          </div>
        </form>
      </article>
    </li>
  );

  return (
    <>
      {/* Panel de moderación (13 de octubre de 2026, petición del fundador: funciones bien estructuradas, con su panel de avisos y los fallos).
          Tres bloques: lo pendiente de revisar (las colas de abajo), el estado de la aplicación y las herramientas. Guía: docs/MODERACION.md. */}
      <h1>Moderación</h1>
      <p className="lead">
        Revisas lo que la comunidad avisa, compruebas los datos y vigilas que la
        aplicación funcione. Cada decisión queda en el historial de cambios.
      </p>

      <section aria-labelledby="titulo-pendiente" style={{ margin: "20px 0" }}>
        <h2 id="titulo-pendiente">Pendiente de revisar</h2>
        <div className="resumen-moderacion">
          {(
            [
              ["avisos", "Avisos de usuarios", nReports],
              ["reclamaciones", "Fichas reclamadas", nClaims],
              ["organizadores", "Organizadores", nOrganizers],
              ["gimnasios", "Gimnasios sin sello", nSinSello],
              ["senales", "Combates con señales", nFlags],
              ["combates", "Combates por verificar", nUnflagged],
              ["revision", "Combates en revisión", nRevision],
            ] as const
          ).map(([ancla, texto, n]) => (
            <a
              key={ancla}
              href={`#${ancla}`}
              className={n > 0 ? "dato con-pendientes" : "dato"}
              aria-label={`${texto}: ${n}`}
            >
              <span className="clave">{texto}</span>
              <strong>{n}</strong>
            </a>
          ))}
        </div>
      </section>

      <section aria-labelledby="titulo-estado-app" style={{ margin: "20px 0" }}>
        <h2 id="titulo-estado-app">Estado de la aplicación</h2>
        <div className="resumen-moderacion">
          <Link
            href="/moderacion/fallos"
            className={nFallos > 0 ? "dato con-pendientes" : "dato"}
            aria-label={`Fallos de la aplicación sin resolver: ${nFallos}`}
          >
            <span className="clave">Fallos sin resolver</span>
            <strong>{nFallos}</strong>
          </Link>
          <Link
            href="/moderacion/noticias"
            className={nFuentesKo > 0 ? "dato con-pendientes" : "dato"}
            aria-label={`Fuentes de noticias que fallan: ${nFuentesKo}`}
          >
            <span className="clave">Fuentes de noticias que fallan</span>
            <strong>{nFuentesKo}</strong>
          </Link>
        </div>
        <p className="mut">
          Versión de la aplicación: <strong>{VERSION}</strong>
          {commitDesplegado() ? ` (commit ${commitDesplegado()})` : ""}. Qué
          trae cada versión: <code>CHANGELOG.md</code> del repositorio.
        </p>
      </section>

      <section
        aria-labelledby="titulo-herramientas"
        style={{ margin: "20px 0" }}
      >
        <h2 id="titulo-herramientas">Herramientas</h2>
        <ul className="lista herramientas-moderacion">
          <li>
            <Link href="/respaldar">Respaldar resultados y títulos</Link>
            <span className="mut">
              Comprobar un resultado o un título con una prueba.
            </span>
          </li>
          <li>
            <Link href="/moderacion/acreditaciones">
              Gestionar acreditaciones
            </Link>
            <span className="mut">
              Quién puede respaldar resultados (entrenadores, federaciones).
            </span>
          </li>
          <li>
            <Link href="/moderacion/historial">
              Ver el historial de cambios
            </Link>
            <span className="mut">
              Todo lo que se ha cambiado, quién y cuándo.
            </span>
          </li>
          <li>
            <Link href="/moderacion/fallos">Fallos de la aplicación</Link>
            <span className="mut">
              Lo que ha fallado, cuántas veces y qué se hizo.
            </span>
          </li>
          <li>
            <Link href="/moderacion/noticias">Fuentes de noticias</Link>
            <span className="mut">
              Qué fuentes funcionan, añadir y ocultar titulares.
            </span>
          </li>
          <li>
            <Link href="/moderacion/veladas">Autorizar veladas pasadas</Link>
            <span className="mut">
              Revisar y decidir sobre eventos con fecha anterior a hoy.
            </span>
          </li>
          {esCreador(user) && (
            <li>
              <Link href="/moderacion/usuarios">
                Administración: cuentas y moderadores
              </Link>
              <span className="mut">Solo la cuenta del creador.</span>
            </li>
          )}
        </ul>
      </section>

      <h2 id="colas" className="sr-only">
        Colas de moderación
      </h2>

      {/* Una bandeja por prioridad; cada cola mantiene páginas independientes y su ancla de retorno. */}
      <h2>Bandeja de moderación</h2>
      <p>
        Primero las veladas pendientes; después señales, fallos, reclamaciones,
        organizadores, gimnasios y combates sin señales. «Poner en revisión»
        suspende el resultado y su aura; «Restaurar como pendiente» lo devuelve
        a lo declarado. Verificar no concede respaldo. Las decisiones conservan
        las páginas y vuelven a la cola.
      </p>
      <div className="lista">
        {(
          [
            ["veladas", "veladas pasadas", ["velada", "veladas"]],
            ["senales", "combates con señales", ["combate", "combates"]],
            ["fallos", "fallos", ["fallo", "fallos"]],
            ["avisos", "avisos", ["aviso", "avisos"]],
            [
              "reclamaciones",
              "reclamaciones",
              ["reclamación", "reclamaciones"],
            ],
            [
              "reclamaciones-gimnasio",
              "reclamaciones de gimnasio",
              ["reclamación", "reclamaciones"],
            ],
            [
              "organizadores",
              "solicitudes de organizador",
              ["solicitud", "solicitudes"],
            ],
            ["gimnasios", "gimnasios", ["gimnasio", "gimnasios"]],
            ["combates", "combates sin señales", ["combate", "combates"]],
            ["revision", "combates en revisión", ["combate", "combates"]],
          ] as [string, string, [string, string]][]
        ).map(([key, label, unit]) => (
          <div key={key}>{paging(key, unit, label)}</div>
        ))}
      </div>
      <Link className="btn secondary" href="/moderacion/gimnasios">
        Altas, importaciones y reclamaciones de gimnasio
      </Link>
      {keys
        .filter((k) => !windows[k].total)
        .map((k) => (
          <span id={k} key={k} />
        ))}
      <ol
        className="lista"
        aria-label="Bandeja de moderación ordenada por urgencia"
        style={{ listStyle: "none", padding: 0 }}
      >
        {pasadas.map((e, i) => (
          <li key={`event-${e.id}`} data-prioridad="1">
            <article className="tarjeta" data-cola="veladas">
              {i === 0 && <span id="veladas" style={{ scrollMarginTop: 80 }} />}
              <span className="pildora">Velada pasada pendiente</span>
              <h3>{e.name}</h3>
              <p>
                {fmtDate(e.date)} · {e.city} · {e.organizer?.name}
              </p>
              <form action={decidirVeladaPasada}>
                <input type="hidden" name="eventId" value={e.id} />
                <input type="hidden" name="back" value={back("veladas")} />
                <label className="field">
                  <span>Nota de autorización</span>
                  <textarea name="note" required maxLength={500} />
                </label>
                <div className="chips">
                  <button name="decision" value="approve">
                    Autorizar velada
                  </button>
                  <button className="secondary" name="decision" value="reject">
                    Rechazar velada
                  </button>
                </div>
              </form>
            </article>
          </li>
        ))}
        {conSenales.map((b, i) => boutItem(b, "senales", 2, i === 0))}
        {enRevision
          .filter((b) => b.flags.length > 0)
          .map((b, i) => boutItem(b, "revision", 2, i === 0))}
        {fallos.map((f, i) => (
          <li key={`error-${f.id}`} data-prioridad="3">
            <article className="tarjeta" data-cola="fallos">
              {i === 0 && <span id="fallos" style={{ scrollMarginTop: 80 }} />}
              <span className="pildora">Fallo de la aplicación</span>
              <h3>{f.message}</h3>
              <p>
                {lookup(ORIGENES_FALLO, f.origin) ?? "En la aplicación"} ·{" "}
                {f.count} veces · {fmtDate(f.lastSeenAt)}
              </p>
              <Link
                className="btn secondary"
                href={`/moderacion/fallos/${f.id}`}
              >
                Ver diagnóstico
              </Link>
              <form action={actualizarFallo}>
                <input type="hidden" name="falloId" value={f.id} />
                <input type="hidden" name="back" value={back("fallos")} />
                <label className="field">
                  <span>Causa o solución</span>
                  <textarea
                    name="nota"
                    required
                    maxLength={2000}
                    defaultValue={f.note ?? ""}
                  />
                </label>
                <div className="chips">
                  <button name="estado" value="RESOLVED">
                    Resolver fallo
                  </button>
                  <button className="secondary" name="estado" value="IGNORED">
                    Descartar fallo
                  </button>
                </div>
              </form>
            </article>
          </li>
        ))}
        {reports.map((r, i) => {
          const bout = reportedBouts.find((b) => b.id === r.entityId);
          const fighter = reportedFighters.find((b) => b.id === r.entityId);
          const aura = reportedAuras.find((b) => b.id === r.entityId);
          const gimnasio = reportedGyms.find((g) => g.id === r.entityId);
          const medio = reportedMedia.find((m) => m.id === r.entityId);
          return (
            <li key={`report-${r.id}`} data-prioridad="4">
              <article className="tarjeta" data-cola="avisos">
                {i === 0 && <span id="avisos" />}
                <span className="pildora">Aviso de usuario</span>
                <div>
                  <strong>
                    {lookup(REPORT_REASONS, r.reason) ?? "Motivo no reconocido"}
                  </strong>
                  <div className="mut">
                    {r.user ? (
                      <>
                        {publicUserName(r.user.name)} · {r.user.email}
                      </>
                    ) : (
                      <>
                        Sin cuenta · {r.reporterName ?? "anónimo"}
                        {r.reporterEmail ? ` · ${r.reporterEmail}` : ""}
                      </>
                    )}
                  </div>
                  {r.message && <div>{r.message}</div>}
                </div>
                <div>
                  {bout && (
                    <>
                      <span className="mut">Combate: </span>
                      <Link href={`/veladas/${bout.event.slug}`}>
                        {bout.fighterA.firstName} {bout.fighterA.lastName}{" "}
                        contra {bout.fighterB.firstName}{" "}
                        {bout.fighterB.lastName} ({bout.event.name})
                      </Link>
                    </>
                  )}
                  {fighter && (
                    <>
                      <span className="mut">Ficha: </span>
                      <Link href={`/peleadores/${fighter.slug}`}>
                        {fighter.firstName} {fighter.lastName}
                      </Link>
                    </>
                  )}
                  {aura && (
                    <>
                      <span className="mut">
                        Comentario de {publicUserName(aura.user.name)} en{" "}
                      </span>
                      <Link href={`/peleadores/${aura.fighter.slug}`}>
                        {aura.fighter.firstName} {aura.fighter.lastName}
                      </Link>
                      : «{aura.comment}»
                    </>
                  )}
                  {medio && (
                    <>
                      <span className="mut">
                        {medio.kind === "PHOTO" ? "Foto" : "Vídeo"} de{" "}
                        {publicUserName(medio.uploader.name)} en{" "}
                      </span>
                      <Link
                        href={`/veladas/${medio.event.slug}#medio-${medio.id}`}
                      >
                        {medio.event.name}
                      </Link>
                      {medio.caption ? <>: «{medio.caption}»</> : null}
                      {medio.kind === "PHOTO" ? (
                        <>
                          {" "}
                          ·{" "}
                          <a
                            href={`/medios/${medio.id}/imagen`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ver la foto
                          <span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra pestaña)</span></a>
                        </>
                      ) : medio.videoUrl ? (
                        <>
                          {" "}
                          ·{" "}
                          <a
                            href={medio.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ver el vídeo
                          <span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra pestaña)</span></a>
                        </>
                      ) : (
                        <>
                          {" "}
                          ·{" "}
                          <a
                            href={`/medios/${medio.id}/video`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ver el vídeo
                          <span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra pestaña)</span></a>
                        </>
                      )}
                      {medio.hiddenAt ? " (ya retirado)" : ""}
                    </>
                  )}
                  {r.entity === "PAGINA" && (
                    <>
                      <span className="mut">Página: </span>
                      <a
                        href={r.entityId}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {r.entityId}
                      <span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra pestaña)</span></a>
                      <div className="mut">
                        Retira lo que haga falta desde la propia página y
                        después cierra el aviso: quien avisó recibirá la
                        decisión por correo.
                      </div>
                    </>
                  )}
                  {gimnasio && (
                    <Link href={`/mis-gimnasios?gimnasio=${gimnasio.id}`}>
                      Gimnasio: {gimnasio.name}
                    </Link>
                  )}
                  {r.entity !== "PAGINA" &&
                    !bout &&
                    !fighter &&
                    !aura &&
                    !medio &&
                    !gimnasio && (
                      <span className="mut">El elemento ya no existe.</span>
                    )}
                </div>
                <div>
                  <form
                    action={resolveReport}
                    style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                  >
                    <input type="hidden" name="reportId" value={r.id} />
                    <input type="hidden" name="back" value={back("avisos")} />
                    <label className="field">
                      <span>
                        {fighter
                          ? "Nota (obligatoria para ocultar; se envía por correo)"
                          : "Nota (opcional; se envía por correo)"}
                      </span>
                      <input name="note" maxLength={500} />
                    </label>
                    <button
                      name="decision"
                      value="resolve"
                      aria-label={`Cerrar: ya está corregido (aviso de ${r.user ? publicUserName(r.user.name) : (r.reporterName ?? "una persona sin cuenta")})`}
                    >
                      Cerrar: ya está corregido
                    </button>
                    {r.entity !== "PAGINA" && (
                      <button
                        name="decision"
                        value="hide"
                        className="secondary"
                        title={
                          bout
                            ? "Marca el combate como «en revisión»"
                            : fighter
                              ? "Borra los datos personales de la ficha (no se puede deshacer; exige una nota)"
                              : medio
                                ? "Deja de mostrarse en la velada y en las fichas"
                                : "Retira el comentario"
                        }
                      >
                        {bout
                          ? "Resolver y rechazar el combate"
                          : fighter
                            ? "Resolver y ocultar la ficha"
                            : medio
                              ? medio.kind === "PHOTO"
                                ? "Resolver y retirar la foto"
                                : "Resolver y retirar el vídeo"
                              : "Resolver y retirar el comentario"}
                      </button>
                    )}
                    <button
                      name="decision"
                      value="dismiss"
                      className="secondary"
                      aria-label={`Cerrar: no hay error (aviso de ${r.user ? publicUserName(r.user.name) : (r.reporterName ?? "una persona sin cuenta")})`}
                    >
                      Cerrar: no hay error
                    </button>
                  </form>
                </div>
              </article>
            </li>
          );
        })}
        {claims.map((c, i) => (
          <li key={`claim-${c.id}`} data-prioridad="4">
            <article className="tarjeta" data-cola="reclamaciones">
              {i === 0 && (
                <span id="reclamaciones" style={{ scrollMarginTop: 80 }} />
              )}
              <span className="pildora">Ficha reclamada</span>
              <h3>
                {c.fighter.firstName} {c.fighter.lastName}
              </h3>
              <p>
                {publicUserName(c.user.name)} · {c.user.email}
              </p>
              <p>{c.message}</p>
              {aprobarRechazar(
                decideClaim,
                "claimId",
                c.id,
                `${publicUserName(c.user.name)} sobre la ficha de ${c.fighter.firstName} ${c.fighter.lastName}`,
              )}
            </article>
          </li>
        ))}
        {reclamacionesGym.map((c, i) => (
          <li key={`gymclaim-${c.id}`} data-prioridad="4">
            <article className="tarjeta" data-cola="reclamaciones-gimnasio">
              {i === 0 && (
                <span
                  id="reclamaciones-gimnasio"
                  style={{ scrollMarginTop: 80 }}
                />
              )}
              <span className="pildora">Gimnasio reclamado</span>
              <h3>{c.gym.name}</h3>
              <p>
                {c.user.name} ·{" "}
                {c.status === "CONFLICT"
                  ? "Conflicto de propiedad"
                  : "Pendiente"}
              </p>
              <p>{c.evidence}</p>
              {c.evidenceUrl && (
                <a
                  className="btn secondary"
                  href={c.evidenceUrl}
                  rel="noopener noreferrer nofollow"
                >
                  Ver prueba
                </a>
              )}
              <form action={decideGymClaim}>
                <input type="hidden" name="claimId" value={c.id} />
                <input
                  type="hidden"
                  name="back"
                  value={back("reclamaciones-gimnasio")}
                />
                <label className="field">
                  <span>Nota de revisión</span>
                  <textarea
                    name="note"
                    minLength={10}
                    required
                    maxLength={1000}
                  />
                </label>
                <div className="chips">
                  {!c.gym.ownerUserId && (
                    <button name="decision" value="approve">
                      Aprobar reclamación de gimnasio
                    </button>
                  )}
                  <button className="secondary" name="decision" value="reject">
                    Rechazar reclamación de gimnasio
                  </button>
                </div>
              </form>
            </article>
          </li>
        ))}
        {organizers.map((r, i) => (
          <li key={`org-${r.id}`} data-prioridad="5">
            <article className="tarjeta" data-cola="organizadores">
              {i === 0 && (
                <span id="organizadores" style={{ scrollMarginTop: 80 }} />
              )}
              <span className="pildora">Organizador</span>
              <h3>{r.orgName}</h3>
              <span className="tag">
                {
                  TIPO_DE_ENTIDAD_ETIQUETA[
                    parseTipoDeEntidad(r.kind) ?? "PROMOTORA"
                  ]
                }
              </span>
              <p>
                {publicUserName(r.user.name)} · {r.user.email}
              </p>
              <p>{r.message}</p>
              {r.website && (
                <a
                  className="btn secondary"
                  href={r.website}
                  rel="noopener noreferrer nofollow"
                >
                  Web aportada
                </a>
              )}
              {aprobarRechazar(
                decideOrganizer,
                "requestId",
                r.id,
                r.orgName,
                true,
              )}
            </article>
          </li>
        ))}
        {gyms.map((g, i) => (
          <li key={`gym-${g.id}`} data-prioridad="6">
            <article className="tarjeta" data-cola="gimnasios">
              {i === 0 && (
                <span id="gimnasios" style={{ scrollMarginTop: 80 }} />
              )}
              <span className="pildora">Gimnasio</span>
              <h3>{g.name}</h3>
              <p>
                {g.city} · {g.province} ·{" "}
                {g.verifiedAt ? "Con sello" : "Sin sello"}
              </p>
              <Link href={`/mis-gimnasios?gimnasio=${g.id}`}>
                Corregir o revisar el gimnasio
              </Link>
              <p>{g.verifiedNote}</p>
              <form action={setGymVerified}>
                <input type="hidden" name="gymId" value={g.id} />
                <input type="hidden" name="back" value={back("gimnasios")} />
                <label className="field">
                  <span>Evidencia comprobada para el sello</span>
                  <input name="note" maxLength={500} />
                </label>
                {g.verifiedAt ? (
                  <button
                    name="decision"
                    value="revoke"
                    className="secondary"
                    aria-label={`Retirar sello de ${g.name}`}
                  >
                    Retirar sello
                  </button>
                ) : (
                  <button
                    name="decision"
                    value="verify"
                    aria-label={`Verificar el gimnasio ${g.name}`}
                  >
                    Verificar
                  </button>
                )}
              </form>
            </article>
          </li>
        ))}
        {sinSenales.map((b, i) => boutItem(b, "combates", 7, i === 0))}
        {enRevision
          .filter((b) => b.flags.length === 0)
          .map((b, i) =>
            boutItem(
              b,
              "revision",
              7,
              i === 0 && !enRevision.some((r) => r.flags.length > 0),
            ),
          )}
      </ol>
      {![
        pasadas,
        conSenales,
        fallos,
        reports,
        claims,
        reclamacionesGym,
        organizers,
        gyms,
        sinSenales,
        enRevision,
      ].some((items) => items.length > 0) && (
        <p>No hay elementos pendientes en la bandeja.</p>
      )}
    </>
  );
}
