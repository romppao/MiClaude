import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/db";
import { LEVEL_LABEL, METHOD_LABEL, fmtDate } from "../../../lib/labels";
import { DISCIPLINE_LABEL } from "../../../lib/disciplines";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await db.event.findUnique({ where: { slug }, include: { organizer: { select: { name: true, organizerRequest: { select: { orgName: true, status: true } } } }, bouts: { orderBy: { order: "desc" }, include: { fighterA: true, fighterB: true } } } });
  if (!e) notFound();
  return (
    <>
      <span className="tag">{DISCIPLINE_LABEL[e.discipline]}</span><span className={`tag ${e.level}`}>{LEVEL_LABEL[e.level]}</span>
      <h1>{e.name}</h1>
      <p className="mut">{fmtDate(e.date)} · {e.venue}, {e.city} ({e.province}){e.promoter ? ` · Organiza: ${e.promoter}` : ""}{e.organizer?.organizerRequest?.status === "APPROVED" && <span className="tag PRO" title="Organizador verificado por un moderador">✓ organizador verificado</span>}</p>
      {e.ticketUrl && <p><a className="tag PRO" href={e.ticketUrl} rel="noopener noreferrer">Entradas</a></p>}
      <h2>Cartel</h2>
      <table>
        <thead><tr><th>Esquina roja</th><th></th><th>Esquina azul</th><th>Peso</th><th>Resultado</th></tr></thead>
        <tbody>
          {e.bouts.map((b) => (
            <tr key={b.id}>
              <td className={b.result === "A_WIN" ? "W" : ""}><Link href={`/peleadores/${b.fighterA.slug}`}>{b.fighterA.firstName} {b.fighterA.lastName}</Link></td>
              <td className="mut">vs</td>
              <td className={b.result === "B_WIN" ? "W" : ""}><Link href={`/peleadores/${b.fighterB.slug}`}>{b.fighterB.firstName} {b.fighterB.lastName}</Link></td>
              <td>{b.weightClass}{b.rounds ? ` · ${b.rounds}x` : ""}</td>
              <td>{b.result ? `${b.result === "DRAW" ? "Empate" : b.result === "NO_CONTEST" ? "Sin decisión" : b.result === "A_WIN" ? "Gana rojo" : "Gana azul"}${b.method ? ` (${METHOD_LABEL[b.method]}${b.endRound ? ` R${b.endRound}` : ""})` : ""}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {e.bouts.length === 0 && <p className="mut">Cartel por anunciar.</p>}
    </>
  );
}
