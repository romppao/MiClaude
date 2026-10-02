import Link from "next/link";
import type { Discipline, Level, Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import Paginacion from "../components/Paginacion";
import { BotonesFiltro, CampoFiltro } from "../components/Filtros";
import { LEVEL_LABEL, PROVINCES } from "../../lib/common/labels";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, WEIGHT_CLASSES, isDiscipline, weightClassLabel } from "../../lib/common/disciplines";

export const metadata = { title: "Peleadores" };
export const dynamic = "force-dynamic";

export default async function Fighters({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q, level, province, disciplina, categoria, pagina } = flatParams(await searchParams);
  const ids = await searchIds("fighter", q);
  const discipline = disciplina && isDiscipline(disciplina) ? disciplina : undefined;
  // El filtro de categoría agrupa por disciplina (el mismo nombre pesa distinto en boxeo y en MMA): el valor es «DISCIPLINA:Categoría»; también se acepta solo el nombre.
  const [catDisc, ...catResto] = (categoria ?? "").split(":");
  const catConDisciplina = catResto.length > 0 && isDiscipline(catDisc);
  const categoriaNombre = catConDisciplina ? catResto.join(":") : categoria;
  const categoriaDisciplina = catConDisciplina ? (catDisc as Discipline) : undefined;
  const where: Prisma.FighterWhereInput = {
    listed: true, hiddenAt: null,
    ...(ids && { id: { in: ids } }),
    ...(level === "PRO" || level === "AMATEUR" ? { level: level as Level } : {}),
    ...(province && { province }),
    ...((discipline || categoriaNombre) && { disciplines: { some: { ...((discipline ?? categoriaDisciplina) && { discipline: discipline ?? categoriaDisciplina }), ...(categoriaNombre && { weightClass: categoriaNombre }) } } }),
  };
  const total = await db.fighter.count({ where });
  const w = pageWindow(total, pageNumber(pagina));
  const fighters = await db.fighter.findMany({ where, orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }], skip: w.skip, take: w.take, include: { gym: true, disciplines: true } });
  return (
    <>
      <h1>Peleadores</h1>
      <form className="search" role="search" aria-label="Filtrar peleadores">
        <CampoFiltro etiqueta="Nombre o alias"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <CampoFiltro etiqueta="Nivel"><select name="level" defaultValue={level ?? ""}><option value="">Todos los niveles</option>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Provincia"><select name="province" defaultValue={province ?? ""}><option value="">Todas las provincias</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Disciplina"><select name="disciplina" defaultValue={disciplina ?? ""}><option value="">Todas las disciplinas</option>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select></CampoFiltro>
        <CampoFiltro etiqueta="Categoría de peso" ayuda="Los kilos son el límite de cada categoría y son orientativos."><select name="categoria" defaultValue={categoria ?? ""}><option value="">Todas las categorías</option>{DISCIPLINE_ORDER.filter((d) => !discipline || d === discipline).map((d) => <optgroup key={d} label={DISCIPLINE_LABEL[d]}>{WEIGHT_CLASSES[d].map((c) => <option key={c} value={`${d}:${c}`}>{weightClassLabel(d, c)}</option>)}</optgroup>)}</select></CampoFiltro>
        <BotonesFiltro ruta="/peleadores" />
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
      {fighters.length === 0 && <p className="mut">No hay peleadores con esos filtros. Prueba a quitar alguno o a escribir solo una parte del nombre.</p>}
      <Paginacion ruta="/peleadores" params={{ q, level, province, disciplina, categoria }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["peleador", "peleadores"]} />
    </>
  );
}
