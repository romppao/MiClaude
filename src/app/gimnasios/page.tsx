import Link from "next/link";
import { db } from "../../lib/db";
import { searchIds } from "../../lib/search";
import { flatParams } from "../../lib/safe";
import { pageNumber, pageWindow } from "../../lib/pagination";
import Paginacion from "../Paginacion";
import { PROVINCES } from "../../lib/labels";

export const metadata = { title: "Gimnasios" };
export const dynamic = "force-dynamic";

export default async function Gyms({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q, province, pagina } = flatParams(await searchParams);
  const ids = await searchIds("gym", q);
  const where = { ...(province && { province }), ...(ids && { id: { in: ids } }) };
  const total = await db.gym.count({ where });
  const w = pageWindow(total, pageNumber(pagina));
  const gyms = await db.gym.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: w.skip, take: w.take, include: { _count: { select: { fighters: true } } } });
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
          <Link key={g.id} href={`/gimnasios/${g.slug}`} className="card"><strong>{g.name}</strong>{g.verifiedAt && <span className="tag PRO" style={{ marginLeft: 6 }}>✓</span>}<div className="mut">{g.city} ({g.province}) · {g._count.fighters} peleadores</div></Link>
        ))}
      </div>
      {gyms.length === 0 && <p className="mut">No hay gimnasios con esos filtros. Prueba a quitar alguno o a escribir solo una parte del nombre.</p>}
      <Paginacion ruta="/gimnasios" params={{ q, province }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["gimnasio", "gimnasios"]} />
    </>
  );
}
