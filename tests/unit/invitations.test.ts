/** Invitaciones a peleadores: quién puede invitar a quién y con qué condiciones (plan aprobado el 17-10-2026). */
import { describe, expect, it } from "vitest";
import {
  INVITATIONS_PER_DAY, INVITATION_DAYS_TO_ANSWER, INVITATION_MESSAGE_MAX, caducaEn, contactoCompartido, desdeRepeticion, destinoDisponible, edadEn,
  invitacionCaducada, parseAjustesDeContacto, parseInvitation, puedeInvitar, puedeResponderInvitacion, puedeRetirarInvitacion, veladaInvitable,
} from "../../src/lib/community/invitations";

const hoy = "2026-10-17";
const verificado = new Date("2026-01-01");

describe("quién puede invitar", () => {
  it("organizadores aprobados y entrenadores con el correo verificado", () => {
    expect(puedeInvitar({ role: "ORGANIZER", emailVerifiedAt: verificado })).toEqual({ ok: true });
    expect(puedeInvitar({ role: "TRAINER", emailVerifiedAt: verificado })).toEqual({ ok: true });
  });
  it("ni aficionados, ni peleadores (usan las propuestas), ni moderación", () => {
    for (const role of ["FAN", "FIGHTER", "ADMIN"]) expect(puedeInvitar({ role, emailVerifiedAt: verificado })).toEqual({ ok: false, problema: "invitacion_sin_permiso" });
  });
  it("sin correo verificado no", () => expect(puedeInvitar({ role: "TRAINER", emailVerifiedAt: null })).toEqual({ ok: false, problema: "invitacion_sin_correo" }));
  it("una cuenta suspendida para invitar no", () => expect(puedeInvitar({ role: "ORGANIZER", emailVerifiedAt: verificado, invitacionesSuspendidas: true })).toEqual({ ok: false, problema: "invitacion_suspendida" }));
  it("el límite diario es de 10", () => expect(INVITATIONS_PER_DAY).toBe(10));
});

describe("a quién se puede invitar", () => {
  const ok = { listed: true, hiddenAt: null, userId: "u1", acceptsInvitations: true, birthDate: new Date("1995-03-02") };
  it("ficha visible, con titular, abierta y de una persona mayor de edad", () => expect(destinoDisponible(ok, hoy)).toEqual({ ok: true }));
  it("una ficha oculta o no listada no existe", () => {
    expect(destinoDisponible({ ...ok, listed: false }, hoy)).toEqual({ ok: false, problema: "no_existe" });
    expect(destinoDisponible({ ...ok, hiddenAt: new Date() }, hoy)).toEqual({ ok: false, problema: "no_existe" });
  });
  it("sin titular nadie podría responder", () => expect(destinoDisponible({ ...ok, userId: null }, hoy)).toEqual({ ok: false, problema: "invitacion_sin_titular" }));
  it("si cerró las invitaciones, «no disponible» sin dar más pistas", () => expect(destinoDisponible({ ...ok, acceptsInvitations: false }, hoy)).toEqual({ ok: false, problema: "invitacion_no_disponible" }));
  it("menores y fecha de nacimiento desconocida: no hasta resolver T-014, con el mismo mensaje", () => {
    expect(destinoDisponible({ ...ok, birthDate: new Date("2010-05-01") }, hoy)).toEqual({ ok: false, problema: "invitacion_no_disponible" });
    expect(destinoDisponible({ ...ok, birthDate: null }, hoy)).toEqual({ ok: false, problema: "invitacion_no_disponible" });
  });
  it("cumple 18 hoy: ya puede; los cumple mañana: todavía no", () => {
    expect(destinoDisponible({ ...ok, birthDate: new Date("2008-10-17") }, hoy)).toEqual({ ok: true });
    expect(destinoDisponible({ ...ok, birthDate: new Date("2008-10-18") }, hoy)).toEqual({ ok: false, problema: "invitacion_no_disponible" });
  });
  it("la edad se cuenta con cumpleaños", () => {
    expect(edadEn(new Date("2000-10-18"), hoy)).toBe(25);
    expect(edadEn(new Date("2000-10-17"), hoy)).toBe(26);
    expect(edadEn(null, hoy)).toBeNull();
  });
});

describe("lo escrito en la invitación", () => {
  const base = { kind: "EVENT", discipline: "BOXEO", message: "  Nos encantaría contar contigo  ", disciplinasDelDestino: ["BOXEO", "MMA"] as never[] };
  it("limpia el mensaje y acepta una disciplina de la ficha invitada", () => {
    expect(parseInvitation(base)).toEqual({ ok: true, value: { kind: "EVENT", discipline: "BOXEO", message: "Nos encantaría contar contigo" } });
  });
  it("tipo desconocido", () => expect(parseInvitation({ ...base, kind: "OTRO" })).toEqual({ ok: false, problema: "invitacion_tipo" }));
  it("la disciplina tiene que ser una de las del peleador invitado", () => expect(parseInvitation({ ...base, discipline: "MUAYTHAI" })).toEqual({ ok: false, problema: "invitacion_disciplina" }));
  it("un sparring exige que la disciplina también sea del peleador en cuyo nombre se propone", () => {
    expect(parseInvitation({ ...base, kind: "SPARRING" })).toEqual({ ok: false, problema: "invitacion_disciplina" });
    expect(parseInvitation({ ...base, kind: "SPARRING", disciplinasDelPropio: ["MMA"] as never[] })).toEqual({ ok: false, problema: "invitacion_disciplina" });
    expect(parseInvitation({ ...base, kind: "SPARRING", disciplinasDelPropio: ["BOXEO"] as never[] }).ok).toBe(true);
  });
  it("sin mensaje es válido, y uno demasiado largo no", () => {
    expect(parseInvitation({ ...base, message: "" })).toEqual({ ok: true, value: { kind: "EVENT", discipline: "BOXEO", message: null } });
    expect(parseInvitation({ ...base, message: "x".repeat(INVITATION_MESSAGE_MAX + 1) })).toEqual({ ok: false, problema: "texto_largo" });
  });
});

