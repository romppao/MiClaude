"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <h1>Algo no ha salido como esperábamos</h1>
      <p>Ha ocurrido un problema y no hemos podido mostrar esta página. No has perdido nada de lo que ya estaba guardado. Puedes intentarlo de nuevo.</p>
      <p className="acciones">
        <button onClick={() => reset()}>Intentarlo de nuevo</button>
        <Link href="/" className="btn secondary">Ir al inicio</Link>
      </p>
    </>
  );
}
