import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/common/db";
import { LEVEL_LABEL, METHOD_LABEL, fmtDate } from "../../../lib/common/labels";
import { divisionLabel } from "../../../lib/common/competition";
import { DISCIPLINE_LABEL, weightClassLabel } from "../../../lib/common/disciplines";
import { publicFighterName } from "../../../lib/common/names";
import VerificationTag from "../../components/VerificationTag";
import { eventDayReached } from "../../../lib/common/dates";

export const dynamic = "force-dynamic";

const getEvent = cache((slug: string) =>
  db.event.findUnique({
    where: { slug },
    include: { organizer: { select: { organizerRequest: { select: { orgName: true, status: true } } } }, bouts: { orderBy: { order: "desc" }, include: { fighterA: true, fighterB: true } } },
  }),
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return { title: "Velada no encontrada" };
  return { title: e.name, description: `${e.name}: ${DISCIPLINE_LABEL[e.discipline]} · ${fmtDate(e.date)} · ${e.venue}, ${e.city}. Cartel y resultados en Ring España.` };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEvent(slug);
  if (!e) notFound();
  const org = e.organizer?.organizerRequest;
  const oficial = !!e.organizerId && org?.status === "APPROVED";
  return (
    <>
      <span className="tag">{DISCIPLINE_LABEL[e.discipline]}</span><span className={`tag ${e.level}`}>{LEVEL_LABEL[e.level]}</span>
      {e.status === "CANCELLED" && <span className="tag">velada cancelada</span>}
      {!e.organizerId && <span className="tag">no oficial</span>}
      <h1>{e.name}</h1>
      {!e.organizerId && <p className="mut">Esta velada no la ha publicado un organizador: la indicó un peleador al registrar su combate. Los datos pueden estar incompletos.</p>}
      <p className="mut">
        {fmtDate(e.date)} · {e.venue}, {e.city} ({e.province})
        {oficial && <> · Publicada por <strong>{org?.orgName}</strong> <span className="tag PRO" title="Organizador verificado por un moderador">✓ organizador verificado</span></>}
        {e.promoter && <> · Promotor indicado por el organizador: {e.promoter}</>}
      </p>
      {e.ticketUrl && <p className="acciones"><a className="btn" href={e.ticketUrl} target="_blank" rel="noopener noreferrer nofollow">Comprar entradas<span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra página web)</span></a></p>}
      <h2>Cartel</h2>
      <div className="table-wrap" tabIndex={0} role="region" aria-label={`Cartel de ${e.name}`}>
      <table className="apilada">
        <caption className="mut" style={{ textAlign: "left" }}>Combates de la velada. La esquina roja aparece primero.</caption>
        <thead><tr><th scope="col">Esquina roja</th><th scope="col"><span className="sr-only">contra</span></th><th scope="col">Esquina azul</th><th scope="col">Categoría</th><th scope="col">Resultado</th><th scope="col">Respaldo</th></tr></thead>
        <tbody>
          {e.bouts.map((b) => {
            const enRevision = b.verification === "DISPUTED"; // un combate rechazado no se muestra como un hecho
            // Lo que declara un peleador sobre su rival no se da por hecho en ningún sitio hasta que el rival lo confirme (igual que en las fichas).
            const pendiente = b.verification === "SELF_REPORTED";
            const oculto = enRevision || pendiente;
            const ganador = oculto ? null : b.result === "A_WIN" ? publicFighterName(b.fighterA) : b.result === "B_WIN" ? publicFighterName(b.fighterB) : null;
            return (
              <tr key={b.id}>
                <td data-label="Esquina roja" className={!oculto && b.result === "A_WIN" ? "W" : ""}><Link href={`/peleadores/${b.fighterA.slug}`}>{publicFighterName(b.fighterA)}</Link></td>
                <td className="mut solo-ancho">contra</td>
                <td data-label="Esquina azul" className={!oculto && b.result === "B_WIN" ? "W" : ""}><Link href={`/peleadores/${b.fighterB.slug}`}>{publicFighterName(b.fighterB)}</Link></td>
                <td data-label="Categoría">{[divisionLabel(b.divisionId), b.weightClass ? weightClassLabel(e.discipline, e.level, b.weightClass, b.divisionId) : null, b.rounds ? `${b.rounds} asaltos` : null].filter(Boolean).join(" · ")}</td>
                <td data-label="Resultado">
                  {enRevision ? <span className="mut">Resultado en revisión</span>
                    : pendiente ? <span className="mut">Resultado pendiente de confirmar por el rival</span>
                    : !b.result ? <span className="mut">{eventDayReached(e.date) ? "Resultado por anotar" : "Próximo combate"}</span>
                    : b.result === "DRAW" ? "Empate"
                    : b.result === "NO_CONTEST" ? "Sin decisión"
                    : <>Gana {ganador}{b.method ? ` (${METHOD_LABEL[b.method]}${b.endRound ? `, asalto ${b.endRound}` : ""})` : ""}</>}
                </td>
                <td data-label="Respaldo">{b.result || oculto ? <VerificationTag verification={b.verification} /> : <span className="mut">—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      {e.bouts.length === 0 && <p className="mut">Cartel por anunciar.</p>}
    </>
  );
}
