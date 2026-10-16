import { availableFighters, isAvailable } from "../../lib/fighters/availability";
import { TarjetaPersona } from "../components/TarjetasDirectorio";
import { ChipsDisciplina, DirectorioNav } from "../components/DirectorioNav";
import { graduationLabel } from "../../lib/fighters/graduation";
import Link from "next/link";
import type { Discipline, Level, Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import Paginacion from "../components/Paginacion";
import { BotonesFiltro, CampoFiltro, MasFiltros, FiltrosActivos } from "../components/Filtros";
import SelectorCategoria from "../components/SelectorCategoria";
import { PROVINCES } from "../../lib/common/labels";
import { divisionById, divisionLabel } from "../../lib/common/competition";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, isDiscipline, isLevel, levelName, weightClassLabel, weightClassesFor, categoryLabel } from "../../lib/common/disciplines";
import { plural } from "../../lib/common/text";

export const metadata = { title: "Peleadores" };
export const dynamic = "force-dynamic";

export default async function Fighters({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q, level, province, disciplina, categoria, divisionId, pagina, disponibles } = flatParams(await searchParams);
  const ids = await searchIds("fighter", q);
  const discipline: Discipline | undefined = disciplina && isDiscipline(disciplina) ? disciplina : undefined;
  const nivel: Level | undefined = level && isLevel(level) ? level : undefined;
  // Disciplina, nivel y categoría se miran juntos sobre la misma disciplina de la ficha: «boxeo + profesional + wélter» es UNA disciplina con esas tres cosas, no tres cosas sueltas.
  const division = divisionById(divisionId);
  const porDisciplina = discipline || nivel || categoria || divisionId;
  const where: Prisma.FighterWhereInput = {
    listed: true, hiddenAt: null,
    ...(disponibles === "1" ? availableFighters() : {}),
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
    ...(disponibles === "1" ? [{ texto: "Disponibles para pelear", claves: ["disponibles"] }] : []),
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
      <DirectorioNav actual="peleadores" />
      <ChipsDisciplina ruta="/peleadores" actual={discipline} conservar={{ q, level, province, disponibles }} />
      <form className="search" role="search" aria-label="Filtrar peleadores">
        <CampoFiltro etiqueta="Nombre o alias"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <MasFiltros activos={activos.filter((x) => !x.claves.includes("q")).length}>
        <SelectorCategoria modo="filtro" nombres={{ discipline: "disciplina", level: "level", weightClass: "categoria" }} defaults={{ discipline: discipline ?? "", level: nivel ?? "", divisionId: divisionId ?? "", weightClass: categoria ?? "" }} />
        <CampoFiltro etiqueta="Provincia"><select name="province" defaultValue={province ?? ""}><option value="">Todas las provincias</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></CampoFiltro>
        <label className="chip"><input type="checkbox" name="disponibles" value="1" defaultChecked={disponibles === "1"} />Disponibles para pelear</label>
        </MasFiltros>
        <BotonesFiltro ruta="/peleadores" hayFiltros={activos.length > 0} />
      </form>
      <FiltrosActivos ruta="/peleadores" params={{ q, level, province, disciplina, categoria, divisionId, disponibles }} activos={activos} />
      <p aria-live="polite" className="mut">{total === 0 ? "Ningún peleador coincide con estos filtros." : `${plural(total, "peleador encontrado", "peleadores encontrados")}.`}</p>
      {/* Carteles (16 de octubre de 2026: «que se vea directamente la imagen»): foto a toda la tarjeta, dos columnas en el móvil. Antes, lista compacta. */}
      <div className="grid grid-cartel">
        {fighters.map((b) => {
          const discs = [...b.disciplines].sort((x, y) => Number(y.discipline === discipline) - Number(x.discipline === discipline) || DISCIPLINE_ORDER.indexOf(x.discipline) - DISCIPLINE_ORDER.indexOf(y.discipline));
          const principal = discs[0];
          return (
            <TarjetaPersona key={b.id} href={`/peleadores/${b.slug}`} tipo="peleador" id={b.id} nombre={`${b.firstName} ${b.lastName}`} disciplina={principal?.discipline ?? null}
              pildora={isAvailable(b) ? `Disponible para pelear${b.currentWeightKg !== null ? ` · ${b.currentWeightKg} kg` : ""}` : undefined}
              lineas={[
                principal ? `${DISCIPLINE_LABEL[principal.discipline]} · ${levelName(principal.level)}${discs.length > 1 ? ` (+${discs.length - 1})` : ""}` : "Sin disciplina",
                [b.alias ? `“${b.alias}”` : null, b.province, b.gym?.name].filter(Boolean).join(" · "),
              ].filter(Boolean)} />
          );
        })}
      </div>
      {fighters.length === 0 && <p className="mut">Prueba a quitar algún filtro (pulsa sobre él, arriba) o a escribir solo una parte del nombre.</p>}
      <Paginacion ruta="/peleadores" params={{ q, level, province, disciplina, categoria, divisionId, disponibles }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["peleador", "peleadores"]} />
    </>
  );
}
