// Hechos ficticios: trayectoria honesta sin verificadores, mejora/revocación del respaldo y privacidad.
import {
  datosDeAlta,
  B,
  rnd,
  browser,
  seen,
  check,
  newUser,
  hacerAdmin,
  registrar,
  enDias,
  terminarDiagnosticos,
} from "./ayudas.mjs";

const owner = await newUser("CampeonAura", "FIGHTER");
const p = owner.p;
await p.goto(B + "/mi-ficha");
await datosDeAlta(p);
await p.locator("[name=firstName]").fill("CampeonAura");
await p.locator("[name=lastName]").fill(`Historia${rnd}`);
await p.locator("select[name=weightClass]").selectOption("M70");
await p.getByRole("button", { name: "Crear mi ficha", exact: true }).click();
await p
  .getByRole("link", { name: "Ver mi ficha pública", exact: true })
  .waitFor();
const publicPath = await p
  .getByRole("link", { name: "Ver mi ficha pública", exact: true })
  .getAttribute("href");
const title = `Nacional Historia ${rnd}`;
const visitor = await (await browser.newContext()).newPage();
const manage = () =>
  p
    .locator("main details")
    .filter({ has: p.locator("summary", { hasText: `Gestionar: ${title}` }) });
async function openManagement() {
  if ((await manage().getAttribute("open")) === null)
    await manage().locator("summary").click();
}
async function aura(expected, label) {
  await visitor.goto(B + publicPath);
  check(
    label,
    await seen(visitor.getByText(`${expected} de aura`, { exact: true })),
  );
}
await p.goto(B + "/mi-ficha/trayectoria");
const newTitle = () =>
  p
    .locator("main form")
    .filter({
      has: p.getByRole("button", {
        name: "Guardar título declarado",
        exact: true,
      }),
    });
async function fillTitle() {
  const f = newTitle();
  await f.locator("[name=championship]").fill(title);
  await f.locator("[name=organization]").fill("Entidad ficticia");
  await f.locator("[name=awardedOn]").fill("1975-06-01");
  await f.locator("[name=scope]").selectOption("NATIONAL");
  await f.locator("[name=discipline]").selectOption("BOXEO");
  await f.locator("[name=weightClass]").selectOption("M70");
}
await fillTitle();
await newTitle().evaluate((form) => {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "supportKind";
  input.value = "FEDERATION";
  form.append(input);
});
await newTitle()
  .getByRole("button", { name: "Guardar título declarado", exact: true })
  .click();
await p.getByRole("status").filter({ hasText: "Título guardado" }).waitFor();
await aura(
  50,
  "un campeón nacional recibe trayectoria sin entrenadores ni federaciones; falsear un campo de respaldo no lo acredita",
);
check(
  "su título figura expresamente como declarado y no publica notas privadas",
  await seen(visitor.getByText(/Declarado por el deportista/)),
);
await p.goto(B + "/mi-ficha/trayectoria");
await fillTitle();
await newTitle().locator("[name=scope]").selectOption("INTERNATIONAL");
await newTitle()
  .getByRole("button", { name: "Guardar título declarado", exact: true })
  .click();
check(
  "el mismo campeonato/año/categoría no se duplica cambiando el ámbito",
  await seen(p.getByRole("alert").filter({ hasText: "Ya has declarado" })),
);
await aura(50, "el duplicado no modifica el aura");
await p.goto(B + "/mi-ficha/trayectoria");
await openManagement();
await manage()
  .getByRole("button", { name: "Retirar este título del aura", exact: true })
  .click();
await p.getByRole("status").filter({ hasText: "Título retirado" }).waitFor();
await visitor.goto(B + publicPath);
check(
  "retirar un título lo oculta y elimina sus puntos",
  !(await visitor.locator("main").innerText()).includes(title) &&
    (await seen(
      visitor.getByText("Todavía no hay aura. La verificación es opcional.", {
        exact: true,
      }),
    )),
);
await openManagement();
await manage()
  .getByRole("button", { name: "Volver a mostrar este título", exact: true })
  .click();
