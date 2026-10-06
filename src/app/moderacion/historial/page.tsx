import Link from "next/link";
import { requireAdmin } from "../../../lib/accounts/permissions";
import { db } from "../../../lib/common/db";
import { AUDIT_ACTION_LABEL, AUDIT_ENTITY_LABEL } from "../../../lib/common/labels";
import { lookup, flatParams } from "../../../lib/common/safe";
import Paginacion from "../../components/Paginacion";
import { pageNumber, pageWindow } from "../../../lib/common/pagination";
import { BotonesFiltro, CampoFiltro } from "../../components/Filtros";

export const metadata = { title: "Historial de cambios" };
export const dynamic = "force-dynamic";

const LIMITE = 50;

export default async function History({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("/moderacion/historial");
  const { entity, id, pagina } = flatParams(await searchParams);
  const entidad = entity && lookup(AUDIT_ENTITY_LABEL, entity) ? entity : undefined;
  const where = { ...(entidad && { entity: entidad }), ...(id && { entityId: id.trim() }) };
  const total = await db.auditLog.count({ where });
  const page = pageWindow(total, pageNumber(pagina), LIMITE);
  const logs = await db.auditLog.findMany({
    where,
    include: { user: { select: { name: true } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: page.take, skip: page.skip,
  });
  return (
    <>
      <h1>Historial de cambios</h1>
      <p><Link href="/moderacion">← Volver a moderación</Link></p>
      <form className="search" role="search" aria-label="Filtrar el historial de cambios">
        <CampoFiltro etiqueta="Qué ha cambiado">
          <select name="entity" defaultValue={entidad ?? ""}><option value="">Todo</option>{Object.entries(AUDIT_ENTITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </CampoFiltro>
        <CampoFiltro etiqueta="Identificador (opcional)" ayuda="Copia el identificador de una fila para ver solo su historial."><input name="id" defaultValue={id} maxLength={40} /></CampoFiltro>
        <BotonesFiltro ruta="/moderacion/historial" hayFiltros={!!(entity || id)} />
      </form>
      {logs.length === 0 ? <p className="mut">No hay registros con esos filtros.</p> : (
        <>
          <Paginacion ruta="/moderacion/historial" params={{ entity: entidad, id }} actual={page.current} paginas={page.pages} desde={page.from} hasta={page.to} total={page.total} unidad={["cambio", "cambios"]} />
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Cambios registrados, del más reciente al más antiguo</caption>
              <thead><tr><th scope="col">Cuándo</th><th scope="col">Quién</th><th scope="col">Qué</th><th scope="col">Detalle</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.createdAt.toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</td>
                    <td>{l.user ? l.user.name : "Sistema o cuenta eliminada"}</td>
                    <td>{lookup(AUDIT_ENTITY_LABEL, l.entity) ?? l.entity}: {lookup(AUDIT_ACTION_LABEL, l.action) ?? l.action.toLowerCase().replaceAll("_", " ")}<div className="mut">Identificador: {l.entityId}</div></td>
                    <td>
                      <details>
                        <summary>Ver el detalle técnico</summary>
                        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: 0 }}>{`Antes: ${l.before ? JSON.stringify(l.before) : "—"}\nDespués: ${l.after ? JSON.stringify(l.after) : "—"}`}</pre>
                      </details>
                    </td>
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
