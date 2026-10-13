import { NextResponse } from "next/server";
import { registrarFallo } from "../../../lib/common/fallos";
import { getUser } from "../../../lib/accounts/auth";
import { papelDe } from "../../../lib/accounts/landing";
import { allow, clientIp, MINUTO } from "../../../lib/accounts/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Recibe los fallos ocurridos en el navegador (components/informarFallo.ts) y los guarda en el registro de fallos.
 * Es pública (los visitantes sin cuenta también sufren fallos), así que se defiende sola: solo desde nuestras propias páginas
 * (cabecera Origin), cuerpo pequeño, como mucho 10 por minuto desde cada dirección (limitador común, lib/accounts/ratelimit.ts),
 * y nunca devuelve nada que sirva a un atacante.
 */

export async function POST(request: Request) {
  const origen = request.headers.get("origin");
  const host = request.headers.get("host");
  let mismoSitio = false;
  try { mismoSitio = !!origen && !!host && new URL(origen).host === host; } catch {}
  if (!mismoSitio) return new NextResponse(null, { status: 403 });
  if (!(await allow(`fallo:${(await clientIp()) ?? "local"}`, 10, MINUTO))) return new NextResponse(null, { status: 429 });
  const texto = await request.text();
  if (texto.length > 9000) return new NextResponse(null, { status: 413 });
  let cuerpo: unknown;
  try { cuerpo = JSON.parse(texto); } catch { return new NextResponse(null, { status: 400 }); }
  const c = (cuerpo && typeof cuerpo === "object" ? cuerpo : {}) as Record<string, unknown>;
  const mensaje = typeof c.mensaje === "string" ? c.mensaje.slice(0, 500) : "";
  if (!mensaje) return new NextResponse(null, { status: 400 });
  const error = new Error(mensaje);
  error.stack = typeof c.pila === "string" ? c.pila.slice(0, 4000) : undefined;
  const ruta = typeof c.ruta === "string" && c.ruta.startsWith("/") ? c.ruta.slice(0, 300) : null;
  await registrarFallo({ origen: "CLIENTE", error, ruta, papel: papelDe(await getUser()) });
  return new NextResponse(null, { status: 204 });
}
