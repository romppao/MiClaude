// Revisión de autorización para una velada pasada: oculta antes de decidir y visible solo al aprobar.
import { B, rnd, browser, btn, check, seen, enDias, newUser, hacerAdmin, esperarCorreo, terminarDiagnosticos, sql } from "./ayudas.mjs";

const organizador = await newUser("VeladaPasada", "FAN");
// En esta prueba se prepara el rol de organizador en la base de datos de pruebas.
sql(`UPDATE "User" SET role='ORGANIZER' WHERE email='${organizador.email}';`);

async function crear(nombre) {
  await organizador.p.goto(B + "/organizador");
  check("antes de crear, se advierte que las veladas pasadas requieren autorización", await organizador.p.locator("p.notice-info", { hasText: "Las veladas ya celebradas necesitan la autorización de un moderador" }).count() === 1);
  await organizador.p.fill("[name=name]", nombre);
  await organizador.p.fill("[name=date]", enDias(-3));
  await organizador.p.selectOption("[name=discipline]", "BOXEO");
  await organizador.p.selectOption("[name=level]", "AMATEUR");
  await organizador.p.fill("[name=city]", "Madrid");
  await organizador.p.selectOption("[name=province]", "Madrid");
  await btn(organizador.p, "Crear el evento");
  await organizador.p.waitForURL("**/organizador/*");
  const slug = new URL(organizador.p.url()).pathname.split("/").pop();
  check(`${nombre}: queda pendiente y se lo explica al organizador`, await organizador.p.getByText(/Pendiente de autorización/).count() === 1);
  return slug;
}

const anon = await (await browser.newContext()).newPage();
// Nombres únicos por ejecución: las búsquedas no deben encontrar veladas de otras ejecuciones (ya autorizadas).
const nombreAprobada = `Pasada aprobada ${rnd}`;
const nombreRechazada = `Pasada rechazada ${rnd}`;
const aprobada = await crear(nombreAprobada);
const bloqueada = await anon.goto(B + `/veladas/${aprobada}`);
check("una velada pendiente da 404 al público", bloqueada?.status() === 404);
const buscarPendiente = await anon.goto(B + `/buscar?q=${encodeURIComponent(nombreAprobada)}`);
// La página repite lo buscado («No hemos encontrado nada para «…»»): se comprueba que no hay enlace a la velada y que dice que no hay resultados.
check("la búsqueda pública tampoco revela la velada pendiente", await seen(anon.locator("main", { hasText: "No hemos encontrado nada" })) && await anon.getByRole("link", { name: nombreAprobada }).count() === 0);
const inscripcionPendiente = await anon.goto(B + `/veladas/${aprobada}/inscribirme`);
check("la inscripción de una velada pendiente no se puede abrir", inscripcionPendiente?.status() === 404);
await anon.goto(B + "/veladas?past=1");
check("una velada pendiente no aparece en el calendario", await anon.getByRole("link", { name: nombreAprobada }).count() === 0);
const mod = await newUser("ModeraVeladas", "FAN");
hacerAdmin(mod.email);
await mod.p.goto(B + "/moderacion/veladas");
const card = mod.p.locator("section", { hasText: nombreAprobada });
await card.locator("textarea[name=note]").fill("Fecha y cartel revisados");
await card.getByRole("button", { name: "Autorizar y publicar" }).click();
await mod.p.goto(B + "/moderacion/historial");
const historial = mod.p.locator("tr", { hasText: "velada pasada autorizada" }).first();
await historial.getByText("Ver el detalle técnico").click();
check("la decisión aprobada y su nota quedan en el historial", (await historial.innerText()).includes("Fecha y cartel revisados"));
check("el organizador recibe la decisión aprobada por correo", await esperarCorreo(organizador.email, "Tu velada pasada ha sido autorizada"));
const visible = await anon.goto(B + `/veladas/${aprobada}`);
check("tras autorizarla, la ficha pasa a ser pública", visible?.status() === 200);
await anon.goto(B + "/veladas?past=1");
check("la velada autorizada aparece en el calendario de anteriores", await await seen(anon.getByRole("link", { name: nombreAprobada })));

const rechazada = await crear(nombreRechazada);
await mod.p.goto(B + "/moderacion/veladas");
const cardRechazo = mod.p.locator("section", { hasText: nombreRechazada });
await cardRechazo.locator("textarea[name=note]").fill("No se pudo comprobar la fecha");
await cardRechazo.getByRole("button", { name: "Rechazar" }).click();
check("el rechazo también se notifica y la velada sigue oculta", await esperarCorreo(organizador.email, "Tu velada pasada no se ha autorizado") && (await anon.goto(B + `/veladas/${rechazada}`))?.status() === 404);

await terminarDiagnosticos();
await browser.close();
