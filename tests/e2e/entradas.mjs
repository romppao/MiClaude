// Cartel y entradas de las veladas (fase 1, 15 de octubre de 2026): la promotora sube el cartel y abre la venta con precio y Bizum; el
// público reserva con una señal del 50 % por Bizum; la promotora confirma la señal, valida en la puerta, deshace y cancela. Lona no cobra.
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { B, rnd, browser, newUser, btn, check, seen, sql, enDias, esperarCorreo, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};
const ok = (p, texto) => seen(p.locator(".notice-ok", { hasText: texto }).first());

// 1) La promotora crea la velada con hora, sube el cartel y abre la venta.
const org = await newUser("Promotora", "FAN"); sql(`update "User" set role='ORGANIZER' where email='${org.email}';`);
await org.p.setViewportSize({ width: 390, height: 844 });
await org.p.goto(B + "/organizador");
const nombre = `Velada Entradas ${rnd}`;
await org.p.fill("[name=name]", nombre); await org.p.fill("[name=date]", enDias(30)); await org.p.fill("[name=hora]", "20:30");
await org.p.selectOption("select[name=discipline]", "BOXING"); await org.p.fill("[name=venue]", "Pabellón Lona"); await org.p.fill("[name=city]", "Madrid"); await org.p.selectOption("select[name=province]", "Madrid");
await org.p.selectOption("select[name=level]", "AMATEUR");
await btn(org.p, "Crear el evento"); await org.p.waitForURL((u) => /\/organizador\/[^/]+$/.test(u.pathname));
const slug = new URL(org.p.url()).pathname.split("/").pop();
check("la velada guarda la hora de inicio", (await db.event.findUniqueOrThrow({ where: { slug } })).startMinute === 20 * 60 + 30);

const seccion = org.p.locator("#entradas");
await seccion.locator("[name=precio]").fill("15");
await seccion.locator("[name=bizum]").fill("612 345 678");
await seccion.locator("[name=aforo]").fill("3");
const cartel = await sharp({ create: { width: 400, height: 600, channels: 3, background: { r: 190, g: 51, b: 245 } } }).png().toBuffer();
await seccion.locator("input[type=file][name=cartel]").setInputFiles({ name: "cartel.png", mimeType: "image/png", buffer: cartel });
await seccion.getByRole("button", { name: "Guardar y abrir la venta" }).click();
check("la promotora guarda cartel y entradas", await ok(org.p, "Cartel y entradas guardados"));
const ev = await db.event.findUniqueOrThrow({ where: { slug } });
check("la venta queda abierta con precio, aforo y Bizum", ev.ticketsOpen && ev.ticketPriceEuros === 15 && ev.ticketCapacity === 3 && ev.bizumPhone === "612345678" && !!ev.posterAt);
await axe(org.p, "Gestión de la velada con cartel y entradas");

// 2) El calendario la enseña como cartel con precio, hora y «Reservar»; la imagen del cartel se sirve.
const visita = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await visita.goto(B + `/veladas?q=${encodeURIComponent(nombre)}`);
const tarjeta = visita.locator(`a.velada-cartel[href="/veladas/${slug}"]`);
check("el calendario muestra la velada como cartel con precio, hora y «Reservar entradas»", await seen(tarjeta) && await seen(tarjeta.getByText("15 €")) && await seen(tarjeta.getByText(/20:30/).first()) && await seen(tarjeta.getByText("Reservar entradas")));
const src = await tarjeta.locator("img").first().getAttribute("src");
const imagen = await visita.request.get(B + src);
check("la imagen del cartel se sirve en WebP", imagen.ok() && imagen.headers()["content-type"] === "image/webp");
await axe(visita, "Calendario de veladas con carteles");

// 3) La ficha: datos, cartel y, sin cuenta, «Entra para reservar».
await visita.goto(B + `/veladas/${slug}`);
check("la ficha enseña el cartel, la hora, el lugar y el precio", await seen(visita.locator(".velada-poster img")) && await seen(visita.locator(".datos-velada").getByText("20:30")) && await seen(visita.locator(".datos-velada").getByText("Pabellón Lona")) && await seen(visita.locator(".datos-velada").getByText("15 €")));
check("sin cuenta se pide entrar para reservar", await seen(visita.getByRole("link", { name: "Entra para reservar" })));

// 4) Un aficionado reserva 2 entradas: ve el desglose y queda pendiente de señal.
const fan = await newUser("Aficionada", "FAN");
await fan.p.setViewportSize({ width: 390, height: 844 });
await fan.p.goto(B + `/veladas/${slug}#entradas`);
await fan.p.locator("#entradas select[name=cantidad]").selectOption("2");
check("el desglose cambia con el número de entradas: 30 € en total, 15 € de señal y 15 € en la puerta", await seen(fan.p.locator(".desglose").getByText("30 €")) && (await fan.p.locator(".desglose dd").allInnerTexts()).join("|") === "30 €|15 €|15 €");
await axe(fan.p, "Ficha de la velada con reserva de entradas");
await fan.p.getByRole("button", { name: "Reservar 2 entradas" }).click();
await fan.p.waitForURL("**/mis-entradas**");
check("tras reservar va a «Mis entradas» con el aviso", await ok(fan.p, "Reserva hecha"));
const reserva = await db.ticketReservation.findFirstOrThrow({ where: { event: { slug }, user: { email: fan.email } } });
check("la reserva queda pendiente de señal, con 15 € de señal y su código", reserva.status === "PENDING_DEPOSIT" && reserva.depositEuros === 15 && reserva.totalEuros === 30 && /^LONA-[A-Z2-9]{6}$/.test(reserva.code));
check("«Mis entradas» enseña el código grande, el Bizum de la promotora y el importe", await seen(fan.p.locator(".entrada-codigo").getByText(reserva.code)) && await seen(fan.p.getByText("612 345 678")) && await seen(fan.p.locator(".entrada-pasos .desglose-senal").getByText("15 €")));
check("le llega el correo con las instrucciones del Bizum", !!(await esperarCorreo(fan.email, reserva.code)));
await axe(fan.p, "Mis entradas");

