import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "../../../lib/accounts/auth";
import { loginPath } from "../../../lib/common/paths";
import { eventDayReached } from "../../../lib/common/dates";
import { db } from "../../../lib/common/db";
import { METHOD_LABEL, fmtDate } from "../../../lib/common/labels";
import SelectorCategoria from "../../components/SelectorCategoria";
import { divisionLabel } from "../../../lib/common/competition";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, METHODS_BY_DISCIPLINE, weightClassLabel, categoryLabel } from "../../../lib/common/disciplines";
import { LIMITS } from "../../../lib/common/text";
import { publicFighterName } from "../../../lib/common/names";
import { setBoutEvidence } from "../../actions/bouts";
import { addCartelBout, removeCartelBout, setBoutResult, setEventStatus, updateEvent } from "../../actions/events";
import { EVENT_KIND_LABEL, PROVINCES } from "../../../lib/common/labels";

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
  const past = eventDayReached(event.date);
  const nombre = (b: { firstName: string; lastName: string; listed?: boolean; hiddenAt?: Date | null }) => publicFighterName(b); // como lo ve el público: una ficha provisional solo enseña la inicial del apellido
  // En la lista se distinguen los homónimos con el alias, la ciudad y el gimnasio.
  const etiqueta = (b: (typeof fighters)[number]) => [nombre(b), b.alias && `«${b.alias}»`, [b.city, b.gym?.name].filter(Boolean).join(" · ")].filter(Boolean).join(" — ");
  return (
    <>
      <h1>{event.name}</h1>
      <p className="mut"><span className="tag">{DISCIPLINE_LABEL[event.discipline]}</span> {fmtDate(event.date)} · {event.venue}, {event.city} · <Link href={`/veladas/${event.slug}`}>Ver la página pública</Link></p>
      {event.status === "CANCELLED" && <p className="notice notice-bad" role="note">Esta velada está cancelada. Sigue visible con esa etiqueta y sus combates no cuentan. Puedes volver a activarla abajo.</p>}
      <p><Link href="/organizador">← Volver a mis veladas</Link></p>

      <h2>Datos de la velada</h2>
      <details>
        <summary>Corregir los datos de la velada — nombre, fecha, lugar, promotor y entradas</summary>
        <form className="search" action={updateEvent} style={{ marginTop: 8 }}>
          <input type="hidden" name="eventId" value={event.id} />
          <label className="field"><span>Nombre de la velada</span><input name="name" defaultValue={event.name} required maxLength={LIMITS.eventName} /></label>
          <label className="field"><span>Tipo</span><select name="kind" defaultValue={event.kind}>{(["VELADA", "INTERCLUB"] as const).map((k) => <option key={k} value={k}>{EVENT_KIND_LABEL[k]}</option>)}</select></label>
          <label className="field"><span>Fecha</span><input name="date" type="date" defaultValue={event.date.toISOString().slice(0, 10)} required min="1980-01-01" /></label>
          <label className="field"><span>Disciplina</span>
            <select name="discipline" defaultValue={event.discipline}>{DISCIPLINE_ORDER.map(d => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select>
            <span className="hint">Solo se puede cambiar mientras el cartel está vacío.</span>
          </label>
          <label className="field"><span>Recinto</span><input name="venue" defaultValue={event.venue} maxLength={LIMITS.venue} /></label>
          <label className="field"><span>Ciudad</span><input name="city" defaultValue={event.city} maxLength={LIMITS.city} /></label>
          <label className="field"><span>Provincia</span><select name="province" defaultValue={event.province}>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label className="field"><span>Promotor (opcional)</span><input name="promoter" defaultValue={event.promoter ?? ""} maxLength={LIMITS.promoter} /></label>
          <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Enlace para comprar entradas (opcional)</span><input name="ticketUrl" defaultValue={event.ticketUrl ?? ""} maxLength={LIMITS.url} placeholder="https://…" /></label>
          <p className="hint">Cambiar el nombre o la fecha retira los respaldos específicos de sus resultados; deberán comprobarse de nuevo.</p><button>Guardar los datos de la velada</button>
        </form>
      </details>
      <details style={{ marginTop: 8 }}>
        <summary>{event.status === "CANCELLED" ? "Volver a activar la velada" : "Cancelar la velada"}</summary>
        <form action={setEventStatus} style={{ marginTop: 8 }}>
          <input type="hidden" name="eventId" value={event.id} />
          <p className="mut">{event.status === "CANCELLED" ? "La velada volverá a aparecer como activa y sus combates volverán a contar." : "La velada seguirá visible con la etiqueta «cancelada» y sus combates dejarán de contar. Podrás volver a activarla."}</p>
          <button name="decision" value={event.status === "CANCELLED" ? "reopen" : "cancel"} className={event.status === "CANCELLED" ? undefined : "secondary"}>{event.status === "CANCELLED" ? "Volver a activar la velada" : "Sí, cancelar la velada"}</button>
        </form>
      </details>

      <h2>Añadir un combate al cartel</h2>
      <form className="search" action={addCartelBout}>
        <input type="hidden" name="eventId" value={event.id} />
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Esquina roja</span>
          <select name="fighterA" required defaultValue=""><option value="" disabled>Elige a un peleador…</option>{fighters.slice(0, MAX_LISTA).map((b) => <option key={b.id} value={b.id}>{etiqueta(b)}</option>)}</select>
        </label>
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Esquina azul</span>
          <select name="fighterB" required defaultValue=""><option value="" disabled>Elige a un peleador…</option>{fighters.slice(0, MAX_LISTA).map((b) => <option key={b.id} value={b.id}>{etiqueta(b)}</option>)}</select>
        </label>
        <SelectorCategoria modo="combate" fijas={{ discipline: event.discipline, level: event.level }} />
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
            <thead><tr><th scope="col">Combate</th><th scope="col">Categoría</th><th scope="col">Enlace del acta o del cartel</th><th scope="col">Resultado</th><th scope="col">Quitar</th></tr></thead>
            <tbody>
              {event.bouts.map((b) => {
                const cual = `${nombre(b.fighterA)} contra ${nombre(b.fighterB)}`;
                return (
                  <tr key={b.id}>
                    <th scope="row" style={{ color: "var(--text)" }}>{nombre(b.fighterA)} <span className="mut">contra</span> {nombre(b.fighterB)}</th>
                    <td className="mut">{categoryLabel(event.discipline, event.level, b.divisionId, b.weightClass)}</td>
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
                        <p className="hint">Cambiar el resultado retira su bonificación de respaldo hasta que se compruebe de nuevo.</p>

                          <input type="hidden" name="boutId" value={b.id} />
                          <select name="outcome" aria-label={`Resultado de ${cual}`} defaultValue={b.result === "A_WIN" ? "WIN" : b.result === "B_WIN" ? "LOSS" : b.result === "DRAW" ? "DRAW" : b.result === "NO_CONTEST" ? "NC" : ""}>
                            <option value="">Elige el resultado…</option><option value="WIN">Gana {b.fighterA.firstName} (esquina roja)</option><option value="LOSS">Gana {b.fighterB.firstName} (esquina azul)</option><option value="DRAW">Empate</option><option value="NC">Sin decisión</option>
                          </select>
                          <select name="method" aria-label={`Cómo terminó ${cual}`} defaultValue={b.method ?? ""}><option value="">Cómo terminó…</option>{METHODS_BY_DISCIPLINE[event.discipline].filter((m) => m !== "DRAW" && m !== "NC").map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}</select>
                          <input name="endRound" type="number" min={1} max={12} aria-label={`Asalto en que terminó ${cual}`} placeholder="Asalto" defaultValue={b.endRound ?? ""} style={{ width: 96 }} />
                          <button aria-label={`${b.result ? "Actualizar" : "Guardar"} resultado de ${cual}`}>{b.result ? "Actualizar resultado" : "Guardar resultado"}</button>
                        </form>
                      ) : <span className="mut">Se podrá indicar cuando se celebre la velada.</span>}
                    </td>
                    <td>
                      <details>
                        <summary className="mut" aria-label={`Quitar del cartel: ${cual}`}>Quitar del cartel</summary>
                        <form action={removeCartelBout} style={{ marginTop: 6 }}>
                          <input type="hidden" name="boutId" value={b.id} />
                          <p className="mut">El combate desaparece del cartel y de la página pública. Si ya tiene aura del público no se podrá quitar.</p>
                          <button className="secondary" aria-label={`Sí, quitar del cartel: ${cual}`}>Sí, quitar del cartel</button>
                        </form>
                      </details>
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
