import Link from "next/link";
import { requireAdmin } from "../../../lib/accounts/permissions";
import { db } from "../../../lib/common/db";
import { pageNumber, pageWindow } from "../../../lib/common/pagination";
import { flatParams } from "../../../lib/common/safe";
import Paginacion from "../../components/Paginacion";
import FormularioGimnasio from "../../components/FormularioGimnasio";
import { saveGym, decideGymClaim } from "../../actions/gyms";

export const metadata = { title: "Revisar gimnasios", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Colas independientes y paginadas: duplicados/importaciones dudosas y propiedad con prueba privada. */
export default async function GymModeration({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  const [nGyms, nClaims] = await Promise.all([db.gym.count({ where: { status: "PENDING" } }), db.gymClaimRequest.count({ where: { status: { in: ["PENDING", "CONFLICT"] } } })]);
  const gw = pageWindow(nGyms, pageNumber(params.pendientes)), cw = pageWindow(nClaims, pageNumber(params.reclamaciones));
  const [gyms, claims] = await Promise.all([
    db.gym.findMany({ where: { status: "PENDING" }, orderBy: [{ name: "asc" }, { id: "asc" }], take: gw.take, skip: gw.skip }),
    db.gymClaimRequest.findMany({ where: { status: { in: ["PENDING", "CONFLICT"] } }, include: { gym: true, user: { select: { name: true } } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: cw.take, skip: cw.skip }),
  ]);
  return <div className="pantalla"><h1>Revisar gimnasios</h1><Link className="btn secondary" href="/moderacion#gimnasios">Volver a moderación</Link>
    <section id="pendientes"><h2>Por revisar ({nGyms})</h2>{gyms.map((g) => <article className="tarjeta" key={g.id}><h3>{g.name} · {g.city} ({g.province || "Provincia por resolver"})</h3><p>{g.reviewNote}</p>{g.source === "OSM" && g.sourceRef && <a className="btn secondary" href={`https://www.openstreetmap.org/${g.sourceRef}`} rel="noopener noreferrer nofollow">Comprobar el dato en OpenStreetMap</a>}<FormularioGimnasio action={saveGym} gym={g} admin /></article>)}<Paginacion ruta="/moderacion/gimnasios" params={params} parametro="pendientes" actual={gw.current} paginas={gw.pages} desde={gw.from} hasta={gw.to} total={nGyms} unidad={["gimnasio", "gimnasios"]} /></section>
    <section id="reclamaciones"><h2>Reclamaciones de gimnasio ({nClaims})</h2>{claims.map((c) => <article className="tarjeta" key={c.id}><h3>{c.gym.name} · {c.user.name}</h3>{c.status === "CONFLICT" && <p className="notice notice-info">Ya tiene titular. Esta solicitud no puede apropiarse del gimnasio; hay que resolver la propiedad con su titular.</p>}<p>{c.evidence}</p>{c.evidenceUrl && <a className="btn secondary" href={c.evidenceUrl} rel="noopener noreferrer nofollow">Ver prueba</a>}<form action={decideGymClaim}><input type="hidden" name="claimId" value={c.id} /><label className="field"><span>Nota de revisión</span><textarea name="note" required minLength={10} maxLength={1000} /></label><div className="chips">{!c.gym.ownerUserId && <button name="decision" value="approve">Aprobar reclamación</button>}<button name="decision" value="reject" className="secondary">Rechazar reclamación</button></div></form></article>)}<Paginacion ruta="/moderacion/gimnasios" params={params} parametro="reclamaciones" actual={cw.current} paginas={cw.pages} desde={cw.from} hasta={cw.to} total={nClaims} unidad={["reclamación", "reclamaciones"]} /></section>
    <details><summary>Alta manual de gimnasio</summary><FormularioGimnasio action={saveGym} admin /></details>
  </div>;
}
