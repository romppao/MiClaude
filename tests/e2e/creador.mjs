// Cuenta del creador (petición del fundador, 8 de octubre de 2026): «un usuario especial, yo como creador de la aplicación, para poder entrar
// desde cualquier sitio con esa clave y gestionar cualquier aspecto». Además de la contraseña, un segundo paso: código de la aplicación de
// códigos o, sin el móvil, un código de emergencia. Requiere el servidor en marcha con CREADOR_CORREO=creador@prueba.test (ver ayudas.mjs).
// También comprueba que la portada común y la de cada disciplina son la misma pantalla con el selector de deporte.
import { createHmac } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { execSync } from "node:child_process";
import { B, rnd, browser, seen, check, btn, newUser, link, sql, terminarDiagnosticos } from "./ayudas.mjs";

const CORREO = process.env.CREADOR_CORREO ?? "creador@prueba.test";
const CLAVE = "contraseña-del-creador-123";
const consulta = (q) => execSync(`psql "${process.env.DATABASE_URL}" -tA`, { input: q }).toString().trim();
const avisoBueno = (p, texto) => p.locator("[role=status]", { hasText: texto });
const avisoMalo = (p, texto) => p.locator("[role=alert]", { hasText: texto });

// Código de 6 cifras (RFC 6238), igual que el de una aplicación de códigos.
const ALF = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const deBase32 = (t) => { let bits = 0, v = 0; const out = []; for (const c of t.replace(/\s/g, "")) { v = ((v << 5) | ALF.indexOf(c)) & 0xffff; bits += 5; if (bits >= 8) { out.push((v >>> (bits - 8)) & 255); bits -= 8; } } return Buffer.from(out); };
const totp = (clave, desplazamiento = 0) => {
  const c = Buffer.alloc(8); c.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + desplazamiento));
  const h = createHmac("sha1", deBase32(clave)).update(c).digest(); const o = h[h.length - 1] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, "0");
};
// Accesibilidad (WCAG 2.2 AA) de la pantalla tal como está ahora, sin recargarla (algunas, como los códigos, solo se ven una vez).
const accesible = async (page, etiqueta) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  check(`accesible: ${etiqueta}${graves.length ? ` (${graves.map((v) => v.id).join(", ")})` : ""}`, graves.length === 0);
};
const entrar = async (p, correo, clave) => {
  await p.goto(B + "/entrar"); await p.fill("[name=email]", correo); await p.fill("[name=password]", clave);
  await btn(p, "Entrar en mi cuenta"); await p.waitForURL((u) => u.pathname !== "/entrar" || u.searchParams.has("problema"));
};

// 0) Una ejecución anterior sobre la misma base pudo dejar la cuenta: se le cambia el correo para empezar de cero.
sql(`update "User" set email='antes-${rnd}-' || email where email='${CORREO}';`);

