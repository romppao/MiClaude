// Pruebas de acceso y correo: límite de intentos, recuperación de contraseña, cuentas sin verificar,
// enlaces de un solo uso y mensajes. Requiere el servidor en marcha (ver ayudas.mjs).
import { B, rnd, browser, seen, check, btn, newUser, esperarEnlace, hayCorreoPara, terminarDiagnosticos } from "./ayudas.mjs";

const cuerpo = (p) => p.locator("body").innerText();
const nueva = async () => (await browser.newContext()).newPage();
const avisoMalo = (p, texto) => p.locator("[role=alert]", { hasText: texto });
const avisoBueno = (p, texto) => p.locator("[role=status]", { hasText: texto });
async function entrar(p, email, password) {
  await p.goto(B + "/entrar");
  await p.fill("[name=email]", email); await p.fill("[name=password]", password);
  await btn(p, "Entrar en mi cuenta");
}

// 1) Registro: datos incorrectos y correo ya usado, con mensajes que explican qué hacer
const rep = await newUser("Repetida", "FAN");
const anon = await nueva();
await anon.goto(B + "/registro");
await anon.fill("[name=name]", "Otra persona"); await anon.fill("[name=email]", `repetida${rnd}@test.es`); await anon.fill("[name=password]", "contraseña123");
await btn(anon, "Crear mi cuenta");
check("un correo ya registrado se explica y ofrece entrar o recuperar la contraseña", await seen(avisoMalo(anon, "Ya hay una cuenta con ese correo")) && await seen(anon.locator("main a:has-text('Elige una nueva')")));
await anon.fill("[name=name]", "Otra persona"); await anon.fill("[name=email]", "a@b.es, c@d.es"); await anon.fill("[name=password]", "contraseña123");
await anon.evaluate(() => document.querySelector("[name=email]").setAttribute("type", "text")); // se salta la comprobación del navegador para probar la del servidor
await btn(anon, "Crear mi cuenta");
check("varias direcciones en el correo se rechazan con un mensaje", await seen(avisoMalo(anon, "correo electrónico")));

// 2) Contraseña incorrecta: mensaje claro; tras varios fallos seguidos, bloqueo temporal aunque la contraseña sea la buena
const bloq = await newUser("Bloqueada", "FAN");
const intento = await nueva();
await entrar(intento, `bloqueada${rnd}@test.es`, "esta-no-es");
check("una contraseña incorrecta da un mensaje claro y amable", await seen(avisoMalo(intento, "no son correctos")));
for (let i = 1; i < 8; i++) { await entrar(intento, `bloqueada${rnd}@test.es`, `tampoco-${i}`); await avisoMalo(intento, "no son correctos").waitFor(); }
await entrar(intento, `bloqueada${rnd}@test.es`, "contraseña123");
check("tras 8 fallos seguidos se bloquea el acceso, incluso con la contraseña correcta, y se explica", await seen(avisoMalo(intento, "demasiados intentos")));
await entrar(intento, `noexiste${rnd}@test.es`, "cualquiera1");
check("con un correo que no existe la respuesta es la misma que con una contraseña equivocada", await seen(avisoMalo(intento, "no son correctos")));

// 2b) El bloqueo es por correo: otra cuenta sigue entrando con normalidad
const otra = await nueva();
await entrar(otra, `repetida${rnd}@test.es`, "contraseña123");
check("el bloqueo de una cuenta no afecta a las demás", await seen(otra.locator("header >> text=Salir")));

// 3) Recuperación de contraseña
const olvi = await newUser("Olvidadiza", "FAN");
const mail = `olvidadiza${rnd}@test.es`;
const rec = await nueva();
await rec.goto(B + "/recuperar");
await rec.fill("[name=email]", mail); await btn(rec, "Enviar el enlace");
check("se avisa de que se ha enviado el enlace, sin más detalles", await seen(avisoBueno(rec, "te hemos enviado un enlace")));
const enlace = await esperarEnlace(mail, "/recuperar/nueva");
check("llega un correo con un enlace de recuperación", !!enlace);
await rec.goto(B + "/recuperar");
await rec.fill("[name=email]", `nadie${rnd}@test.es`); await btn(rec, "Enviar el enlace");
check("con un correo sin cuenta se responde exactamente igual", await seen(avisoBueno(rec, "te hemos enviado un enlace")));
check("y no se envía ningún correo a esa dirección", !(await hayCorreoPara(`nadie${rnd}@test.es`)));

