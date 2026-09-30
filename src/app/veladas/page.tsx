import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "../../lib/db";
import { LEVEL_LABEL, PROVINCES, fmtDate } from "../../lib/labels";

export const metadata = { title: "Calendario de veladas" };
export const dynamic = "force-dynamic";

export default async function Events({ searchParams }: { searchParams: Promise<{ level?: string; province?: string; past?: string; q?: string }> }) {
  const { level, province, past, q } = await searchParams;
  const now = new Date();
  const where: Prisma.EventWhereInput = {
    date: past ? { lt: now } : { gte: new Date(now.getTime() - 864e5) },
    ...(level === "PRO" || level === "AMATEUR" ? { level } : {}),
    ...(province && { province }),
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }, { venue: { contains: q, mode: "insensitive" } }] }),
  };
  const events = await db.event.findMany({ where, orderBy: { date: past ? "desc" : "asc" }, take: 100, include: { _count: { select: { bouts: true } } } });
  return (
    <>
      <h1>Calendario de veladas</h1>
      <form className="search">
        <input name="q" defaultValue={q} placeholder="Velada, ciudad o recinto" />
        <select name="level" defaultValue={level ?? ""}><option value="">Pro y amateur</option>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select name="province" defaultValue={province ?? ""}><option value="">Toda España</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
        <select name="past" defaultValue={past ?? ""}><option value="">Próximas</option><option value="1">Pasadas</option></select>
        <button>Filtrar</button>
      </form>
      <div className="grid">
        {events.map((e) => (
          <Link key={e.id} href={`/veladas/${e.slug}`} className="card">
            <span className={`tag ${e.level}`}>{LEVEL_LABEL[e.level]}</span>
            {e.status === "CANCELLED" && <span className="tag">Cancelada</span>}
            <strong>{e.name}</strong>
            <div className="mut">{fmtDate(e.date)}<br />{e.venue}, {e.city} ({e.province})<br />{e._count.bouts} combates</div>
          </Link>
        ))}
      </div>
      {events.length === 0 && <p className="mut">No hay veladas con esos filtros.</p>}
    </>
  );
}