// 1) Portada: la común y la de cada disciplina son la misma pantalla, con el selector de deporte y la noticia destacada.
sql(`insert into "NewsSource"(id,name,url,kind,disciplines) values ('cr-${rnd}','Fuente creador ${rnd}','https://prueba.invalid/cr-${rnd}','AGREGADOR','{}');
insert into "NewsItem"(id,"sourceId",guid,url,title,publisher,"publishedAt",disciplines) values
('crk-${rnd}','cr-${rnd}','k','https://prueba.invalid/k1-${rnd}','Destacada de K-1 ${rnd}','Diario K',now()+interval '1 day','{K1}');`);
const visita = await (await browser.newContext()).newPage();
await visita.goto(B + "/");
check("el visitante ve la actualidad con la noticia más reciente en grande", await seen(visita.locator("a.noticia-destacada", { hasText: `Destacada de K-1 ${rnd}` })));
const fan = await newUser("Portadacr");
await fan.p.goto(B + "/");
const selector = fan.p.getByRole("navigation", { name: "Elige un deporte" });
check("la portada común abre con el selector de deporte en «Todos»", await seen(selector) && (await selector.locator("a[aria-current=page]").innerText()).trim() === "Todos");
check("cada deporte del selector lleva su dibujo", await selector.locator("a svg").count() === 7);
check("y la noticia más reciente destacada en grande", await seen(fan.p.locator("a.noticia-destacada", { hasText: `Destacada de K-1 ${rnd}` })));
await selector.getByRole("link", { name: "K-1" }).click(); await fan.p.waitForURL("**/disciplinas/k-1");
check("al elegir un deporte se abre su portada, con el mismo selector marcando ese deporte", await seen(fan.p.getByRole("heading", { name: "K-1", level: 1 })) && (await fan.p.getByRole("navigation", { name: "Elige un deporte" }).locator("a[aria-current=page]").innerText()).trim() === "K-1");
check("con la actualidad solo de ese deporte", await seen(fan.p.getByRole("heading", { name: "Actualidad de K-1" })) && await seen(fan.p.locator("a.noticia-destacada", { hasText: `Destacada de K-1 ${rnd}` })));
await fan.p.goto(B + "/disciplinas/mma");
check("y otra disciplina no muestra esa noticia", !(await fan.p.getByText(`Destacada de K-1 ${rnd}`).count()));
await fan.p.getByRole("navigation", { name: "Elige un deporte" }).getByRole("link", { name: "Todos" }).click(); await fan.p.waitForURL(B + "/");
check("«Todos» vuelve a la portada común", await seen(fan.p.getByRole("heading", { name: /Hola/ })));
check("una cuenta normal no ve «Administración»", (await (await fan.p.goto(B + "/moderacion/usuarios")).url()).includes("problema=solo_creador") && await seen(avisoMalo(fan.p, "solo para la cuenta del creador")));

// 2) El creador se registra con su correo. Antes de confirmarlo, no es el creador (cualquiera podría registrarse con ese correo).
const cr = await (await browser.newContext()).newPage();
await cr.goto(B + "/registro?tipo=usuario");
await cr.fill("[name=name]", "Fundador Prueba"); await cr.fill("[name=email]", CORREO); await cr.fill("[name=password]", CLAVE);
await btn(cr, "Crear mi cuenta"); await cr.waitForURL((u) => u.pathname.startsWith("/registro/"));
await cr.getByRole("link", { name: "Lo haré después" }).click(); await cr.waitForURL("**/verificar");
check("sin el correo confirmado no hay Administración", (await (await cr.goto(B + "/moderacion/usuarios")).url()).includes("problema=solo_creador"));
await cr.goto(B + link(CORREO)); await btn(cr, "Confirmar");
check("al confirmar el correo, la sesión que ya tenía abierta no hereda los poderes: se le pide entrar", await seen(cr.getByRole("heading", { name: "Tu correo electrónico está confirmado" })));
await cr.goto(B + "/mi-cuenta");
check("y sin entrar no tiene acceso a nada de su cuenta", cr.url().includes("/entrar"));

