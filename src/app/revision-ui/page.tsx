import Link from "next/link";
import { notFound } from "next/navigation";
import { VistaVisitante } from "../_inicio/Visitante";
import { FilaNoticias, NoticiaDestacada, SinNoticias } from "../components/Noticias";
import { datosRevision, ESTADOS, type Estado } from "./datos";

/** Banco de pruebas exclusivo de desarrollo; en producción siempre responde 404. */
export default async function RevisionUI({ searchParams }: { searchParams: Promise<{ data?: string; vista?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const params = await searchParams;
  const estado: Estado = ESTADOS.find(e => e === params.data) ?? "demo";
  const datos = datosRevision(estado);
  const portada = params.vista === "comun";
  const etiquetas = ["Ejemplo", "Extremo", "Vacío", "Uno", "1.000"];
  return <>
    <style>{`.revision-selector{display:flex;flex-wrap:wrap;gap:4px;margin:12px 0 24px;padding:4px;border:1px solid var(--line);border-radius:12px;font:14px system-ui}.revision-selector a{min-height:44px;padding:8px 12px;display:flex;align-items:center;border-radius:8px}.revision-selector a[aria-current]{background:var(--acc);color:var(--acc-ink)}`}</style>
    <p className="notice notice-info">Revisión visual con datos ficticios. Los perfiles y las veladas de ejemplo no existen. Las funciones que requieren la base de datos no se pueden probar aquí.</p>
    <nav aria-label="Datos de revisión" className="revision-selector">
      {ESTADOS.map((e, i) => <Link key={e} href={`/revision-ui?data=${e}${portada ? "&vista=comun" : ""}`} aria-current={e === estado ? "page" : undefined} scroll={false}>{etiquetas[i]}</Link>)}
      <Link href={`/revision-ui?data=${estado}${portada ? "" : "&vista=comun"}`} scroll={false}>{portada ? "Visitante" : "Portada común"}</Link>
    </nav>
    {portada ? <div className="pantalla inicio-adaptable">
      <h1>Actualidad de los deportes de contacto</h1>
      <section className="portada-actualidad" aria-label="Actualidad">
        {datos.noticias.length ? <><NoticiaDestacada n={datos.noticias[0]} /><FilaNoticias noticias={datos.noticias.slice(1)} etiqueta="Más noticias" /></> : <SinNoticias />}
      </section>
    </div> : <VistaVisitante {...datos} />}
  </>;
}
