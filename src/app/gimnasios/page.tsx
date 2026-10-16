import { publicGyms } from "../../lib/common/gym-directory";
import Link from "next/link";
import { after } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import { CENTROS_PROVINCIA, CENTRO_ESPANA, puntoDeGimnasio, popularidadGimnasio } from "../../lib/common/mapa";
import { ubicarPendientes } from "../../lib/common/geo";
import Paginacion from "../components/Paginacion";
import { BotonesFiltro, CampoFiltro } from "../components/Filtros";
import { TarjetaGimnasioCartel } from "../components/TarjetasDirectorio";
import { DirectorioNav } from "../components/DirectorioNav";
import MapaGimnasios, { type GimnasioEnMapa } from "../components/MapaGimnasios";
import { PROVINCES } from "../../lib/common/labels";
import { gimnasiosVisibles } from "../../lib/common/territorio";

export const metadata = { title: "Gimnasios" };
export const dynamic = "force-dynamic";

/** Como mucho, cuántos gimnasios se pintan en el mapa a la vez (con filtros se ven todos los de la búsqueda). */
const MAX_EN_MAPA = 1500;

/**
 * Gimnasios (13 de octubre de 2026): primero el mapa con «Usar mi ubicación» y «Los más populares de tu zona» (sin ránking: decisión del fundador, 16-10-2026); debajo,
 * recogida en «Ver todos los gimnasios», la lista completa con filtros y páginas, que sigue siendo la forma accesible de recorrerlos.
 */
export default async function Gyms({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q, province, pagina } = flatParams(await searchParams);
  const ids = await searchIds("gym", q);
  const where = { AND: [publicGyms()], ...(province && { province }), ...(ids && { id: { in: ids } }) };
  const total = await db.gym.count({ where });
  const w = pageWindow(total, pageNumber(pagina));
  const [gyms, enMapa] = await Promise.all([
    db.gym.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: w.skip, take: w.take, include: { _count: { select: { fighters: true } } } }),
    db.gym.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], take: MAX_EN_MAPA, select: { id: true, slug: true, name: true, city: true, province: true, lat: true, lng: true, geoSource: true, verifiedAt: true, _count: { select: { fighters: { where: { listed: true, hiddenAt: null } }, trainers: true } } } }),
  ]);
  const puntos: GimnasioEnMapa[] = enMapa.flatMap((g) => {
    const p = puntoDeGimnasio(g);
    if (!p) return [];
    const datos = { peleadores: g._count.fighters, entrenadores: g._count.trainers, verificado: !!g.verifiedAt };
    return [{ id: g.id, slug: g.slug, nombre: g.name, ciudad: g.city, provincia: g.province, ...datos, popularidad: popularidadGimnasio(datos), lat: p.lat, lng: p.lng, origen: p.origen }];
  });
  const centro = (province && CENTROS_PROVINCIA[province]) || CENTRO_ESPANA;
  // Poco a poco, los gimnasios sin coordenadas se ubican en segundo plano (después de responder: la persona no espera).
  after(() => ubicarPendientes(5));
  return (
    <>
      <h1>Gimnasios</h1>
      <DirectorioNav actual="gimnasios" />
      <Link className="btn secondary" href="/mis-gimnasios">¿Es tu gimnasio? Búscalo y reclámalo</Link>
      <p className="meta" style={{ fontSize: 16 }}><a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", minHeight: 44 }}>© colaboradores de OpenStreetMap · datos ODbL</a></p>
      <form className="search" role="search" aria-label="Filtrar gimnasios" style={{ marginBottom: 28 }}>
        <CampoFiltro etiqueta="Nombre o ciudad"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <CampoFiltro etiqueta="Provincia"><select name="province" defaultValue={province ?? ""}><option value="">Todas las provincias</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></CampoFiltro>
        <BotonesFiltro ruta="/gimnasios" hayFiltros={!!(q || province)} />
      </form>
      <MapaGimnasios key={`${q ?? ""}|${province ?? ""}`} gimnasios={puntos} centro={centro} zoom={province ? 8 : 5} zona={province ? `de ${province}` : q ? "de tu búsqueda" : "de España"} />
      {/* La lista completa sigue aquí (la necesita quien no ve el mapa o no da su ubicación), pero recogida: lo primero es el mapa y los más populares. */}
      <details className="lista-completa" open={!!pagina && pagina !== "1"}>
        <summary><span id="todos-los-gimnasios">{q || province ? `Ver todos los gimnasios de tu búsqueda (${total})` : `Ver todos los gimnasios (${total})`}</span></summary>
      <ul className="grid grid-cartel lista-cartel" aria-labelledby="todos-los-gimnasios">
        {gyms.map((g) => (
          <li key={g.id}>
            <TarjetaGimnasioCartel id={g.id} slug={g.slug} nombre={g.name} ciudad={g.city} provincia={g.province} peleadores={g._count.fighters} verificado={!!g.verifiedAt} />
          </li>
        ))}
      </ul>
      {gyms.length === 0 && <p className="mut">No hay gimnasios con esos filtros. Prueba a quitar alguno o a escribir solo una parte del nombre.</p>}
      <Paginacion ruta="/gimnasios" params={{ q, province }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["gimnasio", "gimnasios"]} />
      </details>
    </>
  );
}
