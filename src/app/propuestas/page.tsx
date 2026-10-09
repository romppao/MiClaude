import Link from "next/link";
import type { Metadata } from "next";
import { db } from "../../lib/common/db";
import { requireUser } from "../../lib/accounts/auth";
import { fmtDate } from "../../lib/common/labels";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { publicFighterName } from "../../lib/common/names";
import { flatParams } from "../../lib/common/safe";
import { searchIds } from "../../lib/common/search";
import { PROPOSAL_KIND_LABEL, PROPOSAL_REPLY_MAX, PROPOSAL_STATUS_LABEL, puedeCancelarPropuesta, puedeResponderPropuesta } from "../../lib/fighters/proposals";
import { answerProposal, cancelProposal } from "../actions/proposals";
import Pestanas from "../components/Pestanas";
import type { Discipline, Prisma } from "@prisma/client";
import { DISCIPLINE_ORDER, categoryLabel, weightClassesFor } from "../../lib/common/disciplines";
import { LEVEL_LABEL, PROVINCES, STANCE_LABEL } from "../../lib/common/labels";
import { combinedRecord, computeRecords, emptyTally, type BoutForRecord } from "../../lib/fighters/record";
import { recordHidden, shownRecord } from "../../lib/fighters/privacy";
import { ORDENES_RIVAL, filtrarYOrdenarRivales, hayFiltrosRival, parseFiltrosRival, type FiltrosRival } from "../../lib/fighters/rivals";
import { BotonesFiltro, CampoFiltro, FiltrosActivos, MasFiltros } from "../components/Filtros";

