import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/db";
import { computeRecords, formatRecord } from "../../../lib/record";
import { LEVEL_LABEL, METHOD_LABEL, STANCE_LABEL, fmtDate } from "../../../lib/labels";

export const dynamic = "force-dynamic";

export default async function BoxerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const boxer = await db.boxer.findUnique({ where: { slug }, include: { gym: true, trainer: true } });
  if (!boxer) notFound();
  const bouts = await db.bout.findMany({
    where: { OR: [{ boxerAId: boxer.id }, { boxerBId: boxer.id }] },
    include: { event: true, boxerA: true, boxerB: true },
    orderBy: { event: { date: "desc" } },
  });
  const records = computeRecords(boxer.id, bouts);
  const age = boxer.birthDate ? Math.floor((Date.now() - boxer.birthDate.getTime()) / 3.15576e10) : null;
  return (
    <>
      <span className={`tag ${boxer.level}`}>{LEVEL_LABEL[boxer.level]}</span>
      <h1>{boxer.firstName} {boxer.lastName}</h1>
      {boxer.alias && <p className="mut">“{boxer.alias}”</p>}
      <div className="grid">
        {(["PRO", "AMATEUR"] as const).map((l) => (
          <div key={l} className="card"><div className="mut">Récord {LEVEL_LABEL[l].toLowerCase()} (V-D-E)</div><div className="rec">{formatRecord(records[l])}</div><div className="mut">{records[l].ko} por KO</div></div>
        ))}
      </div>
      <h2>Ficha</h2>
      <table><tbody>
        {[
          ["Categoría", boxer.weightClass], ["Guardia", boxer.stance && STANCE_LABEL[boxer.stance]],
          ["Edad", age], ["Altura", boxer.heightCm && `${boxer.heightCm} cm`], ["Envergadura", boxer.reachCm && `${boxer.reachCm} cm`],
          ["Procedencia", [boxer.city, boxer.province].filter(Boolean).join(", ")],
        ].filter(([, v]) => v).map(([k, v]) => <tr key={k as string}><th>{k}</th><td>{v}</td></tr>)}
        {boxer.gym && <tr><th>Gimnasio</th><td><Link href={`/gimnasios/${boxer.gym.slug}`}>{boxer.gym.name}</Link></td></tr>}
        {boxer.trainer && <tr><th>Entrenador</th><td><Link href={`/entrenadores/${boxer.trainer.slug}`}>{boxer.trainer.name}</Link></td></tr>}
      </tbody></table>
      {boxer.bio && <p>{boxer.bio}</p>}
      <h2>Combates</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Rival</th><th></th><th>Método</th><th>Velada</th></tr></thead>
        <tbody>
          {bouts.map((b) => {
            const isA = b.boxerAId === boxer.id;
            const opp = isA ? b.boxerB : b.boxerA;
            const out = !b.result ? "" : b.result === "DRAW" ? "D" : b.result === "NO_CONTEST" ? "NC" : (b.result === "A_WIN") === isA ? "W" : "L";
            return (
              <tr key={b.id}>
                <td>{b.event.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</td>
                <td><Link href={`/boxeadores/${opp.slug}`}>{opp.firstName} {opp.lastName}</Link></td>
                <td className={out === "NC" ? "D" : out}>{out || "—"}</td>
                <td>{b.method ? METHOD_LABEL[b.method] : ""}{b.endRound ? ` (R${b.endRound})` : ""}</td>
                <td><Link href={`/veladas/${b.event.slug}`}>{b.event.name}</Link> <span className={`tag ${b.event.level}`}>{LEVEL_LABEL[b.event.level]}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {bouts.length === 0 && <p className="mut">Sin combates registrados.</p>}
    </>
  );
}
