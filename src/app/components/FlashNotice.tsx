"use client";

import { useSearchParams } from "next/navigation";
import { AVISOS, PROBLEMAS } from "../../lib/common/messages";
import { lookup } from "../../lib/common/safe";

/**
 * Muestra el resultado de la última acción (éxito o problema) arriba de la página, con texto claro.
 * Las dos regiones existen siempre (vacías) para que los lectores de pantalla anuncien el mensaje cuando aparece:
 * una región que ya nace con el texto dentro muchas veces no se anuncia. El código viene de la dirección, así que se busca
 * con `lookup` (que ignora claves heredadas como «__proto__»).
 */
export default function FlashNotice() {
  const params = useSearchParams();
  const problema = lookup(PROBLEMAS, params?.get("problema"));
  const aviso = problema ? undefined : lookup(AVISOS, params?.get("aviso"));
  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true">
        {aviso && <div className="notice notice-ok"><span aria-hidden="true">✓ </span>{aviso}</div>}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {problema && <div className="notice notice-bad"><span aria-hidden="true">⚠ </span>{problema}</div>}
      </div>
    </>
  );
}
