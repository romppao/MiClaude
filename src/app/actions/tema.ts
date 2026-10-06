"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { internalPath } from "../../lib/common/paths";
import { esClaveDeporte } from "../../lib/common/temas";

/** Guarda una preferencia pública de deporte; no requiere cuenta ni contiene datos personales. */
export async function elegirDeporte(f: FormData) {
  const volverA = internalPath(String(f.get("back") ?? ""));
  const deporte = String(f.get("deporte") ?? "");

  // Un formulario o cookie manipulados no deben introducir valores arbitrarios.
  if (!esClaveDeporte(deporte)) redirect(volverA);

  const jar = await cookies();
  jar.set("deporte", deporte, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
    httpOnly: true,
  });
  redirect(volverA);
}
