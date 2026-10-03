import { B, rnd, MAIL_LOG, browser, seen, check, btn, esperarCorreo, hoyMadrid, enDias, registrar, newUser, hacerAdmin, solicitarOrganizador, anadirAlCartel, aprobarOrganizador, terminarDiagnosticos } from "./ayudas.mjs";
// Prueba de extremo a extremo del flujo principal. Requiere el servidor en marcha con la BD de pruebas.
// Variables de entorno: ver tests/e2e/ayudas.mjs.
import { readFileSync } from "node:fs";
const futura = enDias(120); // la aplicación no admite veladas a más de un año vista

// 1) email sin verificar: no puede dar aura ni crear ficha
const unv = await newUser("Sinverificar", "FIGHTER", false);
await unv.p.goto(B + "/mi-ficha"); check("sin verificar → redirige a /verificar", unv.p.url().includes("/verificar"));

// 2) Pepe crea ficha y registra combate contra un rival aún sin cuenta
const pepe = (await newUser("Pepe", "FIGHTER")).p;
await pepe.goto(B + "/mi-ficha");
await pepe.fill("[name=firstName]", "Pepe"); await pepe.fill("[name=lastName]", `Uno${rnd}`); await pepe.fill("[name=gym]", `Gym Test ${rnd}`); await btn(pepe, "Crear mi ficha");
await pepe.waitForSelector("text=Registrar un combate");
await registrar(pepe, { evento: "Velada Claim Test", fecha: "2026-08-01", rivalNombre: "Luis", rivalApellidos: `Dos${rnd}`, evidencia: "javascript:alert(1)" });
check("un enlace peligroso se rechaza con un mensaje claro y no se guarda nada", await seen(pepe.locator(".notice-bad", { hasText: "El enlace no es válido" })));
await registrar(pepe, { evento: "Velada Claim Test", fecha: "2026-08-01", rivalNombre: "Luis", rivalApellidos: `Dos${rnd}` });
await pepe.waitForSelector("text=1-0-0");
check("aviso claro tras registrar el combate", await pepe.locator("[role=status]", { hasText: "Combate registrado" }).count() === 1);

// Coherencia: el mismo enfrentamiento no se puede registrar dos veces en la misma velada
await registrar(pepe, { evento: "Velada Claim Test", fecha: "2026-08-01", rivalNombre: "Luis", rivalApellidos: `Dos${rnd}` });
check("si ya hay fichas con el nombre del rival se pide elegir cuál es", await seen(pepe.locator("h1", { hasText: "¿Quién es tu rival?" })));
check("y cada candidata dice cuántos combates tienes contra ella y cuándo se creó su ficha", await seen(pepe.locator("main .card", { hasText: "Ficha creada el" }).first()) && (await pepe.locator("main").innerText()).includes("contra esta persona"));
await btn(pepe, "Es esta persona");
await pepe.waitForSelector("[role=alert]:has-text('ya está registrado')");
check("combate duplicado bloqueado con mensaje claro", await pepe.locator(".notice-bad", { hasText: "ya está registrado" }).count() === 1);
check("y se vuelve a la pantalla de elegir rival con los datos escritos, no a un formulario vacío", pepe.url().includes("/mi-ficha/rival") && pepe.url().includes("eventName=Velada+Claim+Test") && await pepe.locator("main a.btn", { hasText: "Corregir los datos del combate" }).count() === 1);
await pepe.locator("main a.btn", { hasText: "Corregir los datos del combate" }).click();
await pepe.waitForURL("**/mi-ficha?*");
check("«Corregir los datos del combate» devuelve el formulario relleno para cambiar lo que haga falta", await pepe.inputValue("[name=eventName]") === "Velada Claim Test" && await pepe.inputValue("[name=oppLast]") === `Dos${rnd}` && await pepe.inputValue("[name=date]") === "2026-08-01");

