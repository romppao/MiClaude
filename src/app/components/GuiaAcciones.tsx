import Link from "next/link";
import type { CSSProperties } from "react";
import type { Discipline } from "@prisma/client";
import { tinteDe } from "../../lib/common/apariencia";
import { dayAndMonth } from "../../lib/common/dates";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import Foto from "./Foto";
import Icono, { type NombreIcono } from "./Icono";
import IconoDisciplina from "./IconoDisciplina";

/**
 * Piezas de las pantallas donde la persona hace algo (16 de octubre de 2026, petición del fundador: «muy poco visuales e intuitivas […]
 * para un usuario que no tenga muchas nociones de usar un teléfono»): saber en qué paso está, elegir tocando una imagen en vez de
 * buscar en una lista y llegar a la acción principal sin deslizar. Solo presentan; no leen la base de datos.
 */

/** «Paso 1 de 2»: dónde está la persona y qué viene después. El paso actual va en lima y los hechos con una marca. */
export function PasosGuia({ pasos, actual }: { pasos: string[]; actual: number }) {
  return (
    <ol className="pasos-guia" aria-label={`Estás en el paso ${actual} de ${pasos.length}`}>
      {pasos.map((p, i) => (
        <li key={p} className={i + 1 < actual ? "hecho" : i + 1 === actual ? "actual" : undefined} aria-current={i + 1 === actual ? "step" : undefined}>
          <span className="num" aria-hidden="true">{i + 1 < actual ? <Icono nombre="check" tam={16} grosor={3} /> : i + 1}</span>
          <span className="txt">{p}</span>
        </li>
      ))}
    </ol>
  );
}

/** Velada para elegir tocando su cartel (como en el calendario), en una fila que se desliza hacia los lados. */
export function TarjetaElegirVelada({ href, nombre, fecha, lugar, disciplina, cartel }: { href: string; nombre: string; fecha: Date; lugar: string; disciplina: Discipline; cartel: string | null }) {
  const { dia, mes } = dayAndMonth(fecha);
  return (
    <Link href={href} className="velada-cartel velada-elegir" style={{ "--tinte": tinteDe(disciplina) } as CSSProperties}>
      <span className="velada-cartel-imagen">
        {cartel ? <Foto src={cartel} /> : <span className="velada-cartel-icono" aria-hidden="true"><IconoDisciplina d={disciplina} tam={72} grosor={1.25} /></span>}
        <span className="velada-cartel-arriba"><span className="fecha-cartel" aria-hidden="true"><b>{dia}</b><span>{mes}</span></span></span>
      </span>
      <span className="velada-cartel-abajo">
        <strong>{nombre}</strong>
        <span className="meta"><span className="sr-only">{dia} de {mes} · </span>{lugar} · {DISCIPLINE_LABEL[disciplina]}</span>
        <span className="velada-reservar">Elegir esta velada<span aria-hidden="true"> →</span></span>
      </span>
    </Link>
  );
}

/** Accesos grandes con icono al principio de una pantalla larga: el primero (el principal) en lima, para llegar sin deslizar. */
export function AccesosRapidos({ accesos, etiqueta }: { accesos: { href: string; icono: NombreIcono; titulo: string; detalle: string }[]; etiqueta: string }) {
  return (
    <nav className="accesos-rapidos" aria-label={etiqueta}>
      {accesos.map((a) => (
        <Link key={a.href} href={a.href} className="acceso-rapido">
          <span className="acceso-icono" aria-hidden="true"><Icono nombre={a.icono} tam={22} grosor={1.9} /></span>
          <span className="acceso-texto"><strong>{a.titulo}</strong><span className="meta">{a.detalle}</span></span>
        </Link>
      ))}
    </nav>
  );
}

/** Texto de ayuda largo recogido: está a un toque, pero no empuja hacia abajo lo que la persona vino a hacer. */
export function AyudaPlegable({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="ayuda-plegable">
      <summary>{titulo}</summary>
      <div className="ayuda-plegable-cuerpo">{children}</div>
    </details>
  );
}
