import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import VerificationTag from "../components/VerificationTag";
import { PROVINCES } from "../../lib/common/labels";
import { LIMITS } from "../../lib/common/text";
import { publicFighterName } from "../../lib/common/names";
import { searchIds } from "../../lib/common/search";
import { oneParam } from "../../lib/common/safe";
import { eventDayReached } from "../../lib/common/dates";
import { OUTCOME_TO_RESULT, boutVersion } from "../../lib/bouts/rules";
import { computeRecords } from "../../lib/fighters/record";
import SelectorCategoria from "../components/SelectorCategoria";
import { divisionLabel } from "../../lib/common/competition";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, weightClassLabel } from "../../lib/common/disciplines";
import DisciplineFields from "../components/DisciplineFields";
import MetodoSegunDisciplina from "../components/MetodoSegunDisciplina";
import RecordCards from "../components/RecordCards";
import { addBout, removeMyBout, respondBout, setBoutEvidence, setMyBoutResult } from "../actions/bouts";
import { createMyFighter, manageHighlight, publishHighlight, requestClaim, saveDiscipline, setRecordPublic, updateMyFighter } from "../actions/fighters";
import { readOnboarding } from "../../lib/accounts/onboarding";
import { HIGHLIGHT_KIND_LABEL, HIGHLIGHT_TITLE_MAX, orderHighlights } from "../../lib/fighters/highlights";
import { recordHidden, shownRecord } from "../../lib/fighters/privacy";
import { combinedRecord, emptyTally } from "../../lib/fighters/record";
import { iniciales } from "../../lib/common/apariencia";
import { LEVEL_LABEL } from "../../lib/common/labels";

export const metadata = { title: "Mi ficha" };
export const dynamic = "force-dynamic";

