"use client";

/** Último recurso: si falla incluso la estructura de la página, se muestra este aviso en español. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ background: "#0e0e10", color: "#f2f2f4", font: "16px/1.5 system-ui, sans-serif", padding: 24 }}>
        <h1>Algo no ha salido como esperábamos</h1>
        <p>Ha ocurrido un problema y no hemos podido cargar Ring España. Puedes intentarlo de nuevo.</p>
        <button onClick={() => reset()} style={{ minHeight: 44, padding: "8px 16px", fontSize: 16 }}>Intentarlo de nuevo</button>
      </body>
    </html>
  );
}
