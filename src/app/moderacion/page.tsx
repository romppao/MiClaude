import Link from "next/link";
import { requireAdmin } from "../../lib/accounts/permissions";
import { esCreador } from "../../lib/accounts/creador";
import { db } from "../../lib/common/db";
import { FLAG_LABEL, type Flag } from "../../lib/fighters/coherence";
import { adminDecide, decideClaim, decideOrganizer, resolveReport, setGymVerified } from "../actions/moderation";
import { REPORT_REASONS } from "../../lib/community/reports";
import Paginacion from "../components/Paginacion";
import { TIPO_DE_ENTIDAD_ETIQUETA, parseTipoDeEntidad } from "../../lib/accounts/landing";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import { boutVersion } from "../../lib/bouts/rules";
import { lookup, flatParams } from "../../lib/common/safe";
import { METHOD_LABEL, VERIFICATION_LABEL, fmtDate } from "../../lib/common/labels";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { publicUserName } from "../../lib/common/names";

export const metadata = { title: "Moderación" };
export const dynamic = "force-dynamic";

const LIMITE = 50;

type BoutRow = Awaited<ReturnType<typeof cargarCombates>>[number];

function cargarCombates(where: object, take = LIMITE, skip = 0) {
  return db.bout.findMany({
    where, take, skip, orderBy: [{ event: { date: "desc" } }, { id: "asc" }],
    include: { event: true, fighterA: true, fighterB: true, createdBy: { select: { name: true, email: true } } },
  });
}

/** Resultado tal y como lo declaró quien registró el combate, en palabras. */
function declarado(b: BoutRow) {
  if (!b.result) return "Sin resultado declarado";
  const r = b.result === "DRAW" ? "Empate" : b.result === "NO_CONTEST" ? "Sin decisión" : `Gana ${b.result === "A_WIN" ? "el rojo" : "el azul"}`;
  return `${r}${b.method && b.result !== "DRAW" && b.result !== "NO_CONTEST" ? ` (${METHOD_LABEL[b.method]}${b.endRound ? `, asalto ${b.endRound}` : ""})` : ""}`;
}

