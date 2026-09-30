import Link from "next/link";
import { db } from "../lib/db";
import { LEVEL_LABEL, fmtDate } from "../lib/labels";
import { auraRanking } from "../lib/aura";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../lib/disciplines";

export const dynamic = "force-dynamic";

// Plaza inicial de lanzamiento. Cambiar aquí (o parametrizar) al expandirse a otras provincias.
const HOME_PROVINCE = "Madrid";

export default async function Home() {
  const [events, fighters, counts, topGroups] = await Promise.all([
    db.event.findMany({ where: { date: { gte: new Date() }, status: "SCHEDULED", level: "AMATEUR", province: HOME_PROVINCE }, orderBy: { date: "asc" }, take: 6 }),
    db.fighter.findMany({ where: { level: "AMATEUR", province: HOME_PROVINCE }, orderBy: { createdAt: "desc" }, take: 6, include: { gym: true } }),
    Promise.all([db.fighter.count({ where: { level: "AMATEUR" } }), db.event.count(), db.gym.count(), db.aura.count()]),
    auraRanking({ discipline: "BOXEO", province: HOME_PROVINCE }), // el boxeo va en cabeza
  ]);
  const top = topGroups.flatMap((g) => g.entries.map((e) => ({ ...e, category: g.weightClass }))).sort((a, b) => b.aura - a.aura).slice(0, 5);
  return (
    <>
      <section className="hero">
        <h1>Descubre los deportes de contacto amateur de {HOME_PROVINCE}</h1>
        <p className="mut">Boxeo, MMA, kickboxing, K-1 y jiu-jitsu en un mismo lugar. Registra tu récord, da aura a quien has visto pelear y encuentra las próximas veladas. Los campeones del futuro empiezan aquí.</p>
        <form className="search" action="/buscar"><input name="q" placeholder="Busca un peleador, gimnasio, entrenador…" style={{ flex: 1 }} /><button>Buscar</button></form>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
          {DISCIPLINE_ORDER.map((d) => <Link key={d} href={`/peleadores?disciplina=${d}`} className="card" style={{ padding: "8px 14px", fontWeight: d === "BOXEO" ? 800 : 500 }}>{DISCIPLINE_LABEL[d]}</Link>)}
        </div>
        <p className="mut">{counts[0]} peleadores amateur · {counts[1]} veladas · {counts[2]} gimnasios · {counts[3]} auras dadas</p>
      </section>
      <h2>Más aura en boxeo <Link href="/ranking" className="mut" style={{ fontSize: ".9rem" }}>ver ránking</Link></h2>
      <div className="grid">
        {top.map((t) => <Link key={t.fighterId} href={`/peleadores/${t.slug}`} className="card"><strong>{t.name}</strong><div className="mut">{t.aura} de aura{t.category ? ` · ${t.category}` : ""}</div></Link>)}
        {top.length === 0 && <p className="mut">Todavía no hay aura en {HOME_PROVINCE}. Sé la primera persona en darla a un peleador tras verlo competir.</p>}
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
