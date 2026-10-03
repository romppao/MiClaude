// Recorrido de una ficha con historial amateur y profesional: categoría por nivel y explicación del récord.
// Solo contra el servidor y la base de pruebas; datos ficticios únicos creados mediante la interfaz.
import { B, rnd, browser, seen, check, newUser, registrar, enDias, terminarDiagnosticos } from "./ayudas.mjs";

const { p } = await newUser("Trayectoria", "FIGHTER");
await p.goto(B + "/mi-ficha");
const crear = p.locator("main form").filter({ has: p.getByRole("button", { name: "Crear mi ficha", exact: true }) });
await crear.locator("[name=firstName]").fill("Trayectoria");
await crear.locator("[name=lastName]").fill(`Niveles${rnd}`);
await crear.locator("select[name=weightClass]").selectOption("M70");
await crear.getByRole("button", { name: "Crear mi ficha", exact: true }).click();
await p.getByRole("link", { name: "Ver mi ficha pública", exact: true }).waitFor();
const publica = await p.getByRole("link", { name: "Ver mi ficha pública", exact: true }).getAttribute("href");

async function combate(sufijo, dias, resultado = "WIN") {
  const evento = `Trayectoria ${sufijo} ${rnd}`;
  await registrar(p, { disciplina: "BOXEO", evento, fecha: enDias(dias), rivalNombre: "Rival", rivalApellidos: `${sufijo}${rnd}`, resultado, metodo: resultado === "NC" ? null : "UD" });
  // La fila nueva distingue este envío de un aviso que siga visible del anterior.
  await p.locator("main table tbody tr", { hasText: evento }).waitFor();
}

async function categoria(nivel, peso) {
  const editar = p.locator("main details").filter({ has: p.locator("summary strong", { hasText: /^Boxeo$/ }) });
  await editar.locator("summary").click();
  await editar.locator("select[name=level]").selectOption(nivel);
  await editar.locator("select[name=weightClass]").selectOption(peso);
  await editar.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  // Esperar la categoría nueva evita leer el mensaje de un guardado anterior.
  await p.locator("main details summary", { hasText: peso === "Wélter" ? "Wélter · hasta 66,7 kg" : "Masculino · hasta 70 kg" }).waitFor();
}

await combate("Amateur", -90);
await categoria("PRO", "Wélter");
await combate("Profesional", -30);
await combate("SinDecision", -10, "NC");

const visitante = await (await browser.newContext()).newPage();
async function comprobar(page, contexto, nivelActual) {
  const cards = page.locator("main .grid > .card").filter({ has: page.locator(".rec") });
  const pro = cards.filter({ hasText: "Boxeo · Profesional" });
  const amateur = cards.filter({ hasText: "Boxeo · Amateur" });
  check(`${contexto}: se conservan los dos niveles de boxeo`, await seen(pro) && await seen(amateur) && await cards.count() === 2);
  const tituloPro = await pro.locator(".mut").first().innerText();
  const tituloAmateur = await amateur.locator(".mut").first().innerText();
  check(`${contexto}: la categoría solo aparece en el nivel actual`, nivelActual === "PRO"
    ? tituloPro === "Boxeo · Profesional · Wélter · hasta 66,7 kg" && tituloAmateur === "Boxeo · Amateur"
    : tituloPro === "Boxeo · Profesional" && tituloAmateur === "Boxeo · Amateur · Masculino · hasta 70 kg");
  check(`${contexto}: cambiar de nivel conserva los resultados históricos`, await pro.locator(".rec").innerText() === "1-0-0 (1 NC)" && await amateur.locator(".rec").innerText() === "1-0-0");
  check(`${contexto}: sin decisión tiene explicación y cada récord enlaza a su respaldo`, await seen(pro.getByText("victorias – derrotas – empates · NC: sin decisión", { exact: true })) && await cards.locator('a[href="/ayuda#respaldo"]').count() === 2);
}

await comprobar(p, "Mi ficha, categoría profesional", "PRO");
await visitante.goto(B + publica);
await comprobar(visitante, "Ficha pública, categoría profesional", "PRO");
await categoria("AMATEUR", "M70");
await comprobar(p, "Mi ficha, categoría amateur", "AMATEUR");
await visitante.goto(B + publica);
await comprobar(visitante, "Ficha pública, categoría amateur", "AMATEUR");
await visitante.locator('main .grid a[href="/ayuda#respaldo"]').first().click();
check("el enlace de respaldo abre la explicación pública", await seen(visitante.getByRole("heading", { name: "Qué significan las etiquetas de un combate", exact: true })) && new URL(visitante.url()).hash === "#respaldo");

await terminarDiagnosticos();
await browser.close();
