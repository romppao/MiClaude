// Aura del público: dar y retirar aura en un combate.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "../../lib/common/db";
import { getUser } from "../../lib/accounts/auth";
import { internalPath } from "../../lib/common/paths";
import { AURA_COMMENT_MAX, AURA_PER_DAY, canGiveAura } from "../../lib/aura/rules";
import { go, str, withLock } from "./shared";

/**
 * Dar aura a un peleador por su actuación en un combate. Las reglas están en `canGiveAura` (lib/rules.ts):
 * combate celebrado, con resultado, no cancelado ni en revisión, y quien la da no participa en él.
 * Además: cuenta con el correo verificado, una aura por persona, combate y peleador (volver a pulsar solo actualiza el comentario)
 * y máximo AURA_PER_DAY al día, comprobado con un bloqueo para que dos peticiones a la vez no se salten el límite.
 */
export async function giveAura(f: FormData) {
  const user = await getUser();
  const back = internalPath(str(f, "back"));
  if (!user) redirect(`/entrar?next=${encodeURIComponent(back)}`);
  if (!user.emailVerifiedAt) redirect("/verificar");
  if (str(f, "comment").length > AURA_COMMENT_MAX) go(back, { problema: "texto_largo" });
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  const fighterId = str(f, "fighterId");
  if (!bout) go(back, { problema: "aura_no_existe" });
  const verdict = canGiveAura({ bout, fighterId, viewerFighterId: user.fighter?.id });
  if (!verdict.ok) go(back, { problema: verdict.problema });

  const comment = str(f, "comment") || null;
  const attended = f.get("attended") === "on";
  const status = await withLock(`aura:${user.id}`, async (tx) => {
    const recent = await tx.aura.count({ where: { userId: user.id, updatedAt: { gte: new Date(Date.now() - 864e5) } } });
    if (recent >= AURA_PER_DAY) return "limite" as const;
    await tx.aura.upsert({
      where: { userId_boutId_fighterId: { userId: user.id, boutId: bout.id, fighterId } },
      create: { userId: user.id, boutId: bout.id, fighterId, comment, attended },
      update: { comment, attended },
    });
    return "ok" as const;
  });
  if (status === "limite") go(back, { problema: "aura_limite" });
  revalidatePath("/", "layout");
  go(back, { aviso: "aura_dada" });
}

export async function removeAura(f: FormData) {
  const user = await getUser();
  const back = internalPath(str(f, "back"));
  if (!user) redirect(`/entrar?next=${encodeURIComponent(back)}`);
  await db.aura.deleteMany({ where: { userId: user.id, boutId: str(f, "boutId"), fighterId: str(f, "fighterId") } });
  revalidatePath("/", "layout");
  go(back, { aviso: "aura_quitada" });
}
