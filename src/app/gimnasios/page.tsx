import Link from "next/link";
import { db } from "../../lib/db";
import { PROVINCES } from "../../lib/labels";

export const metadata = { title: "Gimnasios" };
export const dynamic = "force-dynamic";

export default async function Gyms({ searchParams }: { searchParams: Promise<{ q?: string; province?: string }> }) {
  const { q, province } = await searchParams;
  const gyms = await db.gym.findMany({
    where: { ...(province && { province }), ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }] }) },
    orderBy: { name: "asc" }, take: 100, include: { _count: { select: { boxers: true } } },
  });
  return (
    <>
      <h1>Gimnasios</h1>
      <form className="search">
        <input name="q" defaultValue={q} placeholder="Nombre o ciudad" />
        <select name="province" defaultValue={province ?? ""}><option value="">Todas las provincias</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
        <button>Filtrar</button>
      </form>
      <div className="grid">
        {gyms.map((g) => (
          <Link key={g.id} href={`/gimnasios/${g.slug}`} className="card"><strong>{g.name}</strong><div className="mut">{g.city} ({g.province}) · {g._count.boxers} boxeadores</div></Link>
        ))}
      </div>
      {gyms.length === 0 && <p className="mut">Sin resultados.</p>}
    </>
  );
}
