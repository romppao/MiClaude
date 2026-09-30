import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { fmtDate } from "../../../lib/labels";
import { addCartelBout, setBoutEvidence, setBoutResult } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ManageEvent({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ slug }, { error }, user] = await Promise.all([params, searchParams, getUser()]);
  if (!user) redirect("/entrar");
  const event = await db.event.findUnique({ where: { slug }, include: { bouts: { orderBy: { order: "asc" }, include: { boxerA: true, boxerB: true } } } });
  if (!event) notFound();
  if (event.organizerId !== user.id && user.role !== "ADMIN") redirect("/organizador");
  const boxers = await db.boxer.findMany({ where: { level: event.level }, orderBy: { lastName: "asc" }, take: 500 });
  const past = event.date.getTime() <= Date.now();
  return (
    <>
      <h1>{event.name}</h1>
      <p className="mut">{fmtDate(event.date)} · {event.venue}, {event.city} · <Link href={`/veladas/${event.slug}`}>ver página pública</Link></p>
      {error === "cartel" && <p className="L">Elige dos boxeadores distintos de la lista.</p>}
      {error === "futuro" && <p className="L">Solo puedes poner resultados cuando la velada ya se ha celebrado.</p>}
      <h2>Cartel</h2>
      <table><tbody>
        {event.bouts.map((b) => (
          <tr key={b.id}>
            <td>{b.boxerA.firstName} {b.boxerA.lastName} <span className="mut">vs</span> {b.boxerB.firstName} {b.boxerB.lastName}</td>
            <td className="mut">{b.weightClass}</td>
            <td>
              <form action={setBoutEvidence} style={{ display: "flex", gap: 4 }}>
                <input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="back" value={`/organizador/${event.slug}`} />
                <input name="evidenceUrl" defaultValue={b.evidenceUrl ?? ""} placeholder="Evidencia" /><button>Guardar</button>
              </form>
            </td>
            <td>
              {past ? (
                <form action={setBoutResult} style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <input type="hidden" name="boutId" value={b.id} />
                  <select name="outcome" defaultValue={b.result === "A_WIN" ? "WIN" : b.result === "B_WIN" ? "LOSS" : b.result === "DRAW" ? "DRAW" : "WIN"}>
                    <option value="WIN">Gana rojo</option><option value="LOSS">Gana azul</option><option value="DRAW">Empate</option>
                  </select>
                  <select name="method" defaultValue={b.method ?? "UD"}>{["UD", "SD", "MD", "KO", "TKO", "RTD", "DQ", "DRAW"].map((m) => <option key={m}>{m}</option>)}</select>
                  <input name="endRound" type="number" min={1} max={12} placeholder="Asalto" defaultValue={b.endRound ?? ""} style={{ width: 80 }} />
                  <button>{b.result ? "Actualizar" : "Guardar resultado"}</button>
                </form>
              ) : <span className="mut">Resultado disponible tras la velada</span>}
            </td>
          </tr>
        ))}
      </tbody></table>
      {event.bouts.length === 0 && <p className="mut">Cartel vacío.</p>}
      <h2>Añadir combate</h2>
      <form className="search" action={addCartelBout}>
        <input type="hidden" name="eventId" value={event.id} />
        <input name="boxerA" list="bx" placeholder="Esquina roja" required />
        <input name="boxerB" list="bx" placeholder="Esquina azul" required />
        <datalist id="bx">{boxers.map((b) => <option key={b.id} value={b.slug}>{b.firstName} {b.lastName}</option>)}</datalist>
        <input name="weightClass" placeholder="Peso" />
        <input name="rounds" type="number" min={1} max={12} placeholder="Asaltos" />
        <input name="evidenceUrl" placeholder="Evidencia (acta, cartel, publicación…)" style={{ flex: 1, minWidth: 240 }} />
        <button>Añadir</button>
      </form>
      <p className="mut">Escribe el nombre para elegir de la lista. Si un boxeador no aparece, debe crear o reclamar su ficha primero.</p>
    </>
  );
}
