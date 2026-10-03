import Link from "next/link";
import type { Discipline, Level, Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import Paginacion from "../components/Paginacion";
import { BotonesFiltro, CampoFiltro, FiltrosActivos } from "../components/Filtros";
import SelectorCategoria from "../components/SelectorCategoria";
import { PROVINCES } from "../../lib/common/labels";
import { divisionById, divisionLabel } from "../../lib/common/competition";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, isDiscipline, isLevel, levelName, weightClassLabel, weightClassesFor } from "../../lib/common/disciplines";
import { plural } from "../../lib/common/text";

export const metadata = { title: "Peleadores" };
export const dynamic = "force-dynamic";

export default async function Fighters({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q, level, province, disciplina, categoria, divisionId, pagina } = flatParams(await searchParams);
  const ids = await searchIds("fighter", q);
  const discipline: Discipline | undefined = disciplina && isDiscipline(disciplina) ? disciplina : undefined;
  const nivel: Level | undefined = level && isLevel(level) ? level : undefined;
  // Disciplina, nivel y categoría se miran juntos sobre la misma disciplina de la ficha: «boxeo + profesional + wélter» es UNA disciplina con esas tres cosas, no tres cosas sueltas.
  const division = divisionById(divisionId);
  const porDisciplina = discipline || nivel || categoria || divisionId;
  const where: Prisma.FighterWhereInput = {
    listed: true, hiddenAt: null,
    ...(ids && { id: { in: ids } }),
    ...(province && { province }),
    ...(porDisciplina && { disciplines: { some: { ...(discipline && { discipline }), ...(nivel && { level: nivel }), ...(categoria && { weightClass: categoria }), ...(divisionId && { divisionId }) } } }),
  };
  const total = await db.fighter.count({ where });
  const w = pageWindow(total, pageNumber(pagina));
  const fighters = await db.fighter.findMany({ where, orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }], skip: w.skip, take: w.take, include: { gym: true, disciplines: true } });

  // Texto de cada filtro aplicado (con «✕» para quitarlo) y qué parámetros de la dirección quita.
  const etiquetaCategoria = categoria && discipline ? weightClassLabel(discipline, nivel ?? (weightClassesFor(discipline, "PRO").some((c) => c.valor === categoria) ? "PRO" : "AMATEUR"), categoria, divisionId) : categoria;
  const activos = [
    ...(q ? [{ texto: `«${q}»`, claves: ["q"] }] : []),
    ...(discipline ? [{ texto: DISCIPLINE_LABEL[discipline], claves: ["disciplina", "categoria", "divisionId"] }] : []),
    ...(nivel ? [{ texto: levelName(nivel), claves: ["level", "categoria", "divisionId"] }] : []),
    ...(divisionId ? [{ texto: divisionLabel(division?.id ?? divisionId), claves: ["divisionId", "categoria"] }] : []),
    ...(categoria ? [{ texto: etiquetaCategoria ?? categoria, claves: ["categoria"] }] : []),
    ...(province ? [{ texto: province, claves: ["province"] }] : []),
  ];
  return (
    <>
      <h1>Peleadores</h1>
      <form className="search" role="search" aria-label="Filtrar peleadores">
        <CampoFiltro etiqueta="Nombre o alias"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <SelectorCategoria modo="filtro" nombres={{ discipline: "disciplina", level: "level", weightClass: "categoria" }} defaults={{ discipline: discipline ?? "", level: nivel ?? "", divisionId: divisionId ?? "", weightClass: categoria ?? "" }} />
        <CampoFiltro etiqueta="Provincia"><select name="province" defaultValue={province ?? ""}><option value="">Todas las provincias</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></CampoFiltro>
        <BotonesFiltro ruta="/peleadores" />
      </form>
      <FiltrosActivos ruta="/peleadores" params={{ q, level, province, disciplina, categoria, divisionId }} activos={activos} />
      <p aria-live="polite" className="mut">{total === 0 ? "Ningún peleador coincide con estos filtros." : `${plural(total, "peleador encontrado", "peleadores encontrados")}.`}</p>
      <div className="grid">
        {fighters.map((b) => (
          <Link key={b.id} href={`/peleadores/${b.slug}`} className="card">
            <strong>{b.firstName} {b.lastName}</strong>
            <div className="mut">{b.alias ? `“${b.alias}”` : ""}{b.alias && (b.province || b.gym) ? " · " : ""}{[b.province, b.gym?.name].filter(Boolean).join(" · ")}</div>
            {[...b.disciplines].sort((x, y) => DISCIPLINE_ORDER.indexOf(x.discipline) - DISCIPLINE_ORDER.indexOf(y.discipline)).map((d) => (
              <div key={d.discipline} className="mut">{DISCIPLINE_LABEL[d.discipline]} · {levelName(d.level)} · {divisionLabel(d.divisionId)}{d.weightClass ? ` · ${weightClassLabel(d.discipline, d.level, d.weightClass, d.divisionId)}` : ""}</div>
            ))}
          </Link>
        ))}
      </div>
      {fighters.length === 0 && <p className="mut">Prueba a quitar algún filtro (pulsa sobre él, arriba) o a escribir solo una parte del nombre.</p>}
      <Paginacion ruta="/peleadores" params={{ q, level, province, disciplina, categoria, divisionId }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["peleador", "peleadores"]} />
    </>
  );
}
