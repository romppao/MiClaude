import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "../../../../lib/common/db";
import { getUser } from "../../../../lib/accounts/auth";
import { todayMadrid } from "../../../../lib/common/dates";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../../../lib/common/disciplines";
import { publicFighterName } from "../../../../lib/common/names";
import { PROPOSAL_MESSAGE_MAX, PROPOSAL_PLACE_MAX, PROPOSAL_DAYS_AHEAD, parseProposalKind } from "../../../../lib/fighters/proposals";
import { proposeFight } from "../../../actions/proposals";

export const metadata: Metadata = { title: "Retar o proponer sparring", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Retar a combate o proponer un sparring a un peleador (propuesta n.º 1 del diseño v3). Una sola pantalla con pocas decisiones: el tipo,
 * la disciplina (las del rival) y, si se quiere, una fecha, un lugar y un mensaje.
 */
export default async function Proponer({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tipo?: string }> }) {
  const { slug } = await params;
  const rival = await db.fighter.findUnique({ where: { slug }, include: { disciplines: true } });
  if (!rival || rival.hiddenAt || !rival.listed) notFound();
  const user = await getUser();
  const nombre = publicFighterName(rival);
  const tipo = parseProposalKind((await searchParams).tipo ?? "") ?? "FIGHT";
  const disciplinas = DISCIPLINE_ORDER.filter((d) => rival.disciplines.some((x) => x.discipline === d));
  const comun = user?.fighter ? (await db.fighterDiscipline.findMany({ where: { fighterId: user.fighter.id }, select: { discipline: true } })).map((d) => d.discipline).find((d) => disciplinas.includes(d)) : undefined;
  const hoy = todayMadrid();
  const ultimo = new Date(Date.parse(`${hoy}T00:00:00Z`) + PROPOSAL_DAYS_AHEAD * 864e5).toISOString().slice(0, 10);
  return (
    <div className="pantalla" style={{ gap: 18, maxWidth: 640 }}>
      <div><h1>Retar o proponer sparring</h1><p className="lead" style={{ fontSize: 16 }}>A <Link href={`/peleadores/${rival.slug}`}>{nombre}</Link>. Le llegará un correo y te responderá aquí.</p></div>
      {!user ? (
        <div className="tarjeta"><p style={{ margin: 0 }}>Para retar o proponer un sparring necesitas una cuenta de peleador.</p><Link className="btn btn-grande" href={`/entrar?next=${encodeURIComponent(`/peleadores/${rival.slug}/proponer`)}`}>Entrar</Link><Link className="btn secondary" href="/registro?tipo=peleador">Crear mi cuenta de peleador</Link></div>
      ) : !user.emailVerifiedAt ? (
        <div className="notice notice-bad"><span aria-hidden="true">⚠ </span>Primero <Link href="/verificar">confirma tu correo electrónico</Link>.</div>
      ) : !user.fighter ? (
        <div className="notice notice-bad"><span aria-hidden="true">⚠ </span>Para retar o proponer un sparring necesitas tu ficha de peleador. <Link href="/mi-ficha">Crear o reclamar mi ficha</Link></div>
      ) : user.fighter.id === rival.id ? (
        <p className="mut">Esta es tu ficha. Busca a otro peleador en <Link href="/propuestas#proponer">Mis propuestas</Link>.</p>
      ) : !rival.userId ? (
        <div className="notice"><span aria-hidden="true">ℹ </span>Esta ficha todavía no la ha reclamado su peleador, así que nadie podría responder. Cuando la reclame, podrás enviarle tu propuesta.</div>
      ) : (
        <form action={proposeFight} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <input type="hidden" name="toId" value={rival.id} />
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="leyenda">¿Qué le propones?</legend>
            <div className="segmentos">
              <label><input type="radio" name="kind" value="FIGHT" defaultChecked={tipo === "FIGHT"} required />Reto a combate</label>
              <label><input type="radio" name="kind" value="SPARRING" defaultChecked={tipo === "SPARRING"} />Sparring</label>
            </div>
          </fieldset>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="leyenda">Disciplina</legend>
            <div className="chips">{disciplinas.map((d) => <label key={d} className="chip"><input type="radio" name="discipline" value={d} defaultChecked={d === (comun ?? disciplinas[0])} required />{DISCIPLINE_LABEL[d]}</label>)}</div>
          </fieldset>
          <label className="field"><span>Fecha (opcional)</span><input type="date" name="day" min={hoy} max={ultimo} /><span className="hint">Déjala en blanco si preferís acordarla después.</span></label>
          <label className="field"><span>Dónde (opcional)</span><input name="place" maxLength={PROPOSAL_PLACE_MAX} placeholder="Gimnasio o ciudad" /></label>
          <label className="field"><span>Mensaje (opcional)</span><textarea name="message" maxLength={PROPOSAL_MESSAGE_MAX} rows={2} placeholder="Peso, asaltos, nivel…" /></label>
          <p className="mut" style={{ margin: 0 }}>{nombre} verá tu nombre, tu ficha y lo que escribas; si acepta, podréis escribiros por correo. Aceptar un reto no crea el combate: cuando se celebre, se registra para que cuente en el récord. Ring España no organiza ni supervisa los sparrings: entrenad siempre en un gimnasio y con un entrenador.</p>
          <button className="btn-grande">Enviar la propuesta</button>
        </form>
      )}
    </div>
  );
}
