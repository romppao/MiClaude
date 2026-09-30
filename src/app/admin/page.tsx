import { redirect } from "next/navigation";
import { getUser } from "../../lib/auth";
import { db } from "../../lib/db";
import { adminDecide, decideClaim, decideOrganizer } from "../actions";

export const metadata = { title: "Moderación" };
export const dynamic = "force-dynamic";

export default async function Admin() {
  const user = await getUser();
  if (user?.role !== "ADMIN") redirect("/");
  const pending = await db.bout.findMany({
    where: { verification: { in: ["SELF_REPORTED", "CONFIRMED"] } },
    include: { event: true, boxerA: true, boxerB: true }, orderBy: { event: { date: "desc" } }, take: 100,
  });
  const [claims, organizers] = await Promise.all([
    db.claimRequest.findMany({ where: { status: "PENDING" }, include: { user: true, boxer: true }, orderBy: { createdAt: "asc" } }),
    db.organizerRequest.findMany({ where: { status: "PENDING" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const decide = (action: (f: FormData) => Promise<void>, name: string, id: string) => (
    <form action={action} style={{ display: "flex", gap: 6 }}>
      <input type="hidden" name={name} value={id} />
      <button name="decision" value="approve">Aprobar</button>
      <button name="decision" value="reject" style={{ background: "transparent" }}>Rechazar</button>
    </form>
  );
  return (
    <>
      <h1>Moderación</h1>
      <h2>Reclamaciones de ficha ({claims.length})</h2>
      <table><tbody>
        {claims.map((c) => (
          <tr key={c.id}>
            <td><strong>{c.user.name}</strong> <span className="mut">{c.user.email}{c.user.emailVerifiedAt ? " ✓" : ""}</span></td>
            <td>quiere la ficha de {c.boxer.firstName} {c.boxer.lastName}</td>
            <td className="mut">{c.message}</td>
            <td>{decide(decideClaim, "claimId", c.id)}</td>
          </tr>
        ))}
      </tbody></table>
      <h2>Solicitudes de organizador ({organizers.length})</h2>
      <table><tbody>
        {organizers.map((o) => (
          <tr key={o.id}>
            <td><strong>{o.orgName}</strong> <span className="mut">{o.user.name} · {o.user.email}</span></td>
            <td className="mut">{o.message}</td>
            <td>{decide(decideOrganizer, "requestId", o.id)}</td>
          </tr>
        ))}
      </tbody></table>
      <h2>Combates por verificar</h2>
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
