import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "../../lib/auth";
import { db } from "../../lib/db";
import { PROVINCES } from "../../lib/labels";
import { computeRecords } from "../../lib/record";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../lib/disciplines";
import DisciplineFields from "../DisciplineFields";
import RecordCards from "../RecordCards";
import { addBout, createMyFighter, requestClaim, respondBout, saveDiscipline, setBoutEvidence } from "../actions";

export const metadata = { title: "Mi ficha" };
export const dynamic = "force-dynamic";
const ERR: Record<string, string> = { nombre: "Nombre y apellidos son obligatorios.", combate: "Revisa los datos del combate (evento, fecha y rival).", reclamar: "Esa ficha ya no está disponible.", url: "El enlace de evidencia no es válido (debe empezar por http:// o https://)." };

export default async function MyProfile({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string; q?: string }> }) {
  const user = await requireUser();
  if (!user.emailVerifiedAt) redirect("/verificar");
  const { error, ok, q } = await searchParams;
  const me = user.fighter;

  if (!me) {
    const [candidates, myClaims] = await Promise.all([
      q ? db.fighter.findMany({ where: { userId: null, OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] }, include: { gym: true }, take: 10 }) : Promise.resolve([]),
      db.claimRequest.findMany({ where: { userId: user.id }, include: { fighter: true }, orderBy: { createdAt: "desc" } }),
    ]);
    return (
      <>
        <h1>¿Ya apareces en Ring España?</h1>
        <p className="mut">Si alguien ya registró un combate tuyo, tu ficha existe. Búscala y reclámala; un moderador la revisará.</p>
        {ok && <p className="W">Solicitud enviada. Te avisaremos cuando un moderador la revise.</p>}
        <form className="search"><input name="q" defaultValue={q} placeholder="Tu nombre o apellidos" /><button>Buscar mi ficha</button></form>
        {candidates.map((b) => (
          <form key={b.id} action={requestClaim} className="card" style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input type="hidden" name="fighterId" value={b.id} />
            <strong>{b.firstName} {b.lastName}</strong><span className="mut">{b.city ?? ""}{b.gym ? ` · ${b.gym.name}` : ""}</span>
            <input name="message" placeholder="¿Cómo podemos comprobar que eres tú? (gimnasio, entrenador, licencia…)" style={{ flex: 1, minWidth: 220 }} />
            <button>Reclamar</button>
          </form>
        ))}
        {q && candidates.length === 0 && <p className="mut">No hay fichas sin dueño con ese nombre.</p>}
        {myClaims.length > 0 && <p className="mut">Tus solicitudes: {myClaims.map((c) => `${c.fighter.firstName} ${c.fighter.lastName} (${c.status === "PENDING" ? "pendiente" : c.status === "APPROVED" ? "aprobada" : "rechazada"})`).join(", ")}</p>}
        <h2>Si no apareces, crea tu ficha</h2>
        {error && <p className="L">{ERR[error]}</p>}
        <form className="search" action={createMyFighter} style={{ flexDirection: "column", maxWidth: 560 }}>
          <label className="field"><span>Nombre</span><input name="firstName" required /></label>
          <label className="field"><span>Apellidos</span><input name="lastName" required /></label>
          <label className="field"><span>Alias (opcional)</span><input name="alias" /></label>
          <label className="field"><span>Gimnasio (opcional)</span><input name="gym" /></label>
          <label className="field"><span>Ciudad</span><input name="city" defaultValue="Madrid" /></label>
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
  const toConfirm = bouts.filter((b) => b.verification === "SELF_REPORTED" && b.fighterBId === me.id);

  return (
    <>
      <h1>{me.firstName} {me.lastName}</h1>
      <p><Link href={`/peleadores/${me.slug}`}>Ver mi ficha pública</Link></p>
      {error && <p className="L">{ERR[error]}</p>}
      <RecordCards records={records} disciplines={me.disciplines} />

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
          <table><tbody>
            {toConfirm.map((b) => (
              <tr key={b.id}>
                <td>{b.event.name} · {b.event.date.toLocaleDateString("es-ES")}</td>
                <td>vs {b.fighterA.firstName} {b.fighterA.lastName}</td>
                <td>
                  <form action={respondBout} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="boutId" value={b.id} />
                    <button name="decision" value="confirm">Sí, es correcto</button>
                    <button name="decision" value="dispute" className="secondary">No es correcto</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody></table>
        </>
      )}

      <h2>Registrar un combate</h2>
      <form className="search" action={addBout}>
        <label className="field"><span>Disciplina</span>
          <select name="discipline" defaultValue={me.disciplines[0]?.discipline}>
            {me.disciplines.map((d) => <option key={d.discipline} value={d.discipline}>{DISCIPLINE_LABEL[d.discipline]}</option>)}
          </select>
        </label>
        <label className="field"><span>Nombre de la velada</span><input name="eventName" required /></label>
        <label className="field"><span>Fecha</span><input name="date" type="date" required /></label>
        <label className="field"><span>Recinto (opcional)</span><input name="venue" /></label>
        <label className="field"><span>Ciudad</span><input name="city" defaultValue="Madrid" /></label>
        <label className="field"><span>Nombre de tu rival</span><input name="oppFirst" required /></label>
        <label className="field"><span>Apellidos de tu rival</span><input name="oppLast" required /></label>
        <label className="field"><span>Resultado</span>
          <select name="outcome" defaultValue="WIN"><option value="WIN">Gané</option><option value="LOSS">Perdí</option><option value="DRAW">Empate</option></select>
        </label>
        <label className="field"><span>Cómo terminó</span>
          <select name="method" defaultValue="UD">
            <option value="UD">Decisión unánime</option><option value="SD">Decisión dividida</option><option value="MD">Decisión mayoritaria</option>
            <option value="KO">KO</option><option value="TKO">TKO</option><option value="SUBMISSION">Sumisión</option><option value="POINTS">Puntos</option><option value="ADVANTAGE">Ventajas</option>
            <option value="RTD">Abandono</option><option value="DQ">Descalificación</option><option value="DRAW">Empate</option>
          </select>
          <span className="hint">Elige la que corresponda a tu disciplina (la sumisión, los puntos y las ventajas solo existen en MMA y jiu-jitsu).</span>
        </label>
        <label className="field"><span>Número de asaltos (opcional)</span><input name="rounds" type="number" min={1} max={12} /></label>
        <label className="field" style={{ flex: 1, minWidth: 260 }}><span>Enlace que lo demuestre (opcional)</span><input name="evidenceUrl" placeholder="Acta, cartel, vídeo o publicación" /><span className="hint">Un enlace ayuda a que tu combate se confirme antes.</span></label>
        <button>Registrar este combate</button>
      </form>
      <h2>Mis combates y su evidencia</h2>
      <table><tbody>
        {bouts.map((b) => (
          <tr key={b.id}>
            <td>{b.event.name} · {b.event.date.toLocaleDateString("es-ES")}</td>
            <td>vs {b.fighterAId === me.id ? `${b.fighterB.firstName} ${b.fighterB.lastName}` : `${b.fighterA.firstName} ${b.fighterA.lastName}`}</td>
            <td><span className="tag">{b.verification === "SELF_REPORTED" ? "pendiente de confirmar" : b.verification === "CONFIRMED" ? "confirmado por el rival" : b.verification === "VERIFIED" ? "verificado" : "en revisión"}</span></td>
            <td>
              <form action={setBoutEvidence} style={{ display: "flex", gap: 4 }}>
                <input type="hidden" name="boutId" value={b.id} />
                <input name="evidenceUrl" defaultValue={b.evidenceUrl ?? ""} placeholder="Enlace que lo demuestre" aria-label="Enlace que demuestra este combate" />
                <button>Guardar enlace</button>
              </form>
            </td>
          </tr>
        ))}
      </tbody></table>
      <p className="mut">Tus combates aparecen como «sin confirmar» hasta que tu rival (si tiene cuenta) o un moderador los verifique.</p>
    </>
  );
}
