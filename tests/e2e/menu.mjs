// Menú organizado por actividades: móvil, teclado y permisos, sin funciones ficticias.
import AxeBuilder from "@axe-core/playwright";
import {
  B,
  browser,
  seen,
  check,
  newUser,
  hacerAdmin,
  terminarDiagnosticos,
} from "./ayudas.mjs";
const p = await (
  await browser.newContext({ viewport: { width: 390, height: 844 } })
).newPage();
await p.goto(B + "/");
const open = () => p.getByRole("button", { name: "Menú", exact: true });
const dialog = () =>
  p.getByRole("dialog", { name: "Explora Ring España", exact: true });
await open().click();
check(
  "el menú móvil se abre con cuatro bloques comprensibles",
  (await seen(dialog())) && (await dialog().getByRole("heading").count()) === 4,
);
check(
  "la distribución incluye deportistas, clubes y entrenadores, promotores y cuenta",
  (await dialog()
    .getByRole("heading", { name: "Para deportistas", exact: true })
    .count()) === 1 &&
    (await dialog()
      .getByRole("heading", { name: "Para clubes y entrenadores", exact: true })
      .count()) === 1 &&
    (await dialog()
      .getByRole("heading", { name: "Para promotores", exact: true })
      .count()) === 1 &&
    (await dialog()
      .getByRole("heading", { name: "Tu cuenta y ayuda", exact: true })
      .count()) === 1,
);
check(
  "ningún bloque reúne más de cinco enlaces",
  await dialog()
    .locator("section")
    .evaluateAll((groups) =>
      groups.every((g) => g.querySelectorAll("a").length <= 5),
    ),
);
check(
  "solo se muestran destinos implementados y no permisos de moderación a visitantes",
  (await dialog()
    .getByRole("link", { name: "Moderación", exact: true })
    .count()) === 0 &&
    (await dialog()
      .getByRole("link", { name: /sparring|Reservar espacio|Aprender/ })
      .count()) === 0,
);
const axe = await new AxeBuilder({ page: p })
  .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
  .analyze();
check(
  "el menú abierto cumple la medición automática de accesibilidad",
  axe.violations.filter((v) => ["serious", "critical"].includes(v.impact))
    .length === 0,
);
await p.keyboard.press("Shift+Tab");
check("el foco con teclado permanece dentro del menú", await dialog().evaluate(panel=>panel.contains(document.activeElement)));
await p.keyboard.press("Escape");
check(
  "Escape cierra el menú y devuelve el foco al botón que lo abrió",
  (await dialog().count()) === 0 &&
    (await open().evaluate((e) => document.activeElement === e)),
);
await open().click();
await dialog()
  .getByRole("link", { name: "Encontrar gimnasio", exact: true })
  .click();
await p.waitForURL("**/gimnasios");
check(
  "seguir un enlace cierra el panel y abre el destino",
  (await dialog().count()) === 0 &&
    (await seen(p.getByRole("heading", { name: "Gimnasios", exact: true }))),
);
await p.setViewportSize({ width: 1280, height: 900 });
await open().click();
check(
  "la misma organización está disponible en escritorio",
  await seen(dialog()),
);
await p.mouse.click(100,100);
check("pulsar fuera del panel lo cierra en escritorio", await dialog().count()===0);
await open().click();
await dialog()
  .getByRole("button", { name: "Cerrar menú", exact: true })
  .click();
check(
  "cerrar restaura el desplazamiento de la página",
  await p.evaluate(() => document.body.style.overflow !== "hidden"),
);
const user = await newUser("MenuCuenta");
await user.p.goto(B + "/");
await user.p.getByRole("button", { name: "Menú", exact: true }).click();
const signed = user.p.getByRole("dialog");
check(
  "una cuenta ve sus accesos sin enlaces de moderación ni respaldo no acreditado",
  (await seen(signed.getByRole("link", { name: "Mi cuenta", exact: true }))) &&
    (await signed
      .getByRole("link", { name: "Moderación", exact: true })
      .count()) === 0 &&
    (await signed
      .getByRole("link", {
        name: "Respaldar resultados y títulos",
        exact: true,
      })
      .count()) === 0,
);
check("gestionar perfiles se ofrece solo a quien tiene una entidad asignada", await signed.getByRole("link", { name: "Gestionar mis perfiles", exact: true }).count()===0);
await signed.getByRole("button", { name: "Salir", exact: true }).click();
await user.p
  .getByRole("status")
  .filter({ hasText: "Has cerrado la sesión" })
  .waitFor();
check(
  "cerrar sesión desde el menú funciona y actualiza sus opciones",
  (await user.p.getByRole("link", { name: "Entrar", exact: true }).count()) > 0,
);
const admin = await newUser("MenuModeracion");
hacerAdmin(admin.email);
await admin.p.goto(B + "/");
await admin.p.getByRole("button", { name: "Menú", exact: true }).click();
check(
  "moderación dispone de sus accesos y respaldo",
  (await seen(
    admin.p
      .getByRole("dialog")
      .getByRole("link", { name: "Moderación", exact: true }),
  )) &&
    (await seen(
      admin.p
        .getByRole("dialog")
        .getByRole("link", {
          name: "Respaldar resultados y títulos",
          exact: true,
        }),
    )),
);
await terminarDiagnosticos();
await browser.close();
