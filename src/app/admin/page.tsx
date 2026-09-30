import { redirect } from "next/navigation";
import { getUser } from "../../lib/auth";
import { db } from "../../lib/db";
import { adminDecide } from "../actions";

export const metadata = { title: "Moderación" };
export const dynamic = "force-dynamic";

export default async function Admin() {
  const user = await getUser();
  if (user?.role !== "ADMIN") redirect("/");
  const pending = await db.bout.findMany({
    where: { verification: { in: ["SELF_REPORTED", "CONFIRMED"] } },
    include: { event: true, boxerA: true, boxerB: true }, orderBy: { event: { date: "desc" } }, take: 100,
  });
  return (
    <>
      <h1>Cola de moderación</h1>
      <table>
        <thead><tr><th>Evento</th><th>Combate</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {pending.map((b) => (
            <tr key={b.id}>
              <td>{b.event.name} · {b.event.date.toLocaleDateString("es-ES")}</td>
              <td>{b.boxerA.firstName} {b.boxerA.lastName} vs {b.boxerB.firstName} {b.boxerB.lastName}</td>
              <td>{b.verification}</td>
              <td>
                <form action={adminDecide} style={{ display: "flex", gap: 6 }}>
                  <input type="hidden" name="boutId" value={b.id} />
                  <button name="decision" value="verify">Verificar</button>
                  <button name="decision" value="dispute" style={{ background: "transparent" }}>Rechazar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pending.length === 0 && <p className="mut">Nada pendiente.</p>}
    </>
  );
}
