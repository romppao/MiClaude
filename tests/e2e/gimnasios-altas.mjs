// Altas indirectas de gimnasio: pendientes hasta revisión, sin alterar clubes ya revisados.
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, hacerAdmin, datosDeAlta, check, terminarDiagnosticos } from "./ayudas.mjs";
const db = new PrismaClient();
const fighter = await newUser("AltaClubPeleador", "FIGHTER");
const trainer = await newUser("AltaClubEntrenador");
const mod = await newUser("AltaClubModeracion"); hacerAdmin(mod.email);
await db.user.update({ where: { email: trainer.email }, data: { role: "TRAINER" } });
async function createFighter(a, nombre) {
  await a.p.goto(B + "/mi-ficha");
  await a.p.locator('[name=firstName]').fill("Alta"); await a.p.locator('[name=lastName]').fill(`${nombre}${rnd}`); await a.p.locator('[name=gym]').fill(nombre);
  await datosDeAlta(a.p); await a.p.getByRole("button", { name: "Crear mi ficha", exact: true }).click(); await a.p.locator('.notice-ok').waitFor();
  return db.gym.findFirstOrThrow({ where: { name: nombre } });
}
async function pending(name, label) {
  const g = await db.gym.findFirstOrThrow({ where: { name } });
  check(label, g.status === "PENDING" && (await fighter.p.request.get(B + `/gimnasios/${g.slug}`)).status() === 404);
  return g;
}
// El botón del formulario no está expuesto mientras el desplegable está cerrado.
// Abrimos primero la pestaña y el resumen, también después de cada navegación.
async function editarFicha(p) {
  await p.goto(B + "/mi-ficha");
  await p.getByRole("link", { name: "Mis datos", exact: true }).click();
  await p.locator("summary", { hasText: "Corregir los datos de mi ficha" }).click();
  const form = p.locator("form", { has: p.getByRole("button", { name: "Guardar los datos de mi ficha", exact: true }) });
  await form.locator("[name=gym]").waitFor({ state: "visible" });
  return form;
}
const initial = await createFighter(fighter, `Club Ficha Alta ${rnd}`);
await pending(initial.name, "el gimnasio creado con la ficha del peleador queda pendiente y no se publica");
let edit = await editarFicha(fighter.p);
await edit.locator('[name=gym]').fill(`Club Ficha Editada ${rnd}`); await edit.getByRole("button", { name: "Guardar los datos de mi ficha", exact: true }).click(); await fighter.p.locator('.notice-ok').waitFor();
await pending(`Club Ficha Editada ${rnd}`, "también queda pendiente el gimnasio aportado al editar el peleador");
await trainer.p.goto(B + "/mi-panel");
const publish = trainer.p.locator('form', { has: trainer.p.getByRole("button", { name: "Publicar mi perfil", exact: true }) });
// La casilla de la chip es transparente y no recibe clics: una persona pulsa su etiqueta visible.
await publish.locator('label.chip:has(input[name=disciplina][value=BOXEO])').click();
check("se elige Boxeo desde su opción visible", await publish.locator('input[name=disciplina][value=BOXEO]').isChecked());
await publish.locator('[name=province]').selectOption("Madrid"); await publish.locator('[name=city]').fill("Madrid"); await publish.locator('[name=gym]').fill(`Club Entrenador Alta ${rnd}`);
await publish.getByRole("button", { name: "Publicar mi perfil", exact: true }).click(); await trainer.p.locator('.notice-ok').waitFor();
await pending(`Club Entrenador Alta ${rnd}`, "la publicación del entrenador no publica automáticamente su gimnasio");
const trainerRow = await db.trainer.findFirstOrThrow({ where: { user: { email: trainer.email } } });
await trainer.p.goto(B + `/perfiles/entrenador/${trainerRow.id}/editar`); await trainer.p.locator('[name=trainerGym]').fill(`Club Entrenador Editado ${rnd}`); await trainer.p.getByRole("button", { name: "Guardar perfil", exact: true }).click(); await trainer.p.locator('.notice-ok').waitFor();
await pending(`Club Entrenador Editado ${rnd}`, "editar el gimnasio del entrenador también exige revisión");
const adminGym = await createFighter(mod, `Club Moderación Alta ${rnd}`);
check("moderación puede crear un gimnasio publicado desde su ficha", adminGym.status === "PUBLISHED");
// Vincular un club existente conserva su revisión, no lo retira ni lo vuelve a publicar.
edit = await editarFicha(fighter.p); await edit.locator('[name=gym]').fill(adminGym.name); await edit.getByRole("button", { name: "Guardar los datos de mi ficha", exact: true }).click(); await fighter.p.locator('.notice-ok').waitFor();
check("elegir un gimnasio ya publicado no cambia su estado", (await db.gym.findUniqueOrThrow({ where: { id: adminGym.id } })).status === "PUBLISHED");
await db.gym.update({ where: { id: adminGym.id }, data: { status: "REMOVED" } });
edit = await editarFicha(fighter.p); await edit.getByRole("button", { name: "Guardar los datos de mi ficha", exact: true }).click(); await fighter.p.locator('.notice-ok').waitFor();
check("elegir un gimnasio retirado no lo republica", (await db.gym.findUniqueOrThrow({ where: { id: adminGym.id } })).status === "REMOVED");
await mod.p.goto(B + "/moderacion/gimnasios");
check("el gimnasio pendiente queda disponible para revisión", await mod.p.locator('#pendientes article', { hasText: initial.name }).count() === 1);
await terminarDiagnosticos(); await db.$disconnect(); await browser.close();
