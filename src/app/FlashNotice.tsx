"use client";

import { useSearchParams } from "next/navigation";
import { AVISOS, PROBLEMAS } from "../lib/messages";

/** Muestra el resultado de la última acción (éxito o problema) arriba de la página, con texto claro. */
export default function FlashNotice() {
  const params = useSearchParams();
  const aviso = params.get("aviso");
  const problema = params.get("problema");
  const text = problema ? PROBLEMAS[problema] : aviso ? AVISOS[aviso] : null;
  if (!text) return null;
  return (
    <div role={problema ? "alert" : "status"} className={problema ? "notice notice-bad" : "notice notice-ok"}>
      <span aria-hidden="true">{problema ? "⚠ " : "✓ "}</span>{text}
    </div>
  );
}