await p
  .getByRole("status")
  .filter({ hasText: "deshecho la retirada" })
  .waitFor();
await aura(50, "retirar el título se puede deshacer sin crear un duplicado");

const mod = await newUser("ModeradorAura");
hacerAdmin(mod.email);
async function reviewPage(page = mod.p) {
  await page.goto(B + "/respaldar?q=" + encodeURIComponent(title));
  return page
    .locator("main section.card")
    .filter({ has: page.getByRole("heading", { name: new RegExp(title) }) });
}
async function endorse(kind, expected) {
  const c = await reviewPage();
  const f = c.locator("form").filter({ hasText: "Respaldar este título" });
  await f.locator("[name=supportKind]").selectOption(kind);
  await f.locator("[name=authority]").fill("Entidad comprobada ficticia");
  await f.locator("[name=evidenceUrl]").fill("https://example.com/acta");
  await f.locator("[name=note]").fill(`Comprobación privada ${rnd}`);
  await f
    .getByRole("button", { name: "Respaldar este título", exact: true })
    .click();
  await mod.p
    .getByRole("status")
    .filter({ hasText: "Decisión guardada" })
    .waitFor();
  await aura(
    expected,
    `el respaldo ${kind} sustituye la bonificación anterior (${expected} puntos)`,
  );
}
await endorse("DOCUMENT", 62);
await endorse("TRAINER", 75);
await endorse("FEDERATION", 100);
check(
  "la nota de comprobación es privada",
  !(await visitor.locator("main").innerText()).includes(
    `Comprobación privada ${rnd}`,
  ),
);
await p.goto(B + "/mi-ficha/trayectoria");
await openManagement();
const request = manage()
  .locator("form")
  .filter({
    has: p.getByRole("button", {
      name: "Solicitar revisión del logro",
      exact: true,
    }),
  });
await request
  .locator("[name=evidenceUrl]")
  .fill("https://example.com/fuente-nueva");
await request.locator("[name=note]").fill("Nueva fuente para revisar");
await request
  .getByRole("button", { name: "Solicitar revisión del logro", exact: true })
  .click();
await p
  .getByRole("status")
  .filter({ hasText: "Solicitud de revisión guardada" })
  .waitFor();
await aura(
  100,
  "solicitar un respaldo nuevo no suma puntos ni reemplaza la fuente ya comprobada",
);
let c = await reviewPage();
await c.locator("details summary").click();
check(
  "moderación ve la fuente nueva con texto comprensible",
  await seen(c.getByText("Nueva fuente para revisar", { exact: true })),
);
let decision = c
  .locator("form")
  .filter({ hasText: "Excluir título indicando el motivo" });
await decision
  .locator("[name=note]")
  .fill("Documento incompatible con el título");
await decision
  .getByRole("button", {
    name: "Excluir título indicando el motivo",
    exact: true,
  })
  .click();
await mod.p
  .getByRole("status")
  .filter({ hasText: "Decisión guardada" })
  .waitFor();
await visitor.goto(B + publicPath);
check(
  "moderación puede excluir una declaración falsa sin mantener sus puntos",
  !(await visitor.locator("main").innerText()).includes(title),
);
c = await reviewPage();
decision = c.locator("form").filter({ hasText: "Restaurar como declarado" });
await decision
  .locator("[name=note]")
  .fill("Aclaración recibida; se restaura sin respaldo");
await decision
  .getByRole("button", { name: "Restaurar como declarado", exact: true })
  .click();
await mod.p
  .getByRole("status")
  .filter({ hasText: "Decisión guardada" })
  .waitFor();
await aura(
  50,
  "restaurar un título requiere decisión motivada y no recupera el respaldo anterior",
);

