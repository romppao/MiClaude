"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <h1>Algo no ha salido como esperábamos</h1>
      <p>Ha ocurrido un problema y no hemos podido mostrar esta página. No has perdido nada de lo que ya estaba guardado. Puedes intentarlo de nuevo.</p>
      <p style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={() => reset()}>Intentarlo de nuevo</button>
        <a href="/"><button className="secondary">Ir al inicio</button></a>
      </p>
    </>
  );
}
