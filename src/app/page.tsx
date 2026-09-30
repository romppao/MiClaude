import Link from "next/link";
import { db } from "../lib/db";
import { LEVEL_LABEL, fmtDate } from "../lib/labels";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [events, boxers, counts] = await Promise.all([
    db.event.findMany({ where: { date: { gte: new Date() }, status: "SCHEDULED" }, orderBy: { date: "asc" }, take: 6 }),
    db.boxer.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { gym: true } }),
    Promise.all([db.boxer.count(), db.event.count(), db.gym.count(), db.trainer.count()]),
  ]);
  return (
    <>
      <section className="hero">
        <h1>El boxeo español, en un solo sitio</h1>
        <p className="mut">Récords, veladas, gimnasios y entrenadores — profesional y amateur.</p>
        <form className="search" action="/buscar"><input name="q" placeholder="Busca un boxeador, gimnasio, entrenador…" style={{ flex: 1 }} /><button>Buscar</button></form>
        <p className="mut">{counts[0]} boxeadores · {counts[1]} veladas · {counts[2]} gimnasios · {counts[3]} entrenadores</p>
      </section>
      <h2>Próximas veladas</h2>
      <div className="grid">
        {events.map((e) => (
          <Link key={e.id} href={`/veladas/${e.slug}`} className="card">
            <span className={`tag ${e.level}`}>{LEVEL_LABEL[e.level]}</span>
            <strong>{e.name}</strong>
            <div className="mut">{fmtDate(e.date)}<br />{e.venue}, {e.city}</div>
          </Link>
        ))}
        {events.length === 0 && <p className="mut">No hay veladas programadas.</p>}
      </div>
      <h2>Últimos boxeadores</h2>
      <div className="grid">
        {boxers.map((b) => (
          <Link key={b.id} href={`/boxeadores/${b.slug}`} className="card">
            <span className={`tag ${b.level}`}>{LEVEL_LABEL[b.level]}</span>
            <strong>{b.firstName} {b.lastName}</strong>
            <div className="mut">{b.alias ? `“${b.alias}” · ` : ""}{b.city ?? b.province ?? ""}{b.gym ? ` · ${b.gym.name}` : ""}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
