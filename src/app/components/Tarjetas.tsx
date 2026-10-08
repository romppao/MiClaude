import Link from "next/link";
import type { CSSProperties } from "react";
import type { Discipline, Level } from "@prisma/client";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { COLOR_DISCIPLINA, iniciales, tinteDe } from "../../lib/common/apariencia";
import { LEVEL_LABEL } from "../../lib/common/labels";
import { dayAndMonth } from "../../lib/common/dates";
import Foto from "./Foto";

/** Tarjetas del diseño v3 que se repiten en varias pantallas (inicio, portadas y listados). Solo muestran datos; no leen la base de datos. */

const tinte = (d: Discipline | null | undefined) => ({ "--tinte": tinteDe(d) }) as CSSProperties;

/** Cartel de una velada: foto o color de la disciplina, fecha en lima, nombre y lugar. */
export function TarjetaCartel({ e }: { e: { slug: string; name: string; date: Date; discipline: Discipline; level: Level; city: string } }) {
  const { dia, mes } = dayAndMonth(e.date);
  return (
    <Link href={`/veladas/${e.slug}`} className="tarjeta-foto cartel" style={tinte(e.discipline)}>
      <span className="fecha-cartel" aria-hidden="true"><b>{dia}</b><span>{mes}</span></span>
      <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <strong>{e.name}</strong>
        <span className="meta" style={{ color: "rgba(255,255,255,.8)" }}><span className="sr-only">{dia} de {mes} · </span>{DISCIPLINE_LABEL[e.discipline]} · {LEVEL_LABEL[e.level]} · {e.city}</span>
      </span>
    </Link>
  );
}

/** Tarjeta grande de una disciplina, con su raya de color. */
export function TarjetaDisciplina({ d, href, pequena = false }: { d: Discipline; href: string; pequena?: boolean }) {
  return (
    <Link href={href} className="tarjeta-foto disciplina" style={{ ...tinte(d), "--color": COLOR_DISCIPLINA[d], ...(pequena ? { flex: "none", width: 140, height: 170 } : {}) } as CSSProperties}>
      <span className="raya" aria-hidden="true" />
      <strong style={pequena ? { fontSize: 19 } : undefined}>{DISCIPLINE_LABEL[d]}</strong>
    </Link>
  );
}

/** Peleador en una fila deslizable (ránking de aura): posición, nombre y aura. */
export function MiniPeleador({ f }: { f: { id: string; slug: string; name: string; discipline: Discipline; aura: number; pos?: number } }) {
  return (
    <Link href={`/peleadores/${f.slug}`} className="tarjeta-foto mini-peleador" style={tinte(f.discipline)}>
      <span className="iniciales" aria-hidden="true">{iniciales(f.name)}</span>
      <Foto src={`/imagenes/peleador/${f.id}/avatar`} />
      {f.pos !== undefined && <span className="arriba"><span className="pos">#{f.pos}</span></span>}
      <span className="abajo"><strong style={{ font: "800 16px/1.1 var(--font)", letterSpacing: "-.02em" }}>{f.name}</strong><span className="meta-acc">{f.aura} de aura · {DISCIPLINE_LABEL[f.discipline]}</span></span>
    </Link>
  );
}

/** Gráfico de aura recibida por mes (diseño v3): el área violeta es el acumulado y la línea lima, lo recibido cada mes. */
export function GraficoAura({ serie, etiqueta }: { serie: { mes: string; total: number }[]; etiqueta: string }) {
  const W = 340, H = 140, n = Math.max(serie.length - 1, 1);
  const max = Math.max(1, ...serie.map((x) => x.total));
  let suma = 0;
  const acumulado = serie.map((x) => (suma += x.total));
  const maxAc = Math.max(1, suma);
  const punto = (i: number, v: number, tope: number) => `${Math.round((i / n) * W)} ${Math.round(H - 12 - (v / tope) * (H - 30))}`;
  const linea = serie.map((x, i) => `${i ? "L" : "M"}${punto(i, x.total, max)}`).join(" ");
  const area = acumulado.map((v, i) => `${i ? "L" : "M"}${punto(i, v, maxAc)}`).join(" ");
  const ultimo = punto(serie.length - 1, serie[serie.length - 1]?.total ?? 0, max).split(" ");
  return (
    <figure className="grafico-aura" style={{ margin: 0, position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={etiqueta}>
        <path d={`${area} L${W} ${H} L0 ${H}Z`} style={{ fill: "var(--acc2)", opacity: 0.28 }} />
        <path d={area} style={{ fill: "none", stroke: "var(--acc2)", strokeWidth: 2 }} />
        <path d={linea} style={{ fill: "none", stroke: "var(--acc)", strokeWidth: 2.6, strokeLinejoin: "round" }} />
      </svg>
      <span aria-hidden="true" style={{ position: "absolute", left: `calc(${(Number(ultimo[0]) / W) * 100}% - 5.5px)`, top: `${Number(ultimo[1]) - 5.5}px`, width: 11, height: 11, borderRadius: "50%", background: "var(--acc)" }} />
      <figcaption className="meses" aria-hidden="true">{serie.map((x, i) => <span key={i}>{x.mes}</span>)}</figcaption>
    </figure>
  );
}
