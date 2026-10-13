// Vigila #418 en las rutas concretas de la revisión. Las pruebas usan la misma fecha de referencia en SSR e hidratación,
// y dos zonas horarias para detectar diferencias entre el servidor de Render (UTC) y el navegador de la persona.
import { B, browser, btn, check, datosDeAlta, enDias, newUser, registrar, terminarDiagnosticos } from "./ayudas.mjs";

const rutas = ["/noticias", "/noticias?disciplina=boxeo", "/noticias?disciplina=jiu-jitsu"];
const patronHidratacion = /hydration|did not match|didn't match|#418|#423|#425/i;

async function vigilar(p, ruta, etiqueta) {
  const errores = [];
  const pageError = (e) => errores.push(e.message.slice(0, 200));
  const consoleError = (m) => { if (patronHidratacion.test(m.text())) errores.push(m.text().slice(0, 200)); };
  p.on("pageerror", pageError);
  p.on("console", consoleError);
  await p.goto(B + ruta);
  await p.locator("main").waitFor();
  // Abrir y cerrar el menú exige que React ya haya hidratado la cabecera, sin usar esperas fijas ni networkidle.
  await p.getByRole("button", { name: "Menú", exact: true }).click();
  const dialogo = p.getByRole("dialog");
  await dialogo.waitFor({ state: "visible" });
  await p.keyboard.press("Escape");
  await dialogo.waitFor({ state: "hidden" });
  check(`${etiqueta} ${ruta}: sin errores de hidratación`, errores.length === 0 && errores.join(" "));
  p.off("pageerror", pageError);
  p.off("console", consoleError);
}

for (const timezoneId of ["Europe/Madrid", "America/New_York"]) {
  const usuario = await newUser(`Hidratacion${timezoneId === "Europe/Madrid" ? "Madrid" : "NuevaYork"}`, "FIGHTER", true, {
    locale: "es-ES", timezoneId, viewport: { width: 390, height: 844 },
  });
  const p = usuario.p;
  await p.goto(B + "/mi-ficha");
  await p.fill("[name=firstName]", "Ficha");
  await p.fill("[name=lastName]", `Hidratacion${Date.now()}`);
  await datosDeAlta(p);
  await btn(p, "Crear mi ficha");
  await p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
  await registrar(p, { evento: `Cartel futuro ${Date.now()}`, fecha: enDias(5), rivalNombre: "Rival", rivalApellidos: `Hidratacion${Date.now()}`, resultado: null });
  await p.locator("[role=status]", { hasText: "Combate registrado" }).waitFor();
  const enlaceFicha = await p.getByRole("link", { name: "Ver mi ficha pública", exact: true }).getAttribute("href");

  for (const ruta of rutas) await vigilar(p, ruta, timezoneId);
  await vigilar(p, enlaceFicha, timezoneId);
  await vigilar(p, "/mi-ficha", `${timezoneId} con sesión y combate próximo`);
  await p.getByRole("navigation", { name: "Secciones de mi ficha" }).getByRole("link", { name: "Combates", exact: true }).click();
  await p.getByRole("heading", { name: "Mis combates", exact: true }).waitFor();
  await usuario.p.context().close();
}

await terminarDiagnosticos();
await browser.close();
