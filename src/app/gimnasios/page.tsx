import Link from "next/link";
import { after } from "next/server";
import { db } from "../../lib/common/db";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import { CENTROS_PROVINCIA, CENTRO_ESPANA, puntoDeGimnasio } from "../../lib/common/mapa";
import { ubicarPendientes } from "../../lib/common/geo";
import Paginacion from "../components/Paginacion";
import { BotonesFiltro, CampoFiltro } from "../components/Filtros";
import ProfileThumbnail from "../components/ProfileThumbnail";
import MapaGimnasios, { type GimnasioEnMapa } from "../components/MapaGimnasios";
import { PROVINCES } from "../../lib/common/labels";

export const metadata = { title: "Gimnasios" };
export const dynamic = "force-dynamic";

/** Como mucho, cuántos gimnasios se pintan en el mapa a la vez (con filtros se ven todos los de la búsqueda). */
const MAX_EN_MAPA = 1500;

/**
 * Gimnasios (13 de octubre de 2026): arriba el mapa con «Usar mi ubicación» y los más cercanos; debajo, la lista completa con filtros
 * y páginas, que sigue siendo la forma accesible de recorrerlos (lector de pantalla, sin ubicación).
 */
export default async function Gyms({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q, province, pagina } = flatParams(await searchParams);
  const ids = await searchIds("gym", q);
  const where = { ...(province && { province }), ...(ids && { id: { in: ids } }) };
  const total = await db.gym.count({ where });
  const w = pageWindow(total, pageNumber(pagina));
  const [gyms, enMapa] = await Promise.all([
    db.gym.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: w.skip, take: w.take, include: { _count: { select: { fighters: true } } } }),
    db.gym.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], take: MAX_EN_MAPA, select: { id: true, slug: true, name: true, city: true, province: true, lat: true, lng: true, geoSource: true, verifiedAt: true, _count: { select: { fighters: true } } } }),
  ]);
  const puntos: GimnasioEnMapa[] = enMapa.flatMap((g) => {
    const p = puntoDeGimnasio(g);
    return p ? [{ id: g.id, slug: g.slug, nombre: g.name, ciudad: g.city, provincia: g.province, verificado: !!g.verifiedAt, peleadores: g._count.fighters, lat: p.lat, lng: p.lng, origen: p.origen }] : [];
  });
  const centro = (province && CENTROS_PROVINCIA[province]) || CENTRO_ESPANA;
  // Poco a poco, los gimnasios sin coordenadas se ubican en segundo plano (después de responder: la persona no espera).
  after(() => ubicarPendientes(5));
  return (
    <>
      <h1>Gimnasios</h1>
      <form className="search" role="search" aria-label="Filtrar gimnasios">
        <CampoFiltro etiqueta="Nombre o ciudad"><input name="q" defaultValue={q} maxLength={80} /></CampoFiltro>
        <CampoFiltro etiqueta="Provincia"><select name="province" defaultValue={province ?? ""}><option value="">Todas las provincias</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></CampoFiltro>
        <BotonesFiltro ruta="/gimnasios" hayFiltros={!!(q || province)} />
      </form>
      <MapaGimnasios key={`${q ?? ""}|${province ?? ""}`} gimnasios={puntos} centro={centro} zoom={province ? 8 : 5} />
      <h2 id="todos-los-gimnasios">{q || province ? "Gimnasios de tu búsqueda" : "Todos los gimnasios"}</h2>
      <ul className="lista-gimnasios" aria-labelledby="todos-los-gimnasios">
        {gyms.map((g) => (
          <li key={g.id}>
            <Link href={`/gimnasios/${g.slug}`} className="tarjeta-gimnasio">
              <ProfileThumbnail kind="gimnasio" id={g.id} name={g.name} />
              <span className="cuerpo">
                <strong>{g.name}</strong>
                <span className="meta">{g.city} ({g.province}) · {g._count.fighters === 1 ? "1 peleador" : `${g._count.fighters} peleadores`}</span>
              </span>
              {g.verifiedAt && <span className="pildora pildora-acc" title="Verificado por un moderador"><span aria-hidden="true">✓ </span>Verificado</span>}
            </Link>
          </li>
        ))}
      </ul>
      {gyms.length === 0 && <p className="mut">No hay gimnasios con esos filtros. Prueba a quitar alguno o a escribir solo una parte del nombre.</p>}
      <Paginacion ruta="/gimnasios" params={{ q, province }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["gimnasio", "gimnasios"]} />
    </>
  );
}
