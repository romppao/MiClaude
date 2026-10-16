// Entradas de las veladas: la promotora pone cartel, hora, precio y Bizum; el público reserva y paga la señal por Bizum; la promotora
// confirma la señal y valida la entrada en la puerta (lib/events/entradas.ts). Lona no cobra: solo lleva la cuenta de las reservas.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST).
"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { requireOrganizer } from "../../lib/accounts/permissions";
import { allow, HORA } from "../../lib/accounts/ratelimit";
import { audit } from "../../lib/common/audit";
import { APP_URL, sendMail } from "../../lib/common/mail";
import { oneLine } from "../../lib/common/text";
import { fmtDate } from "../../lib/common/labels";
import { hayBloqueo } from "../../lib/community/bloqueos";
import { putNotification } from "../../lib/community/notifications";
import { borrarFotos, guardarFoto } from "../../lib/media/fotos";
import { normalizeImage } from "../../lib/profiles/images";
import { MAX_ENTRADAS, caducarVencidas, cierreDeReservas, fmtBizum, fmtHora, motivoSinConfirmacion, motivoSinReserva, nuevoCodigo, parseBizum, parseHora, plazasOcupadas, plazoDeSenal, reservaOcupaPlaza, senal } from "../../lib/events/entradas";
import { Rechazo, checkLengths, go, guard, ownEvent, str, withLock } from "./shared";

const euros = (n: number) => `${n} €`;
const enteroEntre = (raw: string, min: number, max: number) => (/^\d{1,5}$/.test(raw) && Number(raw) >= min && Number(raw) <= max ? Number(raw) : null);

/** La promotora pone el cartel, la hora y las condiciones de las entradas. */
export async function guardarCartelYEntradas(f: FormData) {
  const user = await requireOrganizer();
  const event = await ownEvent(str(f, "eventId"), user);
  const back = `/organizador/${event.slug}#entradas`;
  checkLengths(f, back, { hora: 5, precio: 5, puerta: 5, aforo: 6, bizum: 20, nota: 300 });
  // La hora se corrige en «Datos de la velada»; aquí solo cambia si el formulario la trae.
  const hora = f.has("hora") ? (str(f, "hora") ? parseHora(str(f, "hora")) : null) : event.startMinute;
  if (str(f, "hora") && hora === null) go(back, { problema: "hora_invalida" });
  const precio = str(f, "precio") ? enteroEntre(str(f, "precio"), 1, 1000) : null;
  const puerta = str(f, "puerta") ? enteroEntre(str(f, "puerta"), 1, 1000) : null;
  const aforo = str(f, "aforo") ? enteroEntre(str(f, "aforo"), 1, 100000) : null;
  if ((str(f, "precio") && !precio) || (str(f, "puerta") && !puerta) || (str(f, "aforo") && !aforo)) go(back, { problema: "entradas_numeros" });
  const bizum = str(f, "bizum") ? parseBizum(str(f, "bizum")) : null;
  if (str(f, "bizum") && !bizum) go(back, { problema: "bizum_invalido" });
  const abrir = str(f, "abrir") === "1";
  if (abrir && (!precio || !bizum)) go(back, { problema: "entradas_incompletas" });

  // Cartel: se sustituye si llega uno nuevo y se quita si se marca «quitar».
  const archivo = f.get("cartel");
  let cartel: { clave: string | null; bytes: Uint8Array<ArrayBuffer> | null } | undefined;
  if (archivo instanceof File && archivo.size) {
    try { cartel = await guardarFoto("carteles", await normalizeImage(archivo, "poster")); }
    catch (e) { if (e instanceof Error && e.message === "imagen_invalida") go(back, { problema: "imagen_invalida" }); throw e; }
  } else if (str(f, "quitarCartel") === "1") cartel = { clave: null, bytes: null };

  const data = {
    startMinute: hora, ticketPriceEuros: precio, doorPriceEuros: puerta, ticketCapacity: aforo, bizumPhone: bizum, ticketNote: str(f, "nota") || null, ticketsOpen: abrir,
    ...(cartel && { posterKey: cartel.clave, posterAt: cartel.clave || cartel.bytes ? new Date() : null }),
  };
  await guard(back, () => withLock(`entradas:${event.id}`, async (tx) => {
    if (aforo !== null && aforo < (await plazasOcupadas(tx, event.id))) throw new Rechazo("aforo_menor_que_reservas");
    const actual = await tx.event.findUniqueOrThrow({ where: { id: event.id } });
    const startMinute = f.has("hora") ? hora : actual.startMinute;
    await tx.event.update({ where: { id: event.id }, data: { ...data, startMinute } });
    // También cubre los formularios antiguos que todavía envían la hora desde aquí.
    if (startMinute !== actual.startMinute) {
      const cierre = cierreDeReservas(actual.date, startMinute);
      await tx.ticketReservation.updateMany({ where: { eventId: event.id, status: "PENDING_DEPOSIT", depositUntil: { gt: cierre } }, data: { depositUntil: cierre } });
    }
    // Sin almacén, los bytes van a EventPoster; con almacén (o al quitar el cartel), esa fila sobra.
    if (cartel?.bytes) await tx.eventPoster.upsert({ where: { eventId: event.id }, create: { eventId: event.id, bytes: cartel.bytes }, update: { bytes: cartel.bytes } });
    else if (cartel) await tx.eventPoster.deleteMany({ where: { eventId: event.id } });
  }));
  if (cartel && event.posterKey && event.posterKey !== cartel.clave) await borrarFotos([event.posterKey]);
  await audit({ userId: user.id, entity: "EVENT", entityId: event.id, action: "TICKETS_UPDATED", after: { hora, precio, puerta, aforo, abrir, cartel: cartel ? (cartel.clave || cartel.bytes ? "nuevo" : "quitado") : "sin cambios" } });
  revalidatePath("/", "layout");
  go(back, { aviso: "entradas_guardadas" });
}

