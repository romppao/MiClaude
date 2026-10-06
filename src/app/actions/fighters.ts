// Ficha del peleador: crearla, corregirla, añadir disciplinas y reclamar una ficha existente.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { slugName, slugify } from "../../lib/common/labels";
import { findNameCandidates } from "../../lib/fighters/fighters";
import { audit } from "../../lib/common/audit";
import { parseBirthDate } from "../../lib/common/dates";
import { parseGraduation } from "../../lib/fighters/graduation";
import { divisionAgeEligible } from "../../lib/common/competition";
import { parseCompetitionChoice } from "../../lib/common/disciplines";
import { parsePrior } from "../../lib/fighters/prior";
import { LIMITS } from "../../lib/common/text";
import { checkLengths, go, guard, invalidar, readProvince, str, uniqueSlug } from "./shared";

/** Lee del formulario la disciplina elegida (con categoría) y el récord de partida declarado. */
function readDisciplineForm(f: FormData) {
  const choice = parseCompetitionChoice(str(f, "discipline"), str(f, "level"), str(f, "weightClass"), str(f, "divisionId"));
  const prior = parsePrior({ total: str(f, "priorTotal"), wins: str(f, "priorWins"), losses: str(f, "priorLosses"), draws: str(f, "priorDraws") });
  const graduation = parseGraduation(str(f, "discipline"), str(f, "belt"), str(f, "beltDegrees"));
  return { choice, prior, graduation };
}

export async function createMyFighter(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/mi-ficha";
  if (user.fighter) redirect(back);
  checkLengths(f, back, { firstName: LIMITS.firstName, lastName: LIMITS.lastName, alias: LIMITS.alias, gym: LIMITS.gym, city: LIMITS.city });
  const firstName = str(f, "firstName");
  const lastName = str(f, "lastName");
  if (!firstName || !lastName) go(back, { problema: "nombre_ficha" });
  const { choice, prior, graduation } = readDisciplineForm(f);
  if (!graduation) go("/mi-ficha", { problema: "cinturon_invalido" });
  if (!choice) go(back, { problema: "disciplina_no_valida" });
  if (!prior.ok) go(back, { problema: prior.error });
  const province = readProvince(f, "province", back);
  const city = str(f, "city") || province;
  const gymName = str(f, "gym");

  // Con una solicitud para reclamar una ficha pendiente no se crea otra: la moderación aprobaría la solicitud sobre una persona que ya tiene ficha y la rechazaría.
  if (await db.claimRequest.findFirst({ where: { userId: user.id, status: "PENDING" }, select: { id: true } })) go(back, { problema: "ficha_reclamacion_pendiente" });
  // Si ya hay una ficha sin titular con este nombre (la creó un rival al registrar un combate), se avisa antes de crear una segunda: lo normal es reclamarla.
  if (str(f, "confirmarNueva") !== "1") {
    const existentes = (await findNameCandidates(firstName, lastName)).filter((c) => !c.userId);
    if (existentes.length > 0) go(`/mi-ficha?q=${encodeURIComponent(lastName)}`, { problema: "ficha_con_tu_nombre" });
  }

  const created = await guard(back, async () => {
    let gymId: string | undefined;
    if (gymName) {
      const gymSlug = slugName(gymName, city);
      const gym = await db.gym.upsert({ where: { slug: gymSlug }, create: { name: gymName, slug: gymSlug, city, province }, update: {} });
      gymId = gym.id;
    }
    const slug = await uniqueSlug(slugify(`${firstName} ${lastName}`), async (s) => !!(await db.fighter.findUnique({ where: { slug: s } })), "peleador");
    return db.fighter.create({
      data: {
        slug, firstName, lastName, alias: str(f, "alias") || null, city, province, level: choice.level, gymId, userId: user.id,
        disciplines: { create: { ...graduation, discipline: choice.discipline, level: choice.level, weightClass: choice.weightClass, divisionId: choice.divisionId, priorTotal: prior.prior.total, priorWins: prior.prior.wins, priorLosses: prior.prior.losses, priorDraws: prior.prior.draws } },
      },
    });
  });
  await audit({ userId: user.id, entity: "FIGHTER", entityId: created.id, action: "CREATED", after: { discipline: choice.discipline, level: choice.level, weightClass: choice.weightClass, divisionId: choice.divisionId, priorDeclared: prior.prior } });
  invalidar("fichas", "gimnasios");
  revalidatePath("/", "layout");
  go(back, { aviso: "ficha_creada" });
}

