// Fase 2a (petición del fundador, 8 de octubre de 2026): portada común con noticias y portadas por disciplina, menú solo con las opciones
// de cada tipo de cuenta (el entrenador reúne entrenador, club y promotora, y crea veladas e interclubs), y vídeos y fotos del público en las
// veladas («subir los vídeos en la app de verdad y, si no es viable, mediante enlaces»). Requiere el servidor en marcha (ver ayudas.mjs),
// con NEWS_FETCH=no: las noticias de prueba se insertan en la base, sin salir a internet.
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { B, rnd, browser, seen, check, btn, newUser, hacerAdmin, datosDeAlta, registrar, enDias, hoyMadrid, sql, terminarDiagnosticos } from "./ayudas.mjs";

const consulta = (q) => execSync(`psql "${process.env.DATABASE_URL}" -tA`, { input: q }).toString().trim();
const avisoBueno = (p, texto) => p.locator("[role=status]", { hasText: texto });
const avisoMalo = (p, texto) => p.locator("[role=alert]", { hasText: texto });
const menu = async (p) => { await p.getByRole("button", { name: "Menú" }).click(); const t = await p.locator("#navigation-menu").innerText(); await p.getByRole("button", { name: "Cerrar menú" }).click(); return t; };
const pestanas = async (ctxDe) => {
  const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  await m.context().addCookies(await ctxDe.context().cookies()); await m.goto(B + "/");
  const t = (await m.locator("nav.mobile-nav a").allInnerTexts()).map((x) => x.trim()); await m.context().close(); return t;
};

// 1) Noticias de prueba (como si las hubiera leído el lector): una de boxeo y otra de MMA.
sql(`insert into "NewsSource"(id,name,url,kind,disciplines) values ('prueba-${rnd}','Fuente de prueba ${rnd}','https://prueba.invalid/${rnd}','AGREGADOR','{}');
insert into "NewsItem"(id,"sourceId",guid,url,title,publisher,"publishedAt",disciplines) values
('nb-${rnd}','prueba-${rnd}','b','https://prueba.invalid/boxeo-${rnd}','Noticia de boxeo ${rnd}','Diario de prueba',now(),'{BOXEO}'),
('nm-${rnd}','prueba-${rnd}','m','https://prueba.invalid/mma-${rnd}','Noticia de MMA ${rnd}','Otro medio',now()-interval '1 hour','{MMA}');`);

// 2) Aficionado: la misma portada para todos, sus disciplinas, su menú y su panel
const fan = await newUser("Fanmedia");
await fan.p.goto(B + "/");
check("tras entrar, la portada muestra la actualidad y el acceso a «Mi panel»", await seen(fan.p.getByRole("heading", { name: "Actualidad" })) && await seen(fan.p.getByRole("link", { name: /Mi panel/ }).first()));
const titular = fan.p.getByRole("link", { name: new RegExp(`Noticia de boxeo ${rnd}`) });
check("cada noticia dice su medio y se abre en su web original, en otra pestaña", await seen(titular) && await titular.getAttribute("target") === "_blank" && (await titular.innerText()).includes("Diario de prueba"));
await fan.p.goto(B + "/disciplinas/boxeo");
check("la portada de boxeo muestra sus noticias y no las de otras disciplinas", await seen(fan.p.getByRole("heading", { name: "Boxeo", level: 1 })) && await seen(fan.p.getByText(`Noticia de boxeo ${rnd}`)) && !(await fan.p.getByText(`Noticia de MMA ${rnd}`).count()));
await fan.p.goto(B + "/noticias?disciplina=mma");
check("las noticias se filtran por disciplina", await seen(fan.p.getByText(`Noticia de MMA ${rnd}`)) && !(await fan.p.getByText(`Noticia de boxeo ${rnd}`).count()) && await fan.p.locator('nav a[aria-current=page]', { hasText: "MMA" }).count() === 1);
check("una disciplina que no existe responde «no encontrada»", (await fan.p.goto(B + "/disciplinas/futbol")).status() === 404);
await fan.p.goto(B + "/");
const menuFan = await menu(fan.p);
check("el menú del aficionado solo tiene sus opciones", menuFan.includes("Mi panel") && menuFan.includes("Subir vídeos o fotos de una velada") && !menuFan.includes("Mi ficha y trayectoria") && !menuFan.includes("Mis clases") && !menuFan.includes("Mis veladas"));
check("su barra inferior: Inicio, Peleadores, Veladas y Mi panel", JSON.stringify(await pestanas(fan.p)) === JSON.stringify(["Inicio", "Peleadores", "Veladas", "Mi panel"]));
await fan.p.goto(B + "/mi-panel");
check("«Mi panel» del aficionado: sus peleadores y sus vídeos y fotos", await seen(fan.p.getByText("Mi panel", { exact: true }).first()) && await seen(fan.p.getByRole("heading", { name: "Mis vídeos y fotos" })));

