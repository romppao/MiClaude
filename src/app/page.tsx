import Link from "next/link";
import { db } from "../lib/common/db";
import { LEVEL_LABEL, fmtDate } from "../lib/common/labels";
import { auraRanking } from "../lib/aura/ranking";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, weightClassLabel } from "../lib/common/disciplines";
import { getUser } from "../lib/accounts/auth";
import { plural } from "../lib/common/text";
import { calendarDayStart } from "../lib/common/dates";

export const dynamic = "force-dynamic";

// Plaza inicial de lanzamiento. Cambiar aquí (o parametrizar) al expandirse a otras provincias.
const HOME_PROVINCE = "Madrid";

export default async function Home() {
  const user = await getUser();
  const [events, fighters, counts, topGroups] = await Promise.all([
    db.event.findMany({ where: { date: { gte: calendarDayStart() }, status: "SCHEDULED", level: "AMATEUR", province: HOME_PROVINCE }, orderBy: { date: "asc" }, take: 6 }),
    db.fighter.findMany({ where: { level: "AMATEUR", province: HOME_PROVINCE, listed: true, hiddenAt: null }, orderBy: { createdAt: "desc" }, take: 6, include: { gym: true } }),
    Promise.all([db.fighter.count({ where: { level: "AMATEUR", listed: true, hiddenAt: null } }), db.event.count(), db.gym.count(), db.aura.count()]),
    auraRanking({ discipline: "BOXEO", level: "AMATEUR", province: HOME_PROVINCE }), // el boxeo va en cabeza
  ]);
  const top = topGroups.flatMap((g) => g.entries.map((e) => ({ ...e, category: g.weightClass ? weightClassLabel("BOXEO", g.level, g.weightClass) : null }))).sort((a, b) => b.aura - a.aura).slice(0, 5);
  return (
    <>
      <section className="hero">
        <h1>Descubre los deportes de contacto amateur de {HOME_PROVINCE}</h1>
        <p className="mut">Boxeo, MMA, Muay Thai, kickboxing, K-1 y jiu-jitsu en un mismo lugar. Registra tu récord, da aura a quien has visto pelear y encuentra las próximas veladas. Los campeones del futuro empiezan aquí.</p>
        <p className="mut">Puedes consultar las fichas, las veladas y los gimnasios sin crear una cuenta.</p>
        {!user && (
          <p className="acciones">
            <Link href="/registro" className="btn">Crear mi cuenta</Link>
            <Link href="/ayuda" className="btn secondary">Ver cómo funciona</Link>
          </p>
        )}
        <form className="search" action="/buscar" role="search" aria-label="Buscar en Ring España">
          <label className="field" style={{ flex: 1 }}><span>Busca un peleador, un gimnasio, un entrenador o una velada</span><input name="q" maxLength={80} /></label>
          <button className="secondary">Buscar</button>
        </form>
        <p style={{ margin: "8px 0 4px", fontWeight: 700 }}>O elige una disciplina</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 8px" }}>
          {DISCIPLINE_ORDER.map((d) => <Link key={d} href={`/peleadores?disciplina=${d}`} className="card" style={{ padding: "10px 14px", fontWeight: d === "BOXEO" ? 800 : 500 }}>{DISCIPLINE_LABEL[d]}</Link>)}
        </div>
        <p className="mut">{plural(counts[0], "peleador amateur", "peleadores amateur")} · {plural(counts[1], "velada", "veladas")} · {plural(counts[2], "gimnasio", "gimnasios")} · {plural(counts[3], "aura dada", "auras dadas")}. El aura es el reconocimiento del público a un peleador por su actuación en un combate: <Link href="/ayuda">cómo funciona</Link>.</p>
      </section>
      <section aria-labelledby="empezar">
        <h2 id="empezar">¿Qué quieres hacer?</h2>
        <ul>
          <li><Link href="/peleadores">Encontrar un peleador</Link>: consulta su récord y los combates que lo respaldan.</li>
          <li><Link href="/gimnasios">Encontrar dónde entrenar</Link>: consulta los gimnasios y sus entrenadores.</li>
          <li><Link href="/veladas">Ver veladas y resultados</Link>: encuentra el cartel y los combates de cada evento.</li>
          <li><Link href="/mi-ficha">Crear o gestionar mi ficha de peleador</Link>: busca primero si ya existe y registra tus combates.</li>
          <li><Link href="/organizador">Organizar una velada</Link>: solicita acceso para gestionar el cartel y los resultados.</li>
        </ul>
      </section>
      <h2>Más aura en boxeo</h2>
      <div className="grid">
        {top.map((t) => <Link key={t.fighterId} href={`/peleadores/${t.slug}`} className="card"><strong>{t.name}</strong><div className="mut">{t.aura} de aura{t.category ? ` · ${t.category}` : ""}</div></Link>)}
        {top.length === 0 && <p className="mut">Todavía no hay aura en {HOME_PROVINCE}. Sé la primera persona en darla a un peleador tras verlo competir.</p>}
      </div>
      <p><Link href="/ranking">Ver el ránking completo</Link></p>
      <h2>Veladas amateur de hoy y próximas</h2>
      <p className="mut">En {HOME_PROVINCE}. Las veladas de hoy permanecen aquí durante todo el día.</p>
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
        {fighters.length === 0 && <p className="mut">Todavía no hay peleadores amateur en {HOME_PROVINCE}. <Link href="/registro">Crea tu cuenta</Link> y sé el primero.</p>}
      </div>
    </>
  );
}
