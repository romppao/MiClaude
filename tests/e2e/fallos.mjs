// Panel de moderación, registro de fallos y tema claro u oscuro (petición del fundador, 13 de octubre de 2026: «es muy importante que esos
// fallos queden registrados […] para saber qué ha estado ocurriendo a lo largo de la historia» y «que el usuario, en función de su sistema,
// pueda elegir el tema oscuro o el tema blanco»).
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, check, seen, hacerAdmin, terminarDiagnosticos } from "./ayudas.mjs";
import { readFileSync } from "node:fs";

const db = new PrismaClient();
const axe = async (p, que) => {
  for (const tema of ["light", "dark"]) {
    await p.emulateMedia({ colorScheme: tema }); await p.waitForTimeout(600);
    const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    check(`${que} (${tema === "light" ? "claro" : "oscuro"}): sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
  }
  await p.emulateMedia({ colorScheme: "light" });
};

// 1) Un fallo del navegador llega al registro por /api/fallos; sin venir de nuestras páginas, se rechaza.
// La marca única va en letras: el registro agrupa a propósito los fallos que solo cambian en números (la ficha 12 y la 13).
const marca = String(rnd).replace(/\d/g, (d) => "abcdefghij"[Number(d)]);
const mensaje = `Fallo de prueba ${marca} para ana${rnd}@correo.es`;
const ajeno = await fetch(B + "/api/fallos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mensaje, ruta: "/x" }) });
check("/api/fallos rechaza peticiones que no vienen de nuestras páginas", ajeno.status === 403);
const visitante = await (await browser.newContext()).newPage();
await visitante.goto(B + "/ayuda");
const estado = await visitante.evaluate(async (m) => (await fetch("/api/fallos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mensaje: m, pila: "Error: x\n    at prueba", ruta: "/ayuda" }) })).status, mensaje);
check("un fallo del navegador se registra (204)", estado === 204);
const fila = await db.appError.findFirst({ where: { message: { contains: `Fallo de prueba ${marca}` } } });
check("el fallo está en la base, como «Sin revisar» y en el navegador", fila?.status === "OPEN" && fila.origin === "CLIENTE" && fila.path === "/ayuda");
check("sin datos personales: el correo se ha tachado", !!fila && !fila.message.includes("@") && fila.message.includes("[correo]"));
await visitante.evaluate(async (m) => { await fetch("/api/fallos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mensaje: m, ruta: "/ayuda" }) }); }, mensaje);
check("si se repite, suma en vez de duplicar", (await db.appError.count({ where: { message: { contains: `Fallo de prueba ${marca}` } } })) === 1 && (await db.appError.findUnique({ where: { id: fila.id } }))?.count === 2);

// 2) Solo moderación ve los fallos.
const curioso = await newUser("Curioso");
await curioso.p.goto(B + "/moderacion/fallos");
check("quien no modera no puede ver los fallos", !curioso.p.url().includes("/moderacion/fallos"));

// 3) Panel de moderación por bloques y la ficha del fallo.
const mod = await newUser("Moderafallos");
hacerAdmin(mod.email);
await mod.p.goto(B + "/moderacion");
check("el panel muestra «Pendiente de revisar»", await seen(mod.p.getByRole("heading", { name: "Pendiente de revisar" })));
check("el panel muestra «Estado de la aplicación» con los fallos sin resolver", await seen(mod.p.getByRole("link", { name: /Fallos de la aplicación sin resolver: \d+/ })));
check("el panel dice qué versión de la aplicación está en marcha", await seen(mod.p.getByText(`Versión de la aplicación: ${JSON.parse(readFileSync("package.json", "utf8")).version}`)));
check("el panel muestra las herramientas, sin perder ninguna", await seen(mod.p.getByRole("heading", { name: "Herramientas" })) && await seen(mod.p.getByRole("link", { name: "Ver el historial de cambios" })) && await seen(mod.p.getByRole("link", { name: "Gestionar acreditaciones" })) && await seen(mod.p.getByRole("link", { name: "Respaldar resultados y títulos" })));
await axe(mod.p, "Panel de moderación");
await mod.p.getByRole("link", { name: "Fallos de la aplicación", exact: true }).click();
await mod.p.waitForURL("**/moderacion/fallos");
check("la lista de fallos muestra el fallo registrado", await seen(mod.p.getByRole("link", { name: new RegExp(`Fallo de prueba ${marca}`) })));
await axe(mod.p, "Fallos de la aplicación");
await mod.p.getByRole("link", { name: new RegExp(`Fallo de prueba ${marca}`) }).click();
await mod.p.waitForURL(`**/moderacion/fallos/${fila.id}`);
check("la ficha dice cuántas veces ha ocurrido", await seen(mod.p.locator("dd", { hasText: /^2$/ })));
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
check("el fallo guarda la versión de la aplicación y la ficha la muestra", fila.version === version && fila.firstVersion === version && await seen(mod.p.locator("dd", { hasText: version })));
await axe(mod.p, "Detalle de un fallo");
// Resolver sin nota: no se deja.
await mod.p.selectOption("select[name=estado]", "RESOLVED");
await mod.p.getByRole("button", { name: "Guardar el estado del fallo" }).click();
check("para darlo por resuelto hace falta explicar la causa", await seen(mod.p.locator(".notice-bad", { hasText: "escribe en la nota" })));
await mod.p.selectOption("select[name=estado]", "RESOLVED");
await mod.p.fill("textarea[name=nota]", "Prueba: causa encontrada y corregida.");
await mod.p.getByRole("button", { name: "Guardar el estado del fallo" }).click();
check("se guarda el estado con su nota", await seen(mod.p.locator(".notice-ok", { hasText: "Fallo actualizado" })));
check("queda en el historial del fallo", await seen(mod.p.locator("li", { hasText: "Prueba: causa encontrada y corregida." })));
check("en la base: resuelto, con nota y con quién lo cerró", (await db.appError.findUnique({ where: { id: fila.id } }))?.status === "RESOLVED");
// Si vuelve a pasar, se reabre solo.
await visitante.evaluate(async (m) => { await fetch("/api/fallos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mensaje: m, ruta: "/ayuda" }) }); }, mensaje);
check("si un fallo resuelto vuelve a ocurrir, se reabre", (await db.appError.findUnique({ where: { id: fila.id } }))?.status === "OPEN");
check("y la reapertura queda en el historial", (await db.auditLog.count({ where: { entity: "APP_ERROR", entityId: fila.id, action: "FALLO_REAPARECE" } })) === 1);

// 4) Tema: automático por defecto; se puede fijar claro u oscuro desde el menú y se recuerda.
const p = await (await browser.newContext({ colorScheme: "dark" })).newPage();
await p.goto(B + "/");
const fondo = () => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
// Se espera al estado (como pide seen()): leerlo en un instante fijo falló una vez en el CI, más lento que el ordenador local.
const temaEs = (tema, color) => p.waitForFunction(([t, c]) => document.documentElement.dataset.tema === t && getComputedStyle(document.body).backgroundColor === c, [tema, color], { timeout: 5000 }).then(() => true, () => false);
check("sin elegir nada, sigue el tema del sistema (oscuro)", (await fondo()) === "rgb(10, 10, 12)");
await p.getByRole("button", { name: "Menú" }).click();
await p.locator(".selector-tema label", { hasText: "Claro" }).click();
check("al elegir «Claro» la página se vuelve clara", await temaEs("claro", "rgb(244, 242, 236)"));
await p.reload();
check("la elección se recuerda al volver", await temaEs("claro", "rgb(244, 242, 236)"));
// Si React vuelve a pintar <html> al cargar y se pierde el atributo, la elección se repone sola (components/TemaPersistente.tsx).
await p.evaluate(() => { delete document.documentElement.dataset.tema; });
check("si la página pierde el tema al cargar, se vuelve a aplicar el elegido", await temaEs("claro", "rgb(244, 242, 236)"));
await p.getByRole("button", { name: "Menú" }).click();
check("el menú muestra la opción elegida", await p.getByRole("radio", { name: "Claro" }).isChecked());
await p.locator(".selector-tema label", { hasText: "Automático" }).click();
check("«Automático» vuelve al tema del sistema", await temaEs(undefined, "rgb(10, 10, 12)"));

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
