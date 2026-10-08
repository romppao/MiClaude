import Link from "next/link";
import { PASOS_REGISTRO, type TipoDeCuenta } from "../../lib/accounts/landing";
import Icono from "./Icono";

/** Cabecera del registro por pasos (diseño v3): volver, una barra por paso y «Paso n de N». */
export default function PasosRegistro({ tipo, paso, atras, etiquetaAtras }: { tipo: TipoDeCuenta | null; paso: number; atras: string; etiquetaAtras: string }) {
  const total = tipo ? PASOS_REGISTRO[tipo].length : 3;
  return (
    <div className="pasos">
      <Link href={atras} className="boton-icono" aria-label={etiquetaAtras} style={{ marginLeft: -12 }}><Icono nombre="atras" tam={22} /></Link>
      <div className="barras" aria-hidden="true">{Array.from({ length: total }, (_, i) => <span key={i} className={i <= paso ? "hecho" : undefined} />)}</div>
      <span className="meta" style={{ paddingLeft: 8 }}>Paso {paso + 1} de {total}</span>
    </div>
  );
}