/** Reserva de entradas: queda pendiente de la señal por Bizum. */
export async function reservarEntradas(f: FormData) {
  const user = await requireVerifiedUser("/veladas");
  const event = await db.event.findUnique({ where: { id: str(f, "eventId") } });
  if (!event) go("/veladas", { problema: "no_existe" });
  const back = `/veladas/${event.slug}#entradas`;
  const cantidad = enteroEntre(str(f, "cantidad"), 1, MAX_ENTRADAS);
  if (!cantidad) go(back, { problema: "entradas_cantidad" });
  const motivo = motivoSinReserva(event);
  if (motivo) go(back, { problema: motivo });
  if (event.organizerId === user.id) go(back, { problema: "entradas_propias" });
  if (await hayBloqueo(user.id, event.organizerId)) go(back, { problema: "bloqueo_contacto" });
  if (!(await allow(`entradas:${user.id}`, 10, HORA))) go(back, { problema: "entradas_limite" });

  const { reserva, velada } = await guard(back, () => withLock(`entradas:${event.id}`, async (tx) => {
    const velada = await tx.event.findUniqueOrThrow({ where: { id: event.id } });
    const ahora = new Date();
    const motivo = motivoSinReserva(velada, ahora);
    if (motivo) throw new Rechazo(motivo);
    await caducarVencidas(tx, event.id, ahora);
    if (await tx.ticketReservation.findFirst({ where: { eventId: event.id, userId: user.id, status: { in: ["PENDING_DEPOSIT", "CONFIRMED"] } } })) throw new Rechazo("entradas_ya_reservadas");
    if (velada.ticketCapacity !== null && (await plazasOcupadas(tx, event.id, ahora)) + cantidad > velada.ticketCapacity) throw new Rechazo("entradas_agotadas");
    const unidad = velada.ticketPriceEuros!, total = unidad * cantidad;
    const creada = await tx.ticketReservation.create({ data: { eventId: event.id, userId: user.id, quantity: cantidad, unitEuros: unidad, totalEuros: total, depositEuros: senal(total), code: nuevoCodigo(), depositUntil: plazoDeSenal(ahora, velada.date, velada.startMinute) } });
    await audit({ userId: user.id, entity: "EVENT", entityId: event.id, action: "TICKETS_RESERVED", after: { reserva: creada.id, cantidad } }, tx);
    if (event.organizerId) await putNotification(event.organizerId, "TICKET", `Nueva reserva de ${cantidad === 1 ? "1 entrada" : `${cantidad} entradas`} para ${event.name}`, `/organizador/${event.slug}/entradas`, `ticket:${creada.id}`, tx);
    return { reserva: creada, velada };
  }));
  after(() => sendMail(user.email, `Tu reserva para ${oneLine(velada.name)}: envía la señal`, [
    `Has reservado ${reserva.quantity === 1 ? "1 entrada" : `${reserva.quantity} entradas`} para ${oneLine(velada.name)} (${fmtDate(velada.date)}${velada.startMinute !== null ? `, ${fmtHora(velada.startMinute)}` : ""}, ${oneLine(velada.venue)}).`,
    ``,
    `Para confirmarla, envía ${euros(reserva.depositEuros)} por Bizum al ${fmtBizum(velada.bizumPhone!)} con este concepto: ${reserva.code}`,
    `Tienes hasta el ${reserva.depositUntil.toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "long", timeStyle: "short" })}. Si no, la reserva caduca.`,
    `El resto, ${euros(reserva.totalEuros - reserva.depositEuros)}, se paga en la puerta.`,
    ``,
    `Tus entradas: ${APP_URL}/mis-entradas`,
  ].join("\n")));
  revalidatePath("/", "layout");
  go("/mis-entradas", { aviso: "entradas_reservadas" });
}

