import type { Verification } from "@prisma/client";
import { VERIFICATION_LABEL } from "../../lib/common/labels";
import { effectiveSupport, SUPPORT_LABEL } from "../../lib/aura/trajectory";
import { estadoSinResultado } from "../../lib/bouts/status";

/** Un respaldo acredita el hecho concreto; la confirmación del rival sigue siendo opcional. */
export default function VerificationTag({ verification, backing, bout }: { verification: Verification; backing?: Parameters<typeof effectiveSupport>[0]; bout: Parameters<typeof estadoSinResultado>[0] }) {
  const pendiente = estadoSinResultado(bout);
  if (pendiente) return <span className="tag">{pendiente}</span>;
  const kind = backing ? effectiveSupport(backing) : null;
  const label = verification !== "DISPUTED" && backing?.supportKind
    ? kind === "DECLARED" && backing.supportKind !== "DECLARED" ? "Respaldo específico retirado" : SUPPORT_LABEL[kind!]
    : VERIFICATION_LABEL[verification];
  return <span className="tag">{label}</span>;
}
