// Pruebas de privacidad y cuenta: corregir datos, contraseña, descarga de datos, baja de avisos, eliminación de la cuenta.
// Requiere el servidor en marcha (ver ayudas.mjs).
import { B, rnd, browser, seen, check, btn, hoyMadrid, enDias, registrar, newUser, hacerAdmin, esperarEnlace } from "./ayudas.mjs";

const cuerpo = (p) => p.locator("body").innerText();
const nueva = async () => (await browser.newContext()).newPage();
const malo = (p, texto) => p.locator("[role=alert]", { hasText: texto });
const bueno = (p, texto) => p.locator("[role=status]", { hasText: texto });
async function crearFicha(p, nombre, apellidos) {
  await p.goto(B + "/mi-ficha");
  await p.fill("[name=firstName]", nombre); await p.fill("[name=lastName]", apellidos);
  await btn(p, "Crear mi ficha");
  await bueno(p, "ficha de peleador se ha creado").waitFor();
}

// 1) Corregir los datos de la propia ficha
const ana = await newUser("Corregida", "FIGHTER");
await crearFicha(ana.p, "Ana", `Corregida${rnd}`);
await ana.p.locator("summary", { hasText: "Corregir los datos de mi ficha" }).click();
await ana.p.fill("details [name=alias]", "La Rápida"); await ana.p.fill("details [name=heightCm]", "999");
await ana.p.click("details button:has-text('Guardar los datos de mi ficha')");
check("una altura imposible se rechaza con un mensaje que explica cómo escribirla", await seen(malo(ana.p, "en centímetros")));
await ana.p.locator("summary", { hasText: "Corregir los datos de mi ficha" }).click();
await ana.p.fill("details [name=alias]", "La Rápida"); await ana.p.fill("details [name=heightCm]", "171"); await ana.p.fill("details [name=bio]", `Presentación de prueba ${rnd}`);
await ana.p.click("details button:has-text('Guardar los datos de mi ficha')");
check("los datos de la ficha se guardan y se confirma", await seen(bueno(ana.p, "datos de tu ficha se han guardado")));
const anon = await nueva();
await anon.goto(B + `/peleadores/ana-corregida${rnd}`);
const pub = await cuerpo(anon);
check("la ficha pública muestra los datos corregidos", pub.includes("La Rápida") && pub.includes("171 cm") && pub.includes(`Presentación de prueba ${rnd}`));

// 2) Mi cuenta: nombre y avisos por correo
await ana.p.goto(B + "/mi-cuenta");
await ana.p.fill("main [name=name]", "Ana María Corregida");
await ana.p.locator("main input[name=notifyEmails]").uncheck();
await ana.p.click("main button:has-text('Guardar cambios')");
check("los cambios de la cuenta se guardan y se confirma", await seen(bueno(ana.p, "cambios de tu cuenta se han guardado")));
check("y se conservan al volver a abrir la pantalla", await ana.p.inputValue("main [name=name]") === "Ana María Corregida" && !(await ana.p.locator("main input[name=notifyEmails]").isChecked()));

// 3) Cambiar la contraseña
const otraSesion = await nueva();
await otraSesion.goto(B + "/entrar");
await otraSesion.fill("[name=email]", `corregida${rnd}@test.es`); await otraSesion.fill("[name=password]", "contraseña123"); await btn(otraSesion, "Entrar en mi cuenta");
await seen(otraSesion.locator("header >> text=Salir"));
await ana.p.goto(B + "/mi-cuenta");
await ana.p.fill("[name=current]", "no-es-esta"); await ana.p.fill("main [name=password]", "clave-nueva-987"); await ana.p.fill("[name=repeat]", "clave-nueva-987");
await ana.p.click("main button:has-text('Cambiar mi contraseña')");
check("con la contraseña actual equivocada no se cambia nada y se explica", await seen(malo(ana.p, "contraseña actual no es correcta")));
await ana.p.fill("[name=current]", "contraseña123"); await ana.p.fill("main [name=password]", "clave-nueva-987"); await ana.p.fill("[name=repeat]", "clave-nueva-987");
await ana.p.click("main button:has-text('Cambiar mi contraseña')");
check("la contraseña se cambia y se avisa", await seen(bueno(ana.p, "contraseña se ha cambiado")));
await otraSesion.goto(B + "/mi-ficha");
check("las demás sesiones abiertas se cierran, pero la actual sigue abierta", await seen(otraSesion.locator("header >> text=Entrar")) && await seen(ana.p.locator("header >> text=Salir")));

