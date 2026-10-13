"use client";

import Link from "next/link";
import { useEffect } from "react";
import { informarFallo } from "./components/informarFallo";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Queda en el registro de fallos (/moderacion/fallos): los del servidor ya llegan solos; los del navegador se envían aquí.
  useEffect(() => { informarFallo(error, error.digest); }, [error]);
  return (
    <>
      <h1>Algo no ha salido como esperábamos</h1>
      <p>Ha ocurrido un problema y no hemos podido mostrar esta página. No has perdido nada de lo que ya estaba guardado. Puedes intentarlo de nuevo.</p>
      <p className="mut">El fallo ha quedado registrado y el equipo lo revisará.{error.digest && <> Si escribes a soporte, indica este código: <strong>{error.digest}</strong>.</>}</p>
      <p className="acciones">
        <button onClick={() => reset()}>Intentarlo de nuevo</button>
        <Link href="/" className="btn secondary">Ir al inicio</Link>
      </p>
    </>
  );
}
