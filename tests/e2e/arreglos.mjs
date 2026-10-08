// Arreglos pedidos por el fundador el 8 de octubre de 2026 tras probar la demo en el móvil: foto y banner a la vez, portada de los
// highlights de vídeo, quitar una disciplina, solicitar clases a un entrenador y secciones en pestañas que se deslizan a los lados.
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import AxeBuilder from "@axe-core/playwright";
import { B, rnd, browser, newUser, btn, check, seen, sql, hacerAdmin, esperarCorreo, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const FOTOS = process.env.CAPTURAS; // carpeta opcional para guardar capturas en tamaño móvil
const foto = async (p, nombre) => { if (FOTOS) await p.screenshot({ path: `${FOTOS}/${nombre}.png`, fullPage: true }); };
const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};

// 1) Peleador con foto y banner: se ven las dos a la vez.
const pel = await newUser("Banner", "FIGHTER");
await pel.p.setViewportSize({ width: 390, height: 844 });
await pel.p.goto(B + "/mi-ficha");
await pel.p.fill("[name=firstName]", "Banner"); await pel.p.fill("[name=lastName]", `Arreglos${rnd}`);
await pel.p.selectOption("select[name=discipline]", "BOXEO"); await pel.p.selectOption("select[name=province]", "Sevilla");
await btn(pel.p, "Crear mi ficha"); await pel.p.locator(".notice-ok").waitFor();
const f = await db.fighter.findFirstOrThrow({ where: { lastName: `Arreglos${rnd}` } });
const cuadrado = await sharp({ create: { width: 600, height: 600, channels: 3, background: "#d4f67c" } }).png().toBuffer();
const ancho = await sharp({ create: { width: 1600, height: 600, channels: 3, background: "#7a3bd1" } }).png().toBuffer();
await pel.p.goto(B + `/perfiles/peleador/${f.id}/editar`);
await pel.p.setInputFiles("[name=avatar]", { name: "foto.png", mimeType: "image/png", buffer: cuadrado });
await pel.p.setInputFiles("[name=banner]", { name: "banner.png", mimeType: "image/png", buffer: ancho });
await btn(pel.p, "Guardar perfil"); await pel.p.locator(".notice-ok").waitFor();
await pel.p.goto(B + `/peleadores/${f.slug}`);
const portada = pel.p.locator("section.portada");
check("la portada muestra el banner de fondo y la foto en círculo a la vez", await portada.locator("img.fondo").count() === 1 && await portada.locator("img.foto-perfil").count() === 1);
check("la foto se ve (no queda tapada ni vacía)", await portada.locator("img.foto-perfil").evaluate((i) => i.complete && i.naturalWidth > 0 && i.getBoundingClientRect().width >= 80));

