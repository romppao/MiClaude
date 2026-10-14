import { googleDisponible } from "../../lib/accounts/google";

/**
 * «Continuar con Google» (T-015). Solo aparece si el alojamiento tiene las claves de Google (GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET).
 * Es un enlace normal a /api/auth/google: funciona sin JavaScript. El logotipo usa los colores de marca de Google (no los del tema).
 */
export default function BotonGoogle({ modo, tipo, next, texto = "Continuar con Google" }: { modo: "entrar" | "registro"; tipo?: string; next?: string; texto?: string }) {
  if (!googleDisponible()) return null;
  const q = new URLSearchParams({ modo });
  if (tipo) q.set("tipo", tipo);
  if (next) q.set("next", next);
  return (
    <a className="btn secondary boton-google" href={`/api/auth/google?${q}`}>
      <img src="/brand/google-g.svg" alt="" width={20} height={20} aria-hidden="true" />
      {texto}
    </a>
  );
}