describe("invitar a una velada", () => {
  const ev = { organizerId: "org1", status: "SCHEDULED", registrationOpen: true, date: new Date("2026-12-01"), discipline: "BOXEO" as never };
  it("la velada es de quien invita, está programada, con inscripción abierta y por celebrar", () => {
    expect(veladaInvitable(ev, { id: "org1", role: "ORGANIZER" }, hoy)).toEqual({ ok: true });
  });
  it("la velada de otro organizador no", () => expect(veladaInvitable(ev, { id: "otro", role: "ORGANIZER" }, hoy)).toEqual({ ok: false, problema: "invitacion_velada_ajena" }));
  it("moderación sí puede en nombre de cualquiera", () => expect(veladaInvitable(ev, { id: "mod", role: "ADMIN" }, hoy)).toEqual({ ok: true }));
  it("cerrada, cancelada o ya celebrada no", () => {
    for (const cambio of [{ registrationOpen: false }, { status: "CANCELLED" }, { date: new Date("2026-10-01") }]) {
      expect(veladaInvitable({ ...ev, ...cambio }, { id: "org1", role: "ORGANIZER" }, hoy)).toEqual({ ok: false, problema: "invitacion_velada" });
    }
  });
});

describe("vida de una invitación", () => {
  const ahora = new Date("2026-10-17T10:00:00Z");
  it("caduca a los 14 días", () => {
    expect(INVITATION_DAYS_TO_ANSWER).toBe(14);
    expect(caducaEn(ahora).toISOString().slice(0, 10)).toBe("2026-10-31");
  });
  it("se puede responder mientras esté pendiente y no haya caducado", () => {
    expect(puedeResponderInvitacion({ status: "PENDING", expiresAt: caducaEn(ahora) }, ahora)).toBe(true);
    expect(puedeResponderInvitacion({ status: "PENDING", expiresAt: ahora }, ahora)).toBe(false);
    expect(invitacionCaducada({ status: "PENDING", expiresAt: new Date(ahora.getTime() - 1) }, ahora)).toBe(true);
    for (const status of ["ACCEPTED", "DECLINED", "WITHDRAWN", "EXPIRED"] as const) expect(puedeResponderInvitacion({ status, expiresAt: caducaEn(ahora) }, ahora)).toBe(false);
  });
  it("solo se retira una pendiente", () => {
    expect(puedeRetirarInvitacion({ status: "PENDING", expiresAt: ahora })).toBe(true);
    expect(puedeRetirarInvitacion({ status: "ACCEPTED", expiresAt: ahora })).toBe(false);
  });
  it("tras un rechazo, no se repite durante 30 días", () => expect(desdeRepeticion(ahora).toISOString().slice(0, 10)).toBe("2026-09-17"));
});

describe("contacto que se comparte al aceptar", () => {
  const datos = { email: "ana@ejemplo.es", phone: "612345678", instagram: "ana.boxeo" };
  it("solo el canal elegido", () => {
    expect(contactoCompartido("EMAIL", datos)).toBe("Correo: ana@ejemplo.es");
    expect(contactoCompartido("PHONE", datos)).toBe("Teléfono: 612345678");
    expect(contactoCompartido("INSTAGRAM", datos)).toBe("Instagram: @ana.boxeo");
  });
  it("si falta el dato del canal elegido, el correo de la cuenta; nunca el teléfono sin permiso", () => {
    expect(contactoCompartido("PHONE", { ...datos, phone: null })).toBe("Correo: ana@ejemplo.es");
    expect(contactoCompartido("EMAIL", datos)).not.toContain("612345678");
  });
  it("ajustes: teléfono válido", () => {
    expect(parseAjustesDeContacto({ accepts: "1", channel: "PHONE", phone: "612 345 678", instagram: "" })).toEqual({ ok: true, value: { acceptsInvitations: true, contactChannel: "PHONE", contactPhone: "612345678", contactInstagram: null } });
    expect(parseAjustesDeContacto({ accepts: "1", channel: "PHONE", phone: "12", instagram: "" })).toEqual({ ok: false, problema: "contacto_telefono" });
  });
  it("ajustes: Instagram con o sin arroba, y rechaza espacios", () => {
    expect(parseAjustesDeContacto({ accepts: "1", channel: "INSTAGRAM", phone: "", instagram: "@ana.boxeo" })).toEqual({ ok: true, value: { acceptsInvitations: true, contactChannel: "INSTAGRAM", contactPhone: null, contactInstagram: "ana.boxeo" } });
    expect(parseAjustesDeContacto({ accepts: "1", channel: "INSTAGRAM", phone: "", instagram: "ana boxeo" })).toEqual({ ok: false, problema: "contacto_instagram" });
  });
  it("cerrar las invitaciones y un canal desconocido vuelven al correo", () => {
    expect(parseAjustesDeContacto({ accepts: "", channel: "FAX", phone: "612345678", instagram: "x" })).toEqual({ ok: true, value: { acceptsInvitations: false, contactChannel: "EMAIL", contactPhone: null, contactInstagram: null } });
  });
});