/** Quien reservó la cancela. Si ya estaba confirmada, la promotora decide sobre la señal (se le avisa). */
export async function cancelarMiReserva(f: FormData) {
  const user = await requireVerifiedUser("/mis-entradas");
  const back = "/mis-entradas";
  const r = await db.ticketReservation.findFirst({ where: { id: str(f, "reservaId"), userId: user.id }, include: { event: { select: { id: true, name: true, slug: true, organizerId: true } } } });
  if (!r) go(back, { problema: "no_existe" });
  await guard(back, () => db.$transaction(async (tx) => {
    const hecho = await tx.ticketReservation.updateMany({ where: { id: r.id, status: { in: ["PENDING_DEPOSIT", "CONFIRMED"] } }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelledBy: "comprador" } });
    if (hecho.count !== 1) throw new Rechazo("solicitud_cambiada");
    await audit({ userId: user.id, entity: "EVENT", entityId: r.event.id, action: "TICKETS_CANCELLED", after: { reserva: r.id, por: "comprador" } }, tx);
    if (r.event.organizerId) await putNotification(r.event.organizerId, "TICKET", `Han cancelado una reserva (${r.code}) de ${r.event.name}`, `/organizador/${r.event.slug}/entradas`, `ticket-cancel:${r.id}`, tx);
  }));
  revalidatePath("/", "layout");
  go(back, { aviso: "entradas_canceladas" });
}

const PASOS = {
  // Ha llegado la señal: la reserva queda confirmada (también si había caducado y aún hay sitio).
  senal: { desde: ["PENDING_DEPOSIT", "EXPIRED"] as const, a: "CONFIRMED" as const, aviso: "entradas_senal_confirmada", accion: "TICKETS_CONFIRMED" },
  // En la puerta: ha pagado el resto y entra.
  puerta: { desde: ["CONFIRMED"] as const, a: "CHECKED_IN" as const, aviso: "entradas_validadas", accion: "TICKETS_CHECKED_IN" },
  // Se deshace la validación (pulsado por error).
  deshacer: { desde: ["CHECKED_IN"] as const, a: "CONFIRMED" as const, aviso: "entradas_validacion_deshecha", accion: "TICKETS_CHECK_IN_UNDONE" },
  cancelar: { desde: ["PENDING_DEPOSIT", "CONFIRMED"] as const, a: "CANCELLED" as const, aviso: "entradas_canceladas_promotora", accion: "TICKETS_CANCELLED" },
};

