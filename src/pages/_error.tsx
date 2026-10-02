import type { NextPageContext } from "next";

/**
 * Pantalla de último recurso de Next.js (se usa cuando falla algo antes de que la aplicación pueda pintar su cabecera, por ejemplo una dirección mal codificada
 * como «%E0%A4%A»). Sin ella saldría un «400: Bad Request» en inglés. Es independiente del resto de la interfaz a propósito: no puede depender de nada que haya fallado.
 */
function Error({ statusCode }: { statusCode?: number }) {
  const direccionMala = statusCode === 400;
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e10", color: "#f2f2f4", margin: 0 }}>
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "0 auto", padding: "10vh 16px 0", fontSize: "1.125rem", lineHeight: 1.5 }}>
      <h1>{direccionMala ? "No hemos podido abrir esta dirección" : "Ha ocurrido un problema"}</h1>
      <p>
        {direccionMala
          ? "La dirección contiene caracteres que no entendemos; puede que se haya cortado o copiado mal. Vuelve al inicio y busca lo que necesitas desde ahí."
          : "No es culpa tuya. Vuelve al inicio e inténtalo de nuevo; si sigue ocurriendo, inténtalo más tarde."}
      </p>
      <p><a href="/" style={{ display: "inline-block", padding: "12px 20px", background: "#c8102e", color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>Ir al inicio</a></p>
    </main>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => ({ statusCode: res?.statusCode ?? err?.statusCode ?? 500 });

export default Error;
