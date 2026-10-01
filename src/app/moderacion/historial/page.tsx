import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { AUDIT_ACTION_LABEL, AUDIT_ENTITY_LABEL } from "../../../lib/labels";
import { lookup, flatParams } from "../../../lib/safe";
import { BotonesFiltro, CampoFiltro } from "../../Filtros";

export const metadata = { title: "Historial de cambios" };
export const dynamic = "force-dynamic";

const LIMITE = 200;

export default async function History({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getUser();
  if (user?.role !== "ADMIN") redirect("/");
  const { entity, id } = flatParams(await searchParams);
  const entidad = entity && lookup(AUDIT_ENTITY_LABEL, entity) ? entity : undefined;
  const logs = await db.auditLog.findMany({
    where: { ...(entidad && { entity: entidad }), ...(id && { entityId: id.trim() }) },
    include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: LIMITE,
  });
  return (
    <>
      <h1>Historial de cambios</h1>
      <p><Link href="/moderacion">← Volver a moderación</Link></p>
      <form className="search" role="search">
        <CampoFiltro etiqueta="Qué ha cambiado">
          <select name="entity" defaultValue={entidad ?? ""}><option value="">Todo</option>{Object.entries(AUDIT_ENTITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </CampoFiltro>
        <CampoFiltro etiqueta="Identificador (opcional)" ayuda="Copia el identificador de una fila para ver solo su historial."><input name="id" defaultValue={id} maxLength={40} /></CampoFiltro>
        <BotonesFiltro ruta="/moderacion/historial" />
      </form>
      {logs.length === 0 ? <p className="mut">No hay registros con esos filtros.</p> : (
        <>
          <p className="mut">{logs.length === LIMITE ? `Se muestran los ${LIMITE} cambios más recientes.` : `${logs.length} cambios.`}</p>
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
