import { redirect } from "next/navigation";
import { getUser } from "../../lib/auth";
import { db } from "../../lib/db";
import Link from "next/link";
import { FLAG_LABEL, type Flag } from "../../lib/coherence";
import { adminDecide, decideClaim, decideOrganizer, setGymVerified } from "../actions";

export const metadata = { title: "Moderación" };
export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await getUser();
  if (user?.role !== "ADMIN") redirect("/");
  const pending = await db.bout.findMany({
    where: { verification: { in: ["SELF_REPORTED", "CONFIRMED"] } },
    include: { event: true, boxerA: true, boxerB: true }, orderBy: { event: { date: "desc" } }, take: 100,
  });
  const [gyms, claims, organizers] = await Promise.all([
    db.gym.findMany({ orderBy: [{ verifiedAt: "asc" }, { name: "asc" }], take: 100 }),
    db.claimRequest.findMany({ where: { status: "PENDING" }, include: { user: true, boxer: true }, orderBy: { createdAt: "asc" } }),
    db.organizerRequest.findMany({ where: { status: "PENDING" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
  ]);
  pending.sort((a, b) => b.flags.length - a.flags.length); // primero los que tienen señales de coherencia
  const decide = (action: (f: FormData) => Promise<void>, name: string, id: string) => (
    <form action={action} style={{ display: "flex", gap: 6 }}>
      <input type="hidden" name={name} value={id} />
      {action === decideOrganizer && <input name="note" placeholder="Evidencia comprobada (web, redes, llamada…)" />}
      <button name="decision" value="approve">Aprobar</button>
      <button name="decision" value="reject" style={{ background: "transparent" }}>Rechazar</button>
    </form>
  );
  return (
    <>
      <h1>Moderación</h1>
      <p><Link href="/admin/historial">Ver historial de cambios</Link></p>
      {error === "nota" && <p className="L">El sello de verificado necesita una nota con la evidencia comprobada.</p>}
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
      <h2>Gimnasios (sello de verificado)</h2>
      <table><tbody>
        {gyms.map((g) => (
          <tr key={g.id}>
            <td><strong>{g.name}</strong> <span className="mut">{g.city}</span> {g.verifiedAt && <span className="tag PRO">✓ verificado</span>}</td>
            <td className="mut">{g.verifiedNote}{g.website && <> · <a href={g.website} rel="noopener noreferrer nofollow">web</a></>}</td>
            <td>
              <form action={setGymVerified} style={{ display: "flex", gap: 6 }}>
                <input type="hidden" name="gymId" value={g.id} />
                {!g.verifiedAt && <input name="note" placeholder="Evidencia comprobada (web, redes, llamada…)" />}
                {g.verifiedAt ? <button name="decision" value="revoke" style={{ background: "transparent" }}>Retirar sello</button> : <button name="decision" value="verify">Verificar</button>}
              </form>
            </td>
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
              <td>{b.boxerA.firstName} {b.boxerA.lastName} vs {b.boxerB.firstName} {b.boxerB.lastName}{b.flags.map((f) => <div key={f} className="L" style={{ fontSize: ".8rem" }}>⚠ {FLAG_LABEL[f as Flag] ?? f}</div>)}</td>
              <td>{b.verification}{b.evidenceUrl && <> · <a href={b.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow ugc">evidencia ↗</a></>}</td>
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
