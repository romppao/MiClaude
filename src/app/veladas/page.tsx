import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import Paginacion from "../components/Paginacion";
import { BotonesFiltro, CampoFiltro, FiltrosActivos, MasFiltros } from "../components/Filtros";
import { calendarDayStart } from "../../lib/common/dates";
import { plural } from "../../lib/common/text";
import { LEVEL_LABEL, PROVINCES } from "../../lib/common/labels";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, isDiscipline } from "../../lib/common/disciplines";
import { fmtHora, urlCartel, ventaAbierta } from "../../lib/events/entradas";
import { TarjetaVelada } from "../components/Tarjetas";

export const metadata = { title: "Calendario de veladas" };
export const dynamic = "force-dynamic";

export default async function Events({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { level, province, past, q, disciplina, pagina, inscripcion } = flatParams(await searchParams);
  // «Con inscripción abierta»: eventos futuros que admiten solicitudes de participación ahora mismo.
  const conInscripcion = inscripcion === "abierta";
  const ids = await searchIds("event", q);
  const dayStart = calendarDayStart();
  const period = past === "1" ? "1" : past === "todas" ? "todas" : "";
  const where: Prisma.EventWhereInput = {
    status: { notIn: ["PENDING_AUTHORIZATION", "REJECTED"] },
    // past: vacío = próximas · «1» = ya celebradas · «todas» = sin filtrar por fecha (lo usa «Ver todos» de la búsqueda, que encuentra veladas de cualquier fecha)
    ...(period === "todas" ? {} : { date: period === "1" ? { lt: dayStart } : { gte: dayStart } }),
    ...(level === "PRO" || level === "AMATEUR" ? { level } : {}),
    ...(province && { province }),
    ...(disciplina && isDiscipline(disciplina) ? { discipline: disciplina } : {}),
    ...(ids && { id: { in: ids } }),
    ...(conInscripcion && { registrationOpen: true, status: "SCHEDULED" as const, OR: [{ registrationUntil: null }, { registrationUntil: { gte: dayStart } }] }),
  };
  const ahora = new Date();
  const total = await db.event.count({ where });
  const w = pageWindow(total, pageNumber(pagina));
  const events = await db.event.findMany({ where, orderBy: [{ date: period === "1" ? "desc" : "asc" }, { id: "asc" }], skip: w.skip, take: w.take, include: { _count: { select: { bouts: { where: { verification: { not: "DISPUTED" } } } } } } });
  return (
    <>
      <h1>Calendario de veladas</h1>
      <p className="mut">Carteles, horarios y entradas de cada velada, y sus resultados cuando terminan. Las canceladas llevan un aviso.</p>
      <form className="search" role="search" aria-label="Filtrar veladas">
        <CampoFiltro etiqueta="Velada, ciudad o recinto"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <MasFiltros activos={[disciplina, level, province, period, conInscripcion ? "1" : ""].filter(Boolean).length}>
        <CampoFiltro etiqueta="Inscripción de peleadores"><select name="inscripcion" defaultValue={conInscripcion ? "abierta" : ""}><option value="">Todas</option><option value="abierta">Con inscripción abierta</option></select></CampoFiltro>
        <CampoFiltro etiqueta="Disciplina"><select name="disciplina" defaultValue={disciplina ?? ""}><option value="">Todas las disciplinas</option>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Nivel"><select name="level" defaultValue={level ?? ""}><option value="">Profesional y amateur</option>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Provincia"><select name="province" defaultValue={province ?? ""}><option value="">Toda España</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Cuándo" ayuda="«Hoy y próximas» incluye todo el día de hoy, según la hora peninsular (también para los eventos de Canarias)."><select name="past" defaultValue={period}><option value="">Hoy y próximas</option><option value="1">Ya celebradas</option><option value="todas">Todas</option></select></CampoFiltro>
        </MasFiltros>
        <BotonesFiltro ruta="/veladas" hayFiltros={!!(q || disciplina || level || province || period || conInscripcion)} />
      </form>
      <FiltrosActivos ruta="/veladas" params={{ q, disciplina, level, province, past: period, inscripcion: conInscripcion ? "abierta" : undefined }} activos={[
        ...(q ? [{ texto: `Búsqueda: ${q}`, claves: ["q"] }] : []),
        ...(disciplina && isDiscipline(disciplina) ? [{ texto: DISCIPLINE_LABEL[disciplina], claves: ["disciplina"] }] : []),
        ...(level === "PRO" || level === "AMATEUR" ? [{ texto: LEVEL_LABEL[level], claves: ["level"] }] : []),
        ...(province ? [{ texto: province, claves: ["province"] }] : []),
        ...(period ? [{ texto: period === "1" ? "Ya celebradas" : "Todas las fechas", claves: ["past"] }] : []),
        ...(conInscripcion ? [{ texto: "Con inscripción abierta", claves: ["inscripcion"] }] : []),
      ]} />
      <div className="grid velada-grid">
        {events.map((e) => {
          const reservar = ventaAbierta(e, ahora);
          return (
            <TarjetaVelada key={e.id} e={{
              slug: e.slug, name: e.name, date: e.date, discipline: e.discipline, level: e.level, venue: e.venue, city: e.city,
              hora: e.startMinute !== null ? fmtHora(e.startMinute) : null, cartel: urlCartel(e),
              // El precio solo se anuncia si se puede reservar en Lona; si no, podría estar desfasado.
              precio: reservar ? e.ticketPriceEuros : null, reservar,
              etiquetas: [
                ...(e.status === "CANCELLED" ? ["Cancelada"] : []),
                ...(!e.organizerId ? ["No oficial"] : []),
                ...(e.registrationOpen && e.status === "SCHEDULED" ? ["Inscripción abierta"] : []),
                ...(e._count.bouts ? [plural(e._count.bouts, "combate", "combates")] : []),
              ],
            }} />
          );
        })}
      </div>
      {events.some((e) => !e.organizerId) && <p className="mut">«No oficial»: la velada no la ha publicado un organizador, la indicó un peleador al registrar su combate y sus datos pueden estar incompletos.</p>}
      {events.length === 0 && <p className="mut">No hay veladas con esos filtros. Puedes quitar un filtro en «Estás viendo» o <Link href="/veladas?past=todas">consultar todas las fechas sin filtros</Link>.</p>}
      <Paginacion ruta="/veladas" params={{ q, disciplina, level, province, past: period, inscripcion: conInscripcion ? "abierta" : undefined }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["velada", "veladas"]} />
    </>
  );
}
