import Link from "next/link";
import { requireAdmin } from "../../../lib/accounts/permissions";
import { db } from "../../../lib/common/db";
import { fmtDate } from "../../../lib/common/labels";
import { decidirVeladaPasada } from "../../actions/moderation";

export const metadata = { title: "Autorizar veladas pasadas · Moderación" };
export const dynamic = "force-dynamic";

export default async function PastEventsQueue() {
  await requireAdmin();
  const events = await db.event.findMany({ where: { status: "PENDING_AUTHORIZATION" }, include: { organizer: { select: { name: true, email: true, organizerRequest: { select: { orgName: true } } } }, _count: { select: { bouts: true } } }, orderBy: [{ date: "asc" }, { id: "asc" }] });
  return <>
    <p><Link href="/moderacion">← Volver a moderación</Link></p>
    <h1>Veladas pasadas pendientes de autorización ({events.length})</h1>
    <p>Hasta que se autoricen, estas veladas y sus combates no son públicos ni cuentan en récords o ránquines. La nota de cada decisión queda en el historial y se envía al organizador por correo.</p>
    {events.length === 0 ? <p className="mut">No hay veladas pendientes.</p> : <div className="grid">
      {events.map((event) => <section className="card" key={event.id} aria-labelledby={`velada-${event.id}`}>
        <h2 id={`velada-${event.id}`}>{event.name}</h2>
        <p>{fmtDate(event.date)} · {event.venue}, {event.city} ({event.province}) · {event._count.bouts} combates</p>
        <p className="mut">Organizador: {event.organizer?.organizerRequest?.orgName ?? event.organizer?.name ?? "Sin organizador"} · {event.organizer?.email}</p>
        <Link href={`/organizador/${event.slug}`}>Revisar ficha y cartel</Link>
        <form action={decidirVeladaPasada} className="search" style={{ marginTop: 12 }}>
          <input type="hidden" name="eventId" value={event.id} />
          <label className="field" style={{ flexBasis: "100%" }}><span>Nota para el organizador (obligatoria)</span><textarea name="note" maxLength={500} required /></label>
          <button name="decision" value="approve">Autorizar y publicar</button>
          <button name="decision" value="reject" className="secondary">Rechazar</button>
        </form>
      </section>)}
    </div>}
  </>;
}
