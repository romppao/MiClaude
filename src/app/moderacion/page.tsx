import Link from "next/link";
import { requireAdmin } from "../../lib/accounts/permissions";
import { db } from "../../lib/common/db";
import { FLAG_LABEL, type Flag } from "../../lib/fighters/coherence";
import { adminDecide, decideClaim, decideOrganizer, resolveReport, setGymVerified } from "../actions/moderation";
import { REPORT_REASONS } from "../../lib/community/reports";
import { lookup } from "../../lib/common/safe";
import { METHOD_LABEL, VERIFICATION_LABEL, fmtDate } from "../../lib/common/labels";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { publicUserName } from "../../lib/common/names";

export const metadata = { title: "Moderación" };
export const dynamic = "force-dynamic";

const LIMITE = 100;

type BoutRow = Awaited<ReturnType<typeof cargarCombates>>[number];

function cargarCombates(where: object, take = LIMITE) {
  return db.bout.findMany({
    where, take, orderBy: { event: { date: "desc" } },
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
              <td>
                <Link href={`/veladas/${b.event.slug}`}>{b.event.name}</Link> <span className="mut">· {DISCIPLINE_LABEL[b.event.discipline]} · {fmtDate(b.event.date)}</span>
                <div>Rojo: {b.fighterA.firstName} {b.fighterA.lastName} · Azul: {b.fighterB.firstName} {b.fighterB.lastName}</div>
                {b.flags.map((f) => <div key={f} className="L">⚠ {lookup(FLAG_LABEL, f as Flag) ?? f}</div>)}
              </td>
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

export default async function Moderation() {
  const user = await requireAdmin("/moderacion");

  const porVerificar = { verification: { in: ["SELF_REPORTED", "CONFIRMED"] as ("SELF_REPORTED" | "CONFIRMED")[] } };
  const [conSenales, sinSenales, enRevision, totales] = await Promise.all([
    cargarCombates({ ...porVerificar, flags: { isEmpty: false } }),
    cargarCombates({ ...porVerificar, flags: { isEmpty: true } }),
    cargarCombates({ verification: "DISPUTED" }),
    Promise.all([db.bout.count({ where: porVerificar }), db.bout.count({ where: { verification: "DISPUTED" } }), db.gym.count(), db.gym.count({ where: { verifiedAt: null } })]),
  ]);
  const reports = await db.report.findMany({ where: { status: "OPEN" }, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" }, take: LIMITE });
  const ids = (e: string) => reports.filter((r) => r.entity === e).map((r) => r.entityId);
  const [reportedBouts, reportedFighters, reportedAuras] = await Promise.all([
    db.bout.findMany({ where: { id: { in: ids("BOUT") } }, include: { event: true, fighterA: true, fighterB: true } }),
    db.fighter.findMany({ where: { id: { in: ids("FIGHTER") } } }),
    db.aura.findMany({ where: { id: { in: ids("AURA") } }, include: { fighter: true, user: { select: { name: true } } } }),
  ]);
  const [gyms, claims, organizers] = await Promise.all([
    db.gym.findMany({ orderBy: [{ verifiedAt: { sort: "asc", nulls: "first" } }, { name: "asc" }], take: LIMITE }),
    db.claimRequest.findMany({ where: { status: "PENDING" }, include: { user: true, fighter: true }, orderBy: { createdAt: "asc" } }),
    db.organizerRequest.findMany({ where: { status: "PENDING" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const [nPorVerificar, nRevision, nGimnasios, nSinSello] = totales;

  // Quien recibe un «no» tiene derecho a saber por qué: el motivo es obligatorio al rechazar y lo ve la persona (en la aplicación y por correo).
  // Quien recibe un «no» tiene derecho a saber por qué: el motivo es obligatorio al rechazar y lo ve la persona (en la aplicación y por correo).
  // En los organizadores, la nota es siempre obligatoria: al aprobar recoge la evidencia comprobada, que respalda el sello.
  const aprobarRechazar = (action: (f: FormData) => Promise<void>, name: string, id: string, quien: string, notaSiempre = false) => (
    <form action={action} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-end" }}>
      <input type="hidden" name={name} value={id} />
      <label className="field"><span>{notaSiempre ? "Evidencia comprobada, o motivo si rechazas (obligatorio)" : "Motivo (obligatorio si rechazas)"}</span><input name="note" maxLength={500} /></label>
      <button name="decision" value="approve" aria-label={`Aprobar la solicitud de ${quien}`}>Aprobar</button>
      <button name="decision" value="reject" className="secondary" aria-label={`Rechazar la solicitud de ${quien}`}>Rechazar</button>
    </form>
  );

  return (
    <>
      <h1>Moderación</h1>
      <p><Link href="/moderacion/historial">Ver el historial de cambios</Link></p>

      <h2>Avisos de error de usuarios ({reports.length})</h2>
      {reports.length === 0 ? <p className="mut">No hay avisos pendientes.</p> : (
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Motivo</th><th scope="col">Sobre qué</th><th scope="col">Acción</th></tr></thead>
          <tbody>
            {reports.map((r) => {
              const bout = reportedBouts.find((b) => b.id === r.entityId);
              const fighter = reportedFighters.find((b) => b.id === r.entityId);
              const aura = reportedAuras.find((b) => b.id === r.entityId);
              return (
                <tr key={r.id}>
                  <td>
                    <strong>{lookup(REPORT_REASONS, r.reason) ?? "Motivo no reconocido"}</strong>
                    <div className="mut">{publicUserName(r.user.name)} · {r.user.email}</div>
                    {r.message && <div>{r.message}</div>}
                  </td>
                  <td>
                    {bout && <><span className="mut">Combate: </span><Link href={`/veladas/${bout.event.slug}`}>{bout.fighterA.firstName} {bout.fighterA.lastName} contra {bout.fighterB.firstName} {bout.fighterB.lastName} ({bout.event.name})</Link></>}
                    {fighter && <><span className="mut">Ficha: </span><Link href={`/peleadores/${fighter.slug}`}>{fighter.firstName} {fighter.lastName}</Link></>}
                    {aura && <><span className="mut">Comentario de {publicUserName(aura.user.name)} en </span><Link href={`/peleadores/${aura.fighter.slug}`}>{aura.fighter.firstName} {aura.fighter.lastName}</Link>: «{aura.comment}»</>}
                    {!bout && !fighter && !aura && <span className="mut">El elemento ya no existe.</span>}
                  </td>
                  <td>
                    <form action={resolveReport} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <input type="hidden" name="reportId" value={r.id} />
                      <input name="note" placeholder="Nota (opcional)" aria-label="Nota de resolución" maxLength={500} />
                      <button name="decision" value="resolve">Cerrar: ya está corregido</button>
                      <button name="decision" value="hide" className="secondary" title={bout ? "Marca el combate como «en revisión»" : fighter ? "Oculta los datos personales de la ficha" : "Retira el comentario"}>
                        {bout ? "Resolver y rechazar el combate" : fighter ? "Resolver y ocultar la ficha" : "Resolver y retirar el comentario"}
                      </button>
                      <button name="decision" value="dismiss" className="secondary">Cerrar: no hay error</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      )}

      <h2>Reclamaciones de ficha ({claims.length})</h2>
      {claims.length === 0 ? <p className="mut">No hay reclamaciones pendientes.</p> : (
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Quién reclama</th><th scope="col">Qué ficha</th><th scope="col">Cómo lo justifica</th><th scope="col">Acción</th></tr></thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td><strong>{publicUserName(c.user.name)}</strong> <span className="mut">{c.user.email}{c.user.emailVerifiedAt ? " (correo verificado)" : ""}</span></td>
                <td><Link href={`/peleadores/${c.fighter.slug}`}>{c.fighter.firstName} {c.fighter.lastName}</Link></td>
                <td className="mut">{c.message}</td>
                <td>{aprobarRechazar(decideClaim, "claimId", c.id, `${publicUserName(c.user.name)} sobre la ficha de ${c.fighter.firstName} ${c.fighter.lastName}`)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      <h2>Solicitudes de organizador ({organizers.length})</h2>
      {organizers.length === 0 ? <p className="mut">No hay solicitudes pendientes.</p> : (
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Organización</th><th scope="col">Cómo lo justifica</th><th scope="col">Acción</th></tr></thead>
          <tbody>
            {organizers.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.orgName}</strong> <span className="mut">{publicUserName(o.user.name)} · {o.user.email}</span></td>
                <td className="mut">{o.message}</td>
                <td>{aprobarRechazar(decideOrganizer, "requestId", o.id, `${o.orgName}`, true)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      <h2>Gimnasios ({nGimnasios}; {nSinSello} sin sello)</h2>
      <p className="mut">Primero aparecen los que aún no tienen el sello de verificado.{nGimnasios > LIMITE ? ` Se muestran los ${LIMITE} primeros.` : ""}</p>
      <div className="table-wrap"><table>
        <thead><tr><th scope="col">Gimnasio</th><th scope="col">Evidencia anotada</th><th scope="col">Acción</th></tr></thead>
        <tbody>
          {gyms.map((g) => (
            <tr key={g.id}>
              <td><strong>{g.name}</strong> <span className="mut">{g.city}</span> {g.verifiedAt && <span className="tag PRO">✓ verificado</span>}</td>
              <td className="mut">{g.verifiedNote}{g.website && <> · <a href={g.website} rel="noopener noreferrer nofollow">sitio web de {g.name}</a></>}</td>
              <td>
                <form action={setGymVerified} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <input type="hidden" name="gymId" value={g.id} />
                  {!g.verifiedAt && <input name="note" aria-label={`Evidencia comprobada de ${g.name}`} placeholder="Evidencia comprobada (web, redes, llamada…)" maxLength={500} />}
                  {g.verifiedAt ? <button name="decision" value="revoke" className="secondary">Retirar sello</button> : <button name="decision" value="verify">Verificar</button>}
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>

      <h2>Combates con señales de coherencia ({conSenales.length})</h2>
      <p className="mut"><strong>Verificar</strong>: el combate cuenta como respaldado por un moderador. <strong>Marcar como no correcto</strong>: deja de contar en el récord y en el ránking y de mostrarse como hecho hasta que se aclare; puede restaurarse desde «Combates en revisión».</p>
      <BoutTable rows={conSenales} vacio="No hay combates con señales." acciones={(b) => (
        <form action={adminDecide} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input type="hidden" name="boutId" value={b.id} />
          <button name="decision" value="verify">Verificar</button>
          <button name="decision" value="dispute" className="secondary" title="Deja de contar y de mostrarse como hecho hasta que se aclare">Marcar como no correcto</button>
        </form>
      )} />

      <h2>Combates por verificar ({nPorVerificar})</h2>
      {nPorVerificar > sinSenales.length + conSenales.length && <p className="mut">Se muestran los {LIMITE} más recientes de cada lista; hay más pendientes.</p>}
      <BoutTable rows={sinSenales} vacio="No hay combates pendientes." acciones={(b) => (
        <form action={adminDecide} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input type="hidden" name="boutId" value={b.id} />
          <button name="decision" value="verify">Verificar</button>
          <button name="decision" value="dispute" className="secondary" title="Deja de contar y de mostrarse como hecho hasta que se aclare">Marcar como no correcto</button>
        </form>
      )} />

      <h2>Combates en revisión ({nRevision})</h2>
      <p className="mut">Son los que el rival o un moderador ha rechazado. No cuentan en el récord ni en el ránking hasta que se aclaren.</p>
      <BoutTable rows={enRevision} vacio="No hay combates en revisión." acciones={(b) => (
        <form action={adminDecide} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input type="hidden" name="boutId" value={b.id} />
          <button name="decision" value="verify">Verificar</button>
          <button name="decision" value="restore" className="secondary">Restaurar como pendiente</button>
        </form>
      )} />
    </>
  );
}
