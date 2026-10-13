"use client";

import { useEffect } from "react";
import { informarFallo } from "./components/informarFallo";

/** Último recurso: si falla incluso la estructura de la página, se muestra este aviso en español. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { informarFallo(error, error.digest); }, [error]);
  return (
    <html lang="es">
      <body style={{ background: "#0e0e10", color: "#f2f2f4", font: "16px/1.5 system-ui, sans-serif", padding: 24 }}>
        <h1>Algo no ha salido como esperábamos</h1>
        <p>Ha ocurrido un problema y no hemos podido cargar Lona. Puedes intentarlo de nuevo. El fallo ha quedado registrado y el equipo lo revisará.</p>
        <button onClick={() => reset()} style={{ minHeight: 44, padding: "8px 16px", fontSize: 16 }}>Intentarlo de nuevo</button>
      </body>
    </html>
  );
}
