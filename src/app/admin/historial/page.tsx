import { redirect } from "next/navigation";
import { getUser } from "../../../lib/auth";
import { db } from "../../../lib/db";

export const metadata = { title: "Historial de cambios" };
export const dynamic = "force-dynamic";

export default async function History({ searchParams }: { searchParams: Promise<{ entity?: string; id?: string }> }) {
  const user = await getUser();
  if (user?.role !== "ADMIN") redirect("/");
  const { entity, id } = await searchParams;
  const logs = await db.auditLog.findMany({
    where: { ...(entity && { entity }), ...(id && { entityId: id }) },
    include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200,
  });
  return (
    <>
      <h1>Historial de cambios</h1>
      <form className="search"><input name="entity" defaultValue={entity} placeholder="Entidad (BOUT, GYM, CLAIM…)" /><input name="id" defaultValue={id} placeholder="ID" /><button>Filtrar</button></form>
      <table>
        <thead><tr><th>Cuándo</th><th>Quién</th><th>Qué</th><th>Antes → Después</th></tr></thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{l.createdAt.toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</td>
              <td>{l.user ? `${l.user.name}` : "—"}</td>
              <td>{l.entity} · {l.action}<div className="mut" style={{ fontSize: ".75rem" }}>{l.entityId}</div></td>
              <td className="mut" style={{ fontSize: ".8rem" }}>{l.before ? JSON.stringify(l.before) : "—"} → {l.after ? JSON.stringify(l.after) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && <p className="mut">Sin registros.</p>}
    </>
  );
}
