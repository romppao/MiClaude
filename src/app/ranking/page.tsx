import Link from "next/link";
import { db } from "../../lib/db";
import { PROVINCES } from "../../lib/labels";
import { bayesian } from "../../lib/ratings";

export const metadata = { title: "Ránking de aficionados" };
export const dynamic = "force-dynamic";

export default async function Ranking({ searchParams }: { searchParams: Promise<{ province?: string }> }) {
  const province = (await searchParams).province ?? "Madrid";
  const groups = await db.rating.groupBy({
    by: ["boxerId"], _avg: { score: true }, _count: { _all: true },
    where: { boxer: { level: "AMATEUR", ...(province !== "all" && { province }) } },
  });
  const prior = groups.length ? groups.reduce((s, g) => s + (g._avg.score ?? 0), 0) / groups.length : 3;
  const boxers = await db.boxer.findMany({ where: { id: { in: groups.map((g) => g.boxerId) } }, include: { gym: true } });
  const rows = groups
    .map((g) => ({ boxer: boxers.find((b) => b.id === g.boxerId)!, avg: g._avg.score ?? 0, n: g._count._all }))
    .map((r) => ({ ...r, rank: bayesian(r.avg, r.n, prior) }))
    .sort((a, b) => b.rank - a.rank);
  return (
    <>
      <h1>Ránking amateur — valoración del público</h1>
      <form className="search">
        <select name="province" defaultValue={province}><option value="all">Toda España</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
        <button>Filtrar</button>
      </form>
      <table>
        <thead><tr><th>#</th><th>Boxeador</th><th>Nota</th><th>Votos</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.boxer.id}>
              <td>{i + 1}</td>
              <td><Link href={`/boxeadores/${r.boxer.slug}`}>{r.boxer.firstName} {r.boxer.lastName}</Link> <span className="mut">{r.boxer.gym?.name}</span></td>
              <td>{r.avg.toFixed(2)}</td><td>{r.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="mut">Aún no hay valoraciones en esta zona.</p>}
    </>
  );
}
