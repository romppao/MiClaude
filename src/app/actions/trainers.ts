// Entrenadores: su perfil público (cuenta «Entrenador») y sus clases individuales o colectivas.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { audit } from "../../lib/common/audit";
import { slugName, slugify } from "../../lib/common/labels";
import { DISCIPLINE_ORDER } from "../../lib/common/disciplines";
import { LIMITS, oneLine } from "../../lib/common/text";
import { readOnboarding } from "../../lib/accounts/onboarding";
import { parseClass, parseYears, pickDisciplines } from "../../lib/trainers/classes";
import { checkLengths, go, guard, readProvince, str, uniqueSlug } from "./shared";

/** Cuántas clases puede tener publicadas o en pausa un entrenador (evita abusos; se puede ampliar). */
const MAX_CLASES = 20;

/**
 * Crea el perfil público del propio entrenador (con su correo confirmado). Lo que eligió al registrarse llega ya rellenado; si entonces
 * preparó su primera clase, se publica a la vez. El gimnasio se enlaza por nombre y ciudad, como en la ficha del peleador.
 */
export async function createMyTrainer(f: FormData) {
  const user = await requireVerifiedUser("/");
  const back = "/";
  if (user.role !== "TRAINER") go(back, { problema: "solo_entrenadores" });
  if (await db.trainer.findUnique({ where: { userId: user.id }, select: { id: true } })) go("/mis-clases");
  checkLengths(f, back, { gym: LIMITS.gym, city: LIMITS.city, bio: LIMITS.bio });
  const disciplines = pickDisciplines(f.getAll("disciplina").map(String), DISCIPLINE_ORDER);
  if (disciplines.length === 0) go(back, { problema: "entrenador_disciplinas" });
  const years = parseYears(str(f, "years"));
  if (years === undefined) go(back, { problema: "entrenador_anos" });
  const province = readProvince(f, "province", back);
  const city = oneLine(str(f, "city")) || province;
  const gymName = oneLine(str(f, "gym"));
  const borrador = readOnboarding(user.onboarding);
  const primera = borrador?.kind === "entrenador" && borrador.clase && str(f, "publicarClase") === "on" ? parseClass(borrador.clase) : null;
  await guard(back, () => db.$transaction(async (tx) => {
    const gymId = gymName ? (await tx.gym.upsert({ where: { slug: slugName(gymName, city) }, create: { name: gymName, slug: slugName(gymName, city), city, province }, update: {} })).id : null;
    const slug = await uniqueSlug(slugify(user.name), async (s) => !!(await tx.trainer.findUnique({ where: { slug: s } })), "entrenador");
    const t = await tx.trainer.create({ data: { slug, name: user.name, bio: str(f, "bio") || null, gymId, userId: user.id, disciplines, yearsCoaching: years, city, province } });
    if (primera?.ok) await tx.trainingClass.create({ data: { trainerId: t.id, discipline: disciplines[0], ...primera.value } });
    await tx.user.update({ where: { id: user.id }, data: { onboarding: Prisma.DbNull } });
    await audit({ userId: user.id, entity: "TRAINER", entityId: t.id, action: "CREATED", after: { disciplines, gymId, firstClass: !!primera?.ok } }, tx);
  }));
  revalidatePath("/", "layout");
  go("/mis-clases", { aviso: primera?.ok ? "entrenador_creado_con_clase" : "entrenador_creado" });
}

/** Publica una clase nueva del propio entrenador. */
export async function createClass(f: FormData) {
  const user = await requireVerifiedUser("/mis-clases");
  const back = "/mis-clases";
  const trainer = await db.trainer.findUnique({ where: { userId: user.id }, select: { id: true, disciplines: true } });
  if (!trainer) go("/", { problema: "entrenador_perfil_primero" });
  const clase = parseClass({ kind: str(f, "kind"), title: str(f, "title"), minutes: str(f, "minutes"), price: str(f, "price"), capacity: str(f, "capacity"), schedule: str(f, "schedule") });
  if (!clase.ok) go(back, { problema: clase.problema });
  const pedida = str(f, "discipline");
  const discipline = trainer.disciplines.find((d) => d === pedida) ?? trainer.disciplines[0] ?? null;
  if ((await db.trainingClass.count({ where: { trainerId: trainer.id } })) >= MAX_CLASES) go(back, { problema: "clase_limite" });
  const c = await db.trainingClass.create({ data: { trainerId: trainer.id, discipline, ...clase.value } });
  await audit({ userId: user.id, entity: "CLASS", entityId: c.id, action: "CREATED", after: { kind: c.kind, priceEuros: c.priceEuros } });
  revalidatePath("/", "layout");
  go(back, { aviso: "clase_publicada" });
}

/** Pausa o vuelve a publicar una clase del propio entrenador (pausada no se muestra en su perfil). */
export async function toggleClass(f: FormData) {
  const user = await requireVerifiedUser("/mis-clases");
  const back = "/mis-clases";
  const c = await db.trainingClass.findFirst({ where: { id: str(f, "classId"), trainer: { userId: user.id } } });
  if (!c) go(back, { problema: "no_existe" });
  const active = str(f, "activar") === "1";
  await db.trainingClass.updateMany({ where: { id: c.id, active: !active }, data: { active } });
  revalidatePath("/", "layout");
  go(back, { aviso: active ? "clase_activada" : "clase_pausada" });
}
