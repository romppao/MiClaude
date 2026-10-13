// Vigila el error de hidratación de React (#418, «server rendered HTML didn't match the client»), visto en la demo el 13 de octubre de 2026
// en /noticias con filtro y en la ficha de un peleador con un combate próximo. El servidor de Render trabaja en UTC y el navegador en la hora
// de cada persona: cada página se abre con dos zonas horarias para que una fecha formateada sin «timeZone» en el cliente salte aquí.
// Uso: BASE_URL=… node tests/e2e/hidratacion.mjs (con datos de ejemplo para que haya una ficha con combates).
import { B, browser, check, terminarDiagnosticos } from "./ayudas.mjs";

const rutas = ["/noticias", "/noticias?disciplina=boxeo", "/noticias?disciplina=jiu-jitsu", "/peleadores", "/veladas"];
// La primera ficha pública de la lista: con la semilla, tiene combates en el cartel de una velada próxima.
const lista = await (await fetch(B + "/peleadores")).text();
const ficha = lista.match(/href="(\/peleadores\/[a-z0-9-]+)"/)?.[1];
if (ficha) rutas.push(ficha);

for (const timezoneId of ["Europe/Madrid", "America/New_York"]) {
  const ctx = await browser.newContext({ locale: "es-ES", timezoneId });
  for (const ruta of rutas) {
    const p = await ctx.newPage();
    const errores = [];
    p.on("pageerror", (e) => errores.push(e.message.slice(0, 200)));
    p.on("console", (m) => { if (m.type() === "error" && /hydrat|did not match|didn't match|#418|#423|#425/i.test(m.text())) errores.push(m.text().slice(0, 200)); });
    await p.goto(B + ruta, { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    check(`${ruta} (${timezoneId}): sin errores de hidratación${errores.length ? ` → ${errores.join(" | ")}` : ""}`, errores.length === 0);
    await p.close();
  }
  await ctx.close();
}

await terminarDiagnosticos();
await browser.close();