/** La promotora confirma la señal, valida en la puerta, deshace la validación o cancela una reserva de su velada. */
export async function gestionarReserva(f: FormData) {
  const user = await requireOrganizer();
  const r = await db.ticketReservation.findUnique({ where: { id: str(f, "reservaId") }, include: { event: true, user: { select: { email: true } } } });
  if (!r) go("/organizador", { problema: "no_existe" });
  const event = await ownEvent(r.eventId, user);
  const back = `/organizador/${event.slug}/entradas${str(f, "filtro") ? `?estado=${encodeURIComponent(str(f, "filtro"))}` : ""}`;
  const paso = PASOS[str(f, "paso") as keyof typeof PASOS];
  if (!paso) go(back, { problema: "opcion_invalida" });
  await guard(back, () => withLock(`entradas:${event.id}`, async (tx) => {
    if (paso === PASOS.senal) {
      const actual = await tx.ticketReservation.findUniqueOrThrow({ where: { id: r.id } });
      const velada = await tx.event.findUniqueOrThrow({ where: { id: event.id } });
      const ahora = new Date();
      const noCuenta = !reservaOcupaPlaza(actual, ahora);
      const otraActiva = noCuenta && !!(await tx.ticketReservation.findFirst({ where: {
        eventId: event.id, userId: actual.userId, id: { not: actual.id },
        OR: [{ status: "CONFIRMED" }, { status: "PENDING_DEPOSIT", depositUntil: { gte: ahora } }],
      } }));
      const ocupadas = noCuenta ? await plazasOcupadas(tx, event.id, ahora) : 0;
      const motivo = motivoSinConfirmacion(actual, ahora, velada.ticketCapacity, ocupadas, otraActiva);
      if (motivo) throw new Rechazo(motivo);
    }
    const hecho = await tx.ticketReservation.updateMany({
      where: { id: r.id, status: { in: [...paso.desde] } },
      data: { status: paso.a, ...(paso.a === "CONFIRMED" && paso === PASOS.senal && { confirmedAt: new Date() }), ...(paso.a === "CHECKED_IN" && { checkedInAt: new Date() }), ...(paso === PASOS.deshacer && { checkedInAt: null }), ...(paso.a === "CANCELLED" && { cancelledAt: new Date(), cancelledBy: "promotora" }) },
    });
    if (hecho.count !== 1) throw new Rechazo("solicitud_cambiada");
    await audit({ userId: user.id, entity: "EVENT", entityId: event.id, action: paso.accion, after: { reserva: r.id } }, tx);
    if (paso === PASOS.senal) await putNotification(r.userId, "TICKET", `Reserva confirmada para ${event.name}`, "/mis-entradas", `ticket-ok:${r.id}`, tx);
    if (paso === PASOS.cancelar) await putNotification(r.userId, "TICKET", `La promotora ha cancelado tu reserva para ${event.name}`, "/mis-entradas", `ticket-cancel:${r.id}`, tx);
  }));
  if (paso === PASOS.senal) after(() => sendMail(r.user.email, `Reserva confirmada: ${oneLine(event.name)}`, `La promotora ha recibido tu señal. Tu reserva ${r.code} está confirmada (${r.quantity === 1 ? "1 entrada" : `${r.quantity} entradas`}).\n\nEn la puerta, di tu código o enséñalo desde ${APP_URL}/mis-entradas y paga el resto: ${euros(r.totalEuros - r.depositEuros)}.`));
  revalidatePath("/", "layout");
  go(back, { aviso: paso.aviso });
}
