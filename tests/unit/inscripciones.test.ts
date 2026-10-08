import { describe, expect, it } from "vitest";
import { filtrarYOrdenar, inscripcionAbierta, numeroDeFiltro, parseEstadoLista, parseOrden, parseRegistration, parseRegistrationSettings, puedeResponderInscripcion, puedeRetirarInscripcion, type FilaInscripcion } from "../../src/lib/events/registrations";

const dia = (d: string) => new Date(`${d}T00:00:00Z`);

describe("inscripcionAbierta", () => {
  const base = { registrationOpen: true, status: "SCHEDULED", date: dia("2026-11-20"), registrationUntil: null };
  it("abierta, programada y futura", () => expect(inscripcionAbierta(base, "2026-10-09")).toBe(true));
  it("el mismo día del evento todavía se puede pedir", () => expect(inscripcionAbierta(base, "2026-11-20")).toBe(true));
  it("cerrada por el organizador, cancelada o ya celebrada, no", () => {
    expect(inscripcionAbierta({ ...base, registrationOpen: false }, "2026-10-09")).toBe(false);
    expect(inscripcionAbierta({ ...base, status: "CANCELLED" }, "2026-10-09")).toBe(false);
    expect(inscripcionAbierta(base, "2026-11-21")).toBe(false);
  });
  it("respeta la fecha límite, incluido su último día", () => {
    const conLimite = { ...base, registrationUntil: dia("2026-11-01") };
    expect(inscripcionAbierta(conLimite, "2026-11-01")).toBe(true);
    expect(inscripcionAbierta(conLimite, "2026-11-02")).toBe(false);
  });
});

describe("parseRegistration", () => {
  it("peso opcional, con coma o punto y un decimal", () => {
    expect(parseRegistration({ weightKg: "", message: "" })).toEqual({ ok: true, value: { weightKg: null, message: null } });
    expect(parseRegistration({ weightKg: "63,5", message: "  Listo  para   pelear " })).toEqual({ ok: true, value: { weightKg: 63.5, message: "Listo para pelear" } });
    expect(parseRegistration({ weightKg: "72.4", message: "" })).toMatchObject({ ok: true, value: { weightKg: 72.4 } });
  });
  it("rechaza pesos imposibles o mal escritos", () => {
    for (const w of ["19", "201", "abc", "63,55", "-60", "1e2"]) expect(parseRegistration({ weightKg: w, message: "" })).toEqual({ ok: false, problema: "inscripcion_peso" });
  });
  it("mensaje de 500 caracteres como mucho", () => {
    expect(parseRegistration({ weightKg: "", message: "a".repeat(501) })).toEqual({ ok: false, problema: "inscripcion_mensaje_largo" });
  });
});

describe("parseRegistrationSettings", () => {
  const b = { note: "", until: "", hoy: "2026-10-09", diaEvento: "2026-11-20" };
  it("sin requisitos ni fecha límite", () => expect(parseRegistrationSettings(b)).toEqual({ ok: true, value: { registrationNote: null, registrationUntil: null } }));
  it("la fecha límite va de hoy al día del evento", () => {
    expect(parseRegistrationSettings({ ...b, until: "2026-11-20" })).toMatchObject({ ok: true });
    expect(parseRegistrationSettings({ ...b, until: "2026-10-08" })).toEqual({ ok: false, problema: "inscripcion_fecha_limite" });
    expect(parseRegistrationSettings({ ...b, until: "2026-11-21" })).toEqual({ ok: false, problema: "inscripcion_fecha_limite" });
    expect(parseRegistrationSettings({ ...b, until: "mañana" })).toEqual({ ok: false, problema: "inscripcion_fecha_limite" });
  });
  it("requisitos de 500 caracteres como mucho", () => expect(parseRegistrationSettings({ ...b, note: "x".repeat(501) })).toEqual({ ok: false, problema: "inscripcion_requisitos_largo" }));
});

