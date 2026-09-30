import Link from "next/link";
import { db } from "../../lib/db";

export const metadata = { title: "Buscar" };
export const dynamic = "force-dynamic";

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const c = { contains: q, mode: "insensitive" as const };
  const [fighters, gyms, trainers, events] = q
    ? await Promise.all([
        db.fighter.findMany({ where: { listed: true, hiddenAt: null, OR: [{ firstName: c }, { lastName: c }, { alias: c }] }, take: 20 }),
        db.gym.findMany({ where: { OR: [{ name: c }, { city: c }] }, take: 20 }),
        db.trainer.findMany({ where: { name: c }, take: 20 }),
        db.event.findMany({ where: { OR: [{ name: c }, { city: c }, { venue: c }] }, orderBy: { date: "desc" }, take: 20 }),
      ])
    : [[], [], [], []];
  return (
    <>
      <h1>Buscar</h1>
      <form className="search"><input name="q" defaultValue={q} style={{ flex: 1 }} /><button>Buscar</button></form>
      {q && <>
        <h2>Peleadores</h2><ul>{fighters.map((b) => <li key={b.id}><Link href={`/peleadores/${b.slug}`}>{b.firstName} {b.lastName}{b.alias ? ` “${b.alias}”` : ""}</Link></li>)}</ul>
        <h2>Gimnasios</h2><ul>{gyms.map((g) => <li key={g.id}><Link href={`/gimnasios/${g.slug}`}>{g.name} — {g.city}</Link></li>)}</ul>
        <h2>Entrenadores</h2><ul>{trainers.map((t) => <li key={t.id}><Link href={`/entrenadores/${t.slug}`}>{t.name}</Link></li>)}</ul>
        <h2>Veladas</h2><ul>{events.map((e) => <li key={e.id}><Link href={`/veladas/${e.slug}`}>{e.name} — {e.city}</Link></li>)}</ul>
      </>}
    </>
  );
}