const fed = await newUser("FederacionAura");
await fed.p.goto(B + "/respaldar");
check(
  "crear una cuenta o un perfil no concede permisos de federación",
  await seen(
    fed.p.getByRole("alert").filter({ hasText: "acreditación activa" }),
  ),
);
await mod.p.goto(B + "/moderacion/acreditaciones");
const grant = mod.p
  .locator("main form")
  .filter({
    has: mod.p.getByRole("button", {
      name: "Conceder acreditación",
      exact: true,
    }),
  });
await grant.locator("[name=email]").fill(fed.email);
await grant.locator("[name=supportKind]").selectOption("FEDERATION");
await grant.locator("[name=authority]").fill(`Federación ficticia ${rnd}`);
await grant.locator("[name=disciplines][value=BOXEO]").check();
await grant
  .locator("[name=evidenceUrl]")
  .fill("https://example.com/representacion");
await grant
  .locator("[name=note]")
  .fill("Representación comprobada para esta prueba");
await grant
  .getByRole("button", { name: "Conceder acreditación", exact: true })
  .click();
await mod.p
  .getByRole("status")
  .filter({ hasText: "Acreditación actualizada" })
  .waitFor();
c = await reviewPage(fed.p);
let f = c.locator("form").filter({ hasText: "Respaldar este título" });
await f
  .locator("[name=evidenceUrl]")
  .fill("https://example.com/acta-federativa");
await f.locator("[name=note]").fill("Resultado de campeonato comprobado");
await f
  .getByRole("button", { name: "Respaldar este título", exact: true })
  .click();
await fed.p
  .getByRole("status")
  .filter({ hasText: "Decisión guardada" })
  .waitFor();
await aura(
  100,
  "una cuenta acreditada puede respaldar hechos concretos de su disciplina",
);
await mod.p.goto(B + "/moderacion/acreditaciones");
const accredited = () =>
  mod.p.locator("main .card").filter({ hasText: `Federación ficticia ${rnd}` });
await accredited()
  .getByRole("button", { name: "Retirar acreditación", exact: true })
  .click();
await mod.p
  .getByRole("status")
  .filter({ hasText: "Acreditación actualizada" })
  .waitFor();
await aura(
  50,
  "revocar la acreditación elimina sus bonus conservando la trayectoria declarada",
);
await accredited()
  .locator("[name=evidenceUrl]")
  .fill("https://example.com/reacreditacion");
await accredited().locator("[name=note]").fill("Representación revalidada");
await accredited()
  .getByRole("button", {
    name: "Reactivar acreditación comprobada",
    exact: true,
  })
  .click();
await mod.p
  .getByRole("status")
  .filter({ hasText: "Acreditación actualizada" })
  .waitFor();
await accredited()
  .getByRole("button", { name: "Retirar acreditación", exact: true })
  .waitFor();
await aura(100, "la acreditación se puede reactivar tras comprobarla de nuevo");
await p.goto(B + "/mi-ficha/trayectoria");
await openManagement();
const correction = manage()
  .locator("form")
  .filter({
    has: p.getByRole("button", {
      name: "Guardar corrección del título",
      exact: true,
    }),
  });
await correction
  .locator("[name=organization]")
  .fill("Entidad ficticia corregida");
await correction
  .getByRole("button", { name: "Guardar corrección del título", exact: true })
  .click();
await p.getByRole("status").filter({ hasText: "Título guardado" }).waitFor();
await aura(
  50,
  "corregir los datos del título exige un respaldo nuevo y retira el bonus anterior",
);

const event = `Combate respaldado ${rnd}`;
await p.goto(B + "/mi-ficha");
await registrar(p, {
  evento: event,
  fecha: enDias(-10),
  rivalNombre: "RivalAura",
  rivalApellidos: `Ficticio${rnd}`,
  peso: "M70",
});
await p.locator("main tr", { hasText: event }).waitFor();
await fed.p.goto(B + "/respaldar?q=" + encodeURIComponent(event));
const bout = () =>
  fed.p
    .locator("main details.card")
    .filter({ has: fed.p.locator("summary", { hasText: event }) });
await bout().locator("summary").click();
await bout()
  .locator("[name=evidenceUrl]")
  .fill("https://example.com/acta-combate");
