"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { AVISOS, PROBLEMAS } from "../../lib/common/messages";
import { lookup } from "../../lib/common/safe";

const SECCIONES: Record<string, Record<string, string>> = {
  "/moderacion": { avisos: "los avisos", reclamaciones: "las reclamaciones", organizadores: "las solicitudes de organizador", gimnasios: "los gimnasios", senales: "los combates con señales", combates: "los combates por verificar", revision: "los combates en revisión" },
  "/respaldar": { titulos: "los títulos", combates: "los resultados de combates" },
  "/moderacion/acreditaciones": { acreditaciones: "las acreditaciones" },
};

/**
 * Muestra el resultado de la última acción (éxito o problema) arriba de la página, con texto claro.
 * Las dos regiones existen siempre (vacías) para que los lectores de pantalla anuncien el mensaje cuando aparece:
 * una región que ya nace con el texto dentro muchas veces no se anuncia. El código viene de la dirección, así que se busca
 * con `lookup` (que ignora claves heredadas como «__proto__»).
 */
export default function FlashNotice() {
  const params = useSearchParams();
  const pathname = usePathname();
  const section = params?.get("seccion");
  const sectionLabel = lookup(lookup(SECCIONES, pathname) ?? {}, section);
  const resume = sectionLabel ? <> <a href={`#${section}`}>Volver a {sectionLabel}</a></> : null;
  const problema = lookup(PROBLEMAS, params?.get("problema"));
  const avisoBase = problema ? undefined : lookup(AVISOS, params?.get("aviso"));
  const cuentaDesde = params?.get("cuentaDesde") ?? "";
  const fechaCuenta = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(cuentaDesde) ? new Date(cuentaDesde) : null;
  const aviso = avisoBase && params?.get("aviso") === "combate_registrado" && fechaCuenta && Number.isFinite(fechaCuenta.getTime())
    ? `Combate registrado. Contará en tu récord a partir del ${fechaCuenta.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" })} si nadie lo discute.`
    : avisoBase;
  const message = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aviso && !problema) return;
    window.dispatchEvent(new Event("lona:accion-terminada"));
    const frame = requestAnimationFrame(() => {
      message.current?.focus({ preventScroll: true });
      message.current?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [aviso, problema, params]);
  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true">
        {aviso && <div ref={message} tabIndex={-1} className="notice notice-ok"><span aria-hidden="true">✓ </span>{aviso}{resume}</div>}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {problema && <div ref={message} tabIndex={-1} className="notice notice-bad"><span aria-hidden="true">⚠ </span>{problema}{resume}</div>}
      </div>
    </>
  );
}