describe("filtrarYOrdenar (la lista del organizador)", () => {
  const fila = (id: string, x: Partial<FilaInscripcion>): FilaInscripcion => ({ id, status: "PENDING", createdAt: dia("2026-10-01"), nombre: id, gimnasio: null, provincia: null, divisionId: null, weightClass: null, weightKg: null, combates: 0, victorias: 0, aura: 0, edad: null, ...x });
  const filas = [
    fila("Álvaro Ruiz", { createdAt: dia("2026-10-03"), gimnasio: "Club Turia", provincia: "Valencia", combates: 12, victorias: 9, aura: 40, weightKg: 70, edad: 27, weightClass: "M71" }),
    fila("Beatriz Gil", { createdAt: dia("2026-10-01"), provincia: "Sevilla", combates: 3, victorias: 3, aura: 5, weightKg: 57, edad: 19, weightClass: "F57" }),
    fila("Carla Peña", { createdAt: dia("2026-10-02"), status: "ACCEPTED", provincia: "Valencia", combates: 0, aura: 12, edad: 31 }),
    fila("Diego Sanz", { createdAt: dia("2026-10-04"), status: "WITHDRAWN", combates: 5, aura: 1, weightKg: 66.5, edad: 22 }),
  ];
  const nombres = (l: FilaInscripcion[]) => l.map((r) => r.nombre);
  it("por defecto, solo las pendientes y por orden de llegada", () => expect(nombres(filtrarYOrdenar(filas, {}))).toEqual(["Beatriz Gil", "Álvaro Ruiz"]));
  it("«todas» incluye cualquier estado", () => expect(filtrarYOrdenar(filas, { estado: "TODAS" })).toHaveLength(4));
  it("busca por nombre o gimnasio sin importar tildes ni mayúsculas", () => {
    expect(nombres(filtrarYOrdenar(filas, { estado: "TODAS", texto: "alvaro" }))).toEqual(["Álvaro Ruiz"]);
    expect(nombres(filtrarYOrdenar(filas, { estado: "TODAS", texto: "TURIA" }))).toEqual(["Álvaro Ruiz"]);
  });
  it("filtra por provincia, categoría y número de combates", () => {
    expect(nombres(filtrarYOrdenar(filas, { estado: "TODAS", provincia: "Valencia", orden: "nombre" }))).toEqual(["Álvaro Ruiz", "Carla Peña"]);
    expect(nombres(filtrarYOrdenar(filas, { estado: "TODAS", weightClass: "F57" }))).toEqual(["Beatriz Gil"]);
    expect(nombres(filtrarYOrdenar(filas, { estado: "TODAS", minCombates: 3, maxCombates: 5, orden: "nombre" }))).toEqual(["Beatriz Gil", "Diego Sanz"]);
  });
  it("con edad o peso pedidos, quien no los indicó queda fuera", () => {
    expect(nombres(filtrarYOrdenar(filas, { estado: "TODAS", minPeso: 60, maxPeso: 70, orden: "peso" }))).toEqual(["Diego Sanz", "Álvaro Ruiz"]);
    expect(nombres(filtrarYOrdenar(filas, { estado: "TODAS", minEdad: 20, maxEdad: 30, orden: "edad" }))).toEqual(["Diego Sanz", "Álvaro Ruiz"]);
  });
  it("ordena por aura, victorias, combates, experiencia y nombre", () => {
    const t = { estado: "TODAS" as const };
    expect(nombres(filtrarYOrdenar(filas, { ...t, orden: "aura" }))[0]).toBe("Álvaro Ruiz");
    expect(nombres(filtrarYOrdenar(filas, { ...t, orden: "victorias" })).slice(0, 2)).toEqual(["Álvaro Ruiz", "Beatriz Gil"]);
    expect(nombres(filtrarYOrdenar(filas, { ...t, orden: "experiencia" }))[0]).toBe("Carla Peña");
    expect(nombres(filtrarYOrdenar(filas, { ...t, orden: "nombre" }))).toEqual(["Álvaro Ruiz", "Beatriz Gil", "Carla Peña", "Diego Sanz"]);
    // Sin peso declarado, al final.
    expect(nombres(filtrarYOrdenar(filas, { ...t, orden: "peso" })).at(-1)).toBe("Carla Peña");
  });
});

describe("parámetros de la lista", () => {
  it("estado y orden desconocidos vuelven a los de por defecto", () => {
    expect(parseEstadoLista("aceptadas")).toBe("aceptadas");
    expect(parseEstadoLista("constructor")).toBe("pendientes");
    expect(parseOrden("aura")).toBe("aura");
    expect(parseOrden("__proto__")).toBe("fecha");
  });
  it("números de los filtros", () => {
    expect(numeroDeFiltro("3")).toBe(3);
    expect(numeroDeFiltro("63,5")).toBe(63.5);
    expect(numeroDeFiltro("")).toBeUndefined();
    expect(numeroDeFiltro("-1")).toBeUndefined();
    expect(numeroDeFiltro("abc")).toBeUndefined();
  });
  it("quién puede responder o retirar", () => {
    expect(puedeResponderInscripcion("WITHDRAWN")).toBe(false);
    expect(puedeResponderInscripcion("DECLINED")).toBe(true);
    expect(puedeRetirarInscripcion("DECLINED")).toBe(false);
    expect(puedeRetirarInscripcion("ACCEPTED")).toBe(true);
  });
});
