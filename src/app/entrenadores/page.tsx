import Link from "next/link";
import type { Discipline, Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import { PROVINCES } from "../../lib/common/labels";
import { DISCIPLINE_LABEL, isDiscipline } from "../../lib/common/disciplines";
import { plural } from "../../lib/common/text";
import Paginacion from "../components/Paginacion";
import { BotonesFiltro, CampoFiltro, FiltrosActivos, MasFiltros } from "../components/Filtros";
import { ChipsDisciplina, DirectorioNav } from "../components/DirectorioNav";
import { TarjetaPersona } from "../components/TarjetasDirectorio";

export const metadata = { title: "Entrenadores" };
export const dynamic = "force-dynamic";

/**
 * Directorio de entrenadores (16 de octubre de 2026): lo usa sobre todo el aficionado que quiere clases con un entrenador en concreto,
 * así que se busca por nombre, disciplina, provincia, si da clases en Lona y si entrena en un gimnasio o por su cuenta. Lona no cobra
 * las clases: el precio es el que cada entrenador pone en las suyas.
 */
export default async function Trainers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q, pagina, disciplina, province, clases, entrena } = flatParams(await searchParams);
  const ids = await searchIds("trainer", q);
  const discipline: Discipline | undefined = disciplina && isDiscipline(disciplina) ? disciplina : undefined;
  const dondeEntrena = entrena === "gimnasio" || entrena === "independiente" ? entrena : undefined;
  const where: Prisma.TrainerWhereInput = {
    ...(ids && { id: { in: ids } }),
    ...(discipline && { disciplines: { has: discipline } }),
    ...(province && { OR: [{ province }, { gym: { province } }] }),
    ...(clases === "1" && { classes: { some: { active: true } } }),
    ...(dondeEntrena === "gimnasio" && { gymId: { not: null } }),
    ...(dondeEntrena === "independiente" && { gymId: null }),
  };
  const total = await db.trainer.count({ where });
  const w = pageWindow(total, pageNumber(pagina));
  const trainers = await db.trainer.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: w.skip, take: w.take, include: { gym: true, classes: { where: { active: true }, select: { priceEuros: true } } } });
  const activos = [
    ...(q ? [{ texto: `«${q}»`, claves: ["q"] }] : []),
    ...(discipline ? [{ texto: DISCIPLINE_LABEL[discipline], claves: ["disciplina"] }] : []),
    ...(province ? [{ texto: province, claves: ["province"] }] : []),
    ...(clases === "1" ? [{ texto: "Da clases en Lona", claves: ["clases"] }] : []),
    ...(dondeEntrena ? [{ texto: dondeEntrena === "gimnasio" ? "Entrena en un gimnasio" : "Entrena por su cuenta", claves: ["entrena"] }] : []),
  ];
  const parametros = { q, disciplina, province, clases, entrena };
  return (
    <>
      <h1>Entrenadores</h1>
      <DirectorioNav actual="entrenadores" />
      <ChipsDisciplina ruta="/entrenadores" actual={discipline} conservar={{ q, province, clases, entrena }} />
      <form className="search" role="search" aria-label="Filtrar entrenadores">
        <CampoFiltro etiqueta="Nombre del entrenador"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <label className="chip"><input type="checkbox" name="clases" value="1" defaultChecked={clases === "1"} />Da clases en Lona</label>
        <MasFiltros activos={[province, dondeEntrena].filter(Boolean).length}>
          <CampoFiltro etiqueta="Provincia"><select name="province" defaultValue={province ?? ""}><option value="">Todas las provincias</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></CampoFiltro>
          <CampoFiltro etiqueta="Dónde entrena"><select name="entrena" defaultValue={dondeEntrena ?? ""}><option value="">Gimnasio o por su cuenta</option><option value="gimnasio">En un gimnasio</option><option value="independiente">Por su cuenta</option></select></CampoFiltro>
        </MasFiltros>
        {discipline && <input type="hidden" name="disciplina" value={discipline} />}
        <BotonesFiltro ruta="/entrenadores" hayFiltros={activos.length > 0} />
      </form>
      <FiltrosActivos ruta="/entrenadores" params={parametros} activos={activos} />
      <p aria-live="polite" className="mut">{total === 0 ? "Ningún entrenador coincide con estos filtros." : `${plural(total, "entrenador encontrado", "entrenadores encontrados")}.`} <Link href="/clases">Ver las clases disponibles</Link></p>
      <div className="grid grid-cartel">
        {trainers.map((t) => {
          const precios = t.classes.map((c) => c.priceEuros);
          const desde = precios.length ? Math.min(...precios) : null;
          return (
            <TarjetaPersona key={t.id} href={`/entrenadores/${t.slug}`} tipo="entrenador" id={t.id} nombre={t.name} disciplina={t.disciplines[0] ?? null}
              pildora={t.classes.length ? `${t.classes.length} ${t.classes.length === 1 ? "clase" : "clases"}` : undefined}
              lineas={[
                t.gym?.name ?? "Independiente",
                [t.city ?? t.province ?? t.gym?.province, desde !== null ? `desde ${desde} €` : null].filter(Boolean).join(" · "),
              ].filter(Boolean)} />
          );
        })}
      </div>
      {trainers.length === 0 && <p className="mut">{activos.length ? "Prueba a quitar algún filtro (pulsa sobre él, arriba) o a escribir solo una parte del nombre." : "Todavía no hay entrenadores registrados en Lona."}</p>}
      <Paginacion ruta="/entrenadores" params={parametros} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["entrenador", "entrenadores"]} />
    </>
  );
}
