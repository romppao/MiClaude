import Link from "next/link";
import type { Metadata } from "next";
import { db } from "../../lib/common/db";
import { requireUser } from "../../lib/accounts/auth";
import { fmtDate } from "../../lib/common/labels";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { publicFighterName } from "../../lib/common/names";
import { flatParams } from "../../lib/common/safe";
import { searchIds } from "../../lib/common/search";
import { PROPOSAL_KIND_LABEL, PROPOSAL_REPLY_MAX, PROPOSAL_STATUS_LABEL, puedeCancelarPropuesta, puedeResponderPropuesta } from "../../lib/fighters/proposals";
import { answerProposal, cancelProposal } from "../actions/proposals";
import Pestanas from "../components/Pestanas";

export const metadata: Metadata = { title: "Retos y sparrings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const PILDORA = { PENDING: "pildora-violeta", ACCEPTED: "pildora-acc", DECLINED: "", CANCELLED: "" } as const;
const fecha = (d: Date | null) => (d ? d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : null);

/**
 * «Mis propuestas» del peleador: buscar a quién retar o proponer un sparring, y las propuestas recibidas (aceptar o rechazar) y enviadas
 * (cancelar). Con la propuesta aceptada, cada uno ve el correo del otro para concretarlo.
 */
export default async function Propuestas({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/propuestas");
  const { q = "" } = flatParams(await searchParams);
  const me = user.fighter;
  if (!me) {
    return (
      <div className="pantalla" style={{ gap: 16 }}>
        <h1>Retos y sparrings</h1>
        <div className="tarjeta"><p style={{ margin: 0 }}>Para retar a otros peleadores o proponerles un sparring necesitas tu ficha de peleador.</p><Link className="btn btn-grande" href="/mi-ficha">Crear o reclamar mi ficha</Link></div>
      </div>
    );
  }
  const texto = q.trim().slice(0, 80);
  const ids = texto ? await searchIds("fighter", texto) : null;
  const incluir = { include: { disciplines: true, user: { select: { email: true } } } } as const;
  const [encontrados, recibidas, enviadas] = await Promise.all([
    texto ? db.fighter.findMany({ where: { id: { in: ids ?? [] , not: me.id }, listed: true, hiddenAt: null, userId: { not: null } }, take: 10, orderBy: [{ lastName: "asc" }, { id: "asc" }], include: { disciplines: true } }) : Promise.resolve([]),
    db.fightProposal.findMany({ where: { toId: me.id }, orderBy: [{ createdAt: "desc" }], take: 50, include: { from: incluir } }),
    db.fightProposal.findMany({ where: { fromId: me.id }, orderBy: [{ createdAt: "desc" }], take: 50, include: { to: incluir } }),
  ]);
  const pendientes = recibidas.filter((p) => p.status === "PENDING").length;
  const detalle = (p: { discipline: keyof typeof DISCIPLINE_LABEL; day: Date | null; place: string | null }) => [DISCIPLINE_LABEL[p.discipline], fecha(p.day), p.place].filter(Boolean).join(" · ");
  return (
    <div className="pantalla" style={{ gap: 18 }}>
      <div><h1>Retos y sparrings</h1><p className="lead" style={{ fontSize: 16 }}>Reta a otro peleador o proponle un sparring. Si acepta, podréis escribiros por correo para concretarlo.</p></div>

      <section id="proponer" className="tarjeta" aria-labelledby="titulo-proponer" style={{ gap: 12, scrollMarginTop: 80 }}>
        <h2 id="titulo-proponer" style={{ margin: 0, font: "800 20px var(--font)" }}>¿A quién quieres retar?</h2>
        <form role="search" aria-label="Buscar un peleador" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label className="field" style={{ flex: "1 1 220px", margin: 0 }}><span>Nombre o alias del peleador</span><input name="q" defaultValue={texto} maxLength={80} /></label>
          <button>Buscar</button>
        </form>
        {texto && encontrados.length === 0 && <p className="mut" style={{ margin: 0 }}>No hay peleadores con ficha reclamada con ese nombre. Prueba con una parte del nombre, o búscalo en <Link href={`/peleadores?q=${encodeURIComponent(texto)}`}>Peleadores</Link>.</p>}
        {encontrados.map((f) => (
          <div key={f.id} className="fila" style={{ flexWrap: "wrap" }}>
            <span className="cuerpo" style={{ flex: "1 1 60%" }}><span className="nombre">{publicFighterName(f)}</span><span className="meta">{f.disciplines.map((d) => DISCIPLINE_LABEL[d.discipline]).join(", ")}{f.province ? ` · ${f.province}` : ""}</span></span>
            <span style={{ display: "flex", gap: 6 }}>
              <Link className="btn" href={`/peleadores/${f.slug}/proponer?tipo=FIGHT`} aria-label={`Retar a ${publicFighterName(f)}`}>Retar</Link>
              <Link className="btn secondary" href={`/peleadores/${f.slug}/proponer?tipo=SPARRING`} aria-label={`Proponer un sparring a ${publicFighterName(f)}`}>Sparring</Link>
            </span>
          </div>
        ))}
      </section>

      <Pestanas etiqueta="Mis propuestas" inicial={pendientes || !enviadas.length ? 0 : 1} pestanas={[
        { id: "pestana-recibidas", titulo: `Recibidas (${pendientes})`, contenido: <>
          <h2 className="sr-only">Propuestas recibidas</h2>
          {recibidas.length === 0 && <p className="mut" style={{ margin: 0 }}>Todavía nadie te ha retado ni propuesto un sparring.</p>}
          {recibidas.map((p) => (
            <article key={p.id} className="tarjeta" style={p.status === "PENDING" ? { borderColor: "var(--acc)" } : undefined} aria-label={`${PROPOSAL_KIND_LABEL[p.kind]} de ${publicFighterName(p.from)}`}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><span className="kicker">{PROPOSAL_KIND_LABEL[p.kind]}</span><span className="meta">{PROPOSAL_STATUS_LABEL[p.status]} · {fmtDate(p.createdAt)}</span></div>
              <div style={{ font: "800 20px/1.15 var(--font)" }}><Link href={`/peleadores/${p.from.slug}`}>{publicFighterName(p.from)}</Link></div>
              <div className="meta">{detalle(p)}</div>
              {p.message && <p style={{ margin: 0 }}>«{p.message}»</p>}
              {p.reply && <div className="meta">Tu respuesta: {p.reply}</div>}
              {p.status === "ACCEPTED" && p.from.user && <p className="mut" style={{ margin: 0 }}>Para concretarlo, escribe a <a href={`mailto:${p.from.user.email}`}>{p.from.user.email}</a>.</p>}
              {puedeResponderPropuesta(p.status) && (
                <form action={answerProposal} style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <input type="hidden" name="proposalId" value={p.id} />
                  <label className="field"><span>Mensaje (opcional)</span><textarea name="reply" rows={2} maxLength={PROPOSAL_REPLY_MAX} placeholder="Fecha, lugar, peso…" /></label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button name="decision" value="aceptar" style={{ flex: 1 }}>Aceptar</button>
                    <button name="decision" value="rechazar" className="secondary" style={{ flex: 1 }}>Rechazar</button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </> },
        { id: "pestana-enviadas", titulo: `Enviadas (${enviadas.length})`, contenido: <>
          <h2 className="sr-only">Propuestas enviadas</h2>
          {enviadas.length === 0 && <p className="mut" style={{ margin: 0 }}>Todavía no has enviado ninguna propuesta. Busca arriba a quién retar.</p>}
          {enviadas.map((p) => (
            <article key={p.id} className="tarjeta" aria-label={`${PROPOSAL_KIND_LABEL[p.kind]} a ${publicFighterName(p.to)}`}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><span className={`pildora ${PILDORA[p.status]}`}>{PROPOSAL_STATUS_LABEL[p.status]}</span><span className="meta">{fmtDate(p.createdAt)}</span></div>
              <div style={{ font: "800 20px/1.15 var(--font)" }}>{PROPOSAL_KIND_LABEL[p.kind]} a <Link href={`/peleadores/${p.to.slug}`}>{publicFighterName(p.to)}</Link></div>
              <div className="meta">{detalle(p)}</div>
              {p.reply && <p style={{ margin: 0 }}><strong>Su respuesta:</strong> {p.reply}</p>}
              {p.status === "ACCEPTED" && p.to.user && <p className="mut" style={{ margin: 0 }}>Para concretarlo, escribe a <a href={`mailto:${p.to.user.email}`}>{p.to.user.email}</a>.{p.kind === "FIGHT" ? " Cuando se celebre, regístralo en tu ficha para que cuente en el récord." : ""}</p>}
              {puedeCancelarPropuesta(p.status) && (
                <form action={cancelProposal} style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <input type="hidden" name="proposalId" value={p.id} />
                  <button className="secondary" aria-label={`Cancelar la propuesta a ${publicFighterName(p.to)}`}>Cancelar la propuesta</button>
                </form>
              )}
            </article>
          ))}
        </> },
      ]} />
    </div>
  );
}