// Evidencia: una URL peligrosa no se guarda; una inválida da error; una válida aparece como enlace público
await pepe.goto(B + `/peleadores/pepe-uno${rnd}`);
check("URL javascript: no se guarda como evidencia", await pepe.locator("a:has-text('evidencia')").count() === 0);
await pepe.goto(B + "/mi-ficha");
await pepe.fill("main table input[name=evidenceUrl]", "esto no es una url"); await pepe.click("main table button:has-text('Guardar enlace')");
await pepe.waitForSelector("[role=alert]:has-text('no es válido')");
await pepe.fill("main table input[name=evidenceUrl]", `https://example.com/acta-${rnd}`); await pepe.click("main table button:has-text('Guardar enlace')");
await pepe.locator(".notice-ok", { hasText: "enlace de evidencia se ha guardado" }).waitFor();
await pepe.goto(B + `/peleadores/pepe-uno${rnd}`);
check("enlace de evidencia visible en la ficha pública", await pepe.locator(`a[href="https://example.com/acta-${rnd}"][rel*=noopener]`).count() === 1);

// 3) Luis (con cuenta) reclama su ficha existente; admin aprueba
const luis = (await newUser("Luis", "FIGHTER")).p;
await luis.goto(B + `/mi-ficha?q=Dos${rnd}`);
await luis.fill("[name=message]", "Entreno en el mismo gimnasio"); await btn(luis, "Reclamar");
await luis.waitForSelector("text=Solicitud enviada");
const admin = await newUser("Admin");
hacerAdmin(admin.email);
await admin.p.goto(B + "/moderacion");
check("admin ve la reclamación", await admin.p.locator("body").innerText().then((t) => t.includes(`Dos${rnd}`)));
await admin.p.locator("tr", { hasText: `Dos${rnd}` }).locator("button:has-text('Aprobar')").click();
await admin.p.locator("tr", { hasText: `Dos${rnd}` }).locator("button:has-text('Aprobar')").waitFor({ state: "detached" }); // la acción ha terminado
await luis.goto(B + "/mi-ficha");
check("Luis ya tiene la ficha reclamada", await luis.locator("body").innerText().then((t) => t.includes("Registrar un combate")));
await btn(luis, "Sí, es correcto");
check("aviso claro tras confirmar el combate", await seen(luis.locator("[role=status]", { hasText: "Has confirmado el combate" })));
await pepe.goto(B + `/peleadores/pepe-uno${rnd}`);
check("combate confirmado por el rival", await pepe.locator(".tag", { hasText: "confirmado" }).count() > 0);
check("quien registró el combate recibe un correo cuando su rival lo confirma", !!(await esperarCorreo(`pepe${rnd}@test.es`, "ha confirmado tu combate")));

// 3b) El rival se entera de que han registrado un combate contra él, y rechazarlo exige explicar el motivo (que le llega a quien lo registró)
await registrar(luis, { evento: `Velada Rival Avisado ${rnd}`, fecha: "2026-08-15", rivalNombre: "Pepe", rivalApellidos: `Uno${rnd}` });
await seen(luis.locator("h1", { hasText: "¿Quién es tu rival?" }));
await btn(luis, "Es esta persona");
await luis.locator("[role=status]", { hasText: "Combate registrado" }).waitFor();
check("el rival (con cuenta) recibe un correo cuando alguien registra un combate contra él", !!(await esperarCorreo(`pepe${rnd}@test.es`, "ha registrado un combate contra ti")));
await pepe.goto(B + "/mi-ficha");
await pepe.locator("li", { hasText: `Velada Rival Avisado ${rnd}` }).locator("button:has-text('No es correcto')").click();
check("«No es correcto» sin explicar el motivo no se admite y pide escribirlo", await seen(pepe.locator("[role=alert]", { hasText: "por qué no es correcto" })));
await pepe.locator("li", { hasText: `Velada Rival Avisado ${rnd}` }).locator("[name=motivo]").fill("No combatimos ese día");
await pepe.locator("li", { hasText: `Velada Rival Avisado ${rnd}` }).locator("button:has-text('No es correcto')").click();
check("con el motivo, el combate se rechaza y se confirma", await seen(pepe.locator("[role=status]", { hasText: "Has indicado que el combate no es correcto" })) || await seen(pepe.locator(".notice-ok")));
check("y quien lo registró recibe el motivo por correo", !!(await esperarCorreo(`luis${rnd}@test.es`, "No combatimos ese día")));

