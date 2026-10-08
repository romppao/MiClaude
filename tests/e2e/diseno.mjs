// Diseño móvil v3 (fase 1): registro por pasos de los cuatro tipos de cuenta, inicio por papel, barra inferior por papel,
// perfil y clases del entrenador, highlights del peleador y su récord amateur privado.
// Petición del fundador (7 de octubre de 2026, Claude Design): «a la hora de registrarte, da igual de qué cómo lo hagas que la aplicación tiene
// el mismo aspecto y las mismas funcionalidades, y esto no puede ser». Requiere el servidor en marcha (ver ayudas.mjs).
import { execSync } from "node:child_process";
import { B, rnd, browser, seen, check, btn, link, newUser, hacerAdmin, aprobarOrganizador, datosDeAlta, registrar, enDias, terminarDiagnosticos } from "./ayudas.mjs";

const consulta = (q) => execSync(`psql "${process.env.DATABASE_URL}" -tA`, { input: q }).toString().trim();
const movil = async () => (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
const pestanas = (p) => p.locator("nav.mobile-nav a").allInnerTexts().then((xs) => xs.map((x) => x.trim()));
const avisoBueno = (p, texto) => p.locator("[role=status]", { hasText: texto });
const avisoMalo = (p, texto) => p.locator("[role=alert]", { hasText: texto });
const alta = async (p, tipo, nombre, correo) => {
  await p.goto(`${B}/registro?tipo=${tipo}`);
  await p.fill("[name=name]", nombre); await p.fill("[name=email]", correo); await p.fill("[name=password]", "contraseña123");
  await p.locator("main form button").last().click();
};
const confirmar = async (p, correo) => { await p.goto(B + link(correo)); await btn(p, "Confirmar"); await p.waitForSelector("text=Correo electrónico verificado"); };

// 1) Bienvenida y visitante: sin barra en la bienvenida; con cuatro pestañas en la portada
const v = await movil();
await v.goto(B + "/bienvenida");
check("la bienvenida ofrece empezar, entrar o explorar sin cuenta", await seen(v.getByRole("heading", { name: /Tu deporte\.\s*Tu gente\./ })) && await v.getByRole("link", { name: /^Empezar/ }).count() === 1 && await v.getByRole("link", { name: /Entrar/ }).count() >= 1 && await v.getByRole("link", { name: "Explorar sin cuenta" }).count() === 1);
check("la bienvenida, el acceso y el registro no llevan barra inferior", await v.locator("nav.mobile-nav").count() === 0);
await v.getByRole("link", { name: "Explorar sin cuenta" }).click(); await v.waitForURL(B + "/");
check("el visitante tiene Inicio, Peleadores, Veladas y Gimnasios", JSON.stringify(await pestanas(v)) === JSON.stringify(["Inicio", "Peleadores", "Veladas", "Gimnasios"]));
check("la portada invita a cada tipo de cuenta", await v.locator('main a[href="/registro?tipo=peleador"]').count() === 1 && await v.locator('main a[href="/registro?tipo=entrenador"]').count() === 1 && await v.locator('main a[href="/registro?tipo=entidad"]').count() === 1);

// 2) Entrenador: registro en cuatro pasos, perfil publicado al confirmar el correo, clases y pausa
const e = await movil();
const correoE = `entrenadora${rnd}@test.es`;
await alta(e, "entrenador", `Rosa Entrena${rnd}`, correoE);
await e.waitForURL("**/registro/perfil**");
check("la cuenta de entrenador tiene su propio papel", consulta(`select role from "User" where email='${correoE}'`) === "TRAINER");
await e.selectOption("[name=province]", "Zaragoza");
await btn(e, "Siguiente");
check("el perfil exige al menos una disciplina", await seen(avisoMalo(e, "al menos una disciplina")));
await e.locator("label.chip", { hasText: "Boxeo" }).click(); await e.locator("label.chip", { hasText: "MMA" }).click();
await e.fill("[name=gym]", `Club Entrena ${rnd}`); await e.fill("[name=years]", "14"); await e.selectOption("[name=province]", "Zaragoza");
await btn(e, "Siguiente"); await e.waitForURL("**/registro/clase**");
check("el último paso es su primera clase, con «Lo haré después»", await seen(e.getByRole("heading", { name: "Tu primera clase" })) && await e.getByRole("link", { name: "Lo haré después" }).count() === 1);
check("en una clase individual no se piden plazas ni horario", !(await e.locator("[name=capacity]").isVisible()) && !(await e.locator("[name=schedule]").isVisible()));
await e.locator(".segmentos label", { hasText: "Colectiva" }).click();
check("en una colectiva sí", await e.locator("[name=capacity]").isVisible() && await e.locator("[name=schedule]").isVisible());
await e.fill("[name=title]", "Grupo de competición"); await e.locator("label.chip", { hasText: "90 min" }).click(); await e.fill("[name=price]", "12"); await e.fill("[name=capacity]", "1"); await e.fill("[name=schedule]", "Martes y jueves · 19:30");
await e.locator("[name=capacity]").evaluate((i) => i.removeAttribute("min")); // se salta la comprobación del navegador para probar la del servidor
await btn(e, "Terminar");
check("las plazas fuera de rango se explican", await seen(avisoMalo(e, "entre 2 y 30")));
await e.locator(".segmentos label", { hasText: "Colectiva" }).click(); await e.fill("[name=title]", "Grupo de competición"); await e.locator("label.chip", { hasText: "90 min" }).click(); await e.fill("[name=price]", "12"); await e.fill("[name=capacity]", "10"); await e.fill("[name=schedule]", "Martes y jueves · 19:30");
await btn(e, "Terminar"); await e.waitForURL("**/verificar**");
check("antes de confirmar el correo no se publica ningún perfil", consulta(`select count(*) from "Trainer" t join "User" u on u.id=t."userId" where u.email='${correoE}'`) === "0");
await e.goto(B + "/");
check("su inicio le pide confirmar el correo para publicar", await seen(e.getByRole("link", { name: "Confirmar mi correo" })));
check("el entrenador tiene Inicio, Mis clases, Peleadores y Veladas", JSON.stringify(await pestanas(e)) === JSON.stringify(["Inicio", "Mis clases", "Peleadores", "Veladas"]));
await confirmar(e, correoE);
check("tras confirmar, se le ofrece publicar su perfil", await seen(e.locator("main button", { hasText: "Publicar mi perfil de entrenador" })));
await e.goto(B + "/");
const formPerfil = e.locator("main form").filter({ has: e.getByRole("button", { name: "Publicar mi perfil", exact: true }) });
check("el formulario llega rellenado con lo elegido al registrarse", await formPerfil.locator("input[name=disciplina][value=BOXEO]").isChecked() && await formPerfil.locator("input[name=disciplina][value=MMA]").isChecked() && await formPerfil.locator("[name=gym]").inputValue() === `Club Entrena ${rnd}` && await formPerfil.locator("[name=years]").inputValue() === "14" && await formPerfil.locator("[name=province]").inputValue() === "Zaragoza");
check("y ofrece publicar también la primera clase", await formPerfil.locator("input[name=publicarClase]").isChecked() && (await formPerfil.innerText()).includes("Grupo de competición"));
await formPerfil.getByRole("button", { name: "Publicar mi perfil", exact: true }).click();
await e.waitForURL("**/mis-clases**");
check("el perfil y la primera clase se publican a la vez", await seen(avisoBueno(e, "primera clase ya son públicos")) && consulta(`select count(*) from "TrainingClass" c join "Trainer" t on t.id=c."trainerId" join "User" u on u.id=t."userId" where u.email='${correoE}' and c.kind='GROUP' and c.capacity=10`) === "1");
const nueva = e.locator("#nueva form");
await nueva.locator("[name=title]").fill("Técnica y defensa"); await nueva.locator("[name=price]").fill("35");
await nueva.getByRole("button", { name: "Publicar la clase" }).click();
check("puede publicar otra clase individual", await seen(avisoBueno(e, "Clase publicada")) && await seen(e.locator("main section", { hasText: "Técnica y defensa" }).first()));
await e.getByRole("button", { name: "Pausar la clase «Técnica y defensa»" }).click();
check("pausar una clase la deja en pausa", await seen(avisoBueno(e, "Clase en pausa")) && await seen(e.getByRole("button", { name: "Activar la clase «Técnica y defensa»" })));
const slugE = consulta(`select t.slug from "Trainer" t join "User" u on u.id=t."userId" where u.email='${correoE}'`);
await v.goto(`${B}/entrenadores/${slugE}`);
const perfilPublico = await v.locator("main").innerText();
check("el perfil público muestra sus disciplinas, años y clases activas con precio, no las pausadas", perfilPublico.includes("14 años entrenando") && perfilPublico.includes("Grupo de competición") && perfilPublico.includes("12 €") && !perfilPublico.includes("Técnica y defensa"));
await v.goto(`${B}/entrenadores?q=${encodeURIComponent(`Rosa Entrena${rnd}`)}`);
check("y el listado de entrenadores cuenta sus clases", await seen(v.locator("main .card", { hasText: `Rosa Entrena${rnd}` }).filter({ hasText: "1 clase" })));
await e.goto(B + "/");
check("su inicio muestra sus clases publicadas", await seen(e.getByText("Clases publicadas")) && await seen(e.locator("main .fila", { hasText: "Grupo de competición" })));

// 3) Peleador: ficha rellenada desde el registro, inicio propio, highlights y récord amateur privado
const pel = await newUser("Diseno", "FIGHTER");
await pel.p.goto(B + "/mi-ficha");
await pel.p.fill("main [name=firstName]", "Diseño"); await pel.p.fill("main [name=lastName]", `Highlights${rnd}`);
await datosDeAlta(pel.p); await btn(pel.p, "Crear mi ficha");
await pel.p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
check("el peleador tiene Inicio, Veladas, Peleadores y Mi ficha", JSON.stringify(await (async () => { const m = await movil(); await m.context().addCookies(await pel.p.context().cookies()); await m.goto(B + "/"); const t = await pestanas(m); await m.context().close(); return t; })()) === JSON.stringify(["Inicio", "Veladas", "Peleadores", "Mi ficha"]));
await registrar(pel.p, { evento: `Velada Diseño ${rnd}`, fecha: enDias(-20), rivalNombre: "Rival", rivalApellidos: `Diseño${rnd}` });
await pel.p.locator(".notice-ok", { hasText: "Combate registrado" }).waitFor();
await registrar(pel.p, { evento: `Velada Futura ${rnd}`, fecha: enDias(12), rivalNombre: "Futuro", rivalApellidos: `Rival${rnd}`, resultado: null });
await pel.p.locator(".notice-ok", { hasText: "todavía no se ha celebrado" }).waitFor(); // el aviso propio del combate futuro (no el del anterior)
await pel.p.goto(B + "/");
check("su inicio muestra su récord y la cuenta atrás de su próximo combate", await seen(pel.p.getByRole("heading", { name: `Diseño Highlights${rnd}` })) && await seen(pel.p.getByRole("timer")) && (await pel.p.locator("main").innerText()).includes(`Futuro R.`) );
// Highlights
await pel.p.goto(B + "/mi-ficha#highlights");
const hl = pel.p.locator("#publicar-highlight form");
await hl.locator("[name=title]").fill("El KO del tercer asalto"); await hl.locator("[name=videoUrl]").fill("javascript:alert(1)");
await hl.locator("[name=videoUrl]").evaluate((i) => i.setAttribute("type", "text"));
await hl.getByRole("button", { name: "Publicar en mi ficha" }).click();
check("un enlace de vídeo que no es https se rechaza con un mensaje", await seen(avisoMalo(pel.p, "https://")));
await pel.p.locator("#publicar-highlight").evaluate((d) => { d.open = true; });
await hl.locator("[name=title]").fill("El KO del tercer asalto"); await hl.locator("[name=videoUrl]").fill("https://www.youtube.com/watch?v=ringespana");
await hl.locator("select[name=boutId]").selectOption(await hl.locator("select[name=boutId] option", { hasText: `Velada Diseño ${rnd}` }).getAttribute("value"));
await hl.getByRole("button", { name: "Publicar en mi ficha" }).click();
check("el peleador publica un vídeo vinculado a un combate", await seen(avisoBueno(pel.p, "Highlight publicado")));
await pel.p.locator("#publicar-highlight").evaluate((d) => { d.open = true; });
await hl.locator(".segmentos label", { hasText: "Foto" }).click();
check("en una foto no se pide enlace de vídeo", !(await hl.locator("[name=videoUrl]").isVisible()));
await hl.locator("[name=title]").fill("Cara a cara");
// Una imagen PNG mínima válida de 1×1 px (ficticia).
await hl.locator("[name=image]").setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64") });
await hl.locator("label.chip", { hasText: "Destacar en mi ficha" }).click();
await hl.getByRole("button", { name: "Publicar en mi ficha" }).click();
check("y una foto destacada", await seen(avisoBueno(pel.p, "Highlight publicado")) && consulta(`select count(*) from "Highlight" h join "Fighter" f on f.id=h."fighterId" where f."lastName"='Highlights${rnd}' and h.pinned and h.kind='PHOTO' and h."hasImage"`) === "1");
const publica = await pel.p.getByRole("link", { name: "Ver mi ficha pública", exact: true }).getAttribute("href");
await v.goto(B + publica);
const tarjetas = v.locator("a.highlight");
check("la ficha pública muestra los highlights, el destacado primero", await tarjetas.count() === 2 && (await tarjetas.first().innerText()).includes("Cara a cara") && (await tarjetas.first().innerText()).includes("Destacado"));
check("el vídeo abre su enlace en otra pestaña y lo anuncia", await tarjetas.nth(1).getAttribute("href") === "https://www.youtube.com/watch?v=ringespana" && await tarjetas.nth(1).getAttribute("target") === "_blank" && (await tarjetas.nth(1).innerText()).includes(`Velada Diseño ${rnd}`));
const foto = await v.request.get(B + (await tarjetas.first().getAttribute("href")));
check("la foto se sirve como imagen", foto.status() === 200 && foto.headers()["content-type"] === "image/webp");
check("el visitante no puede publicar highlights en una ficha ajena", await v.getByRole("link", { name: "Publicar highlight" }).count() === 0);
await pel.p.goto(B + "/mi-ficha#highlights");
await pel.p.getByRole("button", { name: "Destacar «El KO del tercer asalto»" }).click();
check("solo un highlight puede estar destacado", await seen(avisoBueno(pel.p, "Highlight destacado")) && consulta(`select count(*) from "Highlight" h join "Fighter" f on f.id=h."fighterId" where f."lastName"='Highlights${rnd}' and h.pinned`) === "1");
await pel.p.getByRole("button", { name: "Retirar «Cara a cara» de mi ficha" }).click();
check("retirarlo lo quita de la ficha", await seen(avisoBueno(pel.p, "Highlight retirado")) && consulta(`select count(*) from "Highlight" h join "Fighter" f on f.id=h."fighterId" where f."lastName"='Highlights${rnd}'`) === "1");
// Otro peleador no puede retirar un highlight ajeno aunque manipule el formulario (el servidor comprueba de quién es)
const ajeno = await newUser("Ajenohl", "FIGHTER");
await ajeno.p.goto(B + "/mi-ficha"); await ajeno.p.fill("main [name=firstName]", "Ajeno"); await ajeno.p.fill("main [name=lastName]", `Hl${rnd}`); await datosDeAlta(ajeno.p); await btn(ajeno.p, "Crear mi ficha");
await ajeno.p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
const idAjeno = consulta(`select h.id from "Highlight" h join "Fighter" f on f.id=h."fighterId" where f."lastName"='Highlights${rnd}'`);
const propio = ajeno.p.locator("#publicar-highlight form");
await ajeno.p.locator("#publicar-highlight").evaluate((d) => { d.open = true; });
await propio.locator("[name=title]").fill("Mío"); await propio.locator("[name=videoUrl]").fill("https://example.com/mio");
await propio.getByRole("button", { name: "Publicar en mi ficha" }).click(); await seen(avisoBueno(ajeno.p, "Highlight publicado"));
await ajeno.p.locator("#highlights form").first().evaluate((f, id) => { f.querySelector("[name=highlightId]").value = id; }, idAjeno);
await ajeno.p.getByRole("button", { name: "Retirar «Mío» de mi ficha" }).click();
check("un highlight ajeno no se puede retirar manipulando el formulario", await seen(avisoMalo(ajeno.p, "No hemos encontrado")) && consulta(`select count(*) from "Highlight" where id='${idAjeno}'`) === "1");
// Récord amateur privado en la ficha y en el inicio de quien sigue
check("su récord amateur es privado por defecto", consulta(`select "recordPublic" from "Fighter" where "lastName"='Highlights${rnd}'`) === "f");
await v.goto(B + publica);
check("el visitante ve el número de combates y no el resultado", await seen(v.locator("main .dato", { hasText: "Combates" })) && (await v.locator("#combates").innerText()).includes("Combate ante") && !(await v.locator("#combates").innerText()).includes("Victoria ante"));

// 4) Aficionado: intereses y peleadores seguidos en el registro; inicio con próximo combate «VS» y auras
const fan = await movil();
const correoF = `aficionada${rnd}@test.es`;
await alta(fan, "usuario", "Laura Diseño", correoF);
await fan.waitForURL("**/registro/intereses**");
await fan.locator("label.chip", { hasText: "Muay Thai" }).click(); await fan.locator("label.chip", { hasText: "Boxeo" }).click();
await btn(fan, "Terminar"); await fan.waitForURL("**/verificar**");
check("sus disciplinas se guardan", consulta(`select interests from "User" where email='${correoF}'`) === "{BOXEO,MUAYTHAI}");
await fan.goto(B + publica);
await fan.getByRole("button", { name: "Seguir a este peleador" }).click(); await seen(fan.getByRole("button", { name: "Dejar de seguir" }));
await confirmar(fan, correoF);
await fan.goto(B + "/");
check("el aficionado tiene Inicio, Peleadores, Veladas y Siguiendo", JSON.stringify(await pestanas(fan)) === JSON.stringify(["Inicio", "Peleadores", "Veladas", "Siguiendo"]));
check("su inicio le saluda y muestra el próximo combate de quien sigue en formato «VS»", await seen(fan.getByRole("heading", { name: "Hola, Laura" })) && await seen(fan.locator("a.vs", { hasText: `Velada Futura ${rnd}` })));
check("y sus disciplinas, primero las que eligió (en el orden del catálogo)", JSON.stringify((await fan.locator("main section", { hasText: "Tus disciplinas" }).locator("a.disciplina").allInnerTexts()).slice(0, 2).map((t) => t.trim())) === JSON.stringify(["Boxeo", "Muay Thai"]));
check("los resultados privados de un amateur no se desvelan en el inicio", !(await fan.locator("main").innerText()).includes(`Gana Diseño Highlights${rnd}`));

// 5) Entidad: club pendiente funciona como aficionado; aprobado, su panel
const org = await movil();
const correoO = `club${rnd}@test.es`, club = `Club Diseño ${rnd}`;
await org.goto(`${B}/registro?tipo=entidad`);
await org.fill("[name=name]", "Persona Club"); await org.fill("[name=email]", correoO); await org.fill("[name=password]", "contraseña123");
await org.fill("[name=orgName]", club); await org.locator(".segmentos label", { hasText: "Club" }).click(); await org.fill("[name=message]", "Web del club");
await btn(org, "Enviar solicitud"); await org.waitForURL("**/verificar**");
check("un club se registra como solicitud de tipo «CLUB», con papel de aficionado", consulta(`select u.role||'|'||r.kind from "OrganizerRequest" r join "User" u on u.id=r."userId" where u.email='${correoO}'`) === "FAN|CLUB");
await confirmar(org, correoO);
await org.goto(B + "/");
check("mientras está pendiente, su inicio lo dice y funciona como el de un aficionado", await seen(org.locator("main", { hasText: `Solicitud de «${club}» en revisión` })) && JSON.stringify(await pestanas(org)) === JSON.stringify(["Inicio", "Peleadores", "Veladas", "Siguiendo"]));
const mod = await newUser("Modediseno", "FAN"); hacerAdmin(mod.email);
await aprobarOrganizador(mod.p, club);
await org.goto(B + "/");
check("aprobado, ve su panel con su nombre y el botón de crear velada", await seen(org.getByRole("heading", { name: club })) && await seen(org.getByRole("link", { name: "Crear una velada" })) && JSON.stringify(await pestanas(org)) === JSON.stringify(["Panel", "Mis veladas", "Peleadores", "Veladas"]));
await org.getByRole("link", { name: "Crear una velada" }).click();
check("y «Crear una velada» lleva al formulario", await seen(org.locator("#crear")));

await terminarDiagnosticos();
await browser.close();