// 4) Descargar mis datos
const descarga = await ana.p.request.get(B + "/mi-cuenta/datos");
const datos = await descarga.json().catch(() => null);
check("la descarga de datos entrega un fichero con la cuenta y la ficha", descarga.ok() && /attachment/.test(descarga.headers()["content-disposition"] ?? "") && datos?.cuenta?.correoElectronico === `corregida${rnd}@test.es` && datos?.fichaDePeleador?.alias === "La Rápida");
check("y no incluye la contraseña", !JSON.stringify(datos).includes("passwordHash") && !JSON.stringify(datos).includes("scrypt$"));
const sinSesion = await anon.request.get(B + "/mi-cuenta/datos", { maxRedirects: 0 });
check("sin iniciar sesión no se entrega nada", sinSesion.status() >= 300 && sinSesion.status() < 400);

// 5) Avisos por correo: respetan la preferencia y todo correo lleva un enlace de baja que funciona
const orga = (await newUser("Orgadatos", "FAN")).p;
await orga.goto(B + "/organizador"); await orga.fill("[name=orgName]", `Club Datos ${rnd}`); await btn(orga, "Solicitar");
await orga.waitForSelector("text=Solicitud enviada");
const mod = await newUser("Moddatos", "FAN"); hacerAdmin(mod.email);
await mod.p.goto(B + "/moderacion");
await mod.p.locator("tr", { hasText: `Club Datos ${rnd}` }).locator("button:has-text('Aprobar')").click();
await mod.p.locator("tr", { hasText: `Club Datos ${rnd}` }).locator("button:has-text('Aprobar')").waitFor({ state: "detached" });
await crearFicha((await newUser("Rival", "FIGHTER")).p, "Rival", `Aviso${rnd}`);
const seguidor = await newUser("Seguidor", "FAN");
const apagado = await newUser("Silencio", "FAN");
for (const [u, ficha] of [[seguidor, `ana-corregida${rnd}`], [apagado, `ana-corregida${rnd}`]]) {
  await u.p.goto(B + `/peleadores/${ficha}`);
  await u.p.click("button:has-text('Seguir a este peleador')");
  await u.p.locator("[role=status]", { hasText: "Ahora sigues" }).waitFor();
}
await apagado.p.goto(B + "/mi-cuenta");
await apagado.p.locator("main input[name=notifyEmails]").uncheck(); await apagado.p.click("main button:has-text('Guardar cambios')");
await bueno(apagado.p, "cambios de tu cuenta").waitFor();
await orga.goto(B + "/organizador");
await orga.fill("[name=name]", `Velada Avisos ${rnd}`); await orga.fill("[name=date]", enDias(60)); await btn(orga, "Crear velada");
await orga.waitForURL(`**/organizador/velada-avisos-${rnd}-*`);
await orga.fill("[name=fighterA]", `ana-corregida${rnd}`); await orga.fill("[name=fighterB]", `rival-aviso${rnd}`); await btn(orga, "Añadir");
await bueno(orga, "se ha añadido al cartel").waitFor();
const enlaceBaja = await esperarEnlace(seguidor.email, "/baja");
check("quien sigue al peleador recibe el aviso con un enlace para darse de baja", !!enlaceBaja);
check("quien desactivó los avisos no recibe nada", (await esperarEnlace(apagado.email, "/baja", 6)) === null);
const baja = await nueva();
await baja.goto(B + enlaceBaja);
await btn(baja, "Dejar de recibir avisos");
check("el enlace de baja funciona sin iniciar sesión y confirma el cambio", await seen(bueno(baja, "ya no recibirás avisos")));
await seguidor.p.goto(B + "/mi-cuenta");
check("y en Mi cuenta la opción queda desactivada", !(await seguidor.p.locator("main input[name=notifyEmails]").isChecked()));
await baja.goto(B + "/baja?token=inventado"); await btn(baja, "Dejar de recibir avisos");
check("un enlace de baja inventado no sirve y lo dice", await seen(malo(baja, "no es válido o ha caducado")));

