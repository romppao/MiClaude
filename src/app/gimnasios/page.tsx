import Link from "next/link";
import { db } from "../../lib/common/db";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import Paginacion from "../components/Paginacion";
import { BotonesFiltro, CampoFiltro } from "../components/Filtros";
import { PROVINCES } from "../../lib/common/labels";

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
      <form className="search" role="search">
        <CampoFiltro etiqueta="Nombre o ciudad"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <CampoFiltro etiqueta="Provincia"><select name="province" defaultValue={province ?? ""}><option value="">Todas las provincias</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></CampoFiltro>
        <BotonesFiltro ruta="/gimnasios" />
      </form>
      <div className="grid">
        {gyms.map((g) => (
          <Link key={g.id} href={`/gimnasios/${g.slug}`} className="card"><strong>{g.name}</strong>{g.verifiedAt && <span className="tag PRO" style={{ marginLeft: 6 }} title="Verificado por un moderador"><span aria-hidden="true">✓ </span>Verificado</span>}<div className="mut">{g.city} ({g.province}) · {g._count.fighters} peleadores</div></Link>
        ))}
      </div>
      {gyms.length === 0 && <p className="mut">No hay gimnasios con esos filtros. Prueba a quitar alguno o a escribir solo una parte del nombre.</p>}
      <Paginacion ruta="/gimnasios" params={{ q, province }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["gimnasio", "gimnasios"]} />
    </>
  );
}