// 3) Entrenador: menú de entrenador, club y promotora; crea un interclub sin pedir aprobación
const ent = await newUser("Entmedia");
sql(`update "User" set role='TRAINER' where email='${ent.email}'`);
await ent.p.goto(B + "/");
const menuEnt = await menu(ent.p);
check("el menú del entrenador reúne entrenador, club y promotora", ["ENTRENADOR", "CLUB", "PROMOTORA"].every((s) => menuEnt.toUpperCase().includes(s)) && menuEnt.includes("Mis veladas e interclubs") && !menuEnt.includes("Mi ficha y trayectoria"));
await ent.p.goto(B + "/organizador");
check("el entrenador puede crear eventos sin solicitar acceso", await seen(ent.p.getByRole("heading", { name: "Mis veladas e interclubs" })) && !(await ent.p.getByRole("button", { name: /Solicitar acceso/ }).count()));
await ent.p.locator("label.chip", { hasText: "Interclub" }).click();
await ent.p.fill("main [name=name]", `Interclub Medios ${rnd}`); await ent.p.fill("main [name=date]", hoyMadrid); await datosDeAlta(ent.p);
await btn(ent.p, "Crear el evento");
check("crea un interclub", await seen(avisoBueno(ent.p, "El interclub se ha creado")) && consulta(`select kind from "Event" where name='Interclub Medios ${rnd}'`) === "INTERCLUB");
const slugInterclub = consulta(`select slug from "Event" where name='Interclub Medios ${rnd}'`);
await fan.p.goto(`${B}/veladas/${slugInterclub}`);
check("la página pública lo identifica como interclub", await seen(fan.p.locator(".tag", { hasText: "Interclub" })));

// 4) Un peleador con un combate ya celebrado
const pel = await newUser("Pelmedia", "FIGHTER");
await pel.p.goto(B + "/mi-ficha");
await pel.p.fill("main [name=firstName]", "Medios"); await pel.p.fill("main [name=lastName]", `Peleador${rnd}`);
await datosDeAlta(pel.p); await btn(pel.p, "Crear mi ficha");
await pel.p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
await registrar(pel.p, { evento: `Velada Medios ${rnd}`, fecha: enDias(-10), rivalNombre: "Rival", rivalApellidos: `Medios${rnd}` });
await pel.p.locator(".notice-ok", { hasText: "Combate registrado" }).waitFor();
check("su barra inferior: Inicio, Veladas, Mi panel y Mi ficha", JSON.stringify(await pestanas(pel.p)) === JSON.stringify(["Inicio", "Veladas", "Mi panel", "Mi ficha"]));
const slugVelada = consulta(`select slug from "Event" where name='Velada Medios ${rnd}'`);
const slugPel = consulta(`select slug from "Fighter" where "lastName"='Peleador${rnd}'`);

// 5) El aficionado comparte una foto del combate, un vídeo subido y un enlace
await fan.p.goto(`${B}/veladas/${slugVelada}`);
await fan.p.getByRole("link", { name: "Subir vídeos o fotos de esta velada" }).click();
await fan.p.waitForURL(`**/compartir?velada=${slugVelada}`);
const form = fan.p.locator("main form").filter({ has: fan.p.getByRole("button", { name: "Compartir en la velada" }) });
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
await form.locator("[name=image]").setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: png });
await form.locator("[name=consentimiento]").evaluate((i) => i.removeAttribute("required"));
await form.getByRole("button", { name: "Compartir en la velada" }).click();
check("sin confirmar que puede compartirlo, se rechaza con un mensaje", await seen(avisoMalo(fan.p, "Marca la casilla")));
await form.locator("[name=image]").setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: png });
await form.locator("select[name=boutId]").selectOption({ index: 1 });
await form.locator("[name=caption]").fill("Cara a cara");
await form.locator("[name=consentimiento]").check();
await form.getByRole("button", { name: "Compartir en la velada" }).click();
check("comparte una foto del combate", await seen(avisoBueno(fan.p, "ya se ve en la velada")) && await seen(fan.p.locator("#multimedia img[alt^='Cara a cara']")));

