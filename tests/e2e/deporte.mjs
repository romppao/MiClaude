// Preferencia de deporte: funciona con radios reales, persiste en cookie y una cookie manipulada vuelve a una vista segura.
import { B, browser, check, terminarDiagnosticos } from "./ayudas.mjs";

const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const page = await context.newPage();

await page.goto(B + "/");
check("sin cookie se usa la vista general", await page.locator("html").getAttribute("data-deporte") === "todos");

const grupo = page.getByRole("radiogroup", { name: "Deporte activo", exact: true });
const todos = grupo.getByRole("radio", { name: "Todos los deportes", exact: true });
await todos.focus();
await page.keyboard.press("ArrowRight");
check("las flechas cambian el deporte del radiogrupo", await grupo.getByRole("radio", { name: "Boxeo", exact: true }).isChecked());
await page.getByRole("button", { name: "Aplicar deporte", exact: true }).click();
await page.waitForFunction(() => document.documentElement.dataset.deporte === "boxeo");
check("elegir un deporte cambia data-deporte", await page.locator("html").getAttribute("data-deporte") === "boxeo");

await page.reload();
check("la preferencia persiste al recargar", await page.locator("html").getAttribute("data-deporte") === "boxeo");

await context.addCookies([{ name: "deporte", value: "__proto__", url: B }]);
await page.reload();
check("una cookie manipulada no rompe la página y vuelve a todos", (await page.locator("html").getAttribute("data-deporte")) === "todos" && (await page.getByRole("main").count()) === 1);

await terminarDiagnosticos();
await context.close();

const sinJavaScript = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
const paginaSinJavaScript = await sinJavaScript.newPage();
await paginaSinJavaScript.goto(B + "/");
await paginaSinJavaScript.getByRole("radio", { name: "MMA", exact: true }).check();
await Promise.all([
  paginaSinJavaScript.waitForNavigation(),
  paginaSinJavaScript.getByRole("button", { name: "Aplicar deporte", exact: true }).click(),
]);
check("el selector también guarda el deporte sin JavaScript", await paginaSinJavaScript.locator("html").getAttribute("data-deporte") === "mma");
await sinJavaScript.close();
await browser.close();
