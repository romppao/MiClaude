import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { fmtDate } from "../../lib/common/labels";
import { CLASS_KIND_LABEL, classMeta } from "../../lib/trainers/classes";
import { REQUEST_STATUS_LABEL, puedeCancelar } from "../../lib/trainers/requests";
import { cancelClassRequest } from "../actions/trainers";

export const metadata: Metadata = { title: "Mis reservas de clases", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const PILDORA = { PENDING: "pildora-violeta", ACCEPTED: "pildora-acc", DECLINED: "", CANCELLED: "" } as const;

/** Las clases que ha solicitado la persona, con la respuesta del entrenador y la opción de cancelar. */
export default async function MisReservas() {
  const user = await requireUser("/mis-reservas");
  const solicitudes = await db.classRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50, include: { class: { include: { trainer: { include: { gym: true } } } } } });
  return (
    <div className="pantalla" style={{ gap: 14 }}>
      <div><h1>Mis reservas de clases</h1><p className="lead" style={{ fontSize: 16 }}>Las clases que has solicitado y lo que te ha respondido cada entrenador.</p></div>
      {solicitudes.length === 0 && (
        <div className="tarjeta"><p style={{ margin: 0 }}>Todavía no has solicitado ninguna clase. Busca un entrenador y pulsa «Solicitar esta clase» en la que te interese.</p><Link className="btn" href="/entrenadores">Buscar entrenadores</Link></div>
      )}
      {solicitudes.map((r) => (
        <section key={r.id} className="tarjeta" aria-label={`${r.class.title}: ${REQUEST_STATUS_LABEL[r.status]}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span className={`pildora ${PILDORA[r.status]}`}>{REQUEST_STATUS_LABEL[r.status]}</span><span className="meta">Solicitada el {fmtDate(r.createdAt)}</span></div>
          <div><h2 style={{ margin: 0, font: "700 18px/1.2 var(--font)" }}>{r.class.title}</h2><div className="meta">{CLASS_KIND_LABEL[r.class.kind]} · {classMeta(r.class)} · {r.class.priceEuros} € · con <Link href={`/entrenadores/${r.class.trainer.slug}`}>{r.class.trainer.name}</Link>{r.class.trainer.gym ? ` (${r.class.trainer.gym.name})` : ""}</div></div>
          <div className="meta">Propusiste: {r.preferred}</div>
          {r.reply && <p style={{ margin: 0 }}><strong>Respuesta de {r.class.trainer.name}:</strong> {r.reply}</p>}
          {r.status === "ACCEPTED" && <p className="mut" style={{ margin: 0 }}>La clase se paga directamente al entrenador. Si necesitas hablar con él, respóndele al correo que te enviamos.</p>}
          {r.status === "DECLINED" && <p className="mut" style={{ margin: 0 }}>Puedes <Link href={`/clases/${r.classId}/solicitar`}>solicitarla otra vez con otras fechas</Link> o buscar otro entrenador.</p>}
          {puedeCancelar(r.status) && (
            <form action={cancelClassRequest} style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
              <input type="hidden" name="requestId" value={r.id} />
              <button className="secondary" aria-label={`Cancelar la solicitud de «${r.class.title}»`}>Cancelar la solicitud</button>
            </form>
          )}
        </section>
      ))}
    </div>
  );
}
