import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "../../lib/db";
import { searchIds } from "../../lib/search";
import { flatParams } from "../../lib/safe";
import { pageNumber, pageWindow } from "../../lib/pagination";
import Paginacion from "../Paginacion";
import { BotonesFiltro, CampoFiltro } from "../Filtros";
import { plural } from "../../lib/text";
import { LEVEL_LABEL, PROVINCES, fmtDate } from "../../lib/labels";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, isDiscipline } from "../../lib/disciplines";

export const metadata = { title: "Calendario de veladas" };
export const dynamic = "force-dynamic";

export default async function Events({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { level, province, past, q, disciplina, pagina } = flatParams(await searchParams);
  const ids = await searchIds("event", q);
  const now = new Date();
  const where: Prisma.EventWhereInput = {
    date: past ? { lt: now } : { gte: new Date(now.getTime() - 864e5) },
    ...(level === "PRO" || level === "AMATEUR" ? { level } : {}),
    ...(province && { province }),
    ...(disciplina && isDiscipline(disciplina) ? { discipline: disciplina } : {}),
    ...(ids && { id: { in: ids } }),
  };
  const total = await db.event.count({ where });
  const w = pageWindow(total, pageNumber(pagina));
  const events = await db.event.findMany({ where, orderBy: [{ date: past ? "desc" : "asc" }, { id: "asc" }], skip: w.skip, take: w.take, include: { _count: { select: { bouts: { where: { verification: { not: "DISPUTED" } } } } } } });
  return (
    <>
      <h1>Calendario de veladas</h1>
      <form className="search" role="search">
        <CampoFiltro etiqueta="Velada, ciudad o recinto"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <CampoFiltro etiqueta="Disciplina"><select name="disciplina" defaultValue={disciplina ?? ""}><option value="">Todas las disciplinas</option>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Nivel"><select name="level" defaultValue={level ?? ""}><option value="">Profesional y amateur</option>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Provincia"><select name="province" defaultValue={province ?? ""}><option value="">Toda España</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Cuándo"><select name="past" defaultValue={past ?? ""}><option value="">Próximas</option><option value="1">Ya celebradas</option></select></CampoFiltro>
        <BotonesFiltro ruta="/veladas" />
      </form>
      <div className="grid">
        {events.map((e) => (
          <Link key={e.id} href={`/veladas/${e.slug}`} className="card">
            <span className="tag">{DISCIPLINE_LABEL[e.discipline]}</span><span className={`tag ${e.level}`}>{LEVEL_LABEL[e.level]}</span>
            {e.status === "CANCELLED" && <span className="tag">Cancelada</span>}
            <strong>{e.name}</strong>
            <div className="mut">{fmtDate(e.date)}<br />{e.venue}, {e.city} ({e.province})<br />{plural(e._count.bouts, "combate", "combates")}</div>
          </Link>
        ))}
      </div>
      {events.length === 0 && <p className="mut">No hay veladas con esos filtros. Prueba a quitar alguno, o a mirar las pasadas.</p>}
      <Paginacion ruta="/veladas" params={{ q, disciplina, level, province, past }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["velada", "veladas"]} />
    </>
  );
}