export default async function MyProfile({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/mi-ficha");
  if (!user.emailVerifiedAt) redirect("/verificar");
  const sp = await searchParams;
  const q = oneParam(sp.q)?.slice(0, 100);
  // Al volver desde «¿Quién es tu rival?» con «Corregir los datos del combate», el formulario se rellena con lo que se había escrito.
  const previo = (campo: string) => (oneParam(sp[campo]) ?? "").slice(0, 500);
  const me = user.fighter;

  if (!me) {
    const claimIds = await searchIds("fighterUnclaimed", q);
    const [candidates, myClaims] = await Promise.all([
      q ? db.fighter.findMany({ where: { id: { in: claimIds ?? [] } }, include: { gym: true, disciplines: true, _count: { select: { boutsAsA: true, boutsAsB: true } } }, take: 10 }) : Promise.resolve([]),
      db.claimRequest.findMany({ where: { userId: user.id }, include: { fighter: true }, orderBy: { createdAt: "desc" } }),
    ]);
    const pendiente = myClaims.filter((c) => c.status === "PENDING");
    // Lo que eligió al registrarse (diseño v3): el formulario llega rellenado y solo tiene que revisarlo.
    const borrador = readOnboarding(user.onboarding);
    const intento = borrador?.kind === "peleador" ? borrador : null;
    const confirmarNueva = oneParam(sp.problema) === "ficha_con_tu_nombre"; // ya se le avisó de que existe una ficha con su nombre
    return (
      <>
        <h1>¿Ya apareces en Ring España?</h1>
        <p className="mut">Si alguien ya registró un combate tuyo, tu ficha existe. Búscala y reclámala; un moderador la revisará.</p>
        <form className="search" role="search" aria-label="Buscar mi ficha"><label className="field"><span>Tu nombre o apellidos</span><input name="q" defaultValue={q} maxLength={80} /></label><button>Buscar mi ficha</button></form>
        {candidates.map((b) => pendiente.some((c) => c.fighterId === b.id) ? (
          <p key={b.id} className="card" style={{ marginBottom: 8 }}><strong>{publicFighterName(b)}</strong> <span className="mut">· Ya has pedido reclamar esta ficha; está pendiente de revisión. No hace falta que hagas nada más.</span></p>
        ) : (
          <form key={b.id} action={requestClaim} className="card" style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input type="hidden" name="fighterId" value={b.id} />
            <strong>{publicFighterName(b)}</strong><span className="mut">{b.disciplines.map((d) => DISCIPLINE_LABEL[d.discipline]).join(", ")} · {b._count.boutsAsA + b._count.boutsAsB} combates registrados{b.city ? ` · ${b.city}` : ""}{b.gym ? ` · ${b.gym.name}` : ""}</span>
            <label className="field" style={{ flex: 1, minWidth: 220 }}><span>¿Cómo podemos comprobar que eres tú?</span><input name="message" maxLength={LIMITS.message} placeholder="Gimnasio, entrenador, velada donde combatiste…" /><span className="hint">No escribas números de documento.</span></label>
            <button aria-label={`Reclamar esta ficha de ${publicFighterName(b)}`}>Reclamar esta ficha</button>
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
        {pendiente.length > 0 ? (
          <>
            <h2>Tu solicitud está pendiente</h2>
            <p>Moderación está revisando tu solicitud para reclamar una ficha. <strong>No hace falta que hagas nada más</strong>: cuando la decida, vuelve a esta página para ver la respuesta. Hasta entonces no puedes crear otra ficha.</p>
          </>
        ) : (
        <>
        <h2>Si no apareces, crea tu ficha</h2>
        {intento && <p className="notice notice-info" role="note">Hemos rellenado tu disciplina, tu categoría y tu provincia con lo que elegiste al registrarte. Revísalo, escribe tu nombre y apellidos y pulsa «Crear mi ficha».</p>}
        <form className="search" action={createMyFighter} style={{ flexDirection: "column", alignItems: "stretch", maxWidth: 560 }}>
          <label className="field"><span>Nombre</span><input name="firstName" required maxLength={LIMITS.firstName} autoComplete="given-name" /></label>
          <label className="field"><span>Apellidos</span><input name="lastName" required maxLength={LIMITS.lastName} autoComplete="family-name" /></label>
          <label className="field"><span>Alias (opcional)</span><input name="alias" maxLength={LIMITS.alias} /></label>
          <label className="field"><span>Gimnasio (opcional)</span><input name="gym" maxLength={LIMITS.gym} /></label>
          <label className="field"><span>Ciudad</span><input name="city" maxLength={LIMITS.city} /></label>
          <label className="field"><span>Provincia</span><select name="province" defaultValue={intento?.province ?? ""} required><option value="">Elige una provincia</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <DisciplineFields defaults={intento?.discipline ? { discipline: intento.discipline, level: intento.level, divisionId: intento.divisionId, weightClass: intento.weightClass } : undefined} />
          {confirmarNueva && <input type="hidden" name="confirmarNueva" value="1" />}
          <button>Crear mi ficha</button>
        </form>
        </>
        )}
      </>
    );
  }

  const bouts = await db.bout.findMany({
    where: { OR: [{ fighterAId: me.id }, { fighterBId: me.id }] },
    include: { event: true, fighterA: true, fighterB: true, supportAccreditation: true },
    orderBy: { event: { date: "desc" } },
  });
  const records = computeRecords(me.id, bouts);
  const gym = me.gymId ? await db.gym.findUnique({ where: { id: me.gymId } }) : null;
  const toConfirm = bouts.filter((b) => b.verification === "SELF_REPORTED" && b.fighterBId === me.id);
  const misHighlights = orderHighlights(await db.highlight.findMany({ where: { fighterId: me.id, hiddenAt: null }, select: { id: true, kind: true, title: true, videoUrl: true, pinned: true, createdAt: true, bout: { select: { event: { select: { name: true } } } } } }));
  const tieneAmateur = me.disciplines.some((d) => d.level === "AMATEUR") || bouts.some((b) => b.event.level === "AMATEUR");
  const principal = [...me.disciplines].sort((a, b) => DISCIPLINE_ORDER.indexOf(a.discipline) - DISCIPLINE_ORDER.indexOf(b.discipline))[0];
  const tallyP = principal ? records[principal.discipline]?.[principal.level] ?? emptyTally() : emptyTally();
  const recP = combinedRecord(tallyP, principal ? { total: principal.priorTotal, wins: principal.priorWins, losses: principal.priorLosses, draws: principal.priorDraws } : null);
  const vistoPorOtros = principal ? shownRecord(recP, recordHidden(principal.level, me.recordPublic, false)) : "";

  return (
    <>
      <div className="cabecera-pantalla" style={{ justifyContent: "center" }}><span className="titulo" aria-hidden="true">Mi ficha</span></div>
      <div className="fila" style={{ padding: 16, borderRadius: 26, marginBottom: 12 }}>
        <span className="avatar avatar-relleno" aria-hidden="true" style={{ width: 62, height: 62, fontSize: 20 }}>{iniciales(`${me.firstName} ${me.lastName}`)}</span>
        <span className="cuerpo"><h1 style={{ margin: 0, font: "700 18px/1.2 var(--font)" }}>{me.firstName} {me.lastName}</h1><span className="meta">{principal ? `${DISCIPLINE_LABEL[principal.discipline]} · ${LEVEL_LABEL[principal.level]}${principal.weightClass ? ` · ${weightClassLabel(principal.discipline, principal.level, principal.weightClass, principal.divisionId)}` : ""}` : ""}</span><Link href={`/peleadores/${me.slug}`}>Ver mi ficha pública</Link></span>
        {principal && <span style={{ font: "800 26px var(--font)", letterSpacing: "-.03em", color: "var(--acc)" }}>{recP.w}-{recP.l}-{recP.d}</span>}
      </div>
      <p><Link className="btn" href={`/perfiles/peleador/${me.id}/editar`}>Editar foto y banner</Link></p>

      {tieneAmateur && (
        <section id="privacidad" className="tarjeta" aria-labelledby="titulo-privacidad" style={{ marginBottom: 12, scrollMarginTop: 80 }}>
          <form action={setRecordPublic} className="interruptor">
            <input type="hidden" name="publico" value={me.recordPublic ? "0" : "1"} />
            <span className="texto"><h2 id="titulo-privacidad" style={{ margin: 0, font: "700 16px var(--font)" }}>Mostrar mi récord amateur completo</h2><span className="meta" style={{ display: "block" }}>{me.recordPublic ? "Ahora el público ve tus victorias, derrotas y empates." : "Ahora el público solo ve cuántos combates llevas."}</span></span>
            <button role="switch" aria-checked={me.recordPublic} aria-label={me.recordPublic ? "Ocultar mi récord amateur completo" : "Mostrar mi récord amateur completo"}><span aria-hidden="true" /></button>
          </form>
          <div className="fila" style={{ minHeight: 48, padding: "10px 14px", borderRadius: 16, background: "rgba(255,255,255,.05)", border: 0 }}><span className="cuerpo">Así te ven los demás</span><strong className="acc">{vistoPorOtros}</strong></div>
          <p className="mut" style={{ margin: 0 }}>Solo para el nivel amateur. En profesional el récord siempre es público.</p>
        </section>
      )}

      <section id="highlights" className="tarjeta" aria-labelledby="titulo-mis-highlights" style={{ marginBottom: 12, scrollMarginTop: 80 }}>
        <div className="titulo-seccion"><h2 id="titulo-mis-highlights" style={{ fontSize: 20 }}>Mis highlights</h2><span className="meta">{misHighlights.length} · aparecen en tu ficha pública</span></div>
        {misHighlights.map((h) => (
          <div key={h.id} className="fila" style={{ background: "rgba(255,255,255,.04)" }}>
            <span className="cuerpo"><span className="nombre">{h.title}{h.pinned && <span className="pildora pildora-acc" style={{ marginLeft: 8, fontSize: 13 }}>Destacado</span>}</span><span className="meta">{HIGHLIGHT_KIND_LABEL[h.kind]}{h.bout ? ` · ${h.bout.event.name}` : ""}</span></span>
            <form action={manageHighlight} style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <input type="hidden" name="highlightId" value={h.id} />
              {!h.pinned && <button name="accion" value="destacar" className="secondary" aria-label={`Destacar «${h.title}»`}>Destacar</button>}
              <button name="accion" value="retirar" className="secondary" aria-label={`Retirar «${h.title}» de mi ficha`}>Retirar</button>
            </form>
          </div>
        ))}
        <details id="publicar-highlight" className="opcionales" open={misHighlights.length === 0} style={{ scrollMarginTop: 80 }}>
          <summary>Publicar un highlight</summary>
          <form action={publishHighlight} encType="multipart/form-data" style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 12 }}>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="leyenda">Tipo</legend>
              <div className="segmentos"><label><input type="radio" name="kind" value="VIDEO" defaultChecked required />Vídeo</label><label><input type="radio" name="kind" value="PHOTO" />Foto</label></div>
            </fieldset>
            <label className="field"><span>Título</span><input name="title" required maxLength={HIGHLIGHT_TITLE_MAX} placeholder="El KO del tercer asalto" /></label>
            <label className="field solo-video"><span>Enlace del vídeo</span><input name="videoUrl" type="url" inputMode="url" maxLength={LIMITS.url} placeholder="https://" /><span className="hint">Súbelo a YouTube, Instagram o TikTok y pega aquí su enlace.</span></label>
            <label className="field"><span>Foto (obligatoria si es una foto; opcional como portada del vídeo)</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" /><span className="hint">JPG, PNG o WebP de hasta 4 MB.</span></label>
            <label className="field"><span>¿De qué combate es? (opcional)</span>
              <select name="boutId" defaultValue=""><option value="">Ninguno en concreto</option>{bouts.map((b) => <option key={b.id} value={b.id}>{b.event.name} · {b.event.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</option>)}</select>
            </label>
            <label className="chip" style={{ alignSelf: "flex-start" }}><input type="checkbox" name="pinned" />Destacar en mi ficha</label>
            <p className="mut" style={{ margin: 0 }}>Solo publica contenido tuyo o con permiso de quien lo grabó. Puedes retirarlo cuando quieras.</p>
            <button className="btn-grande">Publicar en mi ficha</button>
          </form>
        </details>
      </section>
      <p><Link className="btn" href="/mi-ficha/trayectoria">Gestionar mis títulos y mi aura</Link></p>
      <nav aria-label="Ir a una parte de esta página" className="indice-pagina">
        <span className="mut">Ir a:</span>
        <a href="#registrar-combate">Registrar un combate</a>
        <a href="#mis-combates">Mis combates</a>
        <a href="#mis-datos">Mis datos</a>
        <a href="#mis-disciplinas">Mis disciplinas</a>
      </nav>
      <RecordCards records={records} disciplines={me.disciplines} />

      <h2 id="mis-datos">Mis datos</h2>
      <details className="card" style={{ marginBottom: 8 }}>
        <summary><strong>Corregir los datos de mi ficha</strong> <span className="mut">— nombre, alias, procedencia, gimnasio, medidas y presentación</span></summary>
        <form className="search" action={updateMyFighter} style={{ flexDirection: "column", alignItems: "stretch", maxWidth: 560 }}>
          <label className="field"><span>Nombre</span><input name="firstName" defaultValue={me.firstName} required maxLength={LIMITS.firstName} autoComplete="given-name" /></label>
          <label className="field"><span>Apellidos</span><input name="lastName" defaultValue={me.lastName} required maxLength={LIMITS.lastName} autoComplete="family-name" /></label>
          <label className="field"><span>Alias (opcional)</span><input name="alias" defaultValue={me.alias ?? ""} maxLength={LIMITS.alias} /></label>
          <label className="field"><span>Gimnasio (opcional)</span><input name="gym" defaultValue={gym?.name ?? ""} maxLength={LIMITS.gym} /></label>
          <label className="field"><span>Ciudad</span><input name="city" defaultValue={me.city ?? ""} maxLength={LIMITS.city} /></label>
          <label className="field"><span>Provincia</span><select name="province" defaultValue={me.province ?? ""} required><option value="">Elige una provincia</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
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

      <h2 id="mis-disciplinas">Mis disciplinas</h2>
      {[...me.disciplines].sort((a, b) => DISCIPLINE_ORDER.indexOf(a.discipline) - DISCIPLINE_ORDER.indexOf(b.discipline)).map((d) => (
        <details key={d.discipline} className="card" style={{ marginBottom: 8 }}>
          <summary><strong>{DISCIPLINE_LABEL[d.discipline]}</strong> · {divisionLabel(d.divisionId)}{d.weightClass ? ` · ${weightClassLabel(d.discipline, d.level, d.weightClass, d.divisionId)}` : ""} <span className="mut">— cambiar categoría o combates anteriores</span></summary>
          <form className="search" action={saveDiscipline}>
            <DisciplineFields defaults={d} />
            <button>Guardar cambios</button>
          </form>
        </details>
      ))}
      <details className="card" style={{ marginBottom: 8 }}>
        <summary><strong>Añadir otra disciplina</strong> <span className="mut">— elige otra disciplina que practiques</span></summary>
        <form className="search" action={saveDiscipline}>
          <input type="hidden" name="modo" value="anadir" />
          <DisciplineFields />
          <button>Añadir disciplina</button>
        </form>
      </details>

      {toConfirm.length > 0 && (
        <>
          <h2 id="por-confirmar">Combates que puedes confirmar o pedir que se revisen</h2>
          <p className="mut">Tu rival ha declarado estos resultados. Confirmarlos es opcional. Si hay un error, explica el motivo para que moderación lo revise; el aviso no suspende el resultado automáticamente.</p>
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
                    <input type="hidden" name="version" value={boutVersion(b)} />
                    <label className="field" style={{ flexBasis: "100%" }}><span>Si no es correcto, ¿por qué? (obligatorio para rechazarlo)</span><input name="motivo" maxLength={LIMITS.note} /></label>
                    <button name="decision" value="confirm" aria-label={`Sí, es correcto: combate contra ${rival} en ${b.event.name}`}>Sí, es correcto</button>
                    <button name="decision" value="dispute" className="secondary" aria-label={`No es correcto: combate contra ${rival} en ${b.event.name}`}>No es correcto</button>
                  </form>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <h2 id="registrar-combate">Registrar un combate</h2>
      <form className="search" action={addBout}>
        <SelectorCategoria modo="combate" nivelesPorDisciplina={Object.fromEntries(me.disciplines.map(d=>[d.discipline,d.level]))} disciplinas={me.disciplines.map(d=>d.discipline)} defaults={{ discipline: (previo("discipline") || me.disciplines[0]?.discipline) as typeof me.disciplines[0]["discipline"], level: (previo("level") || me.disciplines[0]?.level) as typeof me.disciplines[0]["level"], divisionId: previo("divisionId"), weightClass: previo("weightClass") }} />
        <p className="hint">Indica la división y el peso de este combate, aunque hoy compitas en otra categoría. Si no los recuerdas, elige «Prefiero indicarlo más tarde».</p>
        <label className="field"><span>Nombre de la velada</span><input name="eventName" defaultValue={previo("eventName")} required maxLength={LIMITS.eventName} /></label>
        <label className="field"><span>Fecha</span><input name="date" type="date" defaultValue={previo("date")} required min="1980-01-01" /></label>
        <label className="field"><span>Ciudad</span><input name="city" defaultValue={previo("city") || (me.city ?? "")} maxLength={LIMITS.city} /></label>
        <label className="field"><span>Provincia</span><select name="province" defaultValue={previo("province") || (me.province ?? "")} required><option value="">Elige una provincia</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label className="field"><span>Nombre de tu rival</span><input name="oppFirst" defaultValue={previo("oppFirst")} required maxLength={LIMITS.firstName} /></label>
        <label className="field"><span>Apellidos de tu rival</span><input name="oppLast" defaultValue={previo("oppLast")} required maxLength={LIMITS.lastName} /></label>
        <label className="field"><span>Resultado</span>
          <select name="outcome" defaultValue={previo("outcome")}>
            <option value="">Elige el resultado…</option>
            <option value="WIN">Gané</option><option value="LOSS">Perdí</option><option value="DRAW">Empate</option><option value="NC">Sin decisión</option>
          </select>
          <span className="hint">Si el combate es hoy y todavía no se ha celebrado, o es futuro, déjalo sin elegir: podrás añadirlo después. Los combates de días anteriores necesitan resultado.</span>
        </label>
        <label className="field"><span>Cómo terminó</span>
          <MetodoSegunDisciplina inicial={(previo("discipline") || me.disciplines[0]?.discipline) as typeof me.disciplines[0]["discipline"]} defaultValue={previo("method")} />
          <span className="hint">Solo aparecen las formas de terminar de la disciplina elegida. En empates no hace falta.</span>
        </label>
        <details className="opcionales" style={{ flex: "1 1 100%" }}>
          <summary>Más datos del combate (opcional): recinto, asaltos y enlace que lo demuestre</summary>
          <label className="field"><span>Recinto (opcional)</span><input name="venue" defaultValue={previo("venue")} maxLength={LIMITS.venue} /></label>
          <label className="field"><span>Número de asaltos (opcional)</span><input name="rounds" defaultValue={previo("rounds")} type="number" min={1} max={12} /></label>
          <label className="field"><span>Asalto en que terminó (opcional)</span><input name="endRound" defaultValue={previo("endRound")} type="number" min={1} max={12} /><span className="hint">Solo si acabó por KO, TKO, abandono, sumisión o descalificación.</span></label>
          <label className="field" style={{ flex: 1, minWidth: 260 }}><span>Enlace que lo demuestre (opcional)</span><input name="evidenceUrl" defaultValue={previo("evidenceUrl")} maxLength={LIMITS.url} placeholder="Acta, cartel, vídeo o publicación" /><span className="hint">Un enlace permite comprobar el hecho; no verifica el resultado automáticamente.</span></label>
        </details>
        <button>Registrar este combate</button>
      </form>
      <h2 id="mis-combates">Mis combates</h2>
      <div className="table-wrap">
        <table className="apilada">
          <caption className="sr-only">Tus combates con su división deportiva, estado, resultado y enlace de evidencia</caption>
          <thead><tr><th scope="col">Combate</th><th scope="col">Estado</th><th scope="col">Resultado</th><th scope="col">Enlace que lo demuestra</th></tr></thead>
          <tbody>
            {bouts.map((b) => {
              const isA = b.fighterAId === me.id;
              const soyAutor = b.createdById === user.id;
              const opp = isA ? b.fighterB : b.fighterA;
              const puedeCorregir = soyAutor && (b.verification === "SELF_REPORTED" || (b.verification === "CONFIRMED" && !b.result)) && eventDayReached(b.event.date);
              return (
                <tr key={b.id}>
                  <td>{b.event.name} · {b.event.date.toLocaleDateString("es-ES")}<div className="mut">contra {publicFighterName(opp)}</div>
                    {soyAutor && b.verification === "SELF_REPORTED" && (
                      <details style={{ marginTop: 6 }}>
                        <summary className="mut" aria-label={`Quitar este combate: ${b.event.name}`}>Quitar este combate</summary>
                        <form action={removeMyBout} style={{ marginTop: 6 }}>
                          <input type="hidden" name="boutId" value={b.id} />
                          <p className="mut">Úsalo si te equivocaste al registrarlo (rival, fecha o velada). Desaparece de tu ficha y de la de tu rival. No se puede deshacer, pero puedes volver a registrarlo bien.</p>
                          <button className="secondary" aria-label={`Sí, quitar este combate: ${b.event.name}`}>Sí, quitar este combate</button>
                        </form>
                      </details>
                    )}
                  </td>
                  <td data-label="Estado"><VerificationTag verification={b.verification} backing={b} /></td>
                  <td data-label="Resultado">
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
                  <td data-label="Enlace que lo demuestra">
                    {b.verification === "SELF_REPORTED" ? (
                      <form action={setBoutEvidence} style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <input type="hidden" name="boutId" value={b.id} />
                        <input name="evidenceUrl" defaultValue={b.evidenceUrl ?? ""} maxLength={LIMITS.url} placeholder="Enlace que lo demuestre" aria-label={`Enlace que demuestra el combate ${b.event.name}`} />
                        <button className="secondary" aria-label={`Guardar enlace del combate ${b.event.name}`}>Guardar enlace</button>
                      </form>
                    ) : b.evidenceUrl ? <a href={b.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow ugc">Ver evidencia<span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra pestaña)</span></a> : <span className="mut">{b.verification === "DISPUTED" ? "En revisión: moderación lo está aclarando" : "Combate ya confirmado o verificado: el enlace ya no se puede cambiar"}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mut">Los resultados declarados se muestran en ambas fichas con su etiqueta. La confirmación del rival y los respaldos son opcionales. Moderación puede suspender un resultado incorrecto tras revisar un aviso.</p>
    </>
  );
}
