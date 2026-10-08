import { graduationLabel } from "../../../lib/fighters/graduation";
import { cache } from "react";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/common/db";
import { combinedRecord, computeRecords, emptyTally } from "../../../lib/fighters/record";
import { recordHidden } from "../../../lib/fighters/privacy";
import { HIGHLIGHT_KIND_LABEL, orderHighlights } from "../../../lib/fighters/highlights";
import { GaleriaMedios, SELECT_MEDIO } from "../../components/Multimedia";
import { iniciales, tinteDe } from "../../../lib/common/apariencia";
import { monthlySeries } from "../../../lib/common/dates";
import Icono from "../../components/Icono";
import { GraficoAura } from "../../components/Tarjetas";
import { divisionLabel } from "../../../lib/common/competition";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, weightClassLabel } from "../../../lib/common/disciplines";
import { auraRanking } from "../../../lib/aura/ranking";
import TrajectoryList from "../../components/TrajectoryList";
import AuraBreakdown from "../../components/AuraBreakdown";
import RecordCards from "../../components/RecordCards";
import VerificationTag from "../../components/VerificationTag";
import { getUser } from "../../../lib/accounts/auth";
import { profileAccess } from "../../../lib/profiles/profiles";
import { giveAura, removeAura } from "../../actions/aura";
import { createReport, toggleFollow } from "../../actions/community";
import { REASONS_BY_ENTITY, REPORT_REASONS, type ReportEntity } from "../../../lib/community/reports";
import { LEVEL_LABEL, METHOD_LABEL, STANCE_LABEL, resultWord } from "../../../lib/common/labels";
import { publicFighterName, publicUserName } from "../../../lib/common/names";
import { canGiveAura } from "../../../lib/aura/rules";
import { plural } from "../../../lib/common/text";
import { eventDayReached } from "../../../lib/common/dates";
import { PROBLEMAS } from "../../../lib/common/messages";
import { lookup } from "../../../lib/common/safe";

export const dynamic = "force-dynamic";

