/**
 * Envía al registro de fallos (/api/fallos → src/lib/common/fallos.ts) un fallo ocurrido en el navegador.
 * Si el fallo trae `digest`, ocurrió en el servidor y ya está registrado allí: no se repite. Como mucho 3 envíos por página,
 * para que un fallo en bucle no inunde el registro. Nunca lanza.
 */
let enviados = 0;
export function informarFallo(error: unknown, digest?: string | null) {
  if (digest || enviados >= 3 || typeof window === "undefined") return;
  enviados++;
  const e = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Fallo sin mensaje");
  try {
    void fetch("/api/fallos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ mensaje: `${e.name !== "Error" ? `${e.name}: ` : ""}${e.message}`.slice(0, 500), pila: (e.stack ?? "").slice(0, 4000), ruta: location.pathname }),
    }).catch(() => {});
  } catch {}
}