/** Corrige los datos personales de la propia ficha. Cada cambio queda en el historial con el valor anterior. */
export async function updateMyFighter(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/mi-ficha";
  const me = user.fighter;
  if (!me) go(back);
  checkLengths(f, back, { firstName: LIMITS.firstName, lastName: LIMITS.lastName, alias: LIMITS.alias, gym: LIMITS.gym, city: LIMITS.city, bio: LIMITS.bio });
  const firstName = str(f, "firstName");
  const lastName = str(f, "lastName");
  if (!firstName || !lastName) go(back, { problema: "nombre_ficha" });
  const province = readProvince(f, "province", back, me.province);
  const city = str(f, "city") || province;
  const stance = str(f, "stance");
  if (stance && !["ORTODOXO", "ZURDO", "AMBIDIESTRO"].includes(stance)) go(back, { problema: "datos_ficha" });
  const rawBirth = str(f, "birthDate");
  const birthDate = rawBirth ? parseBirthDate(rawBirth) : null;
  if (rawBirth && !birthDate) go(back, { problema: "nacimiento_invalido" });
  if (birthDate && me.disciplines.some(d=>d.divisionId && !divisionAgeEligible(d.divisionId,birthDate,new Date()))) go(back, { problema: "categoria_edad_ficha" });
  const measure = (key: string, min: number, max: number) => {
    const raw = str(f, key);
    if (!raw) return null;
    const n = /^\d{2,3}$/.test(raw) ? parseInt(raw, 10) : NaN;
    if (!(n >= min && n <= max)) go(back, { problema: "medida_invalida" });
    return n;
  };
  const heightCm = measure("heightCm", 100, 250);
  const reachCm = measure("reachCm", 100, 260);
  const gymName = str(f, "gym");
  const patch = { firstName, lastName, alias: str(f, "alias") || null, city, province, bio: str(f, "bio") || null, stance: (stance || null) as "ORTODOXO" | "ZURDO" | "AMBIDIESTRO" | null, birthDate, heightCm, reachCm };
  await guard(back, () => db.$transaction(async (tx) => {
    let gymId: string | null = null;
    if (gymName) {
      const gymSlug = slugName(gymName, city);
      gymId = (await tx.gym.upsert({ where: { slug: gymSlug }, create: { name: gymName, slug: gymSlug, city, province }, update: {} })).id;
    }
    await tx.fighter.update({ where: { id: me.id }, data: { ...patch, gymId } });
    await audit({ userId: user.id, entity: "FIGHTER", entityId: me.id, action: "PROFILE_UPDATED", before: { firstName: me.firstName, lastName: me.lastName, alias: me.alias, city: me.city, province: me.province, gymId: me.gymId }, after: { firstName, lastName, alias: patch.alias, city, province, gymId } }, tx);
  }));
  invalidar("fichas", "gimnasios");
  revalidatePath("/", "layout");
  go(back, { aviso: "ficha_actualizada" });
}

/** Añade una disciplina a la ficha, o actualiza su categoría y su récord de partida (declarado). Cada cambio queda en el historial. */
export async function saveDiscipline(f: FormData) {
  const user = await requireVerifiedUser();
  const me = user.fighter;
  if (!me) redirect("/mi-ficha");
  const { choice, prior, graduation } = readDisciplineForm(f);
  if (!graduation) go("/mi-ficha", { problema: "cinturon_invalido" });
  if (!choice) go("/mi-ficha", { problema: "disciplina_no_valida" });
  if (!prior.ok) go("/mi-ficha", { problema: prior.error });
  if (choice.divisionId && me.birthDate && !divisionAgeEligible(choice.divisionId, me.birthDate, new Date())) go("/mi-ficha", { problema: "categoria_edad_ficha" });
  const before = await db.fighterDiscipline.findUnique({ where: { fighterId_discipline: { fighterId: me.id, discipline: choice.discipline } } });
  // «Añadir otra disciplina» no sobrescribe una que ya tienes (borraría su récord declarado en silencio): para cambiarla se usa su propio formulario.
  if (before && str(f, "modo") === "anadir") go("/mi-ficha", { problema: "disciplina_ya_tienes" });
  const data = { ...graduation, level: choice.level, weightClass: choice.weightClass, divisionId: choice.divisionId, priorTotal: prior.prior.total, priorWins: prior.prior.wins, priorLosses: prior.prior.losses, priorDraws: prior.prior.draws };
  await db.$transaction([
    db.fighterDiscipline.upsert({
      where: { fighterId_discipline: { fighterId: me.id, discipline: choice.discipline } },
      create: { fighterId: me.id, discipline: choice.discipline, ...data }, update: data,
    }),
    audit({ userId: user.id, entity: "FIGHTER", entityId: me.id, action: before ? "DISCIPLINE_UPDATED" : "DISCIPLINE_ADDED", before: before ?? undefined, after: { discipline: choice.discipline, ...data } }, db),
  ]);
  invalidar("fichas");
  revalidatePath("/", "layout");
  go("/mi-ficha", { aviso: "disciplina_guardada" });
}

const MAX_OPEN_REQUESTS = 3;

export async function requestClaim(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/mi-ficha";
  if (user.fighter) redirect(back);
  checkLengths(f, back, { message: LIMITS.message });
  const fighter = await db.fighter.findUnique({ where: { id: str(f, "fighterId") } });
  if (!fighter || fighter.userId || fighter.hiddenAt) go(back, { problema: "reclamar_no_disponible" });
  const open = await db.claimRequest.count({ where: { userId: user.id, status: "PENDING", NOT: { fighterId: fighter.id } } });
  if (open >= MAX_OPEN_REQUESTS) go(back, { problema: "solicitud_limite" });
  const message = str(f, "message") || null;
  await db.claimRequest.upsert({
    where: { userId_fighterId: { userId: user.id, fighterId: fighter.id } },
    create: { userId: user.id, fighterId: fighter.id, message },
    update: { message, status: "PENDING" },
  });
  go(back, { aviso: "solicitud_enviada" });
}
