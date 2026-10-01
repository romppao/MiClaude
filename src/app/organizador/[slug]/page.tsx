import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "../../../lib/accounts/auth";
import { loginPath } from "../../../lib/common/paths";
import { db } from "../../../lib/common/db";
import { METHOD_LABEL, fmtDate } from "../../../lib/common/labels";
import { DISCIPLINE_LABEL, METHODS_BY_DISCIPLINE, WEIGHT_CLASSES } from "../../../lib/common/disciplines";
import { LIMITS } from "../../../lib/common/text";
import { setBoutEvidence } from "../../actions/bouts";
import { addCartelBout, setBoutResult } from "../../actions/events";

export const metadata = { title: "Gestionar velada", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const MAX_LISTA = 500;

export default async function ManageEvent({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, user] = await Promise.all([params, getUser()]);
  if (!user) redirect(loginPath(`/organizador/${slug}`));
  const event = await db.event.findUnique({ where: { slug }, include: { bouts: { orderBy: { order: "asc" }, include: { fighterA: true, fighterB: true } } } });
  if (!event) notFound();
  if (event.organizerId !== user.id && user.role !== "ADMIN") redirect("/organizador?problema=sin_permiso");
  const fighters = await db.fighter.findMany({ where: { hiddenAt: null, disciplines: { some: { discipline: event.discipline } } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }], take: MAX_LISTA + 1, include: { gym: true } });
  const past = event.date.getTime() <= Date.now();
  const nombre = (b: { firstName: string; lastName: string }) => `${b.firstName} ${b.lastName}`;
  // En la lista se distinguen los homónimos con el alias, la ciudad y el gimnasio.
  const etiqueta = (b: (typeof fighters)[number]) => [nombre(b), b.alias && `«${b.alias}»`, [b.city, b.gym?.name].filter(Boolean).join(" · ")].filter(Boolean).join(" — ");
  return (
    <>
      <h1>{event.name}</h1>
      <p className="mut"><span className="tag">{DISCIPLINE_LABEL[event.discipline]}</span> {fmtDate(event.date)} · {event.venue}, {event.city} · <Link href={`/veladas/${event.slug}`}>Ver la página pública</Link></p>
      <p><Link href="/organizador">← Volver a mis veladas</Link></p>

      <h2>Añadir un combate al cartel</h2>
      <form className="search" action={addCartelBout}>
        <input type="hidden" name="eventId" value={event.id} />
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Esquina roja</span>
          <select name="fighterA" required defaultValue=""><option value="" disabled>Elige a un peleador…</option>{fighters.slice(0, MAX_LISTA).map((b) => <option key={b.id} value={b.id}>{etiqueta(b)}</option>)}</select>
        </label>
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Esquina azul</span>
          <select name="fighterB" required defaultValue=""><option value="" disabled>Elige a un peleador…</option>{fighters.slice(0, MAX_LISTA).map((b) => <option key={b.id} value={b.id}>{etiqueta(b)}</option>)}</select>
        </label>
        <label className="field"><span>Categoría de peso (opcional)</span>
          <select name="weightClass" defaultValue=""><option value="">Sin indicar</option>{WEIGHT_CLASSES[event.discipline].map((w) => <option key={w}>{w}</option>)}</select>
        </label>
        <label className="field"><span>Número de asaltos (opcional)</span><input name="rounds" type="number" min={1} max={12} /></label>
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Enlace del acta o del cartel (opcional)</span><input name="evidenceUrl" type="url" maxLength={LIMITS.url} placeholder="https://…" /></label>
        <button>Añadir al cartel</button>
      </form>
      <p className="mut">Elige a cada peleador de la lista desplegable. Si alguien no aparece, debe crear o reclamar antes su ficha en Ring España.{fighters.length > MAX_LISTA && ` Se muestran los primeros ${MAX_LISTA} de la disciplina.`}</p>

      <h2>Cartel</h2>
      {event.bouts.length === 0 ? <p className="mut">El cartel está vacío. Añade el primer combate con el formulario de arriba.</p> : (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Combates del cartel</caption>
            <thead><tr><th scope="col">Combate</th><th scope="col">Categoría</th><th scope="col">Enlace del acta o del cartel</th><th scope="col">Resultado</th></tr></thead>
            <tbody>
              {event.bouts.map((b) => {
                const cual = `${nombre(b.fighterA)} contra ${nombre(b.fighterB)}`;
                return (
                  <tr key={b.id}>
                    <th scope="row" style={{ color: "var(--text)" }}>{nombre(b.fighterA)} <span className="mut">contra</span> {nombre(b.fighterB)}</th>
                    <td className="mut">{b.weightClass ?? "—"}</td>
                    <td>
                      <form action={setBoutEvidence} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="back" value={`/organizador/${event.slug}`} />
                        <input name="evidenceUrl" type="url" defaultValue={b.evidenceUrl ?? ""} maxLength={LIMITS.url} aria-label={`Enlace del acta o del cartel de ${cual}`} placeholder="https://…" />
                        <button className="secondary" aria-label={`Guardar el enlace de ${cual}`}>Guardar enlace</button>
                      </form>
                    </td>
                    <td>
                      {past ? (
                        <form action={setBoutResult} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <input type="hidden" name="boutId" value={b.id} />
                          <select name="outcome" aria-label={`Resultado de ${cual}`} defaultValue={b.result === "A_WIN" ? "WIN" : b.result === "B_WIN" ? "LOSS" : b.result === "DRAW" ? "DRAW" : b.result === "NO_CONTEST" ? "NC" : "WIN"}>
                            <option value="WIN">Gana {b.fighterA.firstName} (esquina roja)</option><option value="LOSS">Gana {b.fighterB.firstName} (esquina azul)</option><option value="DRAW">Empate</option><option value="NC">Sin decisión</option>
                          </select>
                          <select name="method" aria-label={`Cómo terminó ${cual}`} defaultValue={b.method ?? METHODS_BY_DISCIPLINE[event.discipline][0]}>{METHODS_BY_DISCIPLINE[event.discipline].filter((m) => m !== "DRAW" && m !== "NC").map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}</select>
                          <input name="endRound" type="number" min={1} max={12} aria-label={`Asalto en que terminó ${cual}`} placeholder="Asalto" defaultValue={b.endRound ?? ""} style={{ width: 96 }} />
                          <button aria-label={`${b.result ? "Actualizar" : "Guardar"} el resultado de ${cual}`}>{b.result ? "Actualizar resultado" : "Guardar resultado"}</button>
                        </form>
                      ) : <span className="mut">Se podrá indicar cuando se celebre la velada.</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
