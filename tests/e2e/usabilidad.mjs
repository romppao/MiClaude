// Comprobaciones de usabilidad y accesibilidad que axe no mide: navegación corta, lo escrito no se pierde, tamaños, contraste de controles,
// enlaces reconocibles, avisos para lectores de pantalla y respuestas a las solicitudes. Requiere el servidor en marcha (ver ayudas.mjs).
import { datosDeAlta, B, rnd, browser, seen, check, btn, link, hoyMadrid, registrar, newUser, hacerAdmin, solicitarOrganizador, esperarCorreo, aprobarOrganizador, terminarDiagnosticos } from "./ayudas.mjs";

const cuerpo = (p) => p.locator("body").innerText();
const nueva = async () => (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const malo = (p, t) => p.locator("[role=alert]", { hasText: t });
const bueno = (p, t) => p.locator("[role=status]", { hasText: t });

/** Relación de contraste WCAG entre dos colores «rgb(r, g, b)». */
const luz = (c) => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const [x, y] = [luz(a), luz(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const visitante = await nueva();

// 1) Navegación corta y clara
await visitante.goto(B + "/");
check("la navegación principal tiene 5 elementos como máximo", await visitante.locator("nav[aria-label=Principal] a").count() <= 5);
check("la portada ofrece un botón claro para crear la cuenta y otro para ver cómo funciona", await visitante.locator("main a.btn", { hasText: "Crear mi cuenta" }).count() === 1 && await visitante.locator("main a.btn", { hasText: "Ver cómo funciona" }).count() === 1);
check("el buscador de la portada tiene etiqueta visible", await visitante.locator("main label", { hasText: "Busca un peleador" }).count() === 1);
check("el buscador de la cabecera tiene su botón visible", await visitante.locator("header form[role=search] button", { hasText: "Buscar" }).count() === 1);
const aficionada = await newUser("Usabilidad", "FAN");
await aficionada.p.goto(B + "/");
const cab = await aficionada.p.locator("header").innerText();
check("la cabecera de una persona con sesión es corta: «Mi cuenta» y «Salir», sin «Peleadores que sigo» ni su nombre como enlace", cab.includes("Mi cuenta") && cab.includes("Salir") && !cab.includes("Mis peleadores") && !cab.includes("Usabilidad"));
check("a quien acaba de registrarse no se le muestra el botón de crear cuenta", await aficionada.p.locator("main a.btn", { hasText: "Crear mi cuenta" }).count() === 0);
await aficionada.p.goto(B + "/mi-cuenta");
check("«Mi cuenta» reúne los accesos directos (peleadores que sigo, organizar veladas) y los avisos enviados", await seen(aficionada.p.locator("main a", { hasText: "Peleadores que sigo" })) && await aficionada.p.locator("main a", { hasText: "Organizar veladas" }).count() === 1 && (await cuerpo(aficionada.p)).includes("Avisos de error que he enviado"));

// 2) Lo escrito no se pierde tras un error (nunca la contraseña)
await visitante.goto(B + "/registro?tipo=usuario");
await visitante.evaluate(() => document.querySelectorAll("input[minlength]").forEach((i) => i.removeAttribute("minlength")));
await visitante.fill("[name=name]", "Memoria Prueba"); await visitante.fill("[name=email]", `memoria${rnd}@test.es`); await visitante.fill("[name=password]", "corta");
await btn(visitante, "Crear mi cuenta");
check("el error de la contraseña corta se explica", await seen(malo(visitante, "8 caracteres")));
check("y el nombre y el correo escritos siguen en su sitio", await visitante.waitForFunction((v) => document.querySelector("[name=name]")?.value === v[0] && document.querySelector("[name=email]")?.value === v[1], ["Memoria Prueba", `memoria${rnd}@test.es`], { timeout: 4000 }).then(() => true, () => false));
check("pero la contraseña nunca se conserva", await visitante.inputValue("[name=password]") === "");
// El mismo error dos veces seguidas (la dirección no cambia): lo escrito tampoco se pierde la segunda vez. En el acceso, React vacía el formulario
// al terminar la acción y Next.js lo vuelve a montar con la respuesta, así que se espera a que todo haya terminado antes de mirar.
const repetido = await nueva();
await repetido.goto(B + "/entrar");
await repetido.fill("[name=email]", `nadie${rnd}@test.es`); await repetido.fill("[name=password]", "incorrecta-1");
await btn(repetido, "Entrar en mi cuenta");
check("al equivocarse en el acceso, el correo escrito se conserva", await repetido.waitForFunction((v) => document.querySelector("[name=email]")?.value === v && location.search.includes("login_incorrecto"), `nadie${rnd}@test.es`, { timeout: 8000 }).then(() => true, () => false));
// Lo que la persona borra a propósito después del error no se vuelve a rellenar aunque la pantalla cambie (restaurar solo devuelve lo que ella no ha tocado)
await repetido.fill("[name=email]", "");
await repetido.evaluate(() => document.body.appendChild(document.createElement("div")));
await repetido.waitForTimeout(600);
check("lo que se borra a propósito tras un error no se vuelve a rellenar", await repetido.inputValue("[name=email]") === "");
await repetido.fill("[name=email]", `nadie${rnd}@test.es`);
await repetido.fill("[name=password]", "incorrecta-2");
await btn(repetido, "Entrar en mi cuenta");
await repetido.waitForTimeout(3000); // la acción termina, se vacía el formulario y Next.js lo vuelve a montar
check("y si el mismo error se repite (la dirección no cambia), el correo sigue en su sitio", await repetido.inputValue("[name=email]") === `nadie${rnd}@test.es` && await repetido.inputValue("[name=password]") === "");
await visitante.fill("[name=password]", "contraseña-larga-1");
await btn(visitante, "Crear mi cuenta");
await visitante.waitForURL("**/verificar");
await visitante.goto(B + "/registro?tipo=usuario");
check("una pantalla nueva no hereda lo escrito de otro envío", await visitante.inputValue("[name=name]") === "");

// 3) Los avisos están en regiones permanentes para lectores de pantalla
await visitante.goto(B + "/entrar");
check("existen las regiones permanentes de aviso (educada para éxitos, asertiva para errores)", await visitante.locator("[role=status][aria-live=polite]").count() >= 1 && await visitante.locator("[role=alert][aria-live=assertive]").count() >= 1);

// 4) Tamaños, enlaces y contraste de los controles
await visitante.goto(B + "/registro?tipo=usuario");
const medidas = await visitante.evaluate(() => {
  const alto = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null).map((e) => Math.round(e.getBoundingClientRect().height));
  const px = (sel) => [...document.querySelectorAll(sel)].map((e) => parseFloat(getComputedStyle(e).fontSize));
  const campo = document.querySelector("main input[name=name]");
  const estilo = getComputedStyle(campo);
  return {
    altoCabecera: alto("header a, header button, header input"), altoPie: alto("footer a"), altoControles: alto("main button, main input, main select"),
    etiquetas: px(".field > span:not(.hint)"), ayudas: px(".field .hint"), bordeCampo: estilo.borderTopColor, fondo: getComputedStyle(document.body).backgroundColor, relleno: estilo.backgroundColor,
    enlaceTexto: (() => { const a = document.querySelector("main p a"); return a ? getComputedStyle(a).textDecorationLine : "sin enlace"; })(),
  };
});
check("los enlaces y controles de la cabecera y del pie miden 44 px o más", medidas.altoCabecera.every((h) => h >= 44) && medidas.altoPie.every((h) => h >= 44));
check("los botones y campos del formulario miden 44 px o más", medidas.altoControles.length > 0 && medidas.altoControles.every((h) => h >= 44));
check("las etiquetas y las ayudas de los campos tienen 15 px o más (16 px las etiquetas)", medidas.etiquetas.every((f) => f >= 16) && medidas.ayudas.every((f) => f >= 15));
check("el borde de los campos se distingue del fondo (contraste de 3:1 como mínimo)", contraste(medidas.bordeCampo, medidas.fondo) >= 3);
check("los enlaces dentro del texto van subrayados", medidas.enlaceTexto.includes("underline"));
const etiq = await visitante.evaluate(() => { const t = document.createElement("span"); t.className = "tag AMATEUR"; t.textContent = "Amateur"; document.body.appendChild(t); const e = getComputedStyle(t); return { c: e.color, f: e.backgroundColor, px: parseFloat(e.fontSize) }; });
check("la etiqueta «Amateur» tiene texto de 16 px y contraste de 4,5:1 como mínimo", etiq.px >= 16 && contraste(etiq.c, etiq.f) >= 4.5);

// 5) Un solo elemento interactivo por acción (nunca un botón dentro de un enlace)
const noEncontrada = await nueva();
await noEncontrada.goto(B + "/pagina-que-no-existe");
check("la pantalla «no encontrada» ofrece enlaces con aspecto de botón, sin botones dentro de enlaces", await noEncontrada.locator("a button, button a").count() === 0 && await noEncontrada.locator("main a.btn", { hasText: "Ir al inicio" }).count() === 1);

// 6) Los filtros tienen etiqueta visible y un botón claro
await visitante.goto(B + "/peleadores");
const filtros = await visitante.evaluate(() => [...document.querySelectorAll("main form[role=search] select, main form[role=search] input[name=q]")].map((c) => !!c.closest("label")?.querySelector("span")?.textContent?.trim()));
check("todos los filtros del listado tienen etiqueta visible", filtros.length >= 5 && filtros.every(Boolean));
check("sin filtros aplicados no hay un «Quitar todos los filtros» que no haga nada, solo «Aplicar filtros»", await visitante.locator("main button", { hasText: "Aplicar filtros" }).count() === 1 && await visitante.locator("main a", { hasText: "Quitar todos los filtros" }).count() === 0);
await visitante.goto(B + "/peleadores?disciplina=BOXEO");
check("con filtros aplicados sí aparece y lleva al listado completo", await visitante.locator("main a", { hasText: "Quitar todos los filtros" }).count() === 1 && (await visitante.locator("main a", { hasText: "Quitar todos los filtros" }).getAttribute("href")) === "/peleadores");

// 7) Solicitudes: el motivo del rechazo es obligatorio, se muestra a quien lo recibe y se le responde por correo
const solicitante = await newUser("Solicitante", "FAN");
const nombreOrg = `Club Respuesta ${rnd}`;
await solicitarOrganizador(solicitante.p, nombreOrg);
const mod = await newUser("Moderadorausa", "FAN"); hacerAdmin(mod.email);
await mod.p.goto(B + "/moderacion");
const fila = () => mod.p.locator("tr", { hasText: nombreOrg });
await fila().locator("button:has-text('Rechazar')").click();
check("rechazar sin escribir el motivo no se permite y se explica por qué", await seen(malo(mod.p, "Escribe el motivo")));
await fila().locator("input[name=note]").fill("No encontramos la web del club");
await fila().locator("button:has-text('Rechazar')").click();
await fila().waitFor({ state: "detached" });
await solicitante.p.goto(B + "/organizador");
check("quien recibe el rechazo ve el motivo en la propia página", await seen(solicitante.p.locator(".notice-bad", { hasText: "Motivo: No encontramos la web del club" })));
check("y recibe un correo con el motivo", !!(await esperarCorreo(solicitante.email, "Motivo: No encontramos la web del club")));
await solicitante.p.fill("[name=message]", "Nueva web del club y su perfil público");
await btn(solicitante.p, "Solicitar");
await bueno(solicitante.p, "Solicitud enviada").waitFor();
await mod.p.goto(B + "/moderacion");
await fila().locator("button:has-text('Aprobar')").click();
check("aprobar a un organizador sin anotar la evidencia comprobada tampoco se permite", await seen(malo(mod.p, "anota qué has comprobado")));
await aprobarOrganizador(mod.p, nombreOrg);
check("al aprobar, se avisa por correo de que ya puede publicar veladas", !!(await esperarCorreo(solicitante.email, "Ya puedes publicar veladas en Ring España")));
await solicitante.p.goto(B + "/");
check("y la cabecera de quien organiza muestra «Mis veladas»", await seen(solicitante.p.locator("header a", { hasText: "Mis veladas" })));

// 7b) Un doble clic no envía dos veces (dos combates, un error de «duplicado» tras haberlo hecho bien)
const doble = await nueva();
await doble.goto(B + "/registro?tipo=usuario");
await doble.fill("[name=name]", "Doble Clic"); await doble.fill("[name=email]", `dobleclic${rnd}@test.es`); await doble.fill("[name=password]", "contraseña-larga-1");
await doble.dblclick('main button:has-text("Crear mi cuenta")');
check("un doble clic en «Crear mi cuenta» lleva a «Confirma tu correo», sin un error de «ya hay una cuenta»", await doble.waitForURL("**/verificar", { timeout: 8000 }).then(() => true, () => false));
const peleadorDoble = await newUser("Dobleficha", "FIGHTER");
await peleadorDoble.p.goto(B + "/mi-ficha");
await peleadorDoble.p.fill("[name=firstName]", "Doble"); await peleadorDoble.p.fill("[name=lastName]", `Ficha${rnd}`);
await datosDeAlta(peleadorDoble.p); await btn(peleadorDoble.p, "Crear mi ficha");
await peleadorDoble.p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
await registrar(peleadorDoble.p, { evento: `Velada Doble ${rnd}`, fecha: hoyMadrid, rivalNombre: "Rival", rivalApellidos: `Doble${rnd}`, dobleClic: true });
check("un doble clic en «Registrar este combate» registra un solo combate y lo confirma (no pide elegir rival ni duplica)", await seen(peleadorDoble.p.locator("[role=status]", { hasText: "Combate registrado" })) && !peleadorDoble.p.url().includes("/mi-ficha/rival") && await seen(peleadorDoble.p.locator("main table tbody tr", { hasText: `Velada Doble ${rnd}` }).first()) && await peleadorDoble.p.locator("main table tbody tr", { hasText: `Velada Doble ${rnd}` }).count() === 1);

// 8) Volver a donde se estaba: sin sesión nunca hay redirecciones mudas, y quien se registra desde «Entra para…» vuelve a la ficha
const nuevoVisitante = await nueva();
await nuevoVisitante.goto(B + "/peleadores");
const rutaFicha = await nuevoVisitante.locator("main a[href^='/peleadores/']").first().getAttribute("href");
await nuevoVisitante.goto(B + rutaFicha);
await nuevoVisitante.locator("a", { hasText: "Entra para seguir a este peleador" }).click();
check("«Entra para seguir» lleva a «Entrar» explicando por qué y a dónde se volverá", await seen(nuevoVisitante.locator("[role=note]", { hasText: "Al terminar volverás a la página donde estabas" })));
await nuevoVisitante.locator("main a.btn", { hasText: "Crear mi cuenta" }).click();
check("junto al formulario de acceso hay un botón claro para crear la cuenta, y conserva el destino", await seen(nuevoVisitante.locator("[role=note]", { hasText: "podrás volver a la página donde estabas" })) && nuevoVisitante.url().includes("next="));
check("el registro ofrece tres paneles claros, sin el desplegable antiguo", await nuevoVisitante.locator("a.panel-registro").count() === 3 && await nuevoVisitante.locator("select[name=role]").count() === 0);
await nuevoVisitante.locator("a.panel-registro", { hasText: "Usuario" }).click();
check("el panel «Usuario» conserva el destino y pide solo nombre, correo y contraseña", await seen(nuevoVisitante.locator("[name=password]")) && nuevoVisitante.url().includes("next=") && await nuevoVisitante.locator("main form input:not([type=hidden])").count() === 3);
const correoVolver = `volver${rnd}@test.es`;
await nuevoVisitante.fill("[name=name]", "Persona Volver"); await nuevoVisitante.fill("[name=email]", correoVolver); await nuevoVisitante.fill("[name=password]", "contraseña123");
await btn(nuevoVisitante, "Crear mi cuenta"); await nuevoVisitante.waitForURL("**/verificar");
const enlaceVolver = link(correoVolver);
const otroAparato = await nueva(); // el enlace se abre en otro aparato, sin sesión
await otroAparato.goto(B + enlaceVolver); await btn(otroAparato, "Confirmar mi correo");
check("quien confirma el correo en otro aparato (sin sesión) ve que está confirmado y se le invita a entrar, sin contradicciones", await seen(otroAparato.locator("h1", { hasText: "Tu correo electrónico está confirmado" })) && await otroAparato.locator("main button", { hasText: "Entrar en mi cuenta" }).count() === 1);
await nuevoVisitante.goto(B + "/verificar");
check("en el navegador donde se registró, al confirmarse se ofrece «Volver a lo que estabas haciendo»", await seen(nuevoVisitante.locator("main button", { hasText: "Volver a lo que estabas haciendo" })));
await btn(nuevoVisitante, "Volver a lo que estabas haciendo");
await nuevoVisitante.waitForURL("**" + rutaFicha);
check("y ese botón lleva a la ficha del peleador", nuevoVisitante.url().endsWith(rutaFicha));
const sinSesion = await nueva();
for (const ruta of ["/mi-cuenta", "/mi-ficha", "/siguiendo", "/mi-cuenta/eliminar", "/moderacion", "/moderacion/historial"]) {
  await sinSesion.goto(B + ruta);
  check(`${ruta} sin sesión lleva a «Entrar» explicando qué ha pasado y recordando a dónde volver`, sinSesion.url().includes("/entrar") && sinSesion.url().includes("next=" + encodeURIComponent(ruta)) && await seen(sinSesion.locator("[role=status],[role=alert]", { hasText: "Entra en tu cuenta para continuar" })));
}
await sinSesion.goto(B + "/mi-cuenta");
await sinSesion.fill("[name=email]", correoVolver); await sinSesion.fill("[name=password]", "contraseña123"); await btn(sinSesion, "Entrar en mi cuenta");
await sinSesion.waitForURL("**/mi-cuenta");
check("tras entrar se vuelve a la pantalla que se pedía", sinSesion.url().endsWith("/mi-cuenta"));

// 8) Móvil: ninguna pantalla se sale del ancho a 360 px (WCAG 1.4.10, reflujo)
const movil = await (await browser.newContext({ viewport: { width: 360, height: 740 } })).newPage();
const conSesion = async (rol, ruta) => { const u = await newUser(`Movil${rol}`, rol === "FIGHTER" ? "FIGHTER" : "FAN"); if (rol === "ADMIN") hacerAdmin(u.email); await u.p.setViewportSize({ width: 360, height: 740 }); await u.p.goto(B + ruta); return u.p; };
const anchoDesbordado = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const fuera = [];
for (const ruta of ["/", "/peleadores", "/veladas", "/ranking", "/gimnasios", "/buscar?q=ana", "/registro", "/entrar", "/ayuda", "/privacidad", "/organizador"]) {
  await movil.goto(B + ruta);
  const d = await anchoDesbordado(movil); if (d > 1) fuera.push(`${ruta} (+${d}px)`);
}
for (const [rol, rutas] of [["FIGHTER", ["/mi-ficha", "/mi-cuenta"]], ["ADMIN", ["/moderacion", "/moderacion/historial"]]]) {
  const p = await conSesion(rol, rutas[0]);
  for (const ruta of rutas) { await p.goto(B + ruta); await p.waitForLoadState("load"); const d = await anchoDesbordado(p); if (d > 1) fuera.push(`${ruta} (+${d}px)`); }
}
check(`ninguna pantalla se sale del ancho en un móvil de 360 px${fuera.length ? ": " + fuera.join(", ") : ""}`, fuera.length === 0);

// Fichas de peleador y de velada con combates (antes la tabla se salía de la pantalla y «Dar aura» quedaba fuera de la vista)
const peleadorMovil = await newUser("Movilficha", "FIGHTER");
await peleadorMovil.p.goto(B + "/mi-ficha");
await peleadorMovil.p.fill("[name=firstName]", "Movil"); await peleadorMovil.p.fill("[name=lastName]", `Ficha${rnd}`);
await datosDeAlta(peleadorMovil.p); await btn(peleadorMovil.p, "Crear mi ficha");
await peleadorMovil.p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
await registrar(peleadorMovil.p, { evento: `Velada Movil ${rnd}`, fecha: hoyMadrid, rivalNombre: "Rival", rivalApellidos: `Movil${rnd}` });
await peleadorMovil.p.locator("[role=status]", { hasText: "Combate registrado" }).waitFor();
await movil.goto(B + `/peleadores/movil-ficha${rnd}`);
const accionFicha = movil.locator("a", { hasText: "Entra para dar aura" }).first();
check("en el móvil, la ficha de un peleador no se sale del ancho y «Entra para dar aura» queda a la vista", await seen(accionFicha) && await anchoDesbordado(movil) <= 1 && await accionFicha.evaluate((a) => { const r = a.getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth + 1 && r.width > 100; }));
const rutaVelada = await movil.locator("a[href^='/veladas/']").first().getAttribute("href");
await movil.goto(B + rutaVelada);
check("en el móvil, la ficha de la velada tampoco se sale del ancho", await seen(movil.locator("h1")) && await anchoDesbordado(movil) <= 1);
const textoVelada = await cuerpo(movil);
check("en la velada, un resultado declarado se muestra identificado y no exige confirmación", textoVelada.includes("declarado · confirmación opcional") && textoVelada.includes("Gana Movil"));
check("y una velada que no ha publicado un organizador lo explica con texto visible (no solo en un aviso emergente)", textoVelada.includes("no la ha publicado un organizador"));


await terminarDiagnosticos();
await browser.close();
if (process.exitCode) console.error("\nUsabilidad: hay comprobaciones fallidas");
