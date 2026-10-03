import ProfileThumbnail from "./components/ProfileThumbnail";
import Link from "next/link";
import { db } from "../lib/common/db";
import { LEVEL_LABEL, fmtDate } from "../lib/common/labels";
import { auraRanking } from "../lib/aura/ranking";
import { divisionLabel } from "../lib/common/competition";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, weightClassLabel } from "../lib/common/disciplines";
import { getUser } from "../lib/accounts/auth";
import { plural } from "../lib/common/text";
import { calendarDayStart } from "../lib/common/dates";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUser();
  const [events, fighters, counts, topGroups] = await Promise.all([
    db.event.findMany({ where: { date: { gte: calendarDayStart() }, status: "SCHEDULED" }, orderBy: [{ date: "asc" }, { id: "asc" }], take: 6 }),
    db.fighter.findMany({ where: { listed: true, hiddenAt: null }, orderBy: { createdAt: "desc" }, take: 6, include: { gym: true, disciplines: true } }),
    Promise.all([db.fighter.count({ where: { listed: true, hiddenAt: null } }), db.event.count(), db.gym.count(), db.aura.count()]),
    auraRanking(),
  ]);
  const top = topGroups.flatMap((g) => g.entries.map((e) => ({ ...e, discipline: g.discipline, category: `${divisionLabel(g.divisionId)}${g.weightClass ? ` · ${weightClassLabel(g.discipline, g.level, g.weightClass, g.divisionId)}` : ""}` }))).sort((a, b) => b.aura - a.aura || a.name.localeCompare(b.name, "es")).slice(0, 5);
  return (
    <>
      <section className="home-hero">
        <h1>Tu deporte.<br />Tu gente.</h1>
        <p>Tu comunidad de deportes de contacto en toda España</p>
        <Link href="/peleadores" className="btn">Explorar peleadores</Link>
        <p className="sr-only">Imagen ilustrativa con personas ficticias.</p>
      </section>
      <div className="discipline-strip">{DISCIPLINE_ORDER.map(d => <Link key={d} href={`/peleadores?disciplina=${d}`}>{DISCIPLINE_LABEL[d]}</Link>)}</div>
      <section className="community-discovery">
        <h2>Descubre tu comunidad</h2>
        <p className="mut">Encuentra peleadores, gimnasios y veladas de boxeo, jiu-jitsu, K-1, kickboxing, MMA y Muay Thai. Comparte tu trayectoria y reconoce las actuaciones que has visto, tanto en el deporte amateur como en el profesional.</p>
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
          {DISCIPLINE_ORDER.map((d) => <Link key={d} href={`/peleadores?disciplina=${d}`} className="card" style={{ padding: "10px 14px", fontWeight: 500 }}>{DISCIPLINE_LABEL[d]}</Link>)}
        </div>
        <p className="mut">{plural(counts[0], "peleador", "peleadores")} · {plural(counts[1], "velada", "veladas")} · {plural(counts[2], "gimnasio", "gimnasios")} · {plural(counts[3], "aura dada", "auras dadas")}. El aura es el reconocimiento del público a un peleador por su actuación en un combate: <Link href="/ayuda">cómo funciona</Link>.</p>
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
      <h2>Actuaciones reconocidas por la comunidad</h2>
      <div className="grid">
        {top.map((t) => <Link key={`${t.fighterId}-${t.discipline}-${t.level}-${t.divisionId ?? ""}-${t.weightClass ?? ""}`} href={`/peleadores/${t.slug}`} className="card"><strong>{t.name}</strong><div className="mut">{DISCIPLINE_LABEL[t.discipline]} · {LEVEL_LABEL[t.level]} · {t.aura} de aura{t.category ? ` · ${t.category}` : ""}</div></Link>)}
        {top.length === 0 && <p className="mut">Todavía no hay actuaciones con aura. Sé la primera persona en darla a un peleador tras verlo competir.</p>}
      </div>
      <p><Link href="/ranking">Ver el ránking completo</Link></p>
      <h2>Veladas de hoy y próximas</h2>
      <p className="mut">Consulta eventos de todas las disciplinas y provincias. Las veladas de hoy permanecen aquí durante todo el día.</p>
      <div className="grid">
        {events.map((e) => (
          <Link key={e.id} href={`/veladas/${e.slug}`} className="card">
            <span className={`tag ${e.level}`}>{DISCIPLINE_LABEL[e.discipline]} · {LEVEL_LABEL[e.level]}</span>
            <strong>{e.name}</strong>
            <div className="mut">{fmtDate(e.date)}<br />{e.venue}, {e.city}</div>
          </Link>
        ))}
        {events.length === 0 && <p className="mut">No hay veladas programadas. <Link href="/veladas">Ver todo el calendario</Link></p>}
      </div>
      <h2>Peleadores recientes</h2>
      <div className="grid">
        {fighters.map((b) => (
          <Link key={b.id} href={`/peleadores/${b.slug}`} className="card">
            <ProfileThumbnail kind="peleador" id={b.id} name={`${b.firstName} ${b.lastName}`}/><strong>{b.firstName} {b.lastName}</strong><div>{b.disciplines.map(d => <span key={d.discipline} className={`tag ${d.level}`}>{DISCIPLINE_LABEL[d.discipline]} · {LEVEL_LABEL[d.level]}</span>)}</div>
            <div className="mut">{b.alias ? `“${b.alias}” · ` : ""}{b.city ?? ""}{b.gym ? ` · ${b.gym.name}` : ""}</div>
          </Link>
        ))}
        {fighters.length === 0 && <p className="mut">Todavía no hay fichas públicas de peleadores. <Link href="/registro">Crea tu cuenta</Link> para compartir tu trayectoria.</p>}
      </div>
    </>
  );
}
