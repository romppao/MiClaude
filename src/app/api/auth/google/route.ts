import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { APP_URL } from "../../../../lib/common/mail";
import { internalPath } from "../../../../lib/common/paths";
import { HORA, allow, clientIp } from "../../../../lib/accounts/ratelimit";
import { COOKIE_GOOGLE, DURACION_VIAJE_S, configGoogle, escribirViaje, nuevoViaje, urlDeAutorizacion } from "../../../../lib/accounts/google";

export const dynamic = "force-dynamic";

/**
 * «Continuar con Google»: prepara el viaje (state, nonce y PKCE en una cookie de 10 minutos) y lleva a la persona a Google.
 * Parámetros: modo=entrar|registro, tipo=usuario|peleador|entrenador (registro) y next (ruta interna a la que volver).
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const volver = (problema: string) => NextResponse.redirect(new URL(`/entrar?problema=${problema}`, APP_URL), 303);
  const cfg = configGoogle();
  if (!cfg) return volver("google_no_disponible");
  const ip = await clientIp();
  if (ip && !(await allow(`google:ip:${ip}`, 30, HORA))) return volver("demasiados_intentos");
  const viaje = nuevoViaje(q.get("modo") ?? "", q.get("tipo") ?? "", internalPath(q.get("next") ?? "", ""));
  (await cookies()).set(COOKIE_GOOGLE, escribirViaje(viaje), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth/google", maxAge: DURACION_VIAJE_S,
  });
  return NextResponse.redirect(urlDeAutorizacion(cfg, viaje), 303);
}