// 3) Primera entrada: prepara la aplicación de códigos y recibe los códigos de emergencia.
await entrar(cr, CORREO, CLAVE);
check("con la contraseña correcta, pide el segundo paso", cr.url().includes("/entrar/segundo-paso") && await seen(cr.getByRole("heading", { name: "Protege la cuenta del creador" })));
check("y sin él todavía no está dentro", (await (await cr.goto(B + "/moderacion")).url()).includes("/entrar"));
await cr.goto(B + "/entrar/segundo-paso");
const clave = (await cr.locator(".clave-app").innerText()).replace(/\s/g, "");
await accesible(cr, "preparar el segundo paso");
check("enseña la clave para la aplicación y el enlace que la abre en el móvil", /^[A-Z2-7]{32}$/.test(clave) && (await cr.getByRole("link", { name: /Añadir Ring España/ }).getAttribute("href")).startsWith("otpauth://totp/"));
await cr.fill("[name=codigo]", "000000"); await btn(cr, "Activar y ver mis códigos");
check("un código equivocado se explica", await seen(avisoMalo(cr, "Ese código no es válido")));
await cr.fill("[name=codigo]", totp(clave)); await btn(cr, "Activar y ver mis códigos");
const lista = cr.locator("ol.codigos-emergencia li");
check("con el código bueno, entrega diez códigos de emergencia una sola vez", await seen(cr.getByRole("heading", { name: "Tus códigos de emergencia" })) && await lista.count() === 10);
const codigos = (await lista.allInnerTexts()).map((t) => t.trim());
await accesible(cr, "códigos de emergencia");
check("en la base solo se guardan sus huellas, no los códigos", !consulta(`select array_to_string("recoveryCodes", ',') from "User" where email='${CORREO}'`).includes(codigos[0]));
await cr.getByRole("link", { name: "Ya los he guardado: continuar" }).click(); await cr.waitForURL("**/moderacion/usuarios");
check("ya dentro: Administración", await seen(cr.getByRole("heading", { name: "Administración", level: 1 })));
await accesible(cr, "Administración");
check("es moderador, con todo lo de moderación", consulta(`select role from "User" where email='${CORREO}'`) === "ADMIN" && (await (await cr.goto(B + "/moderacion")).url()).endsWith("/moderacion") && await seen(cr.getByRole("link", { name: "Administración: cuentas y moderadores" })));
await cr.getByRole("button", { name: "Menú" }).click();
check("y su menú lleva «Administración»", await seen(cr.locator("#navigation-menu").getByRole("link", { name: "Administración" })));
await cr.getByRole("button", { name: "Cerrar menú" }).click();

// 4) Gestiona cuentas: busca, nombra moderador, quita y cierra sesiones. Todo queda en el historial.
await cr.goto(B + "/moderacion/usuarios");
const buscar = (p) => p.getByLabel("Buscar por nombre o correo electrónico");
await buscar(cr).fill(fan.email); await cr.getByRole("button", { name: "Buscar cuentas" }).click();
await cr.waitForURL(/q=/);
const ficha = cr.locator("li.tarjeta", { hasText: fan.email });
check("encuentra cualquier cuenta por su correo", await seen(ficha) && await cr.locator("li.tarjeta").count() === 1);
await ficha.locator("select[name=role]").selectOption("ADMIN"); await ficha.getByRole("button", { name: /Cambiar el tipo de cuenta/ }).click();
check("la nombra moderadora", await seen(avisoBueno(cr, "Tipo de cuenta cambiado")) && consulta(`select role from "User" where email='${fan.email}'`) === "ADMIN");
check("y la búsqueda se conserva", new URL(cr.url()).searchParams.get("q") === fan.email);
await fan.p.goto(B + "/moderacion");
check("la persona ya entra en Moderación", await seen(fan.p.getByRole("heading", { name: "Moderación", level: 1 })));
await cr.locator("li.tarjeta", { hasText: fan.email }).locator("select[name=role]").selectOption("FAN");
await cr.locator("li.tarjeta", { hasText: fan.email }).getByRole("button", { name: /Cambiar el tipo de cuenta/ }).click();
check("y le quita la moderación", await seen(avisoBueno(cr, "Tipo de cuenta cambiado")) && consulta(`select role from "User" where email='${fan.email}'`) === "FAN");
await cr.locator("li.tarjeta", { hasText: fan.email }).getByRole("button", { name: /Cerrar todas las sesiones/ }).click();
check("cierra las sesiones de otra cuenta", await seen(avisoBueno(cr, "Se han cerrado todas las sesiones")) && consulta(`select count(*) from "Session" s join "User" u on u.id=s."userId" where u.email='${fan.email}'`) === "0");
await fan.p.goto(B + "/mi-cuenta");
check("y esa persona tiene que volver a entrar", fan.p.url().includes("/entrar"));
check("los cambios quedan en el historial", Number(consulta(`select count(*) from "AuditLog" where entity='USER' and action in ('TIPO_CAMBIADO','SESIONES_CERRADAS') and "entityId"=(select id from "User" where email='${fan.email}')`)) === 3);
check("no puede cambiar su propia cuenta desde aquí", await (async () => { await buscar(cr).fill(CORREO); await cr.getByRole("button", { name: "Buscar cuentas" }).click(); await cr.waitForURL(/q=/); return await seen(cr.getByText("Cuenta del creador: siempre es moderador.")); })());

