"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { EstadoCodigos } from "../../lib/accounts/creador";
import { PROBLEMAS } from "../../lib/common/messages";
import { lookup } from "../../lib/common/safe";

/**
 * Formulario que pide un código de la aplicación y, si es correcto, enseña los diez códigos de emergencia una sola vez
 * (activar el segundo paso o crear códigos nuevos). Los códigos no se guardan en claro en ningún sitio: hay que apuntarlos ahora.
 */
export default function CodigosEmergencia({ accion, boton, continuar }: { accion: (prev: EstadoCodigos, f: FormData) => Promise<EstadoCodigos>; boton: string; continuar: string }) {
  const [estado, enviar, enviando] = useActionState(accion, {});
  if (estado.codigos) {
    return (
      <section className="tarjeta" aria-labelledby="titulo-codigos" style={{ gap: 12 }}>
        <h2 id="titulo-codigos" style={{ fontSize: 22 }}>Tus códigos de emergencia</h2>
        <p role="status" style={{ margin: 0 }}>Apúntalos ahora en papel y guárdalos en un lugar seguro (o en un gestor de contraseñas). <strong>No se volverán a mostrar.</strong> Cada uno sirve <strong>una sola vez</strong> para entrar sin el móvil.</p>
        <ol className="codigos-emergencia">{estado.codigos.map((c) => <li key={c}><code>{c}</code></li>)}</ol>
        <p className="acciones" style={{ margin: 0 }}>
          <button type="button" className="secondary" onClick={() => window.print()}>Imprimir los códigos</button>
          <Link className="btn" href={continuar}>Ya los he guardado: continuar</Link>
        </p>
      </section>
    );
  }
  const problema = lookup(PROBLEMAS, estado.problema);
  return (
    <form action={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {problema && <p className="notice notice-bad" role="alert" style={{ margin: 0 }}><span aria-hidden="true">⚠ </span>{problema}</p>}
      <label className="field"><span>Código de 6 cifras de tu aplicación</span><input name="codigo" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required /></label>
      <button className="btn-grande" disabled={enviando}>{enviando ? "Comprobando…" : boton}</button>
    </form>
  );
}