await bout().locator("[name=note]").fill("Acta de resultado comprobada");
await bout()
  .getByRole("button", { name: "Respaldar este resultado", exact: true })
  .click();
await fed.p
  .getByRole("status")
  .filter({ hasText: "Decisión guardada" })
  .waitFor();
await aura(
  53,
  "el respaldo federativo de un combate suma tres puntos sin exigir acuerdo del rival",
);
await p.goto(B + "/mi-ficha");
check("el deportista ve el tipo de respaldo de su combate en su gestión", await seen(p.locator("main tr", { hasText: event }).getByText("Verificado por federación acreditada", { exact: true })));
await fed.p.goto(B + publicPath);
const vote = fed.p.locator("main #combates article", { hasText: event }); // diseño v3: cada combate es una tarjeta
await vote.getByRole("button", { name: new RegExp("Dar aura a") }).click();
await fed.p.getByRole("status").filter({ hasText: "Has dado aura" }).waitFor();
await aura(
  54,
  "el reconocimiento de la comunidad sigue independiente del respaldo",
);
const eventPath = await visitor.locator("main #combates article", { hasText: event }).getByRole("link", { name: event, exact: true }).getAttribute("href");
await mod.p.goto(B + eventPath.replace("/veladas/", "/organizador/"));
const resultForm = mod.p.locator("main form").filter({ has: mod.p.getByRole("button", { name: /^Actualizar resultado de/ }) });
await resultForm.locator("select[name=outcome]").selectOption("LOSS");
await resultForm.locator("select[name=method]").selectOption("UD");
await resultForm.getByRole("button", { name: /^Actualizar resultado de/ }).click();
await mod.p.getByRole("status").filter({ hasText: "El resultado se ha guardado" }).waitFor();
await aura(51, "cambiar el resultado elimina el respaldo anterior conservando el reconocimiento de la comunidad");
// Una cuenta acreditada puede tener su propia ficha, pero no respaldar sus combates: cubierto además por las pruebas de permisos.
const exported = await (await p.request.get(B + "/mi-cuenta/datos")).json();
check(
  "la descarga incluye títulos, fuentes y categorías históricas",
  exported.titulosDeclarados.length === 1 &&
    exported.titulosDeclarados[0].fecha.startsWith("1975-06-01") &&
    exported.titulosDeclarados[0].peso === "M70",
);
await p.goto(B + "/mi-ficha/trayectoria");
const titleId = await manage().locator("input[name=achievementId]").first().inputValue();
await fed.p.goto(B + "/mi-cuenta/eliminar");
await fed.p.locator("[name=current]").fill("contraseña123");
await fed.p.locator("[name=confirm]").check();
await fed.p.getByRole("button", { name: "Eliminar mi cuenta definitivamente", exact: true }).click();
await fed.p.getByRole("status").filter({ hasText: "Tu cuenta y tus datos personales se han eliminado" }).waitFor();
await mod.p.goto(B + "/moderacion/historial?entity=ACHIEVEMENT&id=" + titleId);
check("eliminar una cuenta acreditada limpia sus nombres y notas del historial de respaldos", !(await mod.p.locator("main pre").allTextContents()).join(" ").includes(`Federación ficticia ${rnd}`));
await p.goto(B + "/mi-cuenta/eliminar");
await p.locator("[name=current]").fill("contraseña123");
await p.locator("[name=confirm]").check();
await p
  .getByRole("button", {
    name: "Eliminar mi cuenta definitivamente",
    exact: true,
  })
  .click();
await p
  .getByRole("status")
  .filter({ hasText: "Tu cuenta y tus datos personales se han eliminado" })
  .waitFor();
await mod.p.goto(B + "/respaldar?q=" + encodeURIComponent(title));
check(
  "eliminar la cuenta retira sus títulos y la cola de revisión",
  !(await mod.p.locator("main").innerText()).includes(title),
);
await terminarDiagnosticos();
await browser.close();