function BoutTable({ rows, acciones, vacio }: { rows: BoutRow[]; acciones: (b: BoutRow) => React.ReactNode; vacio: string }) {
  if (rows.length === 0) return <p className="mut">{vacio}</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th scope="col">Combate</th><th scope="col">Lo que se declara</th><th scope="col">Quién lo registró</th><th scope="col">Estado</th><th scope="col">Acción</th></tr></thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id}>
              <th scope="row" className="celda-fila">
                <Link href={`/veladas/${b.event.slug}`}>{b.event.name}</Link> <span className="mut">· {DISCIPLINE_LABEL[b.event.discipline]} · {fmtDate(b.event.date)}</span>
                <div>Rojo: {b.fighterA.firstName} {b.fighterA.lastName} · Azul: {b.fighterB.firstName} {b.fighterB.lastName}</div>
                {b.flags.map((f) => <div key={f} className="L">⚠ {lookup(FLAG_LABEL, f as Flag) ?? f}</div>)}
              </th>
              <td>{declarado(b)}{b.evidenceUrl && <> · <a href={b.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow ugc">ver evidencia<span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra pestaña)</span></a></>}</td>
              <td>{b.createdBy ? <>{publicUserName(b.createdBy.name)}<div className="mut">{b.createdBy.email}</div></> : <span className="mut">—</span>}</td>
              <td>{VERIFICATION_LABEL[b.verification]}</td>
              <td>{acciones(b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Nombre de un combate para los lectores de pantalla: cada botón repetido en una fila lleva su contexto. */
const nombreCombate = (b: { fighterA: { firstName: string; lastName: string }; fighterB: { firstName: string; lastName: string }; event: { name: string } }) =>
  `${b.fighterA.firstName} ${b.fighterA.lastName} contra ${b.fighterB.firstName} ${b.fighterB.lastName} en ${b.event.name}`;

export default async function Moderation({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireAdmin("/moderacion");
  const raw = flatParams(await searchParams);
  const keys = ["avisos", "reclamaciones", "organizadores", "gimnasios", "senales", "combates", "revision"] as const;
  const porVerificar = { verification: { in: ["SELF_REPORTED", "CONFIRMED"] as ("SELF_REPORTED" | "CONFIRMED")[] } };
  const flagged = { ...porVerificar, flags: { isEmpty: false } };
  const unflagged = { ...porVerificar, flags: { isEmpty: true } };
  const [nReports, nClaims, nOrganizers, nGimnasios, nFlags, nUnflagged, nRevision, nSinSello] = await Promise.all([
    db.report.count({ where: { status: "OPEN" } }), db.claimRequest.count({ where: { status: "PENDING" } }),
    db.organizerRequest.count({ where: { status: "PENDING" } }), db.gym.count(),
    db.bout.count({ where: flagged }), db.bout.count({ where: unflagged }), db.bout.count({ where: { verification: "DISPUTED" } }),
    db.gym.count({ where: { verifiedAt: null } }),
  ]);
  const counts = [nReports, nClaims, nOrganizers, nGimnasios, nFlags, nUnflagged, nRevision];
  const windows = Object.fromEntries(keys.map((k,i) => [k, pageWindow(counts[i], pageNumber(raw[k]), LIMITE)]));
  const pageParams = Object.fromEntries(keys.map(k => [k, windows[k].current > 1 ? String(windows[k].current) : undefined]));
  const query = new URLSearchParams(Object.entries(pageParams).filter((v): v is [string,string] => !!v[1])).toString();
  const back = (key: string) => `/moderacion${query ? `?${query}` : ""}#${key}`;
  const paging = (key: string, unidad: [string,string], etiqueta: string) => {
    const w = windows[key];
    return <Paginacion ruta="/moderacion" params={pageParams} parametro={key} ancla={key} etiqueta={`Páginas de ${etiqueta}`} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={w.total} unidad={unidad} />;
  };
  const [conSenales, sinSenales, enRevision, reports, gyms, claims, organizers] = await Promise.all([
    cargarCombates(flagged, windows.senales.take, windows.senales.skip),
    cargarCombates(unflagged, windows.combates.take, windows.combates.skip),
    cargarCombates({ verification: "DISPUTED" }, windows.revision.take, windows.revision.skip),
    db.report.findMany({ where: { status: "OPEN" }, include: { user: { select: { name: true, email: true } } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: windows.avisos.take, skip: windows.avisos.skip }),
    db.gym.findMany({ orderBy: [{ verifiedAt: { sort: "asc", nulls: "first" } }, { name: "asc" }, { id: "asc" }], take: windows.gimnasios.take, skip: windows.gimnasios.skip }),
    db.claimRequest.findMany({ where: { status: "PENDING" }, include: { user: true, fighter: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: windows.reclamaciones.take, skip: windows.reclamaciones.skip }),
    db.organizerRequest.findMany({ where: { status: "PENDING" }, include: { user: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: windows.organizadores.take, skip: windows.organizadores.skip }),
  ]);
  // Por qué el rival dijo «no es correcto» (queda en el historial de cada combate rechazado)
  const rechazos = await db.auditLog.findMany({ where: { entity: "BOUT", action: "RIVAL_DISPUTED", entityId: { in: enRevision.map((b) => b.id) } }, orderBy: { createdAt: "asc" }, select: { entityId: true, after: true } });
  const motivoDe = new Map(rechazos.map((r) => [r.entityId, (r.after as { motivo?: string } | null)?.motivo ?? ""]));
  const ids = (e: string) => reports.filter((r) => r.entity === e).map((r) => r.entityId);
  const [reportedBouts, reportedFighters, reportedAuras, reportedMedia] = await Promise.all([
    db.bout.findMany({ where: { id: { in: ids("BOUT") } }, include: { event: true, fighterA: true, fighterB: true } }),
    db.fighter.findMany({ where: { id: { in: ids("FIGHTER") } } }),
    db.aura.findMany({ where: { id: { in: ids("AURA") } }, include: { fighter: true, user: { select: { name: true } } } }),
    db.mediaItem.findMany({ where: { id: { in: ids("MEDIA") } }, select: { id: true, kind: true, caption: true, hiddenAt: true, videoUrl: true, event: { select: { slug: true, name: true } }, uploader: { select: { name: true } } } }),
  ]);
  // Quien recibe un «no» tiene derecho a saber por qué: el motivo es obligatorio al rechazar y lo ve la persona (en la aplicación y por correo).
  // En los organizadores, la nota es siempre obligatoria: al aprobar recoge la evidencia comprobada, que respalda el sello.
  const aprobarRechazar = (action: (f: FormData) => Promise<void>, name: string, id: string, quien: string, notaSiempre = false) => (
    <form action={action} noValidate={notaSiempre} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-end" }}>
      <input type="hidden" name={name} value={id} />
      <input type="hidden" name="back" value={back(name === "claimId" ? "reclamaciones" : "organizadores")} />
      <label className="field"><span>{notaSiempre ? "Evidencia comprobada, o motivo si rechazas (obligatorio)" : "Motivo (obligatorio si rechazas)"}</span><input name="note" maxLength={500} required={notaSiempre} /></label>
      <button name="decision" value="approve" aria-label={`Aprobar la solicitud de ${quien}`}>Aprobar</button>
      <button name="decision" value="reject" className="secondary" aria-label={`Rechazar la solicitud de ${quien}`}>Rechazar</button>
    </form>
  );

  return (
    <>
      <h1>Moderación</h1><p><Link href="/respaldar">Respaldar resultados y títulos</Link> · <Link href="/moderacion/acreditaciones">Gestionar acreditaciones</Link></p>
      <p><Link href="/moderacion/historial">Ver el historial de cambios</Link> · <Link href="/moderacion/noticias">Fuentes de noticias</Link>{esCreador(user) && <> · <Link href="/moderacion/usuarios">Administración: cuentas y moderadores</Link></>}</p>

      <h2 id="avisos">Avisos de error de usuarios ({nReports})</h2>
      {paging("avisos", ["aviso", "avisos"], "avisos")}
      {reports.length === 0 ? <p className="mut">No hay avisos pendientes.</p> : (
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Motivo</th><th scope="col">Sobre qué</th><th scope="col">Acción</th></tr></thead>
          <tbody>
            {reports.map((r) => {
              const bout = reportedBouts.find((b) => b.id === r.entityId);
              const fighter = reportedFighters.find((b) => b.id === r.entityId);
              const aura = reportedAuras.find((b) => b.id === r.entityId);
              const medio = reportedMedia.find((m) => m.id === r.entityId);
              return (
                <tr key={r.id}>
                  <th scope="row" className="celda-fila">
                    <strong>{lookup(REPORT_REASONS, r.reason) ?? "Motivo no reconocido"}</strong>
                    <div className="mut">{publicUserName(r.user.name)} · {r.user.email}</div>
                    {r.message && <div>{r.message}</div>}
                  </th>
                  <td>
                    {bout && <><span className="mut">Combate: </span><Link href={`/veladas/${bout.event.slug}`}>{bout.fighterA.firstName} {bout.fighterA.lastName} contra {bout.fighterB.firstName} {bout.fighterB.lastName} ({bout.event.name})</Link></>}
                    {fighter && <><span className="mut">Ficha: </span><Link href={`/peleadores/${fighter.slug}`}>{fighter.firstName} {fighter.lastName}</Link></>}
                    {aura && <><span className="mut">Comentario de {publicUserName(aura.user.name)} en </span><Link href={`/peleadores/${aura.fighter.slug}`}>{aura.fighter.firstName} {aura.fighter.lastName}</Link>: «{aura.comment}»</>}
                    {medio && <><span className="mut">{medio.kind === "PHOTO" ? "Foto" : "Vídeo"} de {publicUserName(medio.uploader.name)} en </span><Link href={`/veladas/${medio.event.slug}#medio-${medio.id}`}>{medio.event.name}</Link>{medio.caption ? <>: «{medio.caption}»</> : null}{medio.kind === "PHOTO" ? <> · <a href={`/medios/${medio.id}/imagen`} target="_blank" rel="noopener noreferrer">Ver la foto</a></> : medio.videoUrl ? <> · <a href={medio.videoUrl} target="_blank" rel="noopener noreferrer">Ver el vídeo</a></> : <> · <a href={`/medios/${medio.id}/video`} target="_blank" rel="noopener noreferrer">Ver el vídeo</a></>}{medio.hiddenAt ? " (ya retirado)" : ""}</>}
                    {!bout && !fighter && !aura && !medio && <span className="mut">El elemento ya no existe.</span>}
                  </td>
                  <td>
                    <form action={resolveReport} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <input type="hidden" name="reportId" value={r.id} />
                      <input type="hidden" name="back" value={back("avisos")} />
                      <input name="note" placeholder={fighter ? "Nota (obligatoria para ocultar)" : "Nota (opcional)"} aria-label="Nota de resolución" maxLength={500} />
                      <button name="decision" value="resolve" aria-label={`Cerrar: ya está corregido (aviso de ${publicUserName(r.user.name)})`}>Cerrar: ya está corregido</button>
                      <button name="decision" value="hide" className="secondary" title={bout ? "Marca el combate como «en revisión»" : fighter ? "Borra los datos personales de la ficha (no se puede deshacer; exige una nota)" : medio ? "Deja de mostrarse en la velada y en las fichas" : "Retira el comentario"}>
                        {bout ? "Resolver y rechazar el combate" : fighter ? "Resolver y ocultar la ficha" : medio ? (medio.kind === "PHOTO" ? "Resolver y retirar la foto" : "Resolver y retirar el vídeo") : "Resolver y retirar el comentario"}
                      </button>
                      <button name="decision" value="dismiss" className="secondary" aria-label={`Cerrar: no hay error (aviso de ${publicUserName(r.user.name)})`}>Cerrar: no hay error</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      )}

      <h2 id="reclamaciones">Reclamaciones de ficha ({nClaims})</h2>
      {paging("reclamaciones", ["reclamación", "reclamaciones"], "reclamaciones")}
      {claims.length === 0 ? <p className="mut">No hay reclamaciones pendientes.</p> : (
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Quién reclama</th><th scope="col">Qué ficha</th><th scope="col">Cómo lo justifica</th><th scope="col">Acción</th></tr></thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <th scope="row" className="celda-fila"><strong>{publicUserName(c.user.name)}</strong> <span className="mut">{c.user.email}{c.user.emailVerifiedAt ? " (correo verificado)" : ""}</span></th>
                <td><Link href={`/peleadores/${c.fighter.slug}`}>{c.fighter.firstName} {c.fighter.lastName}</Link></td>
                <td className="mut">{c.message}</td>
                <td>{aprobarRechazar(decideClaim, "claimId", c.id, `${publicUserName(c.user.name)} sobre la ficha de ${c.fighter.firstName} ${c.fighter.lastName}`)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      <h2 id="organizadores">Solicitudes de organizador ({nOrganizers})</h2>
      {paging("organizadores", ["solicitud", "solicitudes"], "solicitudes de organizador")}
      {organizers.length === 0 ? <p className="mut">No hay solicitudes pendientes.</p> : (
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Organización</th><th scope="col">Cómo lo justifica</th><th scope="col">Acción</th></tr></thead>
          <tbody>
            {organizers.map((o) => (
              <tr key={o.id}>
                <th scope="row" className="celda-fila"><strong>{o.orgName}</strong> <span className="tag">{TIPO_DE_ENTIDAD_ETIQUETA[parseTipoDeEntidad(o.kind) ?? "PROMOTORA"]}</span> <span className="mut">{publicUserName(o.user.name)} · {o.user.email}</span></th>
                <td className="mut">{o.message}{o.website && <> · <a href={o.website} target="_blank" rel="noopener noreferrer nofollow ugc">web o redes<span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra pestaña)</span></a></>}</td>
                <td>{aprobarRechazar(decideOrganizer, "requestId", o.id, `${o.orgName}`, true)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      <h2 id="gimnasios">Gimnasios ({nGimnasios}; {nSinSello} sin sello)</h2>
      {paging("gimnasios", ["gimnasio", "gimnasios"], "gimnasios")}
      <p className="mut">Primero aparecen los que aún no tienen el sello de verificado.</p>
      <div className="table-wrap"><table>
        <thead><tr><th scope="col">Gimnasio</th><th scope="col">Evidencia anotada</th><th scope="col">Acción</th></tr></thead>
        <tbody>
          {gyms.map((g) => (
            <tr key={g.id}>
              <th scope="row" className="celda-fila"><strong>{g.name}</strong> <span className="mut">{g.city}</span> {g.verifiedAt && <span className="tag PRO">✓ verificado</span>}</th>
              <td className="mut">{g.verifiedNote}{g.website && <> · <a href={g.website} rel="noopener noreferrer nofollow">sitio web de {g.name}</a></>}</td>
              <td>
                <form action={setGymVerified} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <input type="hidden" name="gymId" value={g.id} />
                  <input type="hidden" name="back" value={back("gimnasios")} />
                  {!g.verifiedAt && <input name="note" aria-label={`Evidencia comprobada de ${g.name}`} placeholder="Evidencia comprobada (web, redes, llamada…)" maxLength={500} />}
                  {g.verifiedAt ? <button name="decision" value="revoke" className="secondary" aria-label={`Retirar sello de ${g.name}`}>Retirar sello</button> : <button name="decision" value="verify" aria-label={`Verificar el gimnasio ${g.name}`}>Verificar</button>}
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>

      <h2 id="senales">Combates con señales de coherencia ({nFlags})</h2>
      {paging("senales", ["combate", "combates"], "combates con señales")}
      <p className="mut"><strong>Verificar</strong>: moderación comprueba el registro; este paso no concede bonificación de respaldo. Para concederla, utiliza «Respaldar resultados y títulos». <strong>Marcar como no correcto</strong>: deja de contar en el récord y en el ránking y de mostrarse como hecho hasta que se aclare; puede restaurarse desde «Combates en revisión».</p>
      <BoutTable rows={conSenales} vacio="No hay combates con señales." acciones={(b) => (
        <form action={adminDecide} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input type="hidden" name="boutId" value={b.id} />
          <input type="hidden" name="back" value={back("senales")} />
          <input type="hidden" name="version" value={boutVersion(b)} />
          <button name="decision" value="verify" aria-label={`Verificar combate: ${nombreCombate(b)}`}>Verificar</button>
          <button name="decision" value="dispute" className="secondary" title="Deja de contar y de mostrarse como hecho hasta que se aclare" aria-label={`Marcar como no correcto el combate: ${nombreCombate(b)}`}>Marcar como no correcto</button>
        </form>
      )} />

      <h2 id="combates">Combates por verificar sin señales ({nUnflagged})</h2>
      {paging("combates", ["combate", "combates"], "combates sin señales")}
      <BoutTable rows={sinSenales} vacio="No hay combates pendientes." acciones={(b) => (
        <form action={adminDecide} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input type="hidden" name="boutId" value={b.id} />
          <input type="hidden" name="back" value={back("combates")} />
          <input type="hidden" name="version" value={boutVersion(b)} />
          <button name="decision" value="verify" aria-label={`Verificar combate: ${nombreCombate(b)}`}>Verificar</button>
          <button name="decision" value="dispute" className="secondary" title="Deja de contar y de mostrarse como hecho hasta que se aclare" aria-label={`Marcar como no correcto el combate: ${nombreCombate(b)}`}>Marcar como no correcto</button>
        </form>
      )} />

      <h2 id="revision">Combates en revisión ({nRevision})</h2>
      {paging("revision", ["combate", "combates"], "combates en revisión")}
      <p className="mut">Son resultados suspendidos hasta aclararlos: no cuentan en el récord ni en el ránking. Un aviso del rival solicita revisión; por sí solo no suspende el resultado.</p>
      <BoutTable rows={enRevision} vacio="No hay combates en revisión." acciones={(b) => (
        <form action={adminDecide} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input type="hidden" name="boutId" value={b.id} />
          <input type="hidden" name="back" value={back("revision")} />
          <input type="hidden" name="version" value={boutVersion(b)} />
          {motivoDe.get(b.id) && <div className="mut" style={{ flexBasis: "100%" }}>Motivo del rival: {motivoDe.get(b.id)}</div>}
          <button name="decision" value="verify" aria-label={`Verificar combate: ${nombreCombate(b)}`}>Verificar</button>
          <button name="decision" value="restore" className="secondary" aria-label={`Restaurar como pendiente el combate: ${nombreCombate(b)}`}>Restaurar como pendiente</button>
        </form>
      )} />
    </>
  );
}
