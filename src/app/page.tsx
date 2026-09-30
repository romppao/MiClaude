import Link from "next/link";
import { db } from "../lib/db";
import { LEVEL_LABEL, fmtDate } from "../lib/labels";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../lib/disciplines";

export const dynamic = "force-dynamic";

// Plaza inicial de lanzamiento. Cambiar aquí (o parametrizar) al expandirse a otras provincias.
const HOME_PROVINCE = "Madrid";

export default async function Home() {
  const [events, fighters, counts, top] = await Promise.all([
    db.event.findMany({ where: { date: { gte: new Date() }, status: "SCHEDULED", level: "AMATEUR", province: HOME_PROVINCE }, orderBy: { date: "asc" }, take: 6 }),
    db.fighter.findMany({ where: { level: "AMATEUR", province: HOME_PROVINCE }, orderBy: { createdAt: "desc" }, take: 6, include: { gym: true } }),
    Promise.all([db.fighter.count({ where: { level: "AMATEUR" } }), db.event.count(), db.gym.count(), db.rating.count()]),
    db.rating.groupBy({ by: ["fighterId"], _avg: { score: true }, _count: { _all: true }, where: { fighter: { level: "AMATEUR", province: HOME_PROVINCE } }, orderBy: { _avg: { score: "desc" } }, take: 5 }),
  ]);
  const topFighters = await db.fighter.findMany({ where: { id: { in: top.map((t) => t.fighterId) } } });
  return (
    <>
      <section className="hero">
        <h1>Descubre los deportes de contacto amateur de {HOME_PROVINCE}</h1>
        <p className="mut">Boxeo, MMA, kickboxing, K-1 y jiu-jitsu en un mismo lugar. Registra tu récord, valora a quien has visto pelear y encuentra las próximas veladas. Los campeones del futuro empiezan aquí.</p>
        <form className="search" action="/buscar"><input name="q" placeholder="Busca un peleador, gimnasio, entrenador…" style={{ flex: 1 }} /><button>Buscar</button></form>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
          {DISCIPLINE_ORDER.map((d) => <Link key={d} href={`/peleadores?disciplina=${d}`} className="card" style={{ padding: "8px 14px", fontWeight: d === "BOXEO" ? 800 : 500 }}>{DISCIPLINE_LABEL[d]}</Link>)}
        </div>
        <p className="mut">{counts[0]} peleadores amateur · {counts[1]} veladas · {counts[2]} gimnasios · {counts[3]} valoraciones</p>
      </section>
      <h2>Mejor valorados por el público <Link href="/ranking" className="mut" style={{ fontSize: ".9rem" }}>ver ránking</Link></h2>
      <div className="grid">
        {top.map((t) => {
          const b = topFighters.find((x) => x.id === t.fighterId)!;
          return <Link key={b.id} href={`/peleadores/${b.slug}`} className="card"><strong>{b.firstName} {b.lastName}</strong><div className="mut">{(t._avg.score ?? 0).toFixed(1)} ★ · {t._count._all} votos</div></Link>;
        })}
        {top.length === 0 && <p className="mut">Sé el primero en valorar a un peleador.</p>}
      </div>
      <h2>Próximas veladas amateur</h2>
      <div className="grid">
        {events.map((e) => (
          <Link key={e.id} href={`/veladas/${e.slug}`} className="card">
            <span className={`tag ${e.level}`}>{LEVEL_LABEL[e.level]}</span>
            <strong>{e.name}</strong>
            <div className="mut">{fmtDate(e.date)}<br />{e.venue}, {e.city}</div>
          </Link>
        ))}
        {events.length === 0 && <p className="mut">No hay veladas amateur programadas. <Link href="/veladas">Ver todo el calendario</Link></p>}
      </div>
      <h2>Peleadores amateur recientes</h2>
      <div className="grid">
        {fighters.map((b) => (
          <Link key={b.id} href={`/peleadores/${b.slug}`} className="card">
            <strong>{b.firstName} {b.lastName}</strong>
            <div className="mut">{b.alias ? `“${b.alias}” · ` : ""}{b.city ?? ""}{b.gym ? ` · ${b.gym.name}` : ""}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
