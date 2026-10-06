import Link from "next/link";
import { db } from "../../lib/common/db";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import Paginacion from "../components/Paginacion";
import { BotonesFiltro, CampoFiltro } from "../components/Filtros";
import { leerCacheado } from "../../lib/common/cache";

export const metadata = { title: "Entrenadores" };
export const dynamic = "force-dynamic";

export default async function Trainers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q, pagina } = flatParams(await searchParams);
  const ids = await searchIds("trainer", q);
  const where = ids ? { id: { in: ids } } : {};
  const consulta = await leerCacheado(`entrenadores:listado:${JSON.stringify({ q: q ?? null, ids: ids ?? null, pagina: pagina ?? null })}`, ["entrenadores"], 60, async () => {
    const total = await db.trainer.count({ where });
    const ventana = pageWindow(total, pageNumber(pagina));
    const trainers = await db.trainer.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: ventana.skip, take: ventana.take, select: { id: true, slug: true, name: true, gym: { select: { name: true } }, _count: { select: { fighters: true } } } });
    return { total, trainers };
  });
  const { total, trainers } = consulta;
  const w = pageWindow(total, pageNumber(pagina));
  return (
    <>
      <h1>Entrenadores</h1>
      <form className="search" role="search" aria-label="Filtrar entrenadores">
        <CampoFiltro etiqueta="Nombre del entrenador"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <BotonesFiltro ruta="/entrenadores" hayFiltros={!!q} />
      </form>
      <div className="grid">
        {trainers.map((t) => <Link key={t.id} href={`/entrenadores/${t.slug}`} className="card"><strong>{t.name}</strong><div className="mut">{t.gym?.name ?? "Independiente"} · {t._count.fighters} peleadores</div></Link>)}
      </div>
      {trainers.length === 0 && <p className="mut">{q ? "No hay entrenadores con ese nombre. Prueba a escribir solo una parte." : "Todavía no hay entrenadores registrados en Ring España."}</p>}
      <Paginacion ruta="/entrenadores" params={{ q }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["entrenador", "entrenadores"]} />
    </>
  );
}