await fan.p.goto(`${B}/compartir?velada=${slugVelada}`);
await form.locator("#video-archivo").setInputFiles({ name: "combate.mp4", mimeType: "video/mp4", buffer: randomBytes(300_000) });
check("el vídeo se sube de verdad, con su progreso", await seen(fan.p.getByText("Vídeo subido: «combate.mp4»"), 20000));
await form.locator("[name=caption]").fill("Tercer asalto");
await form.locator("[name=consentimiento]").check();
await form.getByRole("button", { name: "Compartir en la velada" }).click();
check("y lo publica en la velada", await seen(avisoBueno(fan.p, "ya se ve en la velada")) && await seen(fan.p.locator("#multimedia video")));
const idVideo = consulta(`select m.id from "MediaItem" m join "Event" e on e.id=m."eventId" where e.slug='${slugVelada}' and m."videoKey" is not null`);
const trozo = await fan.p.request.get(`${B}/medios/${idVideo}/video`, { headers: { Range: "bytes=0-99" } });
check("el vídeo se reproduce por partes (avanzar y retroceder en el móvil)", trozo.status() === 206 && (await trozo.body()).length === 100);
const descarga = await fan.p.request.get(`${B}/medios/${idVideo}/video?descargar=1`);
check("y se puede descargar", descarga.status() === 200 && (descarga.headers()["content-disposition"] ?? "").startsWith("attachment"));

const ajeno = `videos/otrapersona1/0f8fad5b-d9cb-469f-a165-70867728950e.mp4`;
await fan.p.goto(`${B}/compartir?velada=${slugVelada}`);
await form.locator("input[name=videoKey]").evaluate((i, v) => { i.value = v; }, ajeno);
await form.locator("[name=consentimiento]").check();
await form.getByRole("button", { name: "Compartir en la velada" }).click();
check("no se puede publicar un vídeo que no ha subido esa persona", await seen(avisoMalo(fan.p, "No encontramos el vídeo subido")));
await form.locator("[name=videoUrl]").fill("https://www.youtube.com/watch?v=ringespana");
await form.locator("[name=consentimiento]").check();
await form.getByRole("button", { name: "Compartir en la velada" }).click();
check("si no se puede subir, vale un enlace", await seen(avisoBueno(fan.p, "ya se ve en la velada")) && await seen(fan.p.locator("#multimedia a[href='https://www.youtube.com/watch?v=ringespana']")));

const futura = await newUser("Futmedia");
sql(`update "User" set role='TRAINER' where email='${futura.email}'`);
await futura.p.goto(B + "/organizador"); await futura.p.fill("main [name=name]", `Velada Futura Medios ${rnd}`); await futura.p.fill("main [name=date]", enDias(15)); await datosDeAlta(futura.p); await btn(futura.p, "Crear el evento");
await avisoBueno(futura.p, "La velada se ha creado").waitFor();
await fan.p.goto(`${B}/compartir?velada=${consulta(`select slug from "Event" where name='Velada Futura Medios ${rnd}'`)}`);
check("una velada futura todavía no admite vídeos ni fotos, y lo explica", await seen(avisoMalo(fan.p, "todavía no se ha celebrado")) && !(await fan.p.getByRole("button", { name: "Compartir en la velada" }).count()));

// 6) El peleador encuentra las imágenes de su combate en su ficha y en «Mi ficha»
const visita = await (await browser.newContext()).newPage();
await visita.goto(`${B}/peleadores/${slugPel}`);
check("la ficha pública muestra los vídeos y fotos de sus combates", await seen(visita.getByRole("heading", { name: "Vídeos y fotos de sus combates" })) && await seen(visita.locator("#multimedia img[alt^='Cara a cara']")));
await pel.p.goto(B + "/mi-ficha#multimedia");
check("el peleador puede descargar la foto de su combate", await seen(pel.p.locator("#multimedia").getByRole("link", { name: /Descargar la foto/ })));

