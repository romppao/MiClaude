import Link from "next/link";
import type { Level, Prisma } from "@prisma/client";
import { db } from "../../lib/db";
import { LEVEL_LABEL, PROVINCES } from "../../lib/labels";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, WEIGHT_CLASSES, isDiscipline } from "../../lib/disciplines";

export const metadata = { title: "Peleadores" };
export const dynamic = "force-dynamic";

export default async function Fighters({ searchParams }: { searchParams: Promise<{ q?: string; level?: string; province?: string; disciplina?: string; categoria?: string }> }) {
  const { q, level, province, disciplina, categoria } = await searchParams;
  const categorias = [...new Set(DISCIPLINE_ORDER.flatMap((d) => WEIGHT_CLASSES[d]))];
  const discipline = disciplina && isDiscipline(disciplina) ? disciplina : undefined;
  const where: Prisma.FighterWhereInput = {
    listed: true, hiddenAt: null,
    ...(q && { OR: [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { alias: { contains: q, mode: "insensitive" } },
    ] }),
    ...(level === "PRO" || level === "AMATEUR" ? { level: level as Level } : {}),
    ...(province && { province }),
    ...((discipline || categoria) && { disciplines: { some: { ...(discipline && { discipline }), ...(categoria && { weightClass: categoria }) } } }),
  };
  const fighters = await db.fighter.findMany({ where, orderBy: [{ lastName: "asc" }], take: 100, include: { gym: true, disciplines: true } });
  return (
    <>
      <h1>Peleadores</h1>
      <form className="search">
        <input name="q" defaultValue={q} placeholder="Nombre o alias" />
        <select name="level" defaultValue={level ?? ""}><option value="">Todos los niveles</option>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select name="province" defaultValue={province ?? ""}><option value="">Todas las provincias</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
        <select name="disciplina" defaultValue={disciplina ?? ""} aria-label="Disciplina"><option value="">Todas las disciplinas</option>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select>
        <select name="categoria" defaultValue={categoria ?? ""} aria-label="Categoría de peso"><option value="">Todas las categorías</option>{categorias.map((c) => <option key={c}>{c}</option>)}</select>
        <button>Filtrar</button>
      </form>
      <div className="grid">
        {fighters.map((b) => (
          <Link key={b.id} href={`/peleadores/${b.slug}`} className="card">
            <span className={`tag ${b.level}`}>{LEVEL_LABEL[b.level]}</span>
            <strong>{b.firstName} {b.lastName}</strong>
            <div className="mut">{b.alias ? `“${b.alias}” · ` : ""}{[...b.disciplines].sort((x, y) => DISCIPLINE_ORDER.indexOf(x.discipline) - DISCIPLINE_ORDER.indexOf(y.discipline)).map((d) => `${DISCIPLINE_LABEL[d.discipline]}${d.weightClass ? ` (${d.weightClass})` : ""}`).join(", ")} · {b.province ?? ""}{b.gym ? ` · ${b.gym.name}` : ""}</div>
          </Link>
        ))}
      </div>
      {fighters.length === 0 && <p className="mut">Sin resultados.</p>}
    </>
  );
}
