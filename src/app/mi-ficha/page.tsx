import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "../../lib/auth";
import { db } from "../../lib/db";
import { PROVINCES } from "../../lib/labels";
import { computeRecords, formatRecord } from "../../lib/record";
import { addBout, createMyBoxer, requestClaim, respondBout, setBoutEvidence } from "../actions";

export const metadata = { title: "Mi ficha" };
export const dynamic = "force-dynamic";
const ERR: Record<string, string> = { nombre: "Nombre y apellidos son obligatorios.", combate: "Revisa los datos del combate (evento, fecha y rival).", reclamar: "Esa ficha ya no está disponible.", url: "El enlace de evidencia no es válido (debe empezar por http:// o https://)." };

export default async function MyProfile({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string; q?: string }> }) {
  const user = await requireUser();
  if (!user.emailVerifiedAt) redirect("/verificar");
  const { error, ok, q } = await searchParams;
  const me = user.boxer;

  if (!me) {
    const [candidates, myClaims] = await Promise.all([
      q ? db.boxer.findMany({ where: { userId: null, OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] }, include: { gym: true }, take: 10 }) : Promise.resolve([]),
      db.claimRequest.findMany({ where: { userId: user.id }, include: { boxer: true }, orderBy: { createdAt: "desc" } }),
    ]);
    return (
      <>
        <h1>¿Ya apareces en Ring España?</h1>
        <p className="mut">Si alguien ya registró un combate tuyo, tu ficha existe. Búscala y reclámala; un moderador la revisará.</p>
        {ok && <p className="W">Solicitud enviada. Te avisaremos cuando un moderador la revise.</p>}
        <form className="search"><input name="q" defaultValue={q} placeholder="Tu nombre o apellidos" /><button>Buscar mi ficha</button></form>
        {candidates.map((b) => (
          <form key={b.id} action={requestClaim} className="card" style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input type="hidden" name="boxerId" value={b.id} />
            <strong>{b.firstName} {b.lastName}</strong><span className="mut">{b.city ?? ""}{b.gym ? ` · ${b.gym.name}` : ""}</span>
            <input name="message" placeholder="¿Cómo podemos comprobar que eres tú? (gimnasio, entrenador, licencia…)" style={{ flex: 1, minWidth: 220 }} />
            <button>Reclamar</button>
          </form>
        ))}
        {q && candidates.length === 0 && <p className="mut">No hay fichas sin dueño con ese nombre.</p>}
        {myClaims.length > 0 && <p className="mut">Tus solicitudes: {myClaims.map((c) => `${c.boxer.firstName} ${c.boxer.lastName} (${c.status === "PENDING" ? "pendiente" : c.status === "APPROVED" ? "aprobada" : "rechazada"})`).join(", ")}</p>}
        <h2>Si no apareces, crea tu ficha</h2>
        {error && <p className="L">{ERR[error]}</p>}
        <form className="search" action={createMyBoxer} style={{ flexDirection: "column", maxWidth: 360 }}>
          <input name="firstName" placeholder="Nombre" required />
          <input name="lastName" placeholder="Apellidos" required />
          <input name="alias" placeholder="Alias (opcional)" />
          <input name="weightClass" placeholder="Categoría (ej. Wélter)" />
          <input name="gym" placeholder="Gimnasio (opcional)" />
          <input name="city" placeholder="Ciudad" defaultValue="Madrid" />
          <select name="province" defaultValue="Madrid">{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
          <button>Crear ficha</button>
        </form>
      </>
    );
  }

  const bouts = await db.bout.findMany({
    where: { OR: [{ boxerAId: me.id }, { boxerBId: me.id }] },
    include: { event: true, boxerA: true, boxerB: true },
    orderBy: { event: { date: "desc" } },
  });
  const rec = computeRecords(me.id, bouts).AMATEUR;
  const toConfirm = bouts.filter((b) => b.verification === "SELF_REPORTED" && b.boxerBId === me.id);

  return (
    <>
      <h1>{me.firstName} {me.lastName}</h1>
      <p><Link href={`/boxeadores/${me.slug}`}>Ver mi ficha pública</Link></p>
      <p className="rec">{formatRecord(rec)} <span className="mut" style={{ fontSize: "1rem" }}>({rec.unverified} sin confirmar)</span></p>
      {error && <p className="L">{ERR[error]}</p>}

      {toConfirm.length > 0 && (
        <>
          <h2>Combates pendientes de que los confirmes</h2>
          <table><tbody>
            {toConfirm.map((b) => (
              <tr key={b.id}>
                <td>{b.event.name} · {b.event.date.toLocaleDateString("es-ES")}</td>
                <td>vs {b.boxerA.firstName} {b.boxerA.lastName}</td>
                <td>
                  <form action={respondBout} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="boutId" value={b.id} />
                    <button name="decision" value="confirm">Confirmar</button>
                    <button name="decision" value="dispute" style={{ background: "transparent" }}>Disputar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody></table>
        </>
      )}

      <h2>Registrar un combate</h2>
      <form className="search" action={addBout}>
        <input name="eventName" placeholder="Velada / evento" required />
        <input name="date" type="date" required />
        <input name="venue" placeholder="Recinto" />
        <input name="city" placeholder="Ciudad" defaultValue="Madrid" />
        <input name="oppFirst" placeholder="Rival: nombre" required />
        <input name="oppLast" placeholder="Rival: apellidos" required />
        <select name="outcome" defaultValue="WIN"><option value="WIN">Gané</option><option value="LOSS">Perdí</option><option value="DRAW">Empate</option></select>
        <select name="method" defaultValue="UD">
          <option value="UD">Decisión unánime</option><option value="SD">Decisión dividida</option><option value="MD">Decisión mayoritaria</option>
          <option value="KO">KO</option><option value="TKO">TKO</option><option value="RTD">Abandono</option><option value="DQ">Descalificación</option><option value="DRAW">Empate</option>
        </select>
        <input name="rounds" type="number" min={1} max={12} placeholder="Asaltos" />
        <input name="evidenceUrl" placeholder="Evidencia (enlace a acta, cartel, vídeo o publicación)" style={{ flex: 1, minWidth: 260 }} />
        <button>Registrar</button>
      </form>
      <h2>Mis combates y su evidencia</h2>
      <table><tbody>
        {bouts.map((b) => (
          <tr key={b.id}>
            <td>{b.event.name} · {b.event.date.toLocaleDateString("es-ES")}</td>
            <td>vs {b.boxerAId === me.id ? `${b.boxerB.firstName} ${b.boxerB.lastName}` : `${b.boxerA.firstName} ${b.boxerA.lastName}`}</td>
            <td><span className="tag">{b.verification === "SELF_REPORTED" ? "sin confirmar" : b.verification === "CONFIRMED" ? "confirmado" : b.verification === "VERIFIED" ? "verificado" : "disputado"}</span></td>
            <td>
              <form action={setBoutEvidence} style={{ display: "flex", gap: 4 }}>
                <input type="hidden" name="boutId" value={b.id} />
                <input name="evidenceUrl" defaultValue={b.evidenceUrl ?? ""} placeholder="Enlace de evidencia" />
                <button>Guardar</button>
              </form>
            </td>
          </tr>
        ))}
      </tbody></table>
      <p className="mut">Tus combates aparecen como «sin confirmar» hasta que tu rival (si tiene cuenta) o un moderador los verifique.</p>
    </>
  );
}
