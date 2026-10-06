import { Prisma } from "@prisma/client";
import { getImageStore } from "../common/imageStore";
import { imageKey } from "../common/imageKeys";

/**
 * Vacía de datos personales el historial de cambios de una ficha: las filas se conservan (qué pasó y cuándo) pero sin el «antes» y el «después»,
 * que guardan nombre, apellidos, alias, ciudad y provincia tal como estaban.
 */
export async function scrubFighterHistory(tx: Prisma.TransactionClient, fighterId: string) {
  const achievements = await tx.fighterAchievement.findMany({ where: { fighterId }, select: { id: true } });
  if (achievements.length) {
    await tx.auditLog.updateMany({ where: { entity: "ACHIEVEMENT", entityId: { in: achievements.map(a=>a.id) } }, data: { before: Prisma.DbNull, after: Prisma.DbNull } });
    await tx.fighterAchievement.deleteMany({ where: { fighterId } });
  }
  await tx.auditLog.updateMany({ where: { entity: "FIGHTER", entityId: fighterId }, data: { before: Prisma.DbNull, after: Prisma.DbNull } });
}

/**
 * Oculta los datos personales de una ficha conservando los combates (forman parte del récord de otras personas).
 * El nombre pasa a «Peleador anónimo», se borran alias, fecha de nacimiento, ciudad, provincia, gimnasio, entrenador,
 * medidas y biografía, y la ficha deja de salir en listados y buscadores. También se vacían los datos personales de su historial de cambios.
 */
export async function anonymizeFighter(tx: Prisma.TransactionClient, fighterId: string) {
  await tx.fighter.update({
    where: { id: fighterId },
    data: {
      slug: `peleador-anonimo-${fighterId.slice(-8)}`,
      firstName: "Peleador", lastName: "anónimo", alias: null, birthDate: null, city: null, province: null, bio: null,
      gymId: null, trainerId: null, heightCm: null, reachCm: null, stance: null,
      listed: false, hiddenAt: new Date(),
    },
  });
  const store = getImageStore();
  await store.delete(imageKey("peleador", fighterId, "avatar"), tx);
  await store.delete(imageKey("peleador", fighterId, "banner"), tx);
  await tx.profile.deleteMany({ where: { kind: "peleador", entityId: fighterId } });
  await tx.fighterDiscipline.updateMany({ where: { fighterId }, data: { belt: null, beltDegrees: null } });
  await scrubFighterHistory(tx, fighterId);
}