const getFighter = cache((slug: string) => db.fighter.findUnique({ where: { slug }, include: { gym: true, trainer: true, disciplines: true } }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const fighter = await getFighter((await params).slug);
  if (!fighter) return { title: "Peleador no encontrado" };
  const nombre = publicFighterName(fighter);
  return {
    title: nombre,
    description: `Ficha de ${nombre} en Ring España: récord por disciplina, combates y aura del público.`,
    // Una ficha sin reclamar u ocultada no debe aparecer en los buscadores.
    robots: fighter.listed && !fighter.hiddenAt ? undefined : { index: false, follow: false },
  };
}

/** Condición de los combates que cuentan de cara al público: ni rechazados ni de veladas canceladas. */
const COUNTED = { verification: { not: "DISPUTED" as const }, event: { status: { not: "CANCELLED" as const } } };

export default async function FighterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fighter = await getFighter(slug);
  if (!fighter) notFound();
  const bouts = await db.bout.findMany({
    where: { OR: [{ fighterAId: fighter.id }, { fighterBId: fighter.id }] },
    include: { event: true, fighterA: true, fighterB: true, supportAccreditation: true },
    orderBy: { event: { date: "desc" } },
  });
  const records = computeRecords(fighter.id, bouts);
  const user = await getUser();
  const [followerCount, following] = await Promise.all([
    db.follow.count({ where: { fighterId: fighter.id } }),
    user ? db.follow.findUnique({ where: { userId_fighterId: { userId: user.id, fighterId: fighter.id } } }) : Promise.resolve(null),
  ]);
  const [auraTotal, auras, myAuras] = await Promise.all([
    db.aura.count({ where: { fighterId: fighter.id, bout: COUNTED } }),
    db.aura.findMany({ where: { fighterId: fighter.id, bout: COUNTED }, include: { user: { select: { name: true } }, bout: { include: { event: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    user ? db.aura.findMany({ where: { fighterId: fighter.id, userId: user.id } }) : Promise.resolve([]),
  ]);

  const [achievements, auraGroups] = fighter.listed && !fighter.hiddenAt ? await Promise.all([
    db.fighterAchievement.findMany({ where: { fighterId: fighter.id, rejectedAt: null, withdrawnAt: null }, include: { supportAccreditation: true }, orderBy: { awardedOn: "desc" } }),
    auraRanking({ fighterId: fighter.id }),
  ]) : [[], []];
  const back = `/peleadores/${fighter.slug}`;
  const nombre = publicFighterName(fighter);
  const publica = fighter.listed && !fighter.hiddenAt; // sin reclamar u oculta: solo se muestran nombre abreviado, récord y combates

  const reportForm = (entity: ReportEntity, entityId: string, etiqueta: string | undefined, sobre: string) =>
    user?.emailVerifiedAt ? (
      <details style={{ marginTop: 6 }}>
        <summary className="mut" aria-label={`${etiqueta ?? "¿Hay un error? Avísanos"}: ${sobre}`}>{etiqueta ?? "¿Hay un error? Avísanos"}</summary>
        <form action={createReport} style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
          <input type="hidden" name="entity" value={entity} /><input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="back" value={back} />
          <select name="reason" aria-label="Motivo del aviso" defaultValue="">
            <option value="" disabled>Motivo…</option>
            {REASONS_BY_ENTITY[entity].map((k) => <option key={k} value={k}>{REPORT_REASONS[k]}</option>)}
          </select>
          <input name="message" aria-label="Detalles (opcional)" placeholder="Detalles (opcional)" maxLength={500} />
          <button className="secondary" aria-label={`Enviar aviso sobre ${sobre}`}>Enviar aviso</button>
        </form>
      </details>
    ) : entity === "FIGHTER" ? (
      // Quien no puede avisar (sin cuenta o sin correo confirmado) debe saber por qué y qué hacer, no encontrarse con nada.
      <p className="mut" style={{ marginTop: 6 }}>
        {user ? <Link href="/verificar">¿Hay un error en esta ficha? Confirma tu correo electrónico para avisarnos</Link>
          : <Link href={`/entrar?next=${encodeURIComponent(back)}`}>¿Hay un error en esta ficha? Entra en tu cuenta para avisarnos</Link>}
      </p>
    ) : null;
  const age = publica && fighter.birthDate ? Math.floor((Date.now() - fighter.birthDate.getTime()) / 3.15576e10) : null;
  // Diseño v3: highlights del propio peleador, aura por combate y por mes, y récord amateur privado salvo para su titular.
  const propia = !!user?.fighter && user.fighter.id === fighter.id;
  const [highlights, auraPorCombate, perfil, aurasRecientes, acceso, medios] = await Promise.all([
    publica || propia ? db.highlight.findMany({ where: { fighterId: fighter.id, hiddenAt: null }, select: { id: true, kind: true, title: true, videoUrl: true, videoKey: true, hasImage: true, pinned: true, createdAt: true, bout: { select: { event: { select: { name: true } } } } } }) : Promise.resolve([]),
    db.aura.groupBy({ by: ["boutId"], where: { fighterId: fighter.id, bout: COUNTED }, _count: { _all: true } }),
    db.profile.findUnique({ where: { kind_entityId: { kind: "peleador", entityId: fighter.id } }, select: { hasBanner: true, hasAvatar: true, updatedAt: true, bannerX: true, bannerY: true } }),
    db.aura.findMany({ where: { fighterId: fighter.id, bout: COUNTED, createdAt: { gte: new Date(Date.now() - 220 * 864e5) } }, select: { createdAt: true } }),
    profileAccess("peleador", fighter.id, user),
    // Vídeos y fotos que el público subió de sus combates (petición del fundador, 8 de octubre de 2026).
    publica || propia ? db.mediaItem.findMany({ where: { hiddenAt: null, bout: { OR: [{ fighterAId: fighter.id }, { fighterBId: fighter.id }] } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 40, select: SELECT_MEDIO }) : Promise.resolve([]),
  ]);
  const ordenados = orderHighlights(highlights);
  const auraDe = (boutId: string) => auraPorCombate.find((g) => g.boutId === boutId)?._count._all ?? 0;
  const principal = [...fighter.disciplines].sort((a, b) => DISCIPLINE_ORDER.indexOf(a.discipline) - DISCIPLINE_ORDER.indexOf(b.discipline))[0];
  const oculto = (level: "PRO" | "AMATEUR") => recordHidden(level, fighter.recordPublic, propia);
  const tallyP = principal ? records[principal.discipline]?.[principal.level] ?? emptyTally() : emptyTally();
  const recP = combinedRecord(tallyP, principal ? { total: principal.priorTotal, wins: principal.priorWins, losses: principal.priorLosses, draws: principal.priorDraws } : null);
  const ocultoP = principal ? oculto(principal.level) : false;
  const totalP = recP.w + recP.l + recP.d + tallyP.nc + (recP.priorDetailed ? 0 : recP.priorTotal);
  const serie = monthlySeries(aurasRecientes.map((a) => a.createdAt), 7);
  const version = perfil ? `?v=${perfil.updatedAt.getTime()}` : "";

  return (
    <div className="pantalla" style={{ gap: 0 }}>
      <section className="portada a-sangre" style={{ marginTop: -20, minHeight: 500, "--tinte": tinteDe(principal?.discipline) } as CSSProperties} aria-labelledby="nombre-peleador">
        <span className="iniciales" aria-hidden="true">{iniciales(nombre)}</span>
        {publica && perfil?.hasBanner && <img className="fondo" src={`/imagenes/peleador/${fighter.id}/banner${version}`} alt="" style={{ objectPosition: `${perfil.bannerX}% ${perfil.bannerY}%` }} />}
        {publica && !perfil?.hasBanner && perfil?.hasAvatar && <img className="fondo" src={`/imagenes/peleador/${fighter.id}/avatar${version}`} alt={`Foto de ${nombre}`} />}
        <div className="barra-superior">
          <Link href="/peleadores" className="boton-icono boton-cristal" aria-label="Volver a los peleadores"><Icono nombre="atras" /></Link>
          {principal && <span className={`pildora ${principal.level === "PRO" ? "pildora-blanca" : "pildora-acc"}`}>{LEVEL_LABEL[principal.level]}</span>}
        </div>
        <div>
          {publica && <div className="apodo">{[fighter.alias && `«${fighter.alias}»`, fighter.city].filter(Boolean).join(" · ")}</div>}
          <h1 id="nombre-peleador" className="nombre">{nombre}</h1>
        </div>
        <div className="discipline-tags" style={{ margin: 0 }}>
          {fighter.disciplines.map((d) => <span key={d.discipline} className="pildora pildora-cristal">{DISCIPLINE_LABEL[d.discipline]}{d.level !== principal?.level ? ` · ${LEVEL_LABEL[d.level]}` : ""}{d.weightClass ? ` · ${weightClassLabel(d.discipline, d.level, d.weightClass, d.divisionId)}` : ""}{publica && graduationLabel(d.belt, d.beltDegrees) ? ` · ${graduationLabel(d.belt, d.beltDegrees)} (declarado por el deportista)` : ""}</span>)}
          {publica && fighter.gym && <span className="pildora pildora-cristal">{fighter.gym.name}</span>}
        </div>
      </section>
      {acceso.editable && <p style={{ margin: "12px 0 0" }}><Link href={`/perfiles/peleador/${fighter.id}/editar`}>Editar foto y banner</Link></p>}
      {!fighter.listed && !fighter.hiddenAt && <p style={{ margin: "12px 0 0" }}><span className="tag">ficha sin reclamar</span></p>}
      {!publica && (
        <p className="mut" style={{ marginTop: 12 }}>
          {fighter.hiddenAt
            ? "Los datos personales de esta ficha se han ocultado. Se conservan los combates porque forman parte del récord de otras personas."
            : "Esta ficha la ha creado otra persona al registrar un combate. Solo se muestra el nombre abreviado hasta que su titular la reclame o el combate se confirme. Si eres esta persona, puedes reclamarla desde «Mi ficha» o pedir que se retiren tus datos: consulta la página de privacidad."}
        </p>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 16 }}>
        {user?.fighter?.id !== fighter.id && !fighter.hiddenAt && (user ? (
          <form action={toggleFollow} style={{ flex: 1, display: "flex" }}>
            <input type="hidden" name="fighterId" value={fighter.id} /><input type="hidden" name="back" value={back} />
            <button className={following ? "secondary" : undefined} style={{ flex: 1, minHeight: 54 }}>{following ? "Dejar de seguir" : "Seguir a este peleador"}</button>
          </form>
        ) : <Link className="btn secondary" style={{ flex: 1, minHeight: 54 }} href={`/entrar?next=${encodeURIComponent(back)}`}>Entra para seguir a este peleador</Link>)}
        <span className="pildora" style={{ minHeight: 54, padding: "0 18px", fontWeight: 500, background: "rgba(255,255,255,.06)" }}>{plural(followerCount, "seguidor", "seguidores")}</span>
      </div>
      {publica && fighter.gym && <Link href={`/gimnasios/${fighter.gym.slug}`} className="btn secondary" style={{ marginTop: 10 }}><Icono nombre="gimnasio" tam={18} grosor={1.9} />{fighter.gym.name}</Link>}

      <div className="rejilla-3" style={{ marginTop: 16 }}>
        <div className="dato"><span className="clave">{ocultoP ? "Combates" : "Récord"}</span><span className="valor">{ocultoP ? totalP : `${recP.w}-${recP.l}-${recP.d}`}</span></div>
        <div className="dato"><span className="clave">{ocultoP ? "Categoría" : "Por KO"}</span><span className="valor" style={ocultoP ? { fontSize: 16, lineHeight: 1.2 } : undefined}>{ocultoP ? (principal?.weightClass ? weightClassLabel(principal.discipline, principal.level, principal.weightClass, principal.divisionId) : "Sin indicar") : tallyP.ko}</span></div>
        <div className="dato"><span className="clave">Aura</span><span className="valor acc">{auraTotal}</span></div>
      </div>

      {(publica || propia) && (
        <section aria-labelledby="titulo-highlights" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
          <div className="titulo-seccion"><h2 id="titulo-highlights">Highlights</h2><span className="meta">{plural(ordenados.length, "publicado", "publicados")}</span></div>
          {(ordenados.length > 0 || propia) && <div className="desliza" role="region" tabIndex={0} aria-label="Highlights (desliza para ver más)">
            {propia && <Link href="/mi-ficha#publicar-highlight" className="highlight-nuevo"><span className="mas" aria-hidden="true"><Icono nombre="mas" tam={24} grosor={2.4} /></span>Publicar highlight</Link>}
            {ordenados.map((h) => {
              const destino = h.kind === "VIDEO" ? (h.videoKey ? `/highlights/${h.id}/video` : h.videoUrl!) : `/highlights/${h.id}/imagen`;
              return (
                <a key={h.id} href={destino} target="_blank" rel="noopener noreferrer nofollow ugc" className="tarjeta-foto highlight" style={{ "--tinte": tinteDe(principal?.discipline) } as CSSProperties}>
                  {h.hasImage && <img src={`/highlights/${h.id}/imagen`} alt="" loading="lazy" />}
                  <span className="arriba"><span className="pildora" style={{ background: "rgba(0,0,0,.6)", fontSize: 13 }}>{HIGHLIGHT_KIND_LABEL[h.kind]}</span>{h.pinned && <span className="pildora pildora-acc" style={{ fontSize: 13 }}>Destacado</span>}</span>
                  {h.kind === "VIDEO" && <span className="play" aria-hidden="true"><Icono nombre="play" /></span>}
                  <span className="abajo"><strong>{h.title}</strong><span className="meta" style={{ color: "rgba(255,255,255,.75)", fontSize: 13 }}>{h.bout?.event.name ?? (h.kind === "VIDEO" ? "Vídeo" : "Foto")}</span><span className="sr-only"> (se abre en otra pestaña)</span></span>
                </a>
              );
            })}
          </div>}
          {ordenados.length === 0 && !propia && <p className="mut" style={{ margin: 0 }}>Todavía no ha publicado highlights.</p>}
          {ordenados.some((h) => h.kind === "VIDEO" && !h.videoKey) && <p className="meta" style={{ margin: 0 }}>Los vídeos con enlace se abren en la web donde se publicaron.</p>}
        </section>
      )}

      <nav className="segmentos" aria-label="Ir a una parte de la ficha" style={{ marginTop: 22 }}>
        <a href="#record">Récord</a><a href="#combates">Combates</a>{medios.length > 0 && <a href="#multimedia">Vídeos</a>}<a href="#publico">Público</a>
      </nav>

      <section id="record" aria-labelledby="titulo-record" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16, scrollMarginTop: 80 }}>
        <h2 id="titulo-record" className="sr-only">Récord</h2>
        <div className="tarjeta" style={{ gap: 12 }}>
          <div><h3 style={{ margin: 0, font: "800 24px var(--font)", letterSpacing: "-.03em" }}>Aura recibida</h3><div className="meta">Reconocimiento del público, últimos 7 meses</div></div>
          <div className="chips"><span className="pildora pildora-violeta">{auraTotal} de aura</span>{principal && <span className="pildora pildora-acc">{ocultoP ? plural(totalP, "combate", "combates") : `${recP.w}-${recP.l}-${recP.d} récord`}</span>}</div>
          <GraficoAura serie={serie} etiqueta={`Aura recibida por mes: ${serie.map((x) => `${x.mes} ${x.total}`).join(", ")}`} />
          <p className="mut" style={{ margin: 0 }}>{plural(auraTotal, "aura recibida", "auras recibidas")}. El aura es el reconocimiento del público: cada persona puede darla una vez por combate.</p>
        </div>
        <RecordCards records={records} disciplines={fighter.disciplines} ocultarAmateur={!propia && !fighter.recordPublic} />
        {publica && <>
          <h3 style={{ margin: "14px 0 0", font: "800 20px var(--font)" }}>Aura por categoría</h3><AuraBreakdown groups={auraGroups} /><p style={{ margin: 0 }}><Link href="/ayuda#aura">Cómo se calcula el aura</Link></p>
          <h3 style={{ margin: "14px 0 0", font: "800 20px var(--font)" }}>Títulos y trayectoria</h3><TrajectoryList achievements={achievements} /><p className="mut" style={{ margin: 0 }}>Cuenta el título con mayor aporte de cada categoría. Los títulos declarados son responsabilidad del deportista; puedes solicitar su revisión desde «¿Hay un error? Avísanos».</p>
          <h3 style={{ margin: "14px 0 0", font: "800 20px var(--font)" }}>Ficha</h3>
          <dl className="lista lista-datos">
            {[
              ["Guardia", fighter.stance && STANCE_LABEL[fighter.stance]],
              ["Edad", age && `${age} años`], ["Altura", fighter.heightCm && `${fighter.heightCm} cm`], ["Envergadura", fighter.reachCm && `${fighter.reachCm} cm`],
              ["Procedencia", [fighter.city, fighter.province].filter(Boolean).join(", ")],
            ].filter(([, v]) => v).map(([k, v]) => <div key={k as string}><dt>{k}</dt><dd>{v}</dd></div>)}
            {fighter.gym && <div><dt>Gimnasio</dt><dd><Link href={`/gimnasios/${fighter.gym.slug}`}>{fighter.gym.name}</Link></dd></div>}
            {fighter.trainer && <div><dt>Entrenador</dt><dd><Link href={`/entrenadores/${fighter.trainer.slug}`}>{fighter.trainer.name}</Link></dd></div>}
          </dl>
          {fighter.bio && <p style={{ margin: 0 }}>{fighter.bio}</p>}
        </>}
        {reportForm("FIGHTER", fighter.id, undefined, `la ficha de ${nombre}`)}
      </section>

      <section id="combates" aria-labelledby="titulo-combates" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 26, scrollMarginTop: 80 }}>
        <h2 id="titulo-combates">Combates</h2>
        {bouts.map((b) => {
          const isA = b.fighterAId === fighter.id;
          const opp = isA ? b.fighterB : b.fighterA;
          // Las declaraciones son visibles en ambas fichas; solo moderación puede suspenderlas.
          const enRevision = b.verification === "DISPUTED";
          const privado = oculto(b.event.level);
          const r = resultWord(b.result, isA);
          const mine = myAuras.some((x) => x.boutId === b.id);
          const aura = canGiveAura({ bout: b, fighterId: fighter.id, viewerFighterId: user?.fighter?.id });
          // Cuando no se puede dar aura, se dice por qué (en vez de dejar el hueco vacío).
          const notaAura = !aura.ok ? lookup(PROBLEMAS, aura.problema) : null;
          const rival = publicFighterName(opp);
          const estado = enRevision ? "Resultado en revisión" : !b.result ? (eventDayReached(b.event.date) ? "Resultado por anotar" : "Próximo combate") : privado ? null : r.text;
          const corto = !b.result || enRevision || privado ? "·" : r.cls === "W" ? "V" : r.cls === "L" ? "D" : "E";
          const n = auraDe(b.id);
          return (
            <article key={b.id} className="tarjeta" aria-label={`Combate contra ${rival} en ${b.event.name}`}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span className={`res ${corto === "V" ? "res-V" : corto === "D" ? "res-D" : ""}`} aria-hidden="true">{corto}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "600 16px/1.3 var(--font)" }}>{estado && estado !== "Próximo combate" && b.result && !enRevision ? <span className={r.cls}>{estado}</span> : estado ?? "Combate"} ante <Link href={`/peleadores/${opp.slug}`}>{rival}</Link></div>
                  <div className="meta">{!enRevision && !privado && b.method ? `${METHOD_LABEL[b.method]}${b.endRound ? ` (asalto ${b.endRound})` : ""} · ` : ""}{b.event.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</div>
                </div>
              </div>
              <div className="chips" style={{ gap: 6 }}>
                <Link href={`/veladas/${b.event.slug}`}>{b.event.name}</Link>
                <span className="tag">{DISCIPLINE_LABEL[b.event.discipline]}</span><span className={`tag ${b.event.level}`}>{LEVEL_LABEL[b.event.level]}</span>
                {b.event.status === "CANCELLED" && <span className="tag">cancelada</span>}
                <VerificationTag verification={b.verification} backing={b} />
                {b.evidenceUrl && <a className="tag" href={b.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow ugc">Ver evidencia<span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra pestaña)</span></a>}
              </div>
              {(b.divisionId || b.weightClass) && <div className="meta">{divisionLabel(b.divisionId)}{b.weightClass ? ` · ${weightClassLabel(b.event.discipline, b.event.level, b.weightClass, b.divisionId)}` : ""}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                <span className="meta-acc" style={{ fontSize: 15 }}>{n} de aura</span>
                {aura.ok && (user?.emailVerifiedAt ? (
                  mine ? (
                    <form action={removeAura} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="fighterId" value={fighter.id} />
                      <input type="hidden" name="back" value={back} />
                      <span className="W" style={{ flex: 1 }}>Has dado aura</span>
                      <button className="secondary" aria-label={`Quitar mi aura del combate de ${nombre} en ${b.event.name}`}>Quitar mi aura</button>
                    </form>
                  ) : (
                    <form action={giveAura} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="fighterId" value={fighter.id} />
                      <input type="hidden" name="back" value={back} />
                      <input name="comment" aria-label="Tu comentario (opcional)" placeholder="Tu comentario (opcional)" maxLength={500} style={{ flex: "1 1 200px" }} />
                      <label className="chip"><input type="checkbox" name="attended" />Lo vi en directo</label>
                      <button aria-label={`Dar aura a ${nombre} por el combate en ${b.event.name}`}><Icono nombre="aura" tam={16} grosor={2.2} />Dar aura</button>
                      <span className="hint mut" style={{ flexBasis: "100%" }}>Se mostrará tu nombre ({publicUserName(user.name)}) y tu comentario, si lo escribes.</span>
                    </form>
                  )
                ) : user ? <Link href="/verificar">Confirma tu correo electrónico para dar aura</Link>
                  : <Link className="btn secondary" href={`/entrar?next=${encodeURIComponent(back)}`}>Entra para dar aura</Link>)}
                {notaAura && <span className="mut">{notaAura}</span>}
                {reportForm("BOUT", b.id, undefined, `el combate contra ${rival}`)}
              </div>
            </article>
          );
        })}
        {bouts.length === 0 && <p className="mut" style={{ margin: 0 }}>Sin combates registrados.</p>}
        {bouts.some((b) => oculto(b.event.level)) && <p className="mut" style={{ margin: 0 }}>Los resultados de sus combates amateur no se muestran: el peleador mantiene privado su récord amateur.</p>}
      </section>

      {medios.length > 0 && (
        <section id="multimedia" aria-labelledby="titulo-multimedia" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 26, scrollMarginTop: 80 }}>
          <h2 id="titulo-multimedia">Vídeos y fotos de sus combates</h2>
          <p className="mut" style={{ margin: 0 }}>Grabados por el público en las veladas.</p>
          <GaleriaMedios medios={medios} conVelada back={`/peleadores/${fighter.slug}#multimedia`} avisar={user?.emailVerifiedAt ? createReport : undefined} />
        </section>
      )}

      <section id="publico" aria-labelledby="titulo-publico" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26, scrollMarginTop: 80 }}>
        <h2 id="titulo-publico">Lo que dice el público</h2>
        {auras.map((r) => (
          <div key={r.id} className="tarjeta" style={{ gap: 8 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="avatar" aria-hidden="true" style={{ width: 38, height: 38, fontSize: 13 }}>{iniciales(publicUserName(r.user.name))}</span>
              <div style={{ flex: 1, minWidth: 0 }}><strong>{publicUserName(r.user.name)}</strong> <span className="mut">dio aura en «{r.bout.event.name}»{r.attended ? " · lo vio en directo" : ""}</span></div>
            </div>
            {r.hiddenAt ? <div className="mut">Comentario retirado por moderación.</div> : r.comment && <p style={{ margin: 0 }}>{r.comment}</p>}
            {!r.hiddenAt && r.comment && reportForm("AURA", r.id, "Avisar de este comentario", `el comentario de ${publicUserName(r.user.name)}`)}
          </div>
        ))}
        {auras.length === 0 && <p className="mut" style={{ margin: 0 }}>Todavía nadie ha dado aura a este peleador. Si has visto uno de sus combates, puedes ser la primera persona.</p>}
      </section>
    </div>
  );
}
