// Modo demostración (solo con DEMO_MODE=si en el servidor): confirmar el correo con un botón y cambiar de papel con una sola cuenta.
import { B, rnd, browser, seen, check, btn, terminarDiagnosticos } from "./ayudas.mjs";

const p = await (await browser.newContext()).newPage();
await p.goto(B + "/registro");
check("la demostración avisa con un mensaje visible de que los datos son ficticios", await seen(p.locator(".barra-aviso", { hasText: "Versión de demostración" })));
await p.fill("[name=name]", "Persona Demo"); await p.fill("[name=email]", `demo${rnd}@test.es`); await p.fill("[name=password]", "contraseña-larga-1");
await btn(p, "Crear mi cuenta");
await p.waitForURL("**/verificar");
await btn(p, "Confirmar mi correo ahora (solo demostración)");
check("el botón de demostración confirma el correo sin correos reales", await seen(p.locator("[role=status]", { hasText: "Correo electrónico verificado" })));
await p.goto(B + "/mi-cuenta");
check("Mi cuenta ofrece cambiar de papel y dice cuál es el actual", await seen(p.locator("section", { hasText: "Ahora usas la aplicación como" })));
await p.click("button:has-text('Probar como moderador')");
check("cambiar a moderador se confirma", await seen(p.locator("[role=status]", { hasText: "has cambiado tu papel" })));
await p.goto(B + "/moderacion");
check("y da acceso a la moderación", await seen(p.locator("h1", { hasText: "Moderación" })));
await p.goto(B + "/mi-cuenta");
await p.click("button:has-text('Probar como organizador')");
await p.locator("[role=status]", { hasText: "has cambiado tu papel" }).waitFor();
await p.goto(B + "/organizador");
check("como organizador se pueden crear veladas", await seen(p.locator("[name=name]")));
await terminarDiagnosticos();
await browser.close();