export const metadata: Metadata = { title: "Retos y sparrings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const PILDORA = { PENDING: "pildora-violeta", ACCEPTED: "pildora-acc", DECLINED: "", CANCELLED: "" } as const;
const edadHoy = (b: Date | null) => (b ? Math.floor((Date.now() - b.getTime()) / 3.15576e10) : null);
const MAX_CANDIDATOS = 400;

type FichaConDisciplinas = Prisma.FighterGetPayload<{ include: { disciplines: true; gym: true } }>;

/**
 * Candidatos para retar o hacer sparring con los filtros pedidos: lo que se puede pedir a la base de datos (nombre, gimnasio, provincia,
 * disciplina, nivel, peso, guardia) va en la consulta; los combates (récord más anteriores declarados), la edad y el aura se calculan
 * aquí para filtrar y ordenar. Solo fichas con titular, visibles y que no son la propia.
 */
async function buscarRivales(f: FiltrosRival, meId: string, ids: string[] | null) {
  const disc: Prisma.FighterDisciplineWhereInput = { ...(f.disciplina && { discipline: f.disciplina }), ...(f.nivel && { level: f.nivel }), ...(f.peso && { weightClass: f.peso }) };
  const where: Prisma.FighterWhereInput = {
    id: ids ? { in: ids, not: meId } : { not: meId }, listed: true, hiddenAt: null, userId: { not: null },
    ...(f.provincia && { province: f.provincia }), ...(f.guardia && { stance: f.guardia }),
    ...(f.gimnasio && { gym: { name: { contains: f.gimnasio, mode: "insensitive" } } }),
    ...(Object.keys(disc).length && { disciplines: { some: disc } }),
  };
  const fichas = await db.fighter.findMany({ where, take: MAX_CANDIDATOS, orderBy: [{ lastName: "asc" }, { id: "asc" }], include: { disciplines: true, gym: true } });
  return { fichas, recortado: fichas.length >= MAX_CANDIDATOS };
}

/** Combates, récord visible, aura, edad y categoría de cada ficha en la disciplina (y nivel) del filtro, o en todas si no hay. */
async function nivelDe(fichas: FichaConDisciplinas[], f: FiltrosRival) {
  const ids = fichas.map((x) => x.id);
  if (!ids.length) return new Map<string, { combates: number; aura: number; edad: number | null; peso: string | null; record: string; categoria: string }>();
  const [bouts, auras] = await Promise.all([
    db.bout.findMany({ where: { OR: [{ fighterAId: { in: ids } }, { fighterBId: { in: ids } }] }, select: { fighterAId: true, fighterBId: true, result: true, method: true, verification: true, event: { select: { discipline: true, level: true, status: true } } } }),
    db.aura.groupBy({ by: ["fighterId"], where: { fighterId: { in: ids } }, _count: { _all: true } }),
  ]);
  const auraDe = new Map(auras.map((a) => [a.fighterId, a._count._all]));
  return new Map(fichas.map((x) => {
    const recs = computeRecords(x.id, bouts.filter((b) => b.fighterAId === x.id || b.fighterBId === x.id) as unknown as BoutForRecord[]);
    const propias = x.disciplines.filter((d) => (!f.disciplina || d.discipline === f.disciplina) && (!f.nivel || d.level === f.nivel));
    let combates = 0, w = 0, l = 0, dr = 0;
    for (const d of propias) {
      const t = recs[d.discipline]?.[d.level] ?? emptyTally();
      const r = combinedRecord(t, { total: d.priorTotal, wins: d.priorWins, losses: d.priorLosses, draws: d.priorDraws });
      combates += r.w + r.l + r.d + t.nc + (r.priorDetailed ? 0 : r.priorTotal); w += r.w; l += r.l; dr += r.d;
    }
    const principal = propias[0];
    const oculto = !principal || recordHidden(principal.level, x.recordPublic, false);
    return [x.id, {
      combates, aura: auraDe.get(x.id) ?? 0, edad: edadHoy(x.birthDate), peso: principal?.weightClass ?? null,
      record: oculto ? `${combates} ${combates === 1 ? "combate" : "combates"}` : shownRecord({ w, l, d: dr }, false),
      categoria: principal ? `${DISCIPLINE_LABEL[principal.discipline]} ${LEVEL_LABEL[principal.level].toLowerCase()}${principal.weightClass || principal.divisionId ? ` · ${categoryLabel(principal.discipline, principal.level, principal.divisionId, principal.weightClass)}` : ""}` : x.disciplines.map((d) => DISCIPLINE_LABEL[d.discipline]).join(", "),
    }];
  }));
}

const fecha = (d: Date | null) => (d ? d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : null);

/**
 * «Mis propuestas» del peleador: buscar a quién retar o proponer un sparring, y las propuestas recibidas (aceptar o rechazar) y enviadas
 * (cancelar). Con la propuesta aceptada, cada uno ve el correo del otro para concretarlo.
 */
export default async function Propuestas({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/propuestas");
  const params = flatParams(await searchParams);
  const me = user.fighter;
  if (!me) {
    return (
      <div className="pantalla" style={{ gap: 16 }}>
        <h1>Retos y sparrings</h1>
        <div className="tarjeta"><p style={{ margin: 0 }}>Para retar a otros peleadores o proponerles un sparring necesitas tu ficha de peleador.</p><Link className="btn btn-grande" href="/mi-ficha">Crear o reclamar mi ficha</Link></div>
      </div>
    );
  }
  // Buscar rival o sparring con filtros (petición del fundador, 9 de octubre de 2026). Sin filtros, se sugieren los más parecidos a ti.
  const miDisciplina = me.disciplines[0]?.discipline as Discipline | undefined;
  const filtros = parseFiltrosRival(params, miDisciplina);
  const conFiltros = hayFiltrosRival(filtros);
  const ids = filtros.texto ? await searchIds("fighter", filtros.texto) : null;
  const { fichas, recortado } = await buscarRivales(filtros, me.id, ids);
  const yoFicha = await db.fighter.findUniqueOrThrow({ where: { id: me.id }, include: { disciplines: true, gym: true } });
  const nivel = await nivelDe([...fichas, yoFicha], filtros);
  const yo = nivel.get(me.id)!;
  const ordenados = filtrarYOrdenarRivales(fichas.map((x) => ({ ...x, nombre: publicFighterName(x), ...nivel.get(x.id)! })), filtros, yo);
  const encontrados = ordenados.slice(0, conFiltros ? 20 : 5);
  const nivelPeso = filtros.disciplina ? filtros.nivel ?? me.disciplines.find((d) => d.discipline === filtros.disciplina)?.level ?? "AMATEUR" : null;
  const pesos = filtros.disciplina && nivelPeso ? weightClassesFor(filtros.disciplina, nivelPeso) : [];
  const enDireccion: Record<string, string | undefined> = { q: filtros.texto, gimnasio: filtros.gimnasio, disciplina: params.disciplina, nivel: filtros.nivel, peso: filtros.peso, provincia: filtros.provincia, guardia: filtros.guardia, mincomb: filtros.minCombates?.toString(), maxcomb: filtros.maxCombates?.toString(), minedad: filtros.minEdad?.toString(), maxedad: filtros.maxEdad?.toString(), orden: filtros.orden === "parecido" ? undefined : filtros.orden };
  const secundarios = [params.disciplina, filtros.nivel, filtros.peso, filtros.provincia, filtros.guardia, filtros.minCombates, filtros.maxCombates, filtros.minEdad, filtros.maxEdad].filter((v) => v !== undefined && v !== "").length;
  const rango = (a: number | undefined, b: number | undefined, u: string) => (a !== undefined && b !== undefined ? `de ${a} a ${b} ${u}` : a !== undefined ? `${a} ${u} o más` : `hasta ${b} ${u}`);
  const incluir = { include: { disciplines: true, user: { select: { email: true } } } } as const;
  const [recibidas, enviadas] = await Promise.all([
    db.fightProposal.findMany({ where: { toId: me.id }, orderBy: [{ createdAt: "desc" }], take: 50, include: { from: incluir } }),
    db.fightProposal.findMany({ where: { fromId: me.id }, orderBy: [{ createdAt: "desc" }], take: 50, include: { to: incluir } }),
  ]);
  const pendientes = recibidas.filter((p) => p.status === "PENDING").length;
  const detalle = (p: { discipline: keyof typeof DISCIPLINE_LABEL; day: Date | null; place: string | null }) => [DISCIPLINE_LABEL[p.discipline], fecha(p.day), p.place].filter(Boolean).join(" · ");
  return (
    <div className="pantalla" style={{ gap: 18 }}>
      <div><h1>Retos y sparrings</h1><p className="lead" style={{ fontSize: 16 }}>Reta a otro peleador o proponle un sparring. Si acepta, podréis escribiros por correo para concretarlo.</p></div>

      <section id="proponer" className="tarjeta" aria-labelledby="titulo-proponer" style={{ gap: 12, scrollMarginTop: 80 }}>
        <h2 id="titulo-proponer" style={{ margin: 0, font: "800 20px var(--font)" }}>¿A quién quieres retar?</h2>
        <p className="mut" style={{ margin: 0 }}>Busca por nombre o por gimnasio, o afina con «Más filtros»: disciplina, peso, guardia, número de combates, edad…</p>
        <form className="search" role="search" aria-label="Buscar rival o sparring">
          <CampoFiltro etiqueta="Nombre o alias"><input name="q" defaultValue={filtros.texto} maxLength={80} /></CampoFiltro>
          <CampoFiltro etiqueta="Gimnasio"><input name="gimnasio" defaultValue={filtros.gimnasio} maxLength={80} /></CampoFiltro>
          <CampoFiltro etiqueta="Ordenar por"><select name="orden" defaultValue={filtros.orden}>{Object.entries(ORDENES_RIVAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></CampoFiltro>
          <MasFiltros activos={secundarios}>
            <CampoFiltro etiqueta="Disciplina" ayuda={miDisciplina ? "Por defecto, la tuya." : undefined}><select name="disciplina" defaultValue={params.disciplina ?? (miDisciplina ?? "todas")}><option value="todas">Todas las disciplinas</option>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select></CampoFiltro>
            <CampoFiltro etiqueta="Nivel"><select name="nivel" defaultValue={filtros.nivel ?? ""}><option value="">Amateur y profesional</option><option value="AMATEUR">Amateur</option><option value="PRO">Profesional</option></select></CampoFiltro>
            {pesos.length > 0 && <CampoFiltro etiqueta="Categoría de peso" ayuda="La que tiene en su ficha."><select name="peso" defaultValue={filtros.peso ?? ""}><option value="">Todas</option>{pesos.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}</select></CampoFiltro>}
            <CampoFiltro etiqueta="Provincia"><select name="provincia" defaultValue={filtros.provincia ?? ""}><option value="">Toda España</option>{PROVINCES.map((x) => <option key={x}>{x}</option>)}</select></CampoFiltro>
            <CampoFiltro etiqueta="Guardia"><select name="guardia" defaultValue={filtros.guardia ?? ""}><option value="">Cualquiera</option>{Object.entries(STANCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></CampoFiltro>
            <CampoFiltro etiqueta="Combates, como mínimo"><input name="mincomb" type="number" inputMode="numeric" min={0} max={999} defaultValue={filtros.minCombates} /></CampoFiltro>
            <CampoFiltro etiqueta="Combates, como máximo"><input name="maxcomb" type="number" inputMode="numeric" min={0} max={999} defaultValue={filtros.maxCombates} /></CampoFiltro>
            <CampoFiltro etiqueta="Edad mínima"><input name="minedad" type="number" inputMode="numeric" min={0} max={99} defaultValue={filtros.minEdad} /></CampoFiltro>
            <CampoFiltro etiqueta="Edad máxima"><input name="maxedad" type="number" inputMode="numeric" min={0} max={99} defaultValue={filtros.maxEdad} /></CampoFiltro>
          </MasFiltros>
          <BotonesFiltro ruta="/propuestas" hayFiltros={conFiltros || !!params.disciplina || filtros.orden !== "parecido"} />
        </form>
        <FiltrosActivos ruta="/propuestas" params={enDireccion} activos={[
          ...(filtros.texto ? [{ texto: `Nombre: ${filtros.texto}`, claves: ["q"] }] : []),
          ...(filtros.gimnasio ? [{ texto: `Gimnasio: ${filtros.gimnasio}`, claves: ["gimnasio"] }] : []),
          ...(params.disciplina ? [{ texto: filtros.disciplina ? DISCIPLINE_LABEL[filtros.disciplina] : "Todas las disciplinas", claves: ["disciplina", "peso"] }] : []),
          ...(filtros.nivel ? [{ texto: LEVEL_LABEL[filtros.nivel], claves: ["nivel"] }] : []),
          ...(filtros.peso ? [{ texto: pesos.find((c) => c.valor === filtros.peso)?.etiqueta ?? filtros.peso, claves: ["peso"] }] : []),
          ...(filtros.provincia ? [{ texto: filtros.provincia, claves: ["provincia"] }] : []),
          ...(filtros.guardia ? [{ texto: `Guardia: ${STANCE_LABEL[filtros.guardia].toLowerCase()}`, claves: ["guardia"] }] : []),
          ...(filtros.minCombates !== undefined || filtros.maxCombates !== undefined ? [{ texto: rango(filtros.minCombates, filtros.maxCombates, "combates"), claves: ["mincomb", "maxcomb"] }] : []),
          ...(filtros.minEdad !== undefined || filtros.maxEdad !== undefined ? [{ texto: `Edad: ${rango(filtros.minEdad, filtros.maxEdad, "años")}`, claves: ["minedad", "maxedad"] }] : []),
        ]} />
        <h3 style={{ margin: 0, font: "700 17px var(--font)" }}>{conFiltros ? (ordenados.length === 1 ? "1 peleador" : `${ordenados.length} peleadores`) : "Peleadores parecidos a ti"}</h3>
        {conFiltros && ordenados.length > encontrados.length && <p className="meta" style={{ margin: 0 }}>Se muestran los {encontrados.length} primeros{recortado ? " de muchos" : ""}. Afina con los filtros para encontrar a quien buscas.</p>}
        {encontrados.length === 0 && <p className="mut" style={{ margin: 0 }}>{conFiltros ? "Ningún peleador con ficha reclamada coincide con estos filtros. Quita alguno en «Estás viendo»." : "Todavía no hay otros peleadores con ficha reclamada en tu disciplina."} También puedes buscar en <Link href="/peleadores">Peleadores</Link>.</p>}
        {encontrados.map((f) => (
          <article key={f.id} className="tarjeta" aria-label={f.nombre} style={{ gap: 6, padding: 14 }}>
            <strong><Link href={`/peleadores/${f.slug}`}>{f.nombre}</Link></strong>
            <span className="meta">{[f.gym?.name, f.province].filter(Boolean).join(" · ") || "Sin gimnasio ni provincia indicados"}</span>
            <span className="meta">{f.categoria}</span>
            <span className="meta">{[f.record, f.stance ? `guardia ${STANCE_LABEL[f.stance].toLowerCase()}` : null, f.edad !== null ? `${f.edad} años` : null, `aura ${f.aura}`].filter(Boolean).join(" · ")}</span>
            <span style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              <Link className="btn" href={`/peleadores/${f.slug}/proponer?tipo=FIGHT`} aria-label={`Retar a ${f.nombre}`}>Retar</Link>
              <Link className="btn secondary" href={`/peleadores/${f.slug}/proponer?tipo=SPARRING`} aria-label={`Proponer un sparring a ${f.nombre}`}>Proponer sparring</Link>
            </span>
          </article>
        ))}
      </section>

      <Pestanas etiqueta="Mis propuestas" inicial={pendientes || !enviadas.length ? 0 : 1} pestanas={[
        { id: "pestana-recibidas", titulo: `Recibidas (${pendientes})`, contenido: <>
          <h2 className="sr-only">Propuestas recibidas</h2>
          {recibidas.length === 0 && <p className="mut" style={{ margin: 0 }}>Todavía nadie te ha retado ni propuesto un sparring.</p>}
          {recibidas.map((p) => (
            <article key={p.id} className="tarjeta" style={p.status === "PENDING" ? { borderColor: "var(--acc)" } : undefined} aria-label={`${PROPOSAL_KIND_LABEL[p.kind]} de ${publicFighterName(p.from)}`}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><span className="kicker">{PROPOSAL_KIND_LABEL[p.kind]}</span><span className="meta">{PROPOSAL_STATUS_LABEL[p.status]} · {fmtDate(p.createdAt)}</span></div>
              <div style={{ font: "800 20px/1.15 var(--font)" }}><Link href={`/peleadores/${p.from.slug}`}>{publicFighterName(p.from)}</Link></div>
              <div className="meta">{detalle(p)}</div>
              {p.message && <p style={{ margin: 0 }}>«{p.message}»</p>}
              {p.reply && <div className="meta">Tu respuesta: {p.reply}</div>}
              {p.status === "ACCEPTED" && p.from.user && <p className="mut" style={{ margin: 0 }}>Para concretarlo, escribe a <a href={`mailto:${p.from.user.email}`}>{p.from.user.email}</a>.</p>}
              {puedeResponderPropuesta(p.status) && (
                <form action={answerProposal} style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <input type="hidden" name="proposalId" value={p.id} />
                  <label className="field"><span>Mensaje (opcional)</span><textarea name="reply" rows={2} maxLength={PROPOSAL_REPLY_MAX} placeholder="Fecha, lugar, peso…" /></label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button name="decision" value="aceptar" style={{ flex: 1 }}>Aceptar</button>
                    <button name="decision" value="rechazar" className="secondary" style={{ flex: 1 }}>Rechazar</button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </> },
        { id: "pestana-enviadas", titulo: `Enviadas (${enviadas.length})`, contenido: <>
          <h2 className="sr-only">Propuestas enviadas</h2>
          {enviadas.length === 0 && <p className="mut" style={{ margin: 0 }}>Todavía no has enviado ninguna propuesta. Busca arriba a quién retar.</p>}
          {enviadas.map((p) => (
            <article key={p.id} className="tarjeta" aria-label={`${PROPOSAL_KIND_LABEL[p.kind]} a ${publicFighterName(p.to)}`}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><span className={`pildora ${PILDORA[p.status]}`}>{PROPOSAL_STATUS_LABEL[p.status]}</span><span className="meta">{fmtDate(p.createdAt)}</span></div>
              <div style={{ font: "800 20px/1.15 var(--font)" }}>{PROPOSAL_KIND_LABEL[p.kind]} a <Link href={`/peleadores/${p.to.slug}`}>{publicFighterName(p.to)}</Link></div>
              <div className="meta">{detalle(p)}</div>
              {p.reply && <p style={{ margin: 0 }}><strong>Su respuesta:</strong> {p.reply}</p>}
              {p.status === "ACCEPTED" && p.to.user && <p className="mut" style={{ margin: 0 }}>Para concretarlo, escribe a <a href={`mailto:${p.to.user.email}`}>{p.to.user.email}</a>.{p.kind === "FIGHT" ? " Cuando se celebre, regístralo en tu ficha para que cuente en el récord." : ""}</p>}
              {puedeCancelarPropuesta(p.status) && (
                <form action={cancelProposal} style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <input type="hidden" name="proposalId" value={p.id} />
                  <button className="secondary" aria-label={`Cancelar la propuesta a ${publicFighterName(p.to)}`}>Cancelar la propuesta</button>
                </form>
              )}
            </article>
          ))}
        </> },
      ]} />
    </div>
  );
}
