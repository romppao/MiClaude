import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { METHOD_LABEL, fmtDate } from "../../../lib/labels";
import { DISCIPLINE_LABEL, METHODS_BY_DISCIPLINE, WEIGHT_CLASSES } from "../../../lib/disciplines";
import { addCartelBout, setBoutEvidence, setBoutResult } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ManageEvent({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ slug }, { error }, user] = await Promise.all([params, searchParams, getUser()]);
  if (!user) redirect("/entrar");
  const event = await db.event.findUnique({ where: { slug }, include: { bouts: { orderBy: { order: "asc" }, include: { fighterA: true, fighterB: true } } } });
  if (!event) notFound();
  if (event.organizerId !== user.id && user.role !== "ADMIN") redirect("/organizador");
  const fighters = await db.fighter.findMany({ where: { disciplines: { some: { discipline: event.discipline } } }, orderBy: { lastName: "asc" }, take: 500 });
  const past = event.date.getTime() <= Date.now();
  return (
    <>
      <h1>{event.name}</h1>
      <p className="mut"><span className="tag">{DISCIPLINE_LABEL[event.discipline]}</span> {fmtDate(event.date)} · {event.venue}, {event.city} · <Link href={`/veladas/${event.slug}`}>ver página pública</Link></p>
      {error === "cartel" && <p className="L">Elige dos peleadores distintos de la lista.</p>}
      {error === "futuro" && <p className="L">Solo puedes poner resultados cuando la velada ya se ha celebrado.</p>}
      <h2>Cartel</h2>
      <table><tbody>
        {event.bouts.map((b) => (
          <tr key={b.id}>
            <td>{b.fighterA.firstName} {b.fighterA.lastName} <span className="mut">vs</span> {b.fighterB.firstName} {b.fighterB.lastName}</td>
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
                  <select name="method" defaultValue={b.method ?? METHODS_BY_DISCIPLINE[event.discipline][0]} aria-label="Cómo terminó">{METHODS_BY_DISCIPLINE[event.discipline].map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}</select>
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
        <input name="fighterA" list="bx" placeholder="Esquina roja" required />
        <input name="fighterB" list="bx" placeholder="Esquina azul" required />
        <datalist id="bx">{fighters.map((b) => <option key={b.id} value={b.slug}>{b.firstName} {b.lastName}</option>)}</datalist>
        <select name="weightClass" defaultValue="" aria-label="Categoría de peso"><option value="">Categoría (opcional)</option>{WEIGHT_CLASSES[event.discipline].map((w) => <option key={w}>{w}</option>)}</select>
        <input name="rounds" type="number" min={1} max={12} placeholder="Asaltos" />
        <input name="evidenceUrl" placeholder="Evidencia (acta, cartel, publicación…)" style={{ flex: 1, minWidth: 240 }} />
        <button>Añadir</button>
      </form>
      <p className="mut">Escribe el nombre para elegir de la lista. Si un peleador no aparece, debe crear o reclamar su ficha primero.</p>
    </>
  );
}