// 2) Highlights: un vídeo enlazado de YouTube lleva su miniatura; uno subido sin foto, un fotograma del propio vídeo.
await pel.p.goto(B + "/mi-ficha#publicar-highlight");
await pel.p.fill("[name=title]", "Mi mejor KO");
await pel.p.fill("[name=videoUrl]", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
await btn(pel.p, "Publicar en mi ficha"); await pel.p.locator(".notice-ok").waitFor();
const otro = await db.highlight.create({ data: { fighterId: f.id, kind: "VIDEO", title: "Subido sin portada", videoKey: `prueba/${rnd}.mp4`, videoType: "video/mp4" } });
await pel.p.goto(B + `/peleadores/${f.slug}`);
check("el highlight de YouTube muestra su miniatura", await pel.p.locator('.highlight img[src^="https://i.ytimg.com/vi/dQw4w9WgXcQ/"]').count() === 1);
check("el vídeo subido sin foto usa un fotograma del propio vídeo como portada", await pel.p.locator(`.highlight video.portada-video[src^="/highlights/${otro.id}/video"]`).count() === 1);
await foto(pel.p, "1-ficha-peleador");

// 3) Pestañas que se deslizan: la ficha agrupa sus secciones y se cambia de una a otra sin bajar.
const barra = pel.p.getByRole("navigation", { name: "Secciones de la ficha" });
check("la ficha agrupa Combates, Récord, Público y Datos en pestañas", JSON.stringify(await barra.locator("a").allInnerTexts()) === JSON.stringify(["Combates", "Récord", "Público", "Datos"]));
const pista = pel.p.locator(".pestanas-pista").first();
await barra.getByRole("link", { name: "Datos" }).click();
await pel.p.waitForFunction(() => { const p = document.querySelector(".pestanas-pista"); return p && p.scrollLeft > p.clientWidth * 2.5; });
check("pulsar una pestaña desliza a su sección y la marca", await barra.getByRole("link", { name: "Datos" }).getAttribute("aria-current") === "true");
await pista.evaluate((p) => p.scrollTo({ left: p.clientWidth, behavior: "auto" }));
await pel.p.waitForFunction(() => document.querySelector('nav[aria-label="Secciones de la ficha"] a[aria-current]')?.textContent === "Récord");
check("deslizar a un lado cambia la pestaña marcada", true);
check("la página no se desplaza a los lados (solo las pestañas)", await pel.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
await axe(pel.p, "Ficha del peleador con pestañas");

// 4) Quitar una disciplina elegida por error, en «Mi ficha».
sql(`insert into "FighterDiscipline" ("fighterId", discipline, level) values ('${f.id}', 'KICKBOXING', 'AMATEUR');`);
await pel.p.goto(B + "/mi-ficha#pestana-datos");
check("«Mi ficha» también va en pestañas", await seen(pel.p.getByRole("navigation", { name: "Secciones de mi ficha" })));
await foto(pel.p, "2-mi-ficha");
const kick = pel.p.locator("details", { has: pel.p.locator("summary", { hasText: "Kickboxing" }) });
await kick.locator("summary").click();
await kick.getByRole("button", { name: "Quitar Kickboxing de mi ficha" }).click();
check("sin marcar la confirmación no se quita (el navegador lo pide)", (await db.fighterDiscipline.count({ where: { fighterId: f.id } })) === 2);
await kick.locator("label.chip", { hasText: "Sí, quiero quitar" }).click();
await kick.getByRole("button", { name: "Quitar Kickboxing de mi ficha" }).click();
check("el peleador quita la disciplina que eligió por error", await seen(pel.p.locator(".notice-ok", { hasText: "Se ha quitado la disciplina" })) && (await db.fighterDiscipline.count({ where: { fighterId: f.id } })) === 1);
check("vuelve a la sección de sus disciplinas", await pel.p.getByRole("navigation", { name: "Secciones de mi ficha" }).getByRole("link", { name: "Mis datos" }).getAttribute("aria-current") === "true");
const unica = pel.p.locator("details", { has: pel.p.locator("summary", { hasText: "Boxeo" }) });
await unica.locator("summary").click();
check("la única disciplina no se puede quitar, y se explica qué hacer", await seen(unica.getByText("Es tu única disciplina")) && await unica.getByRole("button", { name: /Quitar/ }).count() === 0);

// Moderación: puede quitar una disciplina aunque tenga combates (se conservan).
sql(`insert into "FighterDiscipline" ("fighterId", discipline, level) values ('${f.id}', 'MMA', 'AMATEUR');`);
const mod = await newUser("Moderacion", "FAN"); hacerAdmin(mod.email);
await mod.p.goto(B + `/peleadores/${f.slug}#datos`);
const zona = mod.p.locator("details", { hasText: "Moderación: quitar una disciplina" });
await zona.locator("summary").click();
const formMMA = zona.locator("form", { hasText: "MMA" });
await formMMA.locator("label.chip").click(); await formMMA.getByRole("button", { name: "Quitar MMA" }).click();
check("moderación quita una disciplina desde la ficha pública", await seen(mod.p.locator(".notice-ok", { hasText: "Se ha quitado la disciplina" })) && (await db.fighterDiscipline.count({ where: { fighterId: f.id, discipline: "MMA" } })) === 0);
check("queda en el historial", (await db.auditLog.count({ where: { entityId: f.id, action: "DISCIPLINE_REMOVED" } })) === 2);

// 5) Solicitar una clase: botón en el perfil del entrenador, aviso y respuesta.
const ent = await newUser("Entrena", "FAN"); sql(`update "User" set role='TRAINER' where email='${ent.email}';`);
await ent.p.goto(B + "/registro/perfil"); await ent.p.locator("label.chip", { hasText: "Boxeo" }).click(); await ent.p.selectOption("[name=province]", "Madrid");
await ent.p.getByRole("button", { name: "Siguiente" }).click(); await ent.p.waitForURL("**/registro/clase**");
await ent.p.goto(B + "/mi-panel"); await ent.p.getByRole("button", { name: "Publicar mi perfil" }).click(); await ent.p.waitForURL("**/mis-clases**");
const nueva = ent.p.locator("#nueva form");
await nueva.locator("[name=title]").fill(`Defensa ${rnd}`); await nueva.locator("[name=price]").fill("50");
await nueva.getByRole("button", { name: "Publicar la clase" }).click(); await ent.p.locator(".notice-ok", { hasText: "Clase publicada" }).waitFor();
const t = await db.trainer.findFirstOrThrow({ where: { user: { email: ent.email } }, include: { classes: true } });
const clase = t.classes[0];
const fan = await newUser("Alumna", "FAN");
await fan.p.setViewportSize({ width: 390, height: 844 });
await fan.p.goto(B + `/entrenadores/${t.slug}`);
const boton = fan.p.getByRole("link", { name: `Solicitar la clase «${clase.title}»` });
check("cada clase tiene su botón «Solicitar esta clase»", await seen(boton));
await foto(fan.p, "3-entrenador");
await boton.click(); await fan.p.waitForURL(`**/clases/${clase.id}/solicitar`);
await axe(fan.p, "Solicitar una clase");
await btn(fan.p, "Enviar la solicitud");
check("sin decir cuándo le viene bien, el navegador lo pide", fan.p.url().endsWith("/solicitar"));
await fan.p.fill("[name=preferred]", "Martes por la tarde");
await fan.p.fill("[name=phone]", "600 12 34 56");
await btn(fan.p, "Enviar la solicitud"); await fan.p.waitForURL("**/mis-reservas**");
check("la solicitud se envía y aparece en «Mis reservas» como pendiente", await seen(fan.p.locator(".notice-ok", { hasText: "Solicitud enviada" })) && await seen(fan.p.locator("main section", { hasText: clase.title }).getByText("Esperando respuesta")));
check("el entrenador recibe un correo con la solicitud", await esperarCorreo(ent.email, "Martes por la tarde"));
await fan.p.goto(B + `/clases/${clase.id}/solicitar`);
check("no deja pedir dos veces la misma clase mientras espera", await seen(fan.p.getByText("Ya has solicitado esta clase")));
await ent.p.goto(B + "/mi-panel");
check("el panel del entrenador cuenta las solicitudes pendientes", await seen(ent.p.getByRole("link", { name: "Solicitudes de clase: 1 esperando respuesta" })));
await ent.p.goto(B + "/mis-clases#solicitudes");
const sol = ent.p.locator("article", { hasText: "Alumna" });
check("el entrenador ve la solicitud con el contacto", await seen(sol.getByText("Martes por la tarde")) && await sol.locator(`a[href="mailto:${fan.email}"]`).count() === 1 && await sol.locator('a[href="tel:600123456"]').count() === 1);
await sol.locator("[name=reply]").fill("Te espero el martes a las 18:00 en el gimnasio");
await sol.getByRole("button", { name: "Aceptar la clase" }).click();
check("el entrenador la acepta", await seen(ent.p.locator(".notice-ok", { hasText: "Has aceptado la solicitud" })));
await axe(ent.p, "Mis clases con solicitudes");
check("la persona recibe la respuesta por correo", await esperarCorreo(fan.email, "Te espero el martes"));
await fan.p.goto(B + "/mis-reservas");
check("y la ve en «Mis reservas»", await seen(fan.p.getByText("Aceptada")) && await seen(fan.p.getByText("Te espero el martes a las 18:00")));
await axe(fan.p, "Mis reservas");
await foto(fan.p, "4-mis-reservas");
await fan.p.getByRole("button", { name: `Cancelar la solicitud de «${clase.title}»` }).click();
check("puede cancelarla y se avisa al entrenador", await seen(fan.p.locator(".notice-ok", { hasText: "Has cancelado la solicitud" })) && await esperarCorreo(ent.email, "ha cancelado su solicitud"));
await ent.p.goto(B + `/clases/${clase.id}/solicitar`);
check("el entrenador no puede solicitar su propia clase", await seen(ent.p.getByText("Esta clase es tuya")));

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