// 6) Eliminar la cuenta: contraseña y confirmación obligatorias
const adios = await newUser("Adios", "FAN");
await adios.p.goto(B + "/mi-cuenta/eliminar");
check("la pantalla explica qué se borra antes de pedir la contraseña", (await cuerpo(adios.p)).includes("no se puede deshacer") && (await cuerpo(adios.p)).includes("Qué se borra"));
await adios.p.fill("[name=current]", "incorrecta-1"); await adios.p.locator("[name=confirm]").check();
await btn(adios.p, "Eliminar mi cuenta definitivamente");
check("con la contraseña equivocada no se elimina nada", await seen(malo(adios.p, "contraseña actual no es correcta")));
await adios.p.evaluate(() => document.querySelector("[name=confirm]").removeAttribute("required"));
await adios.p.fill("[name=current]", "contraseña123");
await btn(adios.p, "Eliminar mi cuenta definitivamente");
check("sin marcar la casilla de confirmación tampoco", await seen(malo(adios.p, "Marca la casilla")));
await adios.p.fill("[name=current]", "contraseña123"); await adios.p.locator("[name=confirm]").check();
await btn(adios.p, "Eliminar mi cuenta definitivamente");
check("al eliminarla se confirma y se cierra la sesión", await seen(bueno(adios.p, "cuenta y tus datos personales se han eliminado")) && await seen(adios.p.locator("header >> text=Entrar")));
const intento = await nueva();
await intento.goto(B + "/entrar"); await intento.fill("[name=email]", adios.email); await intento.fill("[name=password]", "contraseña123"); await btn(intento, "Entrar en mi cuenta");
check("la cuenta eliminada ya no permite entrar", await seen(malo(intento, "no son correctos")));

// 6b) Ficha sin combates: se borra del todo
const sinCombates = await newUser("Sincombates", "FIGHTER");
await crearFicha(sinCombates.p, "Sin", `Combates${rnd}`);
await sinCombates.p.goto(B + "/mi-cuenta/eliminar");
check("sin combates, la pantalla avisa de que la ficha se borra", (await cuerpo(sinCombates.p)).includes("Tu ficha de peleador, porque no tiene combates"));
await sinCombates.p.fill("[name=current]", "contraseña123"); await sinCombates.p.locator("[name=confirm]").check();
await btn(sinCombates.p, "Eliminar mi cuenta definitivamente");
await seen(bueno(sinCombates.p, "se han eliminado"));
const r404 = await anon.goto(B + `/peleadores/sin-combates${rnd}`);
check("su ficha ya no existe", r404.status() === 404);

// 6c) Ficha con combates: se conservan los combates y la ficha queda anónima, sin ningún dato personal
const vet = await newUser("Retirada", "FIGHTER");
await crearFicha(vet.p, "Retirada", `Apellido${rnd}`);
await vet.p.locator("summary", { hasText: "Corregir los datos de mi ficha" }).click();
await vet.p.fill("details [name=alias]", `Alias secreto ${rnd}`); await vet.p.fill("details [name=city]", `Ciudad secreta ${rnd}`);
await vet.p.click("details button:has-text('Guardar los datos de mi ficha')");
await bueno(vet.p, "datos de tu ficha se han guardado").waitFor();
await registrar(vet.p, { evento: `Velada Retirada ${rnd}`, fecha: hoyMadrid, rivalNombre: "Rival", rivalApellidos: `Perdura${rnd}` });
await bueno(vet.p, "Combate registrado").waitFor();
await vet.p.goto(B + "/mi-cuenta/eliminar");
check("con combates, la pantalla avisa de que la ficha quedará anónima", (await cuerpo(vet.p)).includes("Peleador anónimo"));
await vet.p.fill("[name=current]", "contraseña123"); await vet.p.locator("[name=confirm]").check();
await btn(vet.p, "Eliminar mi cuenta definitivamente");
await seen(bueno(vet.p, "se han eliminado"));
const antigua = await anon.goto(B + `/peleadores/retirada-apellido${rnd}`);
check("la dirección antigua de la ficha ya no existe", antigua.status() === 404);
check("el rival conserva su combate en su ficha", await (async () => { await anon.goto(B + `/peleadores/rival-perdura${rnd}`); return seen(anon.locator("tbody tr").first()); })());
const t = await cuerpo(anon);
check("y su rival figura como «Peleador anónimo», sin nombre, alias ni ciudad", t.includes("Peleador anónimo") && !t.includes(`Apellido${rnd}`) && !t.includes(`Alias secreto ${rnd}`) && !t.includes(`Ciudad secreta ${rnd}`));

// 7) Privacidad: página pública, enlazada desde el pie y el registro
await anon.goto(B + "/privacidad");
const priv = await cuerpo(anon);
check("la página de privacidad explica datos, plazos y derechos", priv.includes("Qué datos guardamos") && priv.includes("Cuánto tiempo los conservamos") && priv.includes("Tus derechos"));
check("está enlazada desde el pie de página", await anon.locator("footer a[href='/privacidad']").count() === 1);
await anon.goto(B + "/registro");
check("y desde el formulario de registro", await anon.locator("main a[href='/privacidad']").count() === 1);

await browser.close();
if (process.exitCode) console.error("\nCuenta: hay comprobaciones fallidas");