// 3c) Quien ya tiene una ficha provisional con su nombre: se le avisa antes de crear otra, y con una solicitud pendiente no se le deja crearla
await registrar(pepe, { evento: `Velada Nuria ${rnd}`, fecha: "2026-08-10", rivalNombre: "Nuria", rivalApellidos: `Provisional${rnd}` });
await pepe.locator("tr", { hasText: `Velada Nuria ${rnd}` }).waitFor(); // se espera a la fila nueva, no al aviso: el formulario se vacía justo al terminar y rellenarlo antes lo perdería
await registrar(pepe, { evento: `Velada Olga ${rnd}`, fecha: "2026-08-11", rivalNombre: "Olga", rivalApellidos: `Provisional${rnd}` });
await pepe.locator("tr", { hasText: `Velada Olga ${rnd}` }).waitFor();
// 3b2) Un combate registrado por error se puede quitar (y con él la velada y la ficha provisional que solo existían por él)
await registrar(pepe, { evento: `Velada Error ${rnd}`, fecha: "2026-08-12", rivalNombre: "Error", rivalApellidos: `Quitar${rnd}` });
await pepe.locator("tr", { hasText: `Velada Error ${rnd}` }).waitFor();
await pepe.locator("tr", { hasText: `Velada Error ${rnd}` }).locator("summary", { hasText: "Quitar este combate" }).click();
await pepe.locator("tr", { hasText: `Velada Error ${rnd}` }).locator("button:has-text('Sí, quitar este combate')").click();
check("un combate registrado por error se quita y se confirma", await seen(pepe.locator("[role=status]", { hasText: "se ha quitado de tu ficha" })) && await pepe.locator("tr", { hasText: `Velada Error ${rnd}` }).count() === 0);
const huerfana = await pepe.goto(B + `/peleadores/error-q`);
check("y la ficha provisional del rival, que solo existía por ese combate, desaparece con él", huerfana.status() === 404);
await pepe.goto(B + "/mi-ficha");

