import Link from "next/link";
import type { Bout, Event, Fighter, FighterDiscipline } from "@prisma/client";
import { DISCIPLINE_LABEL, weightClassLabel } from "../../lib/common/disciplines";
import { LEVEL_LABEL, fmtDate, METHOD_LABEL } from "../../lib/common/labels";
import { daysUntil, whenLabel } from "../../lib/common/dates";
import { iniciales, nombreDePila } from "../../lib/common/apariencia";
import { publicFighterName } from "../../lib/common/names";
import { recordHidden, shownRecord } from "../../lib/fighters/privacy";
import { combinedRecord, computeRecords, emptyTally } from "../../lib/fighters/record";
import Foto from "../components/Foto";

/** Piezas comunes de los inicios por papel (diseño v3). */

/** Saludo con el avatar que lleva a «Mi cuenta». */
export function Saludo({ nombre, sub, cuadrado = false, extra, kicker }: { nombre: string; sub: React.ReactNode; cuadrado?: boolean; extra?: React.ReactNode; kicker?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Link href="/mi-cuenta" className={`avatar ${cuadrado ? "avatar-relleno" : "avatar-acc"}`} style={{ width: 52, height: 52, borderRadius: cuadrado ? 18 : "50%", textDecoration: "none" }} aria-label="Mi cuenta">{iniciales(nombre)}</Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        {kicker && <span className="kicker kicker-acc">{kicker}</span>}
        <h1 style={{ margin: 0, font: "800 22px/1.15 var(--font)", letterSpacing: "-.03em" }}>{cuadrado ? nombre : `Hola, ${nombreDePila(nombre)}`}</h1>
        <div className="meta" style={{ fontSize: 15 }}>{sub}</div>
      </div>
      {extra}
    </div>
  );
}

type FichaRecord = Fighter & { disciplines: FighterDiscipline[] };
type BoutConTodo = Bout & { event: Event; fighterA: FighterRecordable; fighterB: FighterRecordable };
type FighterRecordable = Fighter & { boutsAsA?: (Bout & { event: Event })[]; boutsAsB?: (Bout & { event: Event })[]; disciplines?: FighterDiscipline[] };

/** Récord de una ficha como lo ve el público en la disciplina del combate (respeta el récord amateur privado). */
export function recordPublico(f: FighterRecordable, b: { event: Event }, viewerFighterId?: string | null) {
  const bouts = [...(f.boutsAsA ?? []), ...(f.boutsAsB ?? [])];
  const t = computeRecords(f.id, bouts)[b.event.discipline]?.[b.event.level] ?? emptyTally();
  const fd = f.disciplines?.find((d) => d.discipline === b.event.discipline && d.level === b.event.level);
  const prior = fd ? { total: fd.priorTotal, wins: fd.priorWins, losses: fd.priorLosses, draws: fd.priorDraws } : null;
  return shownRecord(combinedRecord(t, prior), recordHidden(b.event.level, f.recordPublic, viewerFighterId === f.id));
}

/** Combate «VS» del cartel: las dos esquinas con su foto, nombres, récord y los datos de la velada. */
export function CombateVS({ b, viewerFighterId }: { b: BoutConTodo; viewerFighterId?: string | null }) {
  const dias = daysUntil(b.event.date);
  const lado = (f: FighterRecordable) => ({ nombre: publicFighterName(f), rec: recordPublico(f, b, viewerFighterId), ciudad: f.listed ? f.city : null });
  const a = lado(b.fighterA), z = lado(b.fighterB);
  return (
    <Link href={`/veladas/${b.event.slug}`} className="vs" aria-label={`${a.nombre} contra ${z.nombre} en ${b.event.name}, ${fmtDate(b.event.date)}`}>
      <span className="caras" aria-hidden="true">
        <span className="cara cara-a">{iniciales(a.nombre)}<Foto src={`/imagenes/peleador/${b.fighterA.id}/avatar`} /></span>
        <span className="cara cara-b">{iniciales(z.nombre)}<Foto src={`/imagenes/peleador/${b.fighterB.id}/avatar`} /></span>
        <span className="sello">VS</span>
      </span>
      <span className="nombres" aria-hidden="true">
        <span><b>{a.nombre}</b><span className="meta">{a.rec}{a.ciudad ? ` · ${a.ciudad}` : ""}</span></span>
        <span style={{ textAlign: "right" }}><b>{z.nombre}</b><span className="meta">{z.rec}{z.ciudad ? ` · ${z.ciudad}` : ""}</span></span>
      </span>
      <span className="pildoras" aria-hidden="true">
        <span className="pildora" style={{ fontWeight: 500 }}>{b.event.name}</span>
        <span className="pildora" style={{ fontWeight: 500 }}>{fmtDate(b.event.date)} · {b.event.city}</span>
        <span className="pildora" style={{ fontWeight: 500 }}>{DISCIPLINE_LABEL[b.event.discipline]} · {LEVEL_LABEL[b.event.level]}{b.weightClass ? ` · ${weightClassLabel(b.event.discipline, b.event.level, b.weightClass, b.divisionId)}` : ""}{b.rounds ? ` · ${b.rounds} asaltos` : ""}</span>
        <span className="pildora pildora-violeta">{whenLabel(dias)}</span>
      </span>
    </Link>
  );
}

/** «Gana Álvaro Ruiz · KO (asalto 3)», o solo los nombres si el récord amateur de alguno es privado. */
export function textoResultado(b: Bout & { event: Event; fighterA: Fighter; fighterB: Fighter }) {
  const a = publicFighterName(b.fighterA), z = publicFighterName(b.fighterB);
  const privado = b.event.level === "AMATEUR" && (!b.fighterA.recordPublic || !b.fighterB.recordPublic);
  if (privado || !b.result) return `${a} contra ${z}`;
  const metodo = b.method ? ` · ${METHOD_LABEL[b.method]}${b.endRound ? ` (asalto ${b.endRound})` : ""}` : "";
  if (b.result === "DRAW") return `${a} y ${z} empatan${metodo}`;
  if (b.result === "NO_CONTEST") return `${a} contra ${z} · sin decisión`;
  return `Gana ${b.result === "A_WIN" ? a : z} ante ${b.result === "A_WIN" ? z : a}${metodo}`;
}

export type { FichaRecord };
