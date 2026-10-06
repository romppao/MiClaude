import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import Paginacion from "../components/Paginacion";
import { BotonesFiltro, CampoFiltro, FiltrosActivos } from "../components/Filtros";
import { calendarDayStart } from "../../lib/common/dates";
import { plural } from "../../lib/common/text";
import { LEVEL_LABEL, PROVINCES, fmtDate } from "../../lib/common/labels";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, isDiscipline } from "../../lib/common/disciplines";
import { leerCacheado } from "../../lib/common/cache";

export const metadata = { title: "Calendario de veladas" };
export const dynamic = "force-dynamic";

export default async function Events({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { level, province, past, q, disciplina, pagina } = flatParams(await searchParams);
  const ids = await searchIds("event", q);
  const dayStart = calendarDayStart();
  const period = past === "1" ? "1" : past === "todas" ? "todas" : "";
  const where: Prisma.EventWhereInput = {
    // past: vacío = próximas · «1» = ya celebradas · «todas» = sin filtrar por fecha (lo usa «Ver todos» de la búsqueda, que encuentra veladas de cualquier fecha)
    ...(period === "todas" ? {} : { date: period === "1" ? { lt: dayStart } : { gte: dayStart } }),
    ...(level === "PRO" || level === "AMATEUR" ? { level } : {}),
    ...(province && { province }),
    ...(disciplina && isDiscipline(disciplina) ? { discipline: disciplina } : {}),
    ...(ids && { id: { in: ids } }),
  };
  const consulta = await leerCacheado(`veladas:listado:${JSON.stringify({ q: q ?? null, ids: ids ?? null, level: level ?? null, province: province ?? null, discipline: disciplina ?? null, period, pagina: pagina ?? null })}`, ["veladas"], 60, async () => {
    const total = await db.event.count({ where });
    const ventana = pageWindow(total, pageNumber(pagina));
    const events = await db.event.findMany({ where, orderBy: [{ date: period === "1" ? "desc" : "asc" }, { id: "asc" }], skip: ventana.skip, take: ventana.take, select: { id: true, slug: true, discipline: true, level: true, status: true, organizerId: true, name: true, date: true, venue: true, city: true, province: true, _count: { select: { bouts: { where: { verification: { not: "DISPUTED" } } } } } } });
    return { total, events: events.map(({ date, ...event }) => ({ ...event, date: date.toISOString() })) };
  });
  const { total, events } = consulta;
  const w = pageWindow(total, pageNumber(pagina));
  return (
    <>
      <h1>Calendario de veladas</h1>
      <p className="mut">Consulta el cartel y los resultados desde cada velada. «Hoy y próximas» incluye todo el día de hoy según la hora peninsular (también usada para ordenar eventos de Canarias); «Ya celebradas» muestra las fechas anteriores a hoy. Las canceladas llevan un aviso.</p>
      <form className="search" role="search" aria-label="Filtrar veladas">
        <CampoFiltro etiqueta="Velada, ciudad o recinto"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <CampoFiltro etiqueta="Disciplina"><select name="disciplina" defaultValue={disciplina ?? ""}><option value="">Todas las disciplinas</option>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Nivel"><select name="level" defaultValue={level ?? ""}><option value="">Profesional y amateur</option>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Provincia"><select name="province" defaultValue={province ?? ""}><option value="">Toda España</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Cuándo"><select name="past" defaultValue={period}><option value="">Hoy y próximas</option><option value="1">Ya celebradas</option><option value="todas">Todas</option></select></CampoFiltro>
        <BotonesFiltro ruta="/veladas" hayFiltros={!!(q || disciplina || level || province || period)} />
      </form>
      <FiltrosActivos ruta="/veladas" params={{ q, disciplina, level, province, past: period }} activos={[
        ...(q ? [{ texto: `Búsqueda: ${q}`, claves: ["q"] }] : []),
        ...(disciplina && isDiscipline(disciplina) ? [{ texto: DISCIPLINE_LABEL[disciplina], claves: ["disciplina"] }] : []),
        ...(level === "PRO" || level === "AMATEUR" ? [{ texto: LEVEL_LABEL[level], claves: ["level"] }] : []),
        ...(province ? [{ texto: province, claves: ["province"] }] : []),
        ...(period ? [{ texto: period === "1" ? "Ya celebradas" : "Todas las fechas", claves: ["past"] }] : []),
      ]} />
      <div className="grid">
        {events.map((e) => (
          <Link key={e.id} href={`/veladas/${e.slug}`} className="card">
            <span className="tag">{DISCIPLINE_LABEL[e.discipline]}</span><span className={`tag ${e.level}`}>{LEVEL_LABEL[e.level]}</span>
            {e.status === "CANCELLED" && <span className="tag">Cancelada</span>}
            {!e.organizerId && <span className="tag">no oficial</span>}
            <strong>{e.name}</strong>
            <div className="mut">{fmtDate(new Date(e.date))}<br />{e.venue}, {e.city} ({e.province})<br />{plural(e._count.bouts, "combate", "combates")}</div>
          </Link>
        ))}
      </div>
      {events.some((e) => !e.organizerId) && <p className="mut">«No oficial»: la velada no la ha publicado un organizador, la indicó un peleador al registrar su combate y sus datos pueden estar incompletos.</p>}
      {events.length === 0 && <p className="mut">No hay veladas con esos filtros. Puedes quitar un filtro en «Estás viendo» o <Link href="/veladas?past=todas">consultar todas las fechas sin filtros</Link>.</p>}
      <Paginacion ruta="/veladas" params={{ q, disciplina, level, province, past: period }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["velada", "veladas"]} />
    </>
  );
}
