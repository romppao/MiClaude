import Link from "next/link";
import type { Metadata } from "next";
import { db } from "../../lib/common/db";
import { requireUser } from "../../lib/accounts/auth";
import { EVENT_KIND_LABEL, fmtDate } from "../../lib/common/labels";
import { DISCIPLINE_LABEL, categoryLabel } from "../../lib/common/disciplines";
import { REG_STATUS_LABEL, puedeRetirarInscripcion } from "../../lib/events/registrations";
import { withdrawRegistration } from "../actions/registrations";

export const metadata: Metadata = { title: "Mis inscripciones", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const PILDORA = { PENDING: "pildora-violeta", ACCEPTED: "pildora-acc", DECLINED: "", WITHDRAWN: "" } as const;

/** Las veladas e interclubs en los que el peleador ha pedido participar, con la respuesta del organizador. */
export default async function MisInscripciones() {
  const user = await requireUser("/mis-inscripciones");
  const me = user.fighter;
  const lista = me ? await db.eventRegistration.findMany({ where: { fighterId: me.id }, orderBy: [{ event: { date: "asc" } }, { id: "asc" }], take: 100, include: { event: true } }) : [];
  return (
    <div className="pantalla" style={{ gap: 14 }}>
      <div><h1>Mis inscripciones</h1><p className="lead" style={{ fontSize: 16 }}>Las veladas e interclubs en los que has pedido participar y lo que ha respondido cada organizador.</p></div>
      <Link className="btn" href="/veladas?inscripcion=abierta" style={{ alignSelf: "flex-start" }}>Ver eventos con inscripción abierta</Link>
      {!me && <p className="notice notice-bad"><span aria-hidden="true">⚠ </span>Para pedir participar necesitas tu ficha de peleador. <Link href="/mi-ficha">Crear o reclamar mi ficha</Link></p>}
      {me && lista.length === 0 && <p className="mut" style={{ margin: 0 }}>Todavía no has pedido participar en ningún evento.</p>}
      {lista.map((r) => (
        <section key={r.id} className="tarjeta" aria-label={`${r.event.name}: ${REG_STATUS_LABEL[r.status]}`}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><span className={`pildora ${PILDORA[r.status]}`}>{REG_STATUS_LABEL[r.status]}</span><span className="meta">{fmtDate(r.event.date)}</span></div>
          <h2 style={{ margin: 0, font: "700 19px/1.2 var(--font)" }}><Link href={`/veladas/${r.event.slug}`}>{r.event.name}</Link></h2>
          <div className="meta">{EVENT_KIND_LABEL[r.event.kind]} · {DISCIPLINE_LABEL[r.event.discipline]} · {r.event.city} · {categoryLabel(r.event.discipline, r.event.level, r.divisionId, r.weightClass)}</div>
          {r.reply && <p style={{ margin: 0 }}><strong>Mensaje del organizador:</strong> {r.reply}</p>}
          {puedeRetirarInscripcion(r.status) && (
            <form action={withdrawRegistration} style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
              <input type="hidden" name="registrationId" value={r.id} />
              <button className="secondary" aria-label={`Retirar mi solicitud para ${r.event.name}`}>Retirar mi solicitud</button>
            </form>
          )}
        </section>
      ))}
    </div>
  );
}
