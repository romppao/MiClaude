import Link from "next/link";
import { db } from "../../lib/db";
import { searchIds } from "../../lib/search";
import { flatParams } from "../../lib/safe";
import { pageNumber, pageWindow } from "../../lib/pagination";
import Paginacion from "../Paginacion";
import { BotonesFiltro, CampoFiltro } from "../Filtros";

export const metadata = { title: "Entrenadores" };
export const dynamic = "force-dynamic";

export default async function Trainers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q, pagina } = flatParams(await searchParams);
  const ids = await searchIds("trainer", q);
  const where = ids ? { id: { in: ids } } : {};
  const total = await db.trainer.count({ where });
  const w = pageWindow(total, pageNumber(pagina));
  const trainers = await db.trainer.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: w.skip, take: w.take, include: { gym: true, _count: { select: { fighters: true } } } });
  return (
    <>
      <h1>Entrenadores</h1>
      <form className="search" role="search">
        <CampoFiltro etiqueta="Nombre del entrenador"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <BotonesFiltro ruta="/entrenadores" />
      </form>
      <div className="grid">
        {trainers.map((t) => <Link key={t.id} href={`/entrenadores/${t.slug}`} className="card"><strong>{t.name}</strong><div className="mut">{t.gym?.name ?? "Independiente"} · {t._count.fighters} peleadores</div></Link>)}
      </div>
      {trainers.length === 0 && <p className="mut">{q ? "No hay entrenadores con ese nombre. Prueba a escribir solo una parte." : "Todavía no hay entrenadores registrados en Ring España."}</p>}
      <Paginacion ruta="/entrenadores" params={{ q }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["entrenador", "entrenadores"]} />
    </>
  );
}
