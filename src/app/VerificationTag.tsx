import type { Verification } from "@prisma/client";
import { VERIFICATION_LABEL } from "../lib/labels";

/** Etiqueta con el nivel de respaldo de un combate, la misma en toda la aplicación. */
export default function VerificationTag({ verification }: { verification: Verification }) {
  return <span className="tag">{VERIFICATION_LABEL[verification]}</span>;
}
