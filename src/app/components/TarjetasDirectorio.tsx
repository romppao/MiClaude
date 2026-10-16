import Link from "next/link";
import type { CSSProperties } from "react";
import type { Discipline } from "@prisma/client";
import { iniciales, tinteDe } from "../../lib/common/apariencia";
import Foto from "./Foto";
import IconoDisciplina from "./IconoDisciplina";

/**
 * Carteles de los directorios (16 de octubre de 2026, petición del fundador: «que se vea directamente la imagen», como en las veladas):
 * peleadores, entrenadores y gimnasios. Foto a toda la tarjeta; sin foto, el color de la disciplina y las iniciales. Solo muestran datos.
 * Conservan la clase `card` y el nombre en `<strong>` porque las pruebas de navegador y el CSS de las tarjetas cuentan con ellos.
 */
const tinte = (d: Discipline | null | undefined) => ({ "--tinte": tinteDe(d) }) as CSSProperties;

/** Peleador o entrenador: retrato, nombre y, debajo, lo que más sirve para elegir. La primera línea va en lima. */
export function TarjetaPersona({ href, tipo, id, nombre, disciplina, pildora, lineas, extra }: {
  href: string; tipo: "peleador" | "entrenador"; id: string; nombre: string; disciplina: Discipline | null; pildora?: string; lineas: string[]; extra?: string;
}) {
  return (
    <Link href={href} className="card tarjeta-foto cartel-persona" style={tinte(disciplina)} data-reveal>
      <span className="iniciales" aria-hidden="true">{iniciales(nombre)}</span>
      {/* La foto es decorativa: el nombre ya está escrito en la tarjeta. */}
      <Foto src={`/imagenes/${tipo}/${id}/avatar`} />
      <span className="arriba">
        <span />
        {disciplina && <span className="cartel-icono"><IconoDisciplina d={disciplina} tam={20} grosor={1.7} /></span>}
      </span>
      <span className="abajo">
        {pildora && <span className="pildora pildora-acc">{pildora}</span>}
        <strong>{nombre}</strong>
        {lineas.map((l, i) => <span key={i} className={i === 0 ? "meta-acc" : "cartel-dato"}>{l}</span>)}
        {extra && <span className="cartel-dato cartel-extra">{extra}</span>}
      </span>
    </Link>
  );
}

/** Gimnasio: su cabecera (banner) a toda la tarjeta y su logotipo, o las iniciales, en un círculo arriba. */
export function TarjetaGimnasioCartel({ id, slug, nombre, ciudad, provincia, peleadores, verificado }: {
  id: string; slug: string; nombre: string; ciudad: string; provincia: string; peleadores: number; verificado: boolean;
}) {
  return (
    <Link href={`/gimnasios/${slug}`} className="card tarjeta-foto cartel-persona cartel-gimnasio" style={tinte(null)} data-reveal>
      <Foto src={`/imagenes/gimnasio/${id}/banner`} />
      <span className="arriba">
        <span className="cartel-logo"><span aria-hidden="true">{iniciales(nombre)}</span><Foto src={`/imagenes/gimnasio/${id}/avatar`} /></span>
      </span>
      <span className="abajo">
        {verificado && <span className="pildora pildora-acc" title="Verificado por un moderador">Verificado</span>}
        <strong>{nombre}</strong>
        <span className="meta-acc">{ciudad} ({provincia})</span>
        <span className="cartel-dato">{peleadores === 1 ? "1 peleador" : `${peleadores} peleadores`}</span>
      </span>
    </Link>
  );
}