// 5) Volver a entrar desde «otro aparato»: con la aplicación de códigos y, sin el móvil, con un código de emergencia.
const otro = await (await browser.newContext()).newPage();
await entrar(otro, CORREO, CLAVE);
check("en otro aparato pide el segundo paso", await seen(otro.getByRole("heading", { name: "Segundo paso para entrar" })));
await accesible(otro, "segundo paso para entrar");
await otro.fill("[name=codigo]", "123456"); await btn(otro, "Entrar en la cuenta del creador");
check("un código equivocado no deja entrar", await seen(avisoMalo(otro, "Ese código no es válido")) && (await (await otro.goto(B + "/moderacion")).url()).includes("/entrar"));
await otro.goto(B + "/entrar/segundo-paso");
await otro.fill("[name=codigo]", codigos[0].toLowerCase()); await btn(otro, "Entrar en la cuenta del creador");
check("sin el móvil, entra con un código de emergencia", await seen(otro.getByRole("heading", { name: "Administración", level: 1 })) && await seen(avisoBueno(otro, "Has entrado con la cuenta del creador")));
check("ese código queda gastado", consulta(`select cardinality("recoveryCodes") from "User" where email='${CORREO}'`) === "9");
const tercero = await (await browser.newContext()).newPage();
await entrar(tercero, CORREO, CLAVE);
await tercero.fill("[name=codigo]", codigos[0]); await btn(tercero, "Entrar en la cuenta del creador");
check("un código de emergencia no sirve dos veces", await seen(avisoMalo(tercero, "Ese código no es válido")));
await tercero.fill("[name=codigo]", totp(clave, 1)); await btn(tercero, "Entrar en la cuenta del creador");
check("con la aplicación de códigos entra", await seen(tercero.getByRole("heading", { name: "Administración", level: 1 })));
check("registra sus entradas para que pueda revisarlas", await seen(tercero.getByText("con un código de emergencia").first()) && await seen(tercero.getByText("con la aplicación de códigos").first()));

// 6) Códigos nuevos: piden un código de la aplicación (tener la sesión abierta no basta) y anulan los anteriores.
await tercero.locator("#mi-acceso ~ form [name=codigo]").fill("000000"); await tercero.getByRole("button", { name: "Crear códigos de emergencia nuevos" }).click();
check("sin un código bueno no se crean", await seen(avisoMalo(tercero, "Ese código no es válido")));
// Un código de la aplicación no vale dos veces: para no esperar 30 segundos al siguiente, se simula que ha pasado el tiempo.
sql(`update "User" set "totpLastStep"=null where email='${CORREO}';`);
await tercero.locator("#mi-acceso ~ form [name=codigo]").fill(totp(clave)); await tercero.getByRole("button", { name: "Crear códigos de emergencia nuevos" }).click();
check("con él, diez códigos nuevos", await seen(tercero.getByRole("heading", { name: "Tus códigos de emergencia" })) && await tercero.locator("ol.codigos-emergencia li").count() === 10);
const cuarto = await (await browser.newContext()).newPage();
await entrar(cuarto, CORREO, CLAVE);
await cuarto.fill("[name=codigo]", codigos[1]); await btn(cuarto, "Entrar en la cuenta del creador");
check("los códigos anteriores ya no sirven", await seen(avisoMalo(cuarto, "Ese código no es válido")));

// 7) Una contraseña equivocada no llega al segundo paso.
const malo = await (await browser.newContext()).newPage();
await entrar(malo, CORREO, "no-es-la-clave");
check("con la contraseña equivocada no pasa del primer paso", malo.url().includes("/entrar") && !malo.url().includes("segundo-paso") && await seen(avisoMalo(malo, "no son correctos")));

await terminarDiagnosticos();
await browser.close();
