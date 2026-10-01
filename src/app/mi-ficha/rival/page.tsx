import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "../../../lib/accounts/auth";
import { findNameCandidates } from "../../../lib/fighters/fighters";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../../lib/common/disciplines";
import { publicFighterName } from "../../../lib/common/names";
import { oneParam } from "../../../lib/common/safe";
import { addBout } from "../../actions/bouts";

export const metadata = { title: "¿Quién es tu rival?", robots: { index: false } };
export const dynamic = "force-dynamic";

const CAMPOS = ["discipline", "eventName", "date", "venue", "city", "province", "oppFirst", "oppLast", "outcome", "method", "rounds", "endRound", "evidenceUrl"] as const;

/**
 * Paso intermedio de «Registrar un combate»: ya hay fichas con el nombre del rival. Se pide a la persona que elija cuál es
 * (o que indique que es otra), en lugar de fusionar homónimos por el nombre.
 */
export default async function ChooseRival({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  if (!user.emailVerifiedAt) redirect("/verificar");
  if (!user.fighter) redirect("/mi-ficha");
  const sp = await searchParams;
  const valores: Record<string, string> = {};
  for (const k of CAMPOS) valores[k] = (oneParam(sp[k]) ?? "").slice(0, 500);
  if (!valores.oppFirst || !valores.oppLast) redirect("/mi-ficha");
  const candidatos = (await findNameCandidates(valores.oppFirst, valores.oppLast)).filter((c) => c.id !== user.fighter!.id);
  if (candidatos.length === 0) redirect("/mi-ficha");

  const ocultos = (rivalId: string) => (
    <>
      {CAMPOS.map((k) => valores[k] !== "" && <input key={k} type="hidden" name={k} value={valores[k]} />)}
      <input type="hidden" name="rivalId" value={rivalId} />
    </>
  );

  return (
    <>
      <h1>¿Quién es tu rival?</h1>
      <p>Ya hay {candidatos.length === 1 ? "una ficha" : "varias fichas"} con el nombre <strong>{valores.oppFirst} {valores.oppLast}</strong>. Elige cuál es tu rival para no mezclar a dos personas distintas.</p>
      <div className="grid">
        {candidatos.map((c) => (
          <form key={c.id} action={addBout} className="card">
            {ocultos(c.id)}
            <strong>{publicFighterName(c)}</strong>
            <div className="mut">
              {[...c.disciplines].sort((a, b) => DISCIPLINE_ORDER.indexOf(a.discipline) - DISCIPLINE_ORDER.indexOf(b.discipline)).map((d) => DISCIPLINE_LABEL[d.discipline]).join(", ")}
              {c.listed && c.city ? ` · ${c.city}` : ""}{c.listed && c.gym ? ` · ${c.gym.name}` : ""}
              {c.userId ? " · ficha con titular" : " · ficha sin reclamar"}
            </div>
            <button style={{ marginTop: 8 }}>Es esta persona</button>
          </form>
        ))}
        <form action={addBout} className="card">
          {ocultos("nuevo")}
          <strong>Es otra persona</strong>
          <div className="mut">Se creará una ficha nueva para {valores.oppFirst} {valores.oppLast}.</div>
          <button className="secondary" style={{ marginTop: 8 }}>Crear una ficha nueva</button>
        </form>
      </div>
      <p><Link href="/mi-ficha">Volver a «Mi ficha» sin registrar el combate</Link></p>
    </>
  );
}
