import Link from "next/link";
import { requireAdmin } from "../../../lib/accounts/permissions";
import { db } from "../../../lib/common/db";
import { ESTADOS_FALLO, ORIGENES_FALLO, type EstadoFallo } from "../../../lib/common/fallos";
import { lookup, flatParams } from "../../../lib/common/safe";
import { pageNumber, pageWindow } from "../../../lib/common/pagination";
import Paginacion from "../../components/Paginacion";
import { BotonesFiltro, CampoFiltro } from "../../components/Filtros";

export const metadata = { title: "Fallos de la aplicación" };
export const dynamic = "force-dynamic";

const LIMITE = 50;
/** «Pendientes» = sin revisar y en estudio: es lo que hay que mirar. */
const VISTAS = { pendientes: "Pendientes", OPEN: ESTADOS_FALLO.OPEN, INVESTIGATING: ESTADOS_FALLO.INVESTIGATING, RESOLVED: ESTADOS_FALLO.RESOLVED, IGNORED: ESTADOS_FALLO.IGNORED, todos: "Todos" } as const;

const fecha = (d: Date) => d.toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "medium", timeStyle: "short" });

/**
 * Registro de fallos (13 de octubre de 2026): lo que ha fallado en la aplicación, agrupado, del más reciente al más antiguo.
 * Se llena solo (lib/common/fallos.ts). Aquí se mira; en la ficha de cada fallo se cambia su estado y se anota la causa.
 */
export default async function Fallos({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("/moderacion/fallos");
  const { estado, origen, pagina } = flatParams(await searchParams);
  const vista = estado && lookup(VISTAS, estado) ? (estado as keyof typeof VISTAS) : "pendientes";
  const origenValido = origen && lookup(ORIGENES_FALLO, origen) ? origen : undefined;
  const where = {
    ...(vista === "pendientes" ? { status: { in: ["OPEN", "INVESTIGATING"] as EstadoFallo[] } } : vista === "todos" ? {} : { status: vista as EstadoFallo }),
    ...(origenValido && { origin: origenValido }),
  };
  const [total, porEstado] = await Promise.all([
    db.appError.count({ where }),
    db.appError.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const cuenta = (s: EstadoFallo) => porEstado.find((g) => g.status === s)?._count._all ?? 0;
  const page = pageWindow(total, pageNumber(pagina), LIMITE);
  const fallos = await db.appError.findMany({ where, orderBy: [{ lastSeenAt: "desc" }, { id: "asc" }], take: page.take, skip: page.skip });
  return (
    <>
      <h1>Fallos de la aplicación</h1>
      <p><Link href="/moderacion">← Volver a moderación</Link></p>
      <p className="lead">
        Todo lo que falla en Lona queda aquí guardado, aunque nadie lo avise: al mostrar una página, al guardar un formulario, al enviar un correo
        o en el navegador de alguien. Si el mismo fallo se repite, se suma en «Veces». Abre uno para ver el detalle, cambiar su estado y anotar qué lo causó.
      </p>
      <div className="datos" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, margin: "16px 0" }}>
        {(Object.keys(ESTADOS_FALLO) as EstadoFallo[]).map((s) => (
          <Link key={s} href={`/moderacion/fallos?estado=${s}`} className="dato" aria-label={`${ESTADOS_FALLO[s]}: ${cuenta(s)}`}>
            <span className="clave">{ESTADOS_FALLO[s]}</span><strong style={{ fontSize: 26 }}>{cuenta(s)}</strong>
          </Link>
        ))}
      </div>
      <form className="search" role="search" aria-label="Filtrar los fallos">
        <CampoFiltro etiqueta="Estado">
          <select name="estado" defaultValue={vista}>{Object.entries(VISTAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </CampoFiltro>
        <CampoFiltro etiqueta="Dónde ocurrió">
          <select name="origen" defaultValue={origenValido ?? ""}><option value="">En cualquier sitio</option>{Object.entries(ORIGENES_FALLO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </CampoFiltro>
        <BotonesFiltro ruta="/moderacion/fallos" hayFiltros={vista !== "pendientes" || !!origenValido} />
      </form>
      {fallos.length === 0 ? (
        <p className="notice notice-ok">{vista === "pendientes" && !origenValido ? "No hay fallos pendientes. Todo funciona como debe." : "No hay fallos con esos filtros."}</p>
      ) : (
        <>
          <Paginacion ruta="/moderacion/fallos" params={{ estado: vista === "pendientes" ? undefined : vista, origen: origenValido }} actual={page.current} paginas={page.pages} desde={page.from} hasta={page.to} total={page.total} unidad={["fallo", "fallos"]} />
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Fallos registrados, del que ocurrió más recientemente al más antiguo</caption>
              <thead><tr><th scope="col">Fallo</th><th scope="col">Dónde</th><th scope="col">Veces</th><th scope="col">Última vez</th><th scope="col">Estado</th></tr></thead>
              <tbody>
                {fallos.map((f) => (
                  <tr key={f.id}>
                    <th scope="row" className="celda-fila"><Link href={`/moderacion/fallos/${f.id}`}>{f.message.length > 140 ? `${f.message.slice(0, 140)}…` : f.message}</Link></th>
                    <td>{lookup(ORIGENES_FALLO, f.origin) ?? f.origin}{f.path && <div className="mut">{f.path}</div>}</td>
                    <td>{f.count}</td>
                    <td>{fecha(f.lastSeenAt)}</td>
                    <td>{ESTADOS_FALLO[f.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