// 5) No puede reservar dos veces la misma velada; otro aficionado no puede pasar del aforo (3).
await fan.p.goto(B + `/veladas/${slug}#entradas`);
check("con una reserva activa, la ficha enseña su estado en vez del formulario", await seen(fan.p.locator(".mi-reserva").getByText(reserva.code)) && (await fan.p.locator("#entradas select[name=cantidad]").count()) === 0);
const otro = await newUser("Segundo", "FAN");
await otro.p.goto(B + `/veladas/${slug}#entradas`);
check("solo se ofrecen las entradas que quedan (1)", (await otro.p.locator("#entradas select[name=cantidad] option").count()) === 1);

// 6) La promotora confirma la señal buscando el código, valida en la puerta y deshace.
await org.p.goto(B + `/organizador/${slug}/entradas?q=${reserva.code}`);
await axe(org.p, "Reservas de entradas de la promotora");
await org.p.getByRole("button", { name: `Señal recibida: ${reserva.code}` }).click();
check("la promotora confirma la señal", await ok(org.p, "Señal recibida"));
check("la reserva queda confirmada y le llega el correo", (await db.ticketReservation.findUniqueOrThrow({ where: { id: reserva.id } })).status === "CONFIRMED" && !!(await esperarCorreo(fan.email, "Reserva confirmada")));
await org.p.getByRole("button", { name: `Validar en la puerta (cobrar 15 €): ${reserva.code}` }).click();
check("en la puerta se valida", await ok(org.p, "Entrada validada"));
await org.p.goto(B + `/organizador/${slug}/entradas?estado=CHECKED_IN`);
await org.p.getByRole("button", { name: `Deshacer la validación: ${reserva.code}` }).click();
check("la validación se puede deshacer", await ok(org.p, "Validación deshecha") && (await db.ticketReservation.findUniqueOrThrow({ where: { id: reserva.id } })).status === "CONFIRMED");

// 7) CSV de la lista y permisos: nadie más ve las reservas.
const csv = await org.p.request.get(B + `/organizador/${slug}/entradas/csv?estado=todas`);
const texto = await csv.text();
check("la lista se descarga en CSV con el código y el correo", csv.ok() && texto.includes(reserva.code) && texto.includes(fan.email));
const ajeno = await fan.p.request.get(B + `/organizador/${slug}/entradas/csv`, { maxRedirects: 0 });
check("quien no organiza la velada no descarga la lista", ajeno.status() === 403);
await fan.p.goto(B + `/organizador/${slug}/entradas`);
check("ni abre la lista de reservas", new URL(fan.p.url()).pathname === "/organizador");

// 8) La persona cancela su reserva y libera las plazas; sus datos incluyen la reserva.
await fan.p.goto(B + "/mis-entradas");
await fan.p.getByRole("button", { name: `Cancelar la reserva para ${nombre}` }).click();
check("quien reservó la cancela", await ok(fan.p, "Reserva cancelada") && (await db.ticketReservation.findUniqueOrThrow({ where: { id: reserva.id } })).status === "CANCELLED");
await otro.p.goto(B + `/veladas/${slug}#entradas`);
check("al cancelar se liberan las plazas (vuelven a ser 3)", (await otro.p.locator("#entradas select[name=cantidad] option").count()) === 3);
const datos = await (await fan.p.request.get(B + "/mi-cuenta/datos")).json();
check("la descarga de datos personales incluye las entradas reservadas", datos.entradasQueHeReservado?.[0]?.codigo === reserva.code);

// 9) Una reserva sin señal a tiempo caduca y no ocupa plaza.
await otro.p.locator("#entradas select[name=cantidad]").selectOption("3");
await otro.p.getByRole("button", { name: "Reservar 3 entradas" }).click(); await otro.p.waitForURL("**/mis-entradas**");
const segunda = await db.ticketReservation.findFirstOrThrow({ where: { event: { slug }, user: { email: otro.email } } });
sql(`update "TicketReservation" set "depositUntil"=now() - interval '1 minute' where id='${segunda.id}';`);
await otro.p.reload();
check("vencido el plazo, la reserva sale como caducada", await seen(otro.p.locator(".tag.estado-EXPIRED").first()));
await org.p.goto(B + `/organizador/${slug}/entradas?estado=EXPIRED`);
check("la promotora la ve caducada y puede confirmarla si la señal llegó tarde", await seen(org.p.getByRole("button", { name: `Señal recibida (tarde): ${segunda.code}` })));

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