await rec.goto(B + enlace);
await rec.fill("[name=password]", "nueva-clave-123"); await rec.fill("[name=repeat]", "distinta-123");
await btn(rec, "Guardar mi contraseña nueva");
check("dos contraseñas distintas se rechazan sin gastar el enlace", await seen(avisoMalo(rec, "no coinciden")) && await seen(rec.locator("[name=repeat]")));
await rec.evaluate(() => document.querySelectorAll("input[minlength]").forEach((i) => i.removeAttribute("minlength"))); // se salta la comprobación del navegador para probar la del servidor
await rec.fill("[name=password]", "corta"); await rec.fill("[name=repeat]", "corta");
await btn(rec, "Guardar mi contraseña nueva");
check("una contraseña demasiado corta se rechaza con un mensaje", await seen(avisoMalo(rec, "8 caracteres")));
await rec.fill("[name=password]", "nueva-clave-123"); await rec.fill("[name=repeat]", "nueva-clave-123");
await btn(rec, "Guardar mi contraseña nueva");
check("al guardar la contraseña nueva se entra directamente, con un aviso", await seen(avisoBueno(rec, "Tu contraseña se ha cambiado")) && await seen(rec.locator("header >> text=Salir")));
await olvi.p.goto(B + "/mi-ficha");
check("las sesiones abiertas antes de cambiar la contraseña quedan cerradas", await seen(olvi.p.locator("header >> text=Entrar")));
const vieja = await nueva();
await entrar(vieja, mail, "contraseña123");
check("la contraseña antigua ya no sirve", await seen(avisoMalo(vieja, "no son correctos")));
await entrar(vieja, mail, "nueva-clave-123");
check("la contraseña nueva sí", await seen(vieja.locator("header >> text=Salir")));
await rec.goto(B + enlace);
check("el enlace de recuperación solo sirve una vez", await seen(rec.locator("h1", { hasText: "El enlace ya no sirve" })) && await seen(rec.locator("button:has-text('Pedir un enlace nuevo')")));
await rec.goto(B + "/recuperar/nueva?token=inventado");
check("un enlace inventado tampoco sirve y explica qué hacer", await seen(rec.locator("h1", { hasText: "El enlace ya no sirve" })));

// 4) Cuenta sin verificar: recuperar la contraseña demuestra que el correo es tuyo (quien registró un correo ajeno no lo retiene)
const sinV = await newUser("Suplantada", "FAN", false);
const mailS = `suplantada${rnd}@test.es`;
const rec2 = await nueva();
await rec2.goto(B + "/recuperar"); await rec2.fill("[name=email]", mailS); await btn(rec2, "Enviar el enlace");
await rec2.goto(B + await esperarEnlace(mailS, "/recuperar/nueva"));
await rec2.fill("[name=password]", "clave-del-titular1"); await rec2.fill("[name=repeat]", "clave-del-titular1");
await btn(rec2, "Guardar mi contraseña nueva");
await seen(rec2.locator("header >> text=Salir"));
await rec2.goto(B + "/verificar");
check("recuperar la contraseña de una cuenta sin verificar también verifica el correo", await seen(rec2.locator("h1", { hasText: "Tu correo electrónico está verificado" })));
check("y quien la creó con otra contraseña ya no tiene acceso", await (async () => { await sinV.p.goto(B + "/mi-ficha"); return seen(sinV.p.locator("header >> text=Entrar")); })());

// 5) Los enlaces de cada tipo solo valen para lo suyo
const mixto = await newUser("Mixta", "FAN", false);
const mailM = `mixta${rnd}@test.es`;
const enlaceVerificar = await esperarEnlace(mailM, "/verificar");
const p3 = await nueva();
await p3.goto(B + enlaceVerificar.replace("/verificar", "/recuperar/nueva"));
check("un enlace de verificación no sirve para cambiar la contraseña", await seen(p3.locator("h1", { hasText: "El enlace ya no sirve" })));
await mixto.p.goto(B + "/recuperar"); await mixto.p.fill("[name=email]", mailM); await btn(mixto.p, "Enviar el enlace");
const enlaceReset = await esperarEnlace(mailM, "/recuperar/nueva");
await p3.goto(B + enlaceReset.replace("/recuperar/nueva", "/verificar"));
await btn(p3, "Confirmar mi correo electrónico");
check("un enlace de recuperación no sirve para verificar el correo", await seen(avisoMalo(p3, "no es válido o ha caducado")));

// 6) Reenvío del enlace de verificación: mensaje claro y límite de 3 por hora
const reenv = await newUser("Reenvio", "FAN", false);
await reenv.p.goto(B + "/verificar");
check("la pantalla de verificación dice a qué correo se envió y cuándo caduca", (await cuerpo(reenv.p)).includes(`reenvio${rnd}@test.es`) && (await cuerpo(reenv.p)).includes("caduca en 48 horas"));
await btn(reenv.p, "Reenviar el enlace");
check("el reenvío confirma que se ha enviado", await seen(avisoBueno(reenv.p, "enlace nuevo")));
await btn(reenv.p, "Reenviar el enlace"); await avisoBueno(reenv.p, "enlace nuevo").waitFor();
await btn(reenv.p, "Reenviar el enlace"); await avisoBueno(reenv.p, "enlace nuevo").waitFor();
await btn(reenv.p, "Reenviar el enlace");
check("a partir del cuarto reenvío en una hora se pide esperar", await seen(avisoMalo(reenv.p, "demasiados intentos")));
await reenv.p.goto(B + await esperarEnlace(`reenvio${rnd}@test.es`, "/verificar")); await btn(reenv.p, "Confirmar mi correo electrónico");
check("verificar el correo ofrece el siguiente paso con un botón", await seen(reenv.p.locator("h1", { hasText: "Tu correo electrónico está verificado" })) && await seen(reenv.p.locator("main button:has-text('Ver los peleadores')")));

// 7) Salir avisa de que la sesión está cerrada
await vieja.locator("header button:has-text('Salir')").click();
check("al salir se confirma que la sesión está cerrada", await seen(avisoBueno(vieja, "Has cerrado la sesión")));

await terminarDiagnosticos();
await browser.close();
if (process.exitCode) console.error("\nAcceso: hay comprobaciones fallidas");
