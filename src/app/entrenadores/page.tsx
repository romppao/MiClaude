import Link from "next/link";
import { db } from "../../lib/db";

export const metadata = { title: "Entrenadores" };
export const dynamic = "force-dynamic";

export default async function Trainers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const trainers = await db.trainer.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    orderBy: { name: "asc" }, take: 100, include: { gym: true, _count: { select: { boxers: true } } },
  });
  return (
    <>
      <h1>Entrenadores</h1>
      <form className="search"><input name="q" defaultValue={q} placeholder="Nombre" /><button>Buscar</button></form>
      <div className="grid">
        {trainers.map((t) => <Link key={t.id} href={`/entrenadores/${t.slug}`} className="card"><strong>{t.name}</strong><div className="mut">{t.gym?.name ?? "Independiente"} · {t._count.boxers} boxeadores</div></Link>)}
      </div>
      {trainers.length === 0 && <p className="mut">Sin resultados.</p>}
    </>
  );
}
