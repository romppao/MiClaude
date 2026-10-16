import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cierreDeReservas, fmtBizum, fmtHora, inicioDeVelada, motivoSinConfirmacion, motivoSinReserva, nuevoCodigo, parseBizum, parseHora, plazoDeSenal, reservaOcupaPlaza, senal } from "../../src/lib/events/entradas";
import { PROBLEMAS } from "../../src/lib/common/messages";
import { gestionarReserva, guardarCartelYEntradas, reservarEntradas } from "../../src/app/actions/entradas";
import { updateEvent } from "../../src/app/actions/events";

// Sin PostgreSQL: las lecturas anteriores y posteriores al bloqueo pueden devolver datos
// distintos. Las escrituras y los efectos externos se simulan; no se prueba el motor de bloqueos.
const sim = vi.hoisted(() => ({
  bloqueada: false,
  db: { event: { findUnique: vi.fn() }, ticketReservation: { findUnique: vi.fn() } },
  tx: {
    event: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    ticketReservation: { findUniqueOrThrow: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn(), aggregate: vi.fn(), create: vi.fn() },
    eventPoster: { upsert: vi.fn(), deleteMany: vi.fn() },
    bout: { count: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
  },
  ownEvent: vi.fn(), guardarFoto: vi.fn(), borrarFotos: vi.fn(), after: vi.fn(), sendMail: vi.fn(),
}));
vi.mock("../../src/lib/common/db", () => ({ db: sim.db }));
vi.mock("next/server", () => ({ after: sim.after }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../../src/lib/accounts/auth", () => ({ requireVerifiedUser: async () => ({ id: "persona", email: "persona@example.test" }) }));
vi.mock("../../src/lib/accounts/permissions", () => ({ requireOrganizer: async () => ({ id: "promotora" }) }));
vi.mock("../../src/lib/accounts/ratelimit", () => ({ allow: async () => true, HORA: 3_600_000 }));
vi.mock("../../src/lib/common/audit", () => ({ audit: vi.fn() }));
vi.mock("../../src/lib/common/mail", () => ({ APP_URL: "https://example.test", sendMail: sim.sendMail }));
vi.mock("../../src/lib/community/bloqueos", () => ({ hayBloqueo: async () => false }));
vi.mock("../../src/lib/community/notifications", () => ({ putNotification: vi.fn() }));
vi.mock("../../src/lib/media/fotos", () => ({ guardarFoto: sim.guardarFoto, borrarFotos: sim.borrarFotos }));
vi.mock("../../src/lib/profiles/images", () => ({ normalizeImage: async () => new Uint8Array() }));
vi.mock("../../src/app/actions/shared", () => ({
  ownEvent: sim.ownEvent,
  str: (f: FormData, campo: string) => String(f.get(campo) ?? "").trim(),
  checkLengths: vi.fn(),
  readProvince: () => "Madrid",
  go: (_ruta: string, mensaje: { problema?: string; aviso?: string }) => { throw new Error(mensaje.problema ?? mensaje.aviso); },
  Rechazo: class extends Error {},
  guard: (_ruta: string, fn: () => Promise<unknown>) => fn(),
  withLock: async (clave: string, fn: (tx: typeof sim.tx) => Promise<unknown>) => {
    expect(clave).toBe("entradas:velada");
    sim.bloqueada = true;
    try { return await fn(sim.tx); } finally { sim.bloqueada = false; }
  },
}));

const dia = (s: string) => new Date(`${s}T00:00:00Z`);

describe("entradas de las veladas", () => {
  it("la señal es la mitad, redondeada al euro hacia arriba", () => {
    expect(senal(30)).toBe(15);
    expect(senal(25)).toBe(13);
    expect(senal(1)).toBe(1);
  });

  it("lee y escribe la hora", () => {
    expect(parseHora("20:30")).toBe(1230);
    expect(parseHora("9:05")).toBe(545);
    expect(parseHora("24:00")).toBeNull();
    expect(parseHora("20h")).toBeNull();
    expect(fmtHora(1230)).toBe("20:30");
    expect(fmtHora(545)).toBe("09:05");
  });

  it("el inicio respeta la hora peninsular en verano y en invierno", () => {
    expect(inicioDeVelada(dia("2026-07-10"), 20 * 60).toISOString()).toBe("2026-07-10T18:00:00.000Z");
    expect(inicioDeVelada(dia("2026-12-10"), 20 * 60).toISOString()).toBe("2026-12-10T19:00:00.000Z");
    expect(inicioDeVelada(dia("2026-12-10"), null).toISOString()).toBe("2026-12-10T19:00:00.000Z");
  });

  it("la señal se envía en 24 horas, pero nunca después del cierre (3 horas antes)", () => {
    const ahora = new Date("2026-12-01T10:00:00Z");
    expect(plazoDeSenal(ahora, dia("2026-12-10"), 1200).toISOString()).toBe("2026-12-02T10:00:00.000Z");
    expect(plazoDeSenal(ahora, dia("2026-12-01"), 1200)).toEqual(cierreDeReservas(dia("2026-12-01"), 1200));
  });

  it.each([
    ["2026-03-29", 90, "2026-03-29T00:30:00.000Z"],
    ["2026-03-29", 210, "2026-03-29T01:30:00.000Z"],
    ["2026-03-29", 1200, "2026-03-29T18:00:00.000Z"],
    ["2026-10-25", 90, "2026-10-24T23:30:00.000Z"],
    ["2026-10-25", 210, "2026-10-25T02:30:00.000Z"],
    ["2026-10-24", 1200, "2026-10-24T18:00:00.000Z"],
    ["2026-10-25", 1200, "2026-10-25T19:00:00.000Z"],
    ["2026-07-10", 1200, "2026-07-10T18:00:00.000Z"],
    ["2026-12-10", 1200, "2026-12-10T19:00:00.000Z"],
    // Hora inexistente: se desplaza a las 03:30. Hora repetida: segunda aparición.
    ["2026-03-29", 150, "2026-03-29T01:30:00.000Z"],
    ["2026-10-25", 150, "2026-10-25T01:30:00.000Z"],
  ])("inicio, cierre y señal para %s a los %i minutos", (fecha, minutos, inicio) => {
    const instante = Date.parse(inicio), cierre = new Date(instante - 3 * 3_600_000);
    expect(inicioDeVelada(dia(fecha), minutos).toISOString()).toBe(inicio);
    expect(cierreDeReservas(dia(fecha), minutos)).toEqual(cierre);
    // Cerca del cierre manda el límite de tres horas; lejos de él, 24 horas reales.
    expect(plazoDeSenal(new Date(instante - 4 * 3_600_000), dia(fecha), minutos)).toEqual(cierre);
    expect(plazoDeSenal(new Date(instante - 48 * 3_600_000), dia(fecha), minutos)).toEqual(new Date(instante - 24 * 3_600_000));
  });

  it("las 24 horas de señal atraviesan los cambios de horario sin ganar ni perder una hora", () => {
    for (const fecha of ["2026-03-29", "2026-10-25"]) {
      const ahora = new Date(`${fecha}T00:00:00Z`);
      expect(plazoDeSenal(ahora, dia("2026-11-10"), 1200).getTime() - ahora.getTime()).toBe(24 * 3_600_000);
    }
  });

  it("una pendiente cuenta hasta el instante exacto del plazo, pero no después", () => {
    const ahora = new Date("2026-10-16T10:00:00Z");
    expect(reservaOcupaPlaza({ status: "PENDING_DEPOSIT", depositUntil: ahora }, ahora)).toBe(true);
    expect(reservaOcupaPlaza({ status: "PENDING_DEPOSIT", depositUntil: new Date(ahora.getTime() - 1) }, ahora)).toBe(false);
    expect(reservaOcupaPlaza({ status: "PENDING_DEPOSIT", depositUntil: new Date(ahora.getTime() + 1) }, ahora)).toBe(true);
    for (const status of ["EXPIRED", "CANCELLED"] as const) expect(reservaOcupaPlaza({ status, depositUntil: ahora }, ahora)).toBe(false);
    for (const status of ["CONFIRMED", "CHECKED_IN"] as const) expect(reservaOcupaPlaza({ status, depositUntil: new Date(0) }, ahora)).toBe(true);
  });

  it.each(["EXPIRED", "PENDING_DEPOSIT"] as const)("confirmar %s vencida exige plaza y ausencia de otra activa", (status) => {
    const ahora = new Date("2026-10-16T10:00:00Z"), r = { status, depositUntil: new Date("2026-10-16T09:00:00Z"), quantity: 2 };
    expect(motivoSinConfirmacion(r, ahora, 10, 9, false)).toBe("entradas_agotadas");
    expect(motivoSinConfirmacion(r, ahora, 10, 8, false)).toBeNull();
    expect(motivoSinConfirmacion(r, ahora, null, 100, false)).toBeNull();
    const problema = motivoSinConfirmacion(r, ahora, null, 0, true);
    expect(problema).toBe("entradas_otra_activa");
    expect(PROBLEMAS[problema as keyof typeof PROBLEMAS]).toBe("Esa persona ya tiene otra reserva activa en esta velada. Cancela una de las dos antes de confirmar la señal.");
  });

  it("confirmar una pendiente vigente no suma de nuevo sus plazas", () => {
    const ahora = new Date("2026-10-16T10:00:00Z");
    expect(motivoSinConfirmacion({ status: "PENDING_DEPOSIT", depositUntil: ahora, quantity: 2 }, ahora, 10, 10, false)).toBeNull();
    for (const status of ["CONFIRMED", "CHECKED_IN", "CANCELLED"] as const) {
      expect(motivoSinConfirmacion({ status, depositUntil: ahora, quantity: 2 }, ahora, null, 0, false)).toBe("solicitud_cambiada");
    }
  });

  it("solo acepta móviles españoles como Bizum", () => {
    expect(parseBizum("+34 612 345 678")).toBe("612345678");
    expect(parseBizum("712-345-678")).toBe("712345678");
    expect(parseBizum("912345678")).toBeNull();
    expect(parseBizum("61234567")).toBeNull();
    expect(fmtBizum("612345678")).toBe("612 345 678");
  });

  it("el código es corto y sin letras que se confundan", () => {
    const codigos = new Set(Array.from({ length: 200 }, nuevoCodigo));
    expect(codigos.size).toBe(200);
    for (const c of codigos) expect(c).toMatch(/^LONA-[A-HJKMNP-Z2-9]{6}$/);
  });

  it("explica por qué no se puede reservar", () => {
    const base = { status: "SCHEDULED", date: dia("2026-12-10"), startMinute: 1200, ticketsOpen: true, ticketPriceEuros: 20, bizumPhone: "612345678" };
    const antes = new Date("2026-12-01T10:00:00Z");
    expect(motivoSinReserva(base, antes)).toBeNull();
    expect(motivoSinReserva({ ...base, ticketsOpen: false }, antes)).toBe("entradas_no_disponibles");
    expect(motivoSinReserva({ ...base, bizumPhone: null }, antes)).toBe("entradas_no_disponibles");
    expect(motivoSinReserva({ ...base, status: "CANCELLED" }, antes)).toBe("entradas_no_disponibles");
    expect(motivoSinReserva(base, new Date("2026-12-10T17:00:00Z"))).toBe("entradas_cerradas");
  });
});

describe("acciones de entradas con datos que cambian antes del bloqueo", () => {
  const velada = () => ({ id: "velada", slug: "velada", name: "Velada", organizerId: "promotora", date: new Date("2026-10-25T12:00:00Z"), startMinute: 1200, status: "SCHEDULED", ticketsOpen: true, ticketCapacity: 10, ticketPriceEuros: 20, bizumPhone: "612345678", venue: "Pabellón", posterKey: "cartel-antiguo", discipline: "BOXEO", level: "AMATEUR", kind: "VELADA" });
  const reserva = () => ({ id: "reserva", eventId: "velada", userId: "persona", status: "PENDING_DEPOSIT", depositUntil: new Date("2026-10-17T10:00:00Z"), quantity: 2, code: "LONA-ABCDEF", totalEuros: 40, depositEuros: 20, user: { email: "persona@example.test" } });
  const formulario = (datos: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries({ eventId: "velada", reservaId: "reserva", ...datos })) f.set(k, v);
    return f;
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-16T10:00:00Z"));
    sim.bloqueada = false;
    sim.ownEvent.mockResolvedValue(velada());
    sim.db.event.findUnique.mockResolvedValue(velada());
    sim.db.ticketReservation.findUnique.mockResolvedValue(reserva());
    sim.tx.event.findUniqueOrThrow.mockImplementation(async () => { expect(sim.bloqueada).toBe(true); return velada(); });
    sim.tx.ticketReservation.findUniqueOrThrow.mockImplementation(async () => { expect(sim.bloqueada).toBe(true); return reserva(); });
    sim.tx.ticketReservation.findFirst.mockResolvedValue(null);
    sim.tx.ticketReservation.aggregate.mockResolvedValue({ _sum: { quantity: 9 } });
    sim.tx.ticketReservation.updateMany.mockResolvedValue({ count: 1 });
    sim.tx.ticketReservation.create.mockImplementation(async ({ data }) => ({ ...data, id: "nueva" }));
    sim.tx.event.update.mockImplementation(async ({ data }) => { expect(sim.bloqueada).toBe(true); return { ...velada(), ...data }; });
    sim.tx.bout.findMany.mockResolvedValue([]);
  });
  afterEach(() => vi.useRealTimers());

  it.each(["EXPIRED", "PENDING_DEPOSIT"])("relee la reserva (%s) y el aforo antes de confirmar una señal tardía", async (status) => {
    // Fuera del bloqueo parecía vigente y cabía; dentro, ya no cuenta y el aforo ha bajado.
    sim.tx.ticketReservation.findUniqueOrThrow.mockResolvedValue({ ...reserva(), status, depositUntil: new Date("2026-10-16T09:00:00Z") });
    sim.tx.event.findUniqueOrThrow.mockResolvedValue({ ...velada(), ticketCapacity: 9 });
    sim.tx.ticketReservation.aggregate.mockResolvedValue({ _sum: { quantity: 8 } });
    await expect(gestionarReserva(formulario({ paso: "senal" }))).rejects.toThrow("entradas_agotadas");
    expect(sim.tx.ticketReservation.updateMany).not.toHaveBeenCalled();
  });

  it.each(["CONFIRMED", "PENDING_DEPOSIT"])("rechaza una señal tardía si hay otra reserva activa %s", async (status) => {
    sim.tx.ticketReservation.findUniqueOrThrow.mockResolvedValue({ ...reserva(), status: "EXPIRED" });
    sim.tx.ticketReservation.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
    sim.tx.ticketReservation.findFirst.mockResolvedValue({ id: "otra", status });
    await expect(gestionarReserva(formulario({ paso: "senal" }))).rejects.toThrow("entradas_otra_activa");
    expect(sim.tx.ticketReservation.findFirst).toHaveBeenCalledWith({ where: {
      eventId: "velada", userId: "persona", id: { not: "reserva" },
      OR: [{ status: "CONFIRMED" }, { status: "PENDING_DEPOSIT", depositUntil: { gte: new Date() } }],
    } });
    expect(sim.tx.ticketReservation.updateMany).not.toHaveBeenCalled();
  });

  it("confirma una señal tardía si cabe y no hay otra activa", async () => {
    sim.tx.ticketReservation.findUniqueOrThrow.mockResolvedValue({ ...reserva(), status: "EXPIRED" });
    sim.tx.ticketReservation.aggregate.mockResolvedValue({ _sum: { quantity: 8 } });
    await expect(gestionarReserva(formulario({ paso: "senal" }))).rejects.toThrow("entradas_senal_confirmada");
    expect(sim.tx.ticketReservation.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "CONFIRMED" }) }));
  });

  it("comprueba el aforo bajo el bloqueo, con el cliente de la transacción", async () => {
    sim.tx.ticketReservation.aggregate.mockImplementation(async () => { expect(sim.bloqueada).toBe(true); return { _sum: { quantity: 9 } }; });
    await expect(guardarCartelYEntradas(formulario({ precio: "20", aforo: "8" }))).rejects.toThrow("aforo_menor_que_reservas");
    expect(sim.tx.event.update).not.toHaveBeenCalled();
  });

  it("guarda primero la imagen, actualiza bajo el bloqueo y borra después la antigua", async () => {
    sim.guardarFoto.mockImplementation(async () => { expect(sim.bloqueada).toBe(false); return { clave: "cartel-nuevo", bytes: null }; });
    sim.borrarFotos.mockImplementation(async () => { expect(sim.bloqueada).toBe(false); expect(sim.tx.event.update).toHaveBeenCalled(); });
    const f = formulario({ precio: "20", aforo: "10" });
    f.set("cartel", new File(["imagen"], "cartel.png", { type: "image/png" }));
    await expect(guardarCartelYEntradas(f)).rejects.toThrow("entradas_guardadas");
    expect(sim.guardarFoto.mock.invocationCallOrder[0]).toBeLessThan(sim.tx.event.update.mock.invocationCallOrder[0]);
    expect(sim.borrarFotos).toHaveBeenCalledWith(["cartel-antiguo"]);
  });

  it.each([
    { ticketsOpen: false }, { bizumPhone: null }, { ticketPriceEuros: null }, { status: "CANCELLED" },
    { date: new Date("2026-10-16T12:00:00Z"), startMinute: 12 * 60 },
  ])("revalida la venta dentro del bloqueo: %j", async (cambio) => {
    sim.tx.event.findUniqueOrThrow.mockResolvedValue({ ...velada(), ...cambio });
    await expect(reservarEntradas(formulario({ cantidad: "1" }))).rejects.toThrow(cambio.startMinute ? "entradas_cerradas" : "entradas_no_disponibles");
    expect(sim.tx.ticketReservation.create).not.toHaveBeenCalled();
  });

  it("reserva con el aforo, precio, plazo y Bizum releídos", async () => {
    sim.tx.event.findUniqueOrThrow.mockResolvedValue({ ...velada(), ticketPriceEuros: 25, ticketCapacity: 12, bizumPhone: "712345678", date: new Date("2026-10-16T12:00:00Z"), startMinute: 18 * 60 });
    await expect(reservarEntradas(formulario({ cantidad: "2" }))).rejects.toThrow("entradas_reservadas");
    expect(sim.tx.ticketReservation.create).toHaveBeenCalledWith({ data: expect.objectContaining({ quantity: 2, unitEuros: 25, totalEuros: 50, depositEuros: 25, depositUntil: new Date("2026-10-16T13:00:00Z") }) });
    await sim.after.mock.calls[0][0]();
    expect(sim.sendMail.mock.calls[0][2]).toContain("712 345 678");
  });

  it("rechaza una reserva que ya no cabe con el aforo releído", async () => {
    sim.tx.event.findUniqueOrThrow.mockResolvedValue({ ...velada(), ticketCapacity: 9 });
    await expect(reservarEntradas(formulario({ cantidad: "1" }))).rejects.toThrow("entradas_agotadas");
    expect(sim.tx.ticketReservation.create).not.toHaveBeenCalled();
  });

  it.each([
    ["2026-10-24", "20:00", "2026-10-24T15:00:00Z"],
    ["2026-10-25", "18:00", "2026-10-25T14:00:00Z"],
    ["2026-10-16", "12:00", "2026-10-16T07:00:00Z"],
    ["2026-10-26", "20:00", "2026-10-26T16:00:00Z"],
  ])("editar fecha/hora a %s %s solo acorta pendientes, también con un cierre pasado", async (date, hora, cierre) => {
    await expect(updateEvent(formulario({ name: "Velada", date, hora }))).rejects.toThrow("velada_actualizada");
    // El filtro estricto conserva los plazos anteriores o iguales y excluye los otros estados.
    expect(sim.tx.ticketReservation.updateMany).toHaveBeenCalledWith({ where: { eventId: "velada", status: "PENDING_DEPOSIT", depositUntil: { gt: new Date(cierre) } }, data: { depositUntil: new Date(cierre) } });
    expect(sim.tx.event.update.mock.invocationCallOrder[0]).toBeLessThan(sim.tx.ticketReservation.updateMany.mock.invocationCallOrder[0]);
  });
});
