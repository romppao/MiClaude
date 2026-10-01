import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { PROVINCES, VERIFICATION_LABEL } from "../../lib/common/labels";
import { LIMITS } from "../../lib/common/text";
import { publicFighterName } from "../../lib/common/names";
import { searchIds } from "../../lib/common/search";
import { oneParam } from "../../lib/common/safe";
import { eventDayReached } from "../../lib/common/dates";
import { OUTCOME_TO_RESULT } from "../../lib/bouts/rules";
import { computeRecords } from "../../lib/fighters/record";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../lib/common/disciplines";
import DisciplineFields from "../components/DisciplineFields";
import RecordCards from "../components/RecordCards";
import { addBout, respondBout, setBoutEvidence, setMyBoutResult } from "../actions/bouts";
import { createMyFighter, requestClaim, saveDiscipline, updateMyFighter } from "../actions/fighters";

export const metadata = { title: "Mi ficha" };
export const dynamic = "force-dynamic";

export default async function MyProfile({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const user = await requireUser("/mi-ficha");
  if (!user.emailVerifiedAt) redirect("/verificar");
  const q = oneParam((await searchParams).q)?.slice(0, 100);
  const me = user.fighter;

  if (!me) {
    const claimIds = await searchIds("fighterUnclaimed", q);
    const [candidates, myClaims] = await Promise.all([
      q ? db.fighter.findMany({ where: { id: { in: claimIds ?? [] } }, include: { gym: true, disciplines: true, _count: { select: { boutsAsA: true, boutsAsB: true } } }, take: 10 }) : Promise.resolve([]),
      db.claimRequest.findMany({ where: { userId: user.id }, include: { fighter: true }, orderBy: { createdAt: "desc" } }),
    ]);
    return (
      <>
        <h1>¿Ya apareces en Ring España?</h1>
        <p className="mut">Si alguien ya registró un combate tuyo, tu ficha existe. Búscala y reclámala; un moderador la revisará.</p>
        <form className="search"><input name="q" defaultValue={q} placeholder="Tu nombre o apellidos" /><button>Buscar mi ficha</button></form>
        {candidates.map((b) => (
          <form key={b.id} action={requestClaim} className="card" style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input type="hidden" name="fighterId" value={b.id} />
            <strong>{publicFighterName(b)}</strong><span className="mut">{b.disciplines.map((d) => DISCIPLINE_LABEL[d.discipline]).join(", ")} · {b._count.boutsAsA + b._count.boutsAsB} combates registrados{b.city ? ` · ${b.city}` : ""}{b.gym ? ` · ${b.gym.name}` : ""}</span>
            <label className="field" style={{ flex: 1, minWidth: 220 }}><span>¿Cómo podemos comprobar que eres tú?</span><input name="message" maxLength={LIMITS.message} placeholder="Gimnasio, entrenador, velada donde combatiste…" /><span className="hint">No escribas números de documento.</span></label>
            <button aria-label={`Reclamar la ficha de ${publicFighterName(b)}`}>Reclamar esta ficha</button>
          </form>
        ))}
        {q && candidates.length === 0 && <p className="mut">No hay fichas sin dueño con ese nombre.</p>}
        {myClaims.length > 0 && (
          <>
            <h2>Tus solicitudes</h2>
            <ul>
              {myClaims.map((c) => (
                <li key={c.id}>
                  <strong>{publicFighterName(c.fighter)}</strong>:{" "}
                  {c.status === "PENDING" ? "pendiente de revisión por un moderador (vuelve a esta página para ver la respuesta)" : c.status === "APPROVED" ? "aprobada" : "rechazada"}
                  {c.status === "REJECTED" && c.reviewNote ? <> — motivo: {c.reviewNote}</> : null}
                </li>
              ))}
            </ul>
          </>
        )}
        <h2>Si no apareces, crea tu ficha</h2>
        <form className="search" action={createMyFighter} style={{ flexDirection: "column", maxWidth: 560 }}>
          <label className="field"><span>Nombre</span><input name="firstName" required maxLength={LIMITS.firstName} autoComplete="given-name" /></label>
          <label className="field"><span>Apellidos</span><input name="lastName" required maxLength={LIMITS.lastName} autoComplete="family-name" /></label>
          <label className="field"><span>Alias (opcional)</span><input name="alias" maxLength={LIMITS.alias} /></label>
          <label className="field"><span>Gimnasio (opcional)</span><input name="gym" maxLength={LIMITS.gym} /></label>
          <label className="field"><span>Ciudad</span><input name="city" defaultValue="Madrid" maxLength={LIMITS.city} /></label>
          <label className="field"><span>Provincia</span><select name="province" defaultValue="Madrid">{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <DisciplineFields />
          <button>Crear mi ficha</button>
        </form>
      </>
    );
  }

  const bouts = await db.bout.findMany({
    where: { OR: [{ fighterAId: me.id }, { fighterBId: me.id }] },
    include: { event: true, fighterA: true, fighterB: true },
    orderBy: { event: { date: "desc" } },
  });
  const records = computeRecords(me.id, bouts);
  const gym = me.gymId ? await db.gym.findUnique({ where: { id: me.gymId } }) : null;
  const toConfirm = bouts.filter((b) => b.verification === "SELF_REPORTED" && b.fighterBId === me.id);

  return (
    <>
      <h1>{me.firstName} {me.lastName}</h1>
      <p><Link href={`/peleadores/${me.slug}`}>Ver mi ficha pública</Link></p>
      <RecordCards records={records} disciplines={me.disciplines} />

      <h2>Mis datos</h2>
      <details className="card" style={{ marginBottom: 8 }}>
        <summary><strong>Corregir los datos de mi ficha</strong> <span className="mut">— nombre, alias, procedencia, gimnasio, medidas y presentación</span></summary>
        <form className="search" action={updateMyFighter} style={{ flexDirection: "column", maxWidth: 560 }}>
          <label className="field"><span>Nombre</span><input name="firstName" defaultValue={me.firstName} required maxLength={LIMITS.firstName} autoComplete="given-name" /></label>
          <label className="field"><span>Apellidos</span><input name="lastName" defaultValue={me.lastName} required maxLength={LIMITS.lastName} autoComplete="family-name" /></label>
          <label className="field"><span>Alias (opcional)</span><input name="alias" defaultValue={me.alias ?? ""} maxLength={LIMITS.alias} /></label>
          <label className="field"><span>Gimnasio (opcional)</span><input name="gym" defaultValue={gym?.name ?? ""} maxLength={LIMITS.gym} /></label>
          <label className="field"><span>Ciudad</span><input name="city" defaultValue={me.city ?? ""} maxLength={LIMITS.city} /></label>
          <label className="field"><span>Provincia</span><select name="province" defaultValue={me.province ?? "Madrid"}>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label className="field"><span>Fecha de nacimiento (opcional)</span><input name="birthDate" type="date" defaultValue={me.birthDate ? me.birthDate.toISOString().slice(0, 10) : ""} min="1920-01-01" /><span className="hint">En público solo se muestra tu edad.</span></label>
          <label className="field"><span>Guardia (opcional)</span>
            <select name="stance" defaultValue={me.stance ?? ""}><option value="">Sin indicar</option><option value="ORTODOXO">Ortodoxo</option><option value="ZURDO">Zurdo</option><option value="AMBIDIESTRO">Ambidiestro</option></select>
          </label>
          <label className="field"><span>Altura en centímetros (opcional)</span><input name="heightCm" inputMode="numeric" defaultValue={me.heightCm ?? ""} maxLength={3} /></label>
          <label className="field"><span>Envergadura en centímetros (opcional)</span><input name="reachCm" inputMode="numeric" defaultValue={me.reachCm ?? ""} maxLength={3} /></label>
          <label className="field"><span>Presentación (opcional)</span><textarea name="bio" defaultValue={me.bio ?? ""} maxLength={LIMITS.bio} rows={4} /></label>
          <button>Guardar los datos de mi ficha</button>
        </form>
      </details>
      <p className="mut">Tu correo electrónico, tu contraseña, tus avisos y la eliminación de tu cuenta están en <Link href="/mi-cuenta">Mi cuenta</Link>.</p>

      <h2>Mis disciplinas</h2>
      {[...me.disciplines].sort((a, b) => DISCIPLINE_ORDER.indexOf(a.discipline) - DISCIPLINE_ORDER.indexOf(b.discipline)).map((d) => (
        <details key={d.discipline} className="card" style={{ marginBottom: 8 }}>
          <summary><strong>{DISCIPLINE_LABEL[d.discipline]}</strong>{d.weightClass ? ` · ${d.weightClass}` : ""} <span className="mut">— cambiar categoría o combates anteriores</span></summary>
          <form className="search" action={saveDiscipline}>
            <DisciplineFields defaults={d} />
            <button>Guardar cambios</button>
          </form>
        </details>
      ))}
      <details className="card" style={{ marginBottom: 8 }}>
        <summary><strong>Añadir otra disciplina</strong> <span className="mut">— por ejemplo MMA, kickboxing, K-1 o jiu-jitsu</span></summary>
        <form className="search" action={saveDiscipline}>
          <DisciplineFields defaults={{ discipline: DISCIPLINE_ORDER.find((d) => !me.disciplines.some((x) => x.discipline === d)) ?? "BOXEO" }} />
          <button>Añadir disciplina</button>
        </form>
      </details>

      {toConfirm.length > 0 && (
        <>
          <h2>Combates que tu rival ha registrado y necesitan tu respuesta</h2>
          <p className="mut">Tu rival dice que combatisteis y que el resultado fue el que ves aquí. Si es correcto, confírmalo; si no, indícalo.</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {toConfirm.map((b) => {
              const rival = `${b.fighterA.firstName} ${b.fighterA.lastName}`;
              const resultado = !b.result ? "sin resultado indicado" : b.result === "DRAW" ? "empate" : b.result === "NO_CONTEST" ? "sin decisión" : b.result === "A_WIN" ? `gana ${rival}` : `ganas tú`;
              return (
                <li key={b.id} className="card" style={{ marginBottom: 8 }}>
                  <strong>{b.event.name}</strong> · {b.event.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}
                  <div className="mut">Combate contra {rival}: {resultado}.</div>
                  <form action={respondBout} style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    <input type="hidden" name="boutId" value={b.id} />
                    <button name="decision" value="confirm" aria-label={`Confirmar que es correcto el combate contra ${rival} en ${b.event.name}`}>Sí, es correcto</button>
                    <button name="decision" value="dispute" className="secondary" aria-label={`Indicar que no es correcto el combate contra ${rival} en ${b.event.name}`}>No es correcto</button>
                  </form>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <h2>Registrar un combate</h2>
      <form className="search" action={addBout}>
        <label className="field"><span>Disciplina</span>
          <select name="discipline" defaultValue={me.disciplines[0]?.discipline}>
            {me.disciplines.map((d) => <option key={d.discipline} value={d.discipline}>{DISCIPLINE_LABEL[d.discipline]}</option>)}
          </select>
        </label>
        <label className="field"><span>Nombre de la velada</span><input name="eventName" required maxLength={LIMITS.eventName} /></label>
        <label className="field"><span>Fecha</span><input name="date" type="date" required min="1980-01-01" /></label>
        <label className="field"><span>Recinto (opcional)</span><input name="venue" maxLength={LIMITS.venue} /></label>
        <label className="field"><span>Ciudad</span><input name="city" defaultValue={me.city ?? "Madrid"} maxLength={LIMITS.city} /></label>
        <label className="field"><span>Provincia</span><select name="province" defaultValue={me.province ?? "Madrid"}>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label className="field"><span>Nombre de tu rival</span><input name="oppFirst" required maxLength={LIMITS.firstName} /></label>
        <label className="field"><span>Apellidos de tu rival</span><input name="oppLast" required maxLength={LIMITS.lastName} /></label>
        <label className="field"><span>Resultado</span>
          <select name="outcome" defaultValue="">
            <option value="">Elige el resultado…</option>
            <option value="WIN">Gané</option><option value="LOSS">Perdí</option><option value="DRAW">Empate</option><option value="NC">Sin decisión</option>
          </select>
          <span className="hint">Si el combate todavía no se ha celebrado, déjalo sin elegir: podrás añadirlo después.</span>
        </label>
        <label className="field"><span>Cómo terminó</span>
          <select name="method" defaultValue="">
            <option value="">Elige cómo terminó…</option>
            <option value="UD">Decisión unánime</option><option value="SD">Decisión dividida</option><option value="MD">Decisión mayoritaria</option>
            <option value="KO">KO</option><option value="TKO">TKO</option><option value="SUBMISSION">Sumisión</option><option value="POINTS">Puntos</option><option value="ADVANTAGE">Ventajas</option>
            <option value="RTD">Abandono</option><option value="DQ">Descalificación</option>
          </select>
          <span className="hint">Elige la que corresponda a tu disciplina (la sumisión, los puntos y las ventajas solo existen en MMA y jiu-jitsu). En empates no hace falta.</span>
        </label>
        <label className="field"><span>Número de asaltos (opcional)</span><input name="rounds" type="number" min={1} max={12} /></label>
        <label className="field"><span>Asalto en que terminó (opcional)</span><input name="endRound" type="number" min={1} max={12} /><span className="hint">Solo si acabó por KO, TKO, abandono, sumisión o descalificación.</span></label>
        <label className="field" style={{ flex: 1, minWidth: 260 }}><span>Enlace que lo demuestre (opcional)</span><input name="evidenceUrl" maxLength={LIMITS.url} placeholder="Acta, cartel, vídeo o publicación" /><span className="hint">Un enlace ayuda a que tu combate se confirme antes.</span></label>
        <button>Registrar este combate</button>
      </form>
      <h2>Mis combates</h2>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Tus combates con su estado, su resultado y su enlace de evidencia</caption>
          <thead><tr><th scope="col">Combate</th><th scope="col">Estado</th><th scope="col">Resultado</th><th scope="col">Enlace que lo demuestra</th></tr></thead>
          <tbody>
            {bouts.map((b) => {
              const isA = b.fighterAId === me.id;
              const soyAutor = b.createdById === user.id;
              const opp = isA ? b.fighterB : b.fighterA;
              const puedeCorregir = soyAutor && b.verification === "SELF_REPORTED" && eventDayReached(b.event.date);
              return (
                <tr key={b.id}>
                  <td>{b.event.name} · {b.event.date.toLocaleDateString("es-ES")}<div className="mut">contra {publicFighterName(opp)}</div></td>
                  <td><span className="tag">{VERIFICATION_LABEL[b.verification]}</span></td>
                  <td>
                    {b.result ? <span>{b.result === "DRAW" ? "Empate" : b.result === "NO_CONTEST" ? "Sin decisión" : (b.result === "A_WIN") === isA ? "Victoria" : "Derrota"}</span> : <span className="mut">Sin resultado</span>}
                    {puedeCorregir && (
                      <details style={{ marginTop: 6 }}>
                        <summary className="mut">{b.result ? "Corregir el resultado" : "Añadir el resultado"}</summary>
                        <form action={setMyBoutResult} style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                          <input type="hidden" name="boutId" value={b.id} />
                          <select name="outcome" aria-label="Resultado" defaultValue="">
                            <option value="">Elige el resultado…</option>
                            {Object.keys(OUTCOME_TO_RESULT).map((k) => <option key={k} value={k}>{k === "WIN" ? "Gané" : k === "LOSS" ? "Perdí" : k === "DRAW" ? "Empate" : "Sin decisión"}</option>)}
                          </select>
                          <select name="method" aria-label="Cómo terminó" defaultValue="">
                            <option value="">Cómo terminó…</option>
                            <option value="UD">Decisión unánime</option><option value="SD">Decisión dividida</option><option value="MD">Decisión mayoritaria</option>
                            <option value="KO">KO</option><option value="TKO">TKO</option><option value="SUBMISSION">Sumisión</option><option value="POINTS">Puntos</option><option value="ADVANTAGE">Ventajas</option>
                            <option value="RTD">Abandono</option><option value="DQ">Descalificación</option>
                          </select>
                          <input name="endRound" type="number" min={1} max={12} aria-label="Asalto en que terminó (opcional)" placeholder="Asalto" style={{ width: 90 }} />
                          <button className="secondary">Guardar resultado</button>
                        </form>
                      </details>
                    )}
                  </td>
                  <td>
                    {b.verification === "SELF_REPORTED" ? (
                      <form action={setBoutEvidence} style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <input type="hidden" name="boutId" value={b.id} />
                        <input name="evidenceUrl" defaultValue={b.evidenceUrl ?? ""} maxLength={LIMITS.url} placeholder="Enlace que lo demuestre" aria-label={`Enlace que demuestra el combate ${b.event.name}`} />
                        <button className="secondary" aria-label={`Guardar el enlace del combate ${b.event.name}`}>Guardar enlace</button>
                      </form>
                    ) : b.evidenceUrl ? <a href={b.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow ugc">Ver evidencia<span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra pestaña)</span></a> : <span className="mut">Combate ya confirmado o verificado</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mut">Tus combates aparecen como «pendiente de confirmar» hasta que tu rival (si tiene cuenta) o un moderador los verifique. Lo que declaras sobre tu rival no cuenta en su récord hasta que él lo confirme.</p>
    </>
  );
}