const nuria = (await newUser("Nuria", "FIGHTER")).p;
await nuria.goto(B + "/mi-ficha");
await nuria.fill("[name=firstName]", "Nuria"); await nuria.fill("[name=lastName]", `Provisional${rnd}`);
await btn(nuria, "Crear mi ficha");
check("si ya hay una ficha sin titular con tu nombre, se avisa antes de crear otra y se ofrece reclamarla", await seen(nuria.locator("[role=alert]", { hasText: "ficha sin titular con tu nombre" })) && await nuria.locator("main button", { hasText: "Reclamar esta ficha" }).count() >= 1);
await nuria.fill("[name=firstName]", "Nuria"); await nuria.fill("[name=lastName]", `Provisional${rnd}`);
await btn(nuria, "Crear mi ficha");
check("y quien confirma que no es esa persona puede crear su ficha", await seen(nuria.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" })));
const olga = (await newUser("Olga", "FIGHTER")).p;
await olga.goto(B + `/mi-ficha?q=Provisional${rnd}`);
await olga.locator("form", { hasText: "Olga" }).first().locator("[name=message]").fill("Entreno en el mismo gimnasio");
await olga.locator("form", { hasText: "Olga" }).first().locator("button:has-text('Reclamar')").click();
await olga.waitForSelector("text=Solicitud enviada");
await olga.goto(B + "/mi-ficha");
check("con una solicitud pendiente se explica que no hace falta nada más y no se ofrece crear otra ficha", await seen(olga.locator("h2", { hasText: "Tu solicitud está pendiente" })) && await olga.locator("main button", { hasText: "Crear mi ficha" }).count() === 0);

// 4) dar aura: fan sin verificar no puede; verificado sí
const fanU = await newUser("Fanuno", "FAN", false);
await fanU.p.goto(B + `/peleadores/pepe-uno${rnd}`);
check("fan sin verificar no ve el botón de dar aura", await fanU.p.locator("button:has-text('Dar aura')").count() === 0 && await fanU.p.locator("text=Confirma tu correo electrónico para dar aura").count() > 0);
const fanAcc = await newUser("Fandos");
const fan = fanAcc.p;
await fan.goto(B + `/peleadores/pepe-uno${rnd}`);
await fan.fill("input[name=comment]", "Increíble, alucinante"); await fan.click("button:has-text('Dar aura')");
await fan.locator("[role=status]", { hasText: "Has dado aura" }).waitFor();
check("aviso claro tras dar aura", await fan.locator(".notice-ok", { hasText: "Has dado aura" }).count() === 1);
await fan.reload();
check("el aura queda registrada y suma en la ficha", await fan.locator("body").innerText().then((t) => t.includes("1 aura recibida") && t.includes("Increíble, alucinante")));
await fan.click("button:has-text('Quitar mi aura')");
await fan.locator("[role=status]", { hasText: "Has quitado tu aura" }).waitFor();
check("se puede quitar el aura", await fan.locator("text=0 auras recibidas").waitFor({ timeout: 8000 }).then(() => true, () => false));
await fan.click("button:has-text('Dar aura')");
await fan.locator("[role=status]", { hasText: "Has dado aura" }).waitFor();
await fan.goto(B + "/ranking");
const rk = await fan.locator("body").innerText();
check("el ránking de boxeo lista al peleador con su aura dentro de su categoría", rk.includes(`Uno${rnd}`) && rk.includes("Boxeo ·"));

// 4a) un usuario avisa de un error; solo puede hacerlo una vez mientras siga abierto; el moderador lo resuelve
await fan.goto(B + `/peleadores/pepe-uno${rnd}`);
const report = async () => {
  const det = fan.locator("main table details").first();
  await det.locator("summary").click();
  await det.locator("select[name=reason]").selectOption("RESULTADO");
  await det.locator("input[name=message]").fill(`Aviso ${rnd}`);
  await det.locator("button").click();
};
await report();
await fan.locator(".notice-ok", { hasText: "Hemos recibido tu aviso" }).waitFor();
check("aviso de error enviado con confirmación clara", await fan.locator(".notice-ok").count() === 1);
await report();
await fan.locator(".notice-bad", { hasText: "Ya nos avisaste" }).waitFor();
check("no se puede repetir un aviso abierto", await fan.locator(".notice-bad").count() === 1);
await admin.p.goto(B + "/moderacion");
const repRow = admin.p.locator("tr", { hasText: `Aviso ${rnd}` });
check("el moderador ve el aviso con su motivo", await repRow.count() === 1 && (await repRow.innerText()).includes("El resultado no es correcto"));
await repRow.locator("button:has-text('Cerrar: ya está corregido')").click();
await repRow.waitFor({ state: "detached" });
check("el aviso resuelto sale de la cola", await admin.p.locator("tr", { hasText: `Aviso ${rnd}` }).count() === 0);

// 4c) seguir a un peleador y ver la página de ayuda sin cuenta
await fan.goto(B + `/peleadores/pepe-uno${rnd}`);
await fan.click("main button:has-text('Seguir a este peleador')");
await fan.locator(".notice-ok", { hasText: "Ahora sigues a este peleador" }).waitFor();
check("seguir a un peleador con aviso claro y contador", await fan.locator("text=1 seguidor").waitFor({ timeout: 8000 }).then(() => true, () => false));
check("el propio peleador no ve el botón de seguirse", await (async () => { await pepe.goto(B + `/peleadores/pepe-uno${rnd}`); return pepe.locator("button:has-text('Seguir a este peleador')").count(); })() === 0);
const anon = await (await browser.newContext()).newPage();
await anon.goto(B + "/ayuda");
check("la ayuda es pública y explica las etiquetas", await anon.locator("body").innerText().then((t) => t.includes("Qué significan las etiquetas") && t.includes("Pendiente de confirmar")));

// 4b) un visitante sin sesión que quiere dar aura vuelve a la misma ficha tras entrar
const visitor = await (await browser.newContext()).newPage();
await visitor.goto(B + `/peleadores/pepe-uno${rnd}`);
await visitor.click("text=Entra para dar aura");
await visitor.fill("[name=email]", fanAcc.email); await visitor.fill("[name=password]", "contraseña123"); await btn(visitor, "Entrar");
await visitor.waitForURL(`**/peleadores/pepe-uno${rnd}`);
check("tras entrar vuelve a la ficha donde iba a dar aura", visitor.url().endsWith(`/peleadores/pepe-uno${rnd}`));

// 5) organizador
const org = (await newUser("Orga")).p;
await solicitarOrganizador(org, `Club Demo Madrid ${rnd}`);
await aprobarOrganizador(admin.p, `Club Demo Madrid ${rnd}`);
await org.goto(B + "/organizador");
await org.fill("[name=name]", `Gran Velada Org ${rnd}`); await org.fill("[name=date]", "2026-07-20"); await btn(org, "Crear velada");
await org.waitForURL(`**/organizador/gran-velada-org-${rnd}-2026-07-20?*`);
await anadirAlCartel(org, `Pepe Uno${rnd}`, `Luis Dos${rnd}`);
await org.locator("[role=status]", { hasText: "se ha añadido al cartel" }).waitFor();
await org.selectOption("select[name=outcome]", "WIN"); await org.selectOption("select[name=method]", "KO"); await btn(org, "Guardar resultado");
await org.locator(".notice-ok", { hasText: "resultado se ha guardado" }).waitFor();
await fan.goto(B + `/veladas/gran-velada-org-${rnd}-2026-07-20`);
const t = await fan.locator("body").innerText();
check("velada pública con cartel y resultado", t.includes(`Gana Pepe Uno${rnd}`) && t.includes("KO"));

// 5b) La organizadora corrige, cancela y reactiva su velada y quita un combate del cartel
await org.goto(B + `/organizador/gran-velada-org-${rnd}-2026-07-20`);
await org.locator("summary", { hasText: "Corregir los datos de la velada" }).click();
await org.fill("details [name=name]", `Gran Velada Org Corregida ${rnd}`); await org.fill("details [name=venue]", "Pabellón Nuevo");
await org.click("details button:has-text('Guardar los datos de la velada')");
check("la organizadora corrige los datos de su velada y se confirma", await seen(org.locator("[role=status]", { hasText: "datos de la velada se han guardado" })));
await org.locator("summary", { hasText: "Cancelar la velada" }).click();
await org.click("button:has-text('Sí, cancelar la velada')");
check("cancelar la velada se confirma y la página lo dice", await seen(org.locator("[role=status]", { hasText: "marcado como cancelada" })) && await seen(org.locator("[role=note]", { hasText: "Esta velada está cancelada" })));
await fan.goto(B + `/veladas/gran-velada-org-${rnd}-2026-07-20`);
check("la página pública enseña la velada cancelada con su etiqueta y el nombre corregido", (await fan.locator("body").innerText()).includes("velada cancelada") && (await fan.locator("body").innerText()).includes(`Gran Velada Org Corregida ${rnd}`));
await org.goto(B + `/organizador/gran-velada-org-${rnd}-2026-07-20`);
await org.locator("summary", { hasText: "Volver a activar la velada" }).click();
await org.click("button:has-text('Volver a activar la velada')");
check("se puede volver a activar", await seen(org.locator("[role=status]", { hasText: "vuelve a estar activa" })));
await org.locator("summary", { hasText: "Quitar del cartel" }).first().click();
await org.click("button:has-text('Sí, quitar del cartel')");
check("quitar un combate del cartel se confirma", await seen(org.locator("[role=status]", { hasText: "se ha quitado del cartel" })));
check("y el cartel queda vacío", await seen(org.locator("p", { hasText: "El cartel está vacío. Añade" })));
// 6) un fan no puede entrar al panel de otra velada
await fan.goto(B + `/organizador/gran-velada-org-${rnd}-2026-07-20`);
check("fan no accede a gestionar velada ajena", !fan.url().includes("/gran-velada-org-"));
// 6) Récord de partida (declarado) y varias disciplinas en una misma ficha
const vet = (await newUser("Vet", "FIGHTER")).p;
await vet.goto(B + "/mi-ficha");
await vet.fill("[name=firstName]", "Vet"); await vet.fill("[name=lastName]", `Veterano${rnd}`);
await vet.fill("[name=priorTotal]", "20"); await vet.fill("[name=priorWins]", "10"); await vet.fill("[name=priorLosses]", "3"); await vet.fill("[name=priorDraws]", "1");
await btn(vet, "Crear mi ficha");
await vet.locator(".notice-bad", { hasText: "no coincide" }).waitFor();
check("un récord de partida que no suma se rechaza con un mensaje claro", await vet.locator(".notice-bad", { hasText: "no coincide" }).count() === 1);
await vet.fill("[name=firstName]", "Vet"); await vet.fill("[name=lastName]", `Veterano${rnd}`);
await vet.fill("[name=priorTotal]", "14"); await vet.fill("[name=priorWins]", "10"); await vet.fill("[name=priorLosses]", "3"); await vet.fill("[name=priorDraws]", "1"); // tras el error el formulario conserva lo escrito: el total se corrige de forma explícita
await btn(vet, "Crear mi ficha");
await vet.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
check("el récord de partida detallado se muestra como declarado", await seen(vet.locator("text=10-3-1").first()) && await seen(vet.locator("text=Incluye 14 combates anteriores declarados por el propio deportista")));
await registrar(vet, { evento: `Velada Vet ${rnd}`, fecha: "2026-06-01", rivalNombre: "Vet", rivalApellidos: `Rival${rnd}` });
await vet.locator(".notice-ok", { hasText: "Combate registrado" }).waitFor();
check("el récord suma lo anterior más lo registrado (10-3-1 + 1-0-0)", await seen(vet.locator(".rec", { hasText: /^\s*11-3-1\s*$/ }).first()));
await registrar(vet, { evento: `Velada Vet dos ${rnd}`, fecha: "2026-04-01", rivalNombre: "Vet", rivalApellidos: `Otro${rnd}`, metodo: "SUBMISSION" });
await vet.locator(".notice-bad", { hasText: "no existe en la disciplina" }).waitFor();
check("una sumisión no se acepta en boxeo", await vet.locator(".notice-bad", { hasText: "no existe en la disciplina" }).count() === 1);
const addDisc = vet.locator("details", { hasText: "Añadir otra disciplina" });
await addDisc.locator("summary").click();
await addDisc.locator("select[name=discipline]").selectOption("MMA"); await addDisc.locator("select[name=level]").selectOption("AMATEUR"); await addDisc.locator("select[name=weightClass]").selectOption("Ligero");
await addDisc.locator("input[name=priorTotal]").fill("3");
await addDisc.locator("button:has-text('Añadir disciplina')").click();
await vet.locator(".notice-ok", { hasText: "disciplina en tu ficha" }).waitFor();
await registrar(vet, { disciplina: "MMA", evento: `Velada MMA Vet ${rnd}`, fecha: "2026-05-01", rivalNombre: "Vet", rivalApellidos: `Rival mma${rnd}`, metodo: "SUBMISSION" });
await vet.locator(".notice-ok", { hasText: "Combate registrado" }).waitFor();
await anon.goto(B + `/peleadores/vet-veterano${rnd}`);
const pub = await anon.locator("body").innerText();
check("la ficha pública separa el récord por disciplina", pub.includes("MMA") && pub.includes("1 sumisión") && pub.includes("3 combates anteriores sin detallar") && pub.includes("Boxeo"));
await anon.goto(B + `/peleadores?disciplina=MMA&q=Veterano${rnd}`); // el listado está paginado: se acota con el nombre
check("el filtro por disciplina incluye a quien la practica", await seen(anon.locator("main .card strong", { hasText: `Vet Veterano${rnd}` })));
await anon.goto(B + `/peleadores?disciplina=JIUJITSU&q=Veterano${rnd}`);
check("y excluye a quien no", await seen(anon.locator("main p", { hasText: "Ningún peleador coincide con estos filtros." })) && await anon.locator("main .card strong", { hasText: `Vet Veterano${rnd}` }).count() === 0);

// Avisos a seguidores: un organizador publica un combate futuro de un peleador seguido
await org.goto(B + "/organizador");
await org.fill("[name=name]", `Velada Futura ${rnd}`); await org.fill("[name=date]", futura); await btn(org, "Crear velada");
await org.waitForURL(`**/organizador/velada-futura-${rnd}-${futura}?*`);
await anadirAlCartel(org, `Pepe Uno${rnd}`, `Luis Dos${rnd}`);
await org.locator(".notice-ok", { hasText: "se ha añadido al cartel" }).waitFor();
let mailed = false;
for (let i = 0; i < 20 && !mailed; i++) { mailed = readFileSync(MAIL_LOG, "utf8").includes(`to=${fanAcc.email} subject="Pepe Uno${rnd} tiene un nuevo combate"`); if (!mailed) await new Promise((r) => setTimeout(r, 250)); }
check("el seguidor recibe un aviso por correo del nuevo combate", mailed);
await fan.goto(B + "/siguiendo");
check("el calendario marca como «no oficial» la velada que indicó un peleador y lo explica", await (async () => { await fan.goto(B + `/veladas?past=todas&q=${encodeURIComponent(`Velada Nuria ${rnd}`)}`); const t = await fan.locator("main").innerText(); return t.includes("no oficial") && t.includes("la indicó un peleador"); })());
await fan.goto(B + "/siguiendo");
check("«Peleadores que sigo» muestra el próximo combate", await fan.locator("body").innerText().then((t) => t.includes(`Velada Futura ${rnd}`)));

// Sello de verificado del gimnasio (exige nota con la evidencia) e historial de cambios
await admin.p.goto(B + "/moderacion");
const gymRow = () => admin.p.locator("tr", { hasText: `Gym Test ${rnd}` });
await gymRow().locator("button:has-text('Verificar')").click();
check("sello sin nota se rechaza", await seen(admin.p.locator("text=necesita una nota")));
await gymRow().locator("input[name=note]").fill("Web y Google Maps comprobadas, llamada al responsable");
await gymRow().locator("button:has-text('Verificar')").click();
await gymRow().locator("button:has-text('Retirar sello')").waitFor(); // la acción ha terminado
await pepe.goto(B + `/gimnasios/gym-test-${rnd}-madrid`);
check("gimnasio muestra el sello de verificado", await pepe.locator("h1 .tag", { hasText: "verificado" }).count() === 1);
check("la nota interna no se expone públicamente", !(await pepe.locator("body").innerText()).includes("Google Maps"));
await admin.p.goto(B + "/moderacion/historial?entity=BOUT");
const hist = await admin.p.locator("body").innerText();
check("historial registra creación y evidencia del combate", hist.includes("creado") && hist.includes("enlace de evidencia cambiado"));
await admin.p.goto(B + "/moderacion/historial?entity=GYM");
check("historial registra el sello del gimnasio", await admin.p.locator("body").innerText().then((t) => t.includes("sello de verificado concedido")));
// Coherencia: un segundo combate a 2 días del primero se guarda, pero queda marcado para el moderador
await pepe.goto(B + "/mi-ficha");
await registrar(pepe, { evento: "Velada Cercana", fecha: "2026-08-03", rivalNombre: "Tercero", rivalApellidos: `Tres${rnd}` });
await pepe.waitForSelector("[role=status]:has-text('Combate registrado')");
await admin.p.goto(B + "/moderacion");
const adminText = await admin.p.locator("body").innerText();
check("la cola de moderación marca los combates muy seguidos", adminText.includes("Menos de 7 días"));
await terminarDiagnosticos();
await browser.close();
if (process.exitCode) console.error("\nE2E: hay comprobaciones fallidas");
