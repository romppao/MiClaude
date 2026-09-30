import Link from "next/link";
import type { Level, Prisma } from "@prisma/client";
import { db } from "../../lib/db";
import { LEVEL_LABEL, PROVINCES } from "../../lib/labels";

export const metadata = { title: "Peleadores" };
export const dynamic = "force-dynamic";

export default async function Fighters({ searchParams }: { searchParams: Promise<{ q?: string; level?: string; province?: string; weight?: string }> }) {
  const { q, level, province, weight } = await searchParams;
  const where: Prisma.FighterWhereInput = {
    ...(q && { OR: [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { alias: { contains: q, mode: "insensitive" } },
    ] }),
    ...(level === "PRO" || level === "AMATEUR" ? { level: level as Level } : {}),
    ...(province && { province }),
    ...(weight && { weightClass: { contains: weight, mode: "insensitive" } }),
  };
  const fighters = await db.fighter.findMany({ where, orderBy: [{ lastName: "asc" }], take: 100, include: { gym: true } });
  return (
    <>
      <h1>Peleadores</h1>
      <form className="search">
        <input name="q" defaultValue={q} placeholder="Nombre o alias" />
        <select name="level" defaultValue={level ?? ""}><option value="">Todos los niveles</option>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select name="province" defaultValue={province ?? ""}><option value="">Todas las provincias</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
        <input name="weight" defaultValue={weight} placeholder="Peso (ej. Ligero)" />
        <button>Filtrar</button>
      </form>
      <div className="grid">
        {fighters.map((b) => (
          <Link key={b.id} href={`/peleadores/${b.slug}`} className="card">
            <span className={`tag ${b.level}`}>{LEVEL_LABEL[b.level]}</span>
            <strong>{b.firstName} {b.lastName}</strong>
            <div className="mut">{b.alias ? `“${b.alias}” · ` : ""}{b.weightClass ?? ""} · {b.province ?? ""}{b.gym ? ` · ${b.gym.name}` : ""}</div>
          </Link>
        ))}
      </div>
      {fighters.length === 0 && <p className="mut">Sin resultados.</p>}
    </>
  );
}