// 7) Avisar de una foto y que moderación la retire
await fan.p.goto(`${B}/peleadores/${slugPel}#multimedia`);
const medio = fan.p.locator("#multimedia li", { hasText: "Cara a cara" });
await medio.locator("summary").click();
await medio.locator("select[name=reason]").selectOption("MI_IMAGEN");
await medio.getByRole("button", { name: /Enviar aviso/ }).click();
check("se puede avisar de una foto en la que apareces", await seen(avisoBueno(fan.p, "Hemos recibido tu aviso")));
const mod = await newUser("Modmedia"); hacerAdmin(mod.email);
await mod.p.goto(B + "/moderacion");
await mod.p.locator("tr", { hasText: "Cara a cara" }).getByRole("button", { name: "Resolver y retirar la foto" }).click();
await avisoBueno(mod.p, "contenido ocultado").waitFor();
await visita.goto(`${B}/veladas/${slugVelada}`);
check("moderación la retira y deja de verse", !(await visita.locator("#multimedia img[alt^='Cara a cara']").count()) && await seen(visita.locator("#multimedia video")));

// 8) «Mis vídeos y fotos»: lo compartido y borrarlo
await fan.p.goto(B + "/mi-panel#mis-subidas");
const lista = fan.p.locator("#mis-subidas li");
check("el aficionado ve lo que ha compartido (y lo retirado por moderación)", await lista.count() === 3 && await seen(fan.p.getByText("Retirado por moderación")));
const fila = lista.filter({ hasText: "Tercer asalto" });
await fila.locator("summary").click();
await fila.getByRole("button", { name: /Sí, borrar definitivamente/ }).click();
check("y puede borrarlo, también el archivo", await seen(avisoBueno(fan.p, "Se ha borrado")) && (await fan.p.request.get(`${B}/medios/${idVideo}/video`)).status() === 404);

// 9) Highlight con vídeo subido a la aplicación
await pel.p.goto(B + "/mi-ficha#highlights");
await pel.p.locator("#publicar-highlight").evaluate((d) => { d.open = true; });
const hl = pel.p.locator("#publicar-highlight form");
await hl.locator("[name=title]").fill("Mi mejor asalto");
await hl.locator("#highlight-video").setInputFiles({ name: "asalto.mp4", mimeType: "video/mp4", buffer: randomBytes(200_000) });
await pel.p.getByText("Vídeo subido: «asalto.mp4»").waitFor({ timeout: 20000 });
await hl.getByRole("button", { name: "Publicar en mi ficha" }).click();
check("el peleador publica un highlight con un vídeo subido", await seen(avisoBueno(pel.p, "Highlight publicado")));
await visita.goto(`${B}/peleadores/${slugPel}`);
const href = await visita.locator("a.highlight", { hasText: "Mi mejor asalto" }).getAttribute("href");
const video = await visita.request.get(B + href);
check("y se ve en su ficha pública desde la aplicación", /^\/highlights\/\w+\/video$/.test(href ?? "") && video.status() === 200 && video.headers()["content-type"] === "video/mp4");

// 10) Moderación de las noticias
await mod.p.goto(B + "/moderacion/noticias");
check("moderación ve las fuentes y su estado", await seen(mod.p.getByRole("heading", { name: "Fuentes de noticias" })) && await seen(mod.p.getByText(`Fuente de prueba ${rnd}`).first()));
await mod.p.locator("li", { hasText: `Noticia de MMA ${rnd}` }).getByRole("button", { name: /Ocultar/ }).click();
await avisoBueno(mod.p, "Noticia ocultada").waitFor();
await visita.goto(B + "/noticias");
check("una noticia ocultada deja de verse", !(await visita.getByText(`Noticia de MMA ${rnd}`).count()) && await seen(visita.getByText(`Noticia de boxeo ${rnd}`)));
check("solo moderación entra en las fuentes de noticias", !(await (await fan.p.goto(B + "/moderacion/noticias")).url().includes("/moderacion/noticias")) || await seen(fan.p.getByText("solo moderadores")));

await terminarDiagnosticos();
await browser.close();
