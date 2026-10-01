import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Autorización de las acciones del servidor: qué rol puede ejecutar qué. Cada acción se ejecuta con el verdadero `getUser` y las
 * verdaderas guardas (`requireAdmin`, `requireVerifiedUser`…), sobre una base de datos simulada que anota toda escritura.
 * Una acción denegada debe terminar en una redirección con su mensaje y NO escribir nada.
 */
const mundo = vi.hoisted(() => {
  const estado = {
    usuario: null as null | Record<string, unknown>,
    respuestas: {} as Record<string, unknown>,
    escrituras: [] as string[],
  };
  const ESCRIBE = /^(create|createMany|update|updateMany|upsert|delete|deleteMany)$/;
  const modelo = (nombre: string) => new Proxy({}, {
    get: (_t, metodo: string) => async (...args: unknown[]) => {
      const clave = `${nombre}.${metodo}`;
      if (ESCRIBE.test(metodo)) estado.escrituras.push(clave);
      const r = estado.respuestas[clave];
      if (typeof r === "function") return (r as (...a: unknown[]) => unknown)(...args);
      if (r !== undefined) return r;
      return metodo === "findMany" ? [] : metodo === "count" ? 0 : null;
    },
  });
  const db: unknown = new Proxy({}, {
    get: (_t, nombre: string) => {
      if (nombre === "$transaction") return async (a: unknown) => (typeof a === "function" ? (a as (tx: unknown) => unknown)(db) : Promise.all(a as unknown[]));
      if (nombre === "$executeRaw" || nombre === "$queryRaw") return async () => [];
      return modelo(nombre);
    },
  });
  class Redireccion extends Error {
    constructor(public destino: string) { super(destino); }
  }
  return { estado, db, Redireccion };
});

vi.mock("../../src/lib/common/db", () => ({ db: mundo.db }));
vi.mock("next/navigation", () => ({
  redirect: (destino: string) => { throw new mundo.Redireccion(destino); },
  notFound: () => { throw new mundo.Redireccion("404"); },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "session" && mundo.estado.usuario ? { value: "token-de-prueba" } : undefined), set: vi.fn(), delete: vi.fn() }),
  headers: async () => ({ get: () => null }),
}));

import * as cuentas from "../../src/app/actions/accounts";
import * as peleadores from "../../src/app/actions/fighters";
import * as combates from "../../src/app/actions/bouts";
import * as aura from "../../src/app/actions/aura";
import * as veladas from "../../src/app/actions/events";
import * as moderacion from "../../src/app/actions/moderation";
import * as comunidad from "../../src/app/actions/community";
import { hashPassword } from "../../src/lib/accounts/password";

const acciones = { ...cuentas, ...peleadores, ...combates, ...aura, ...veladas, ...moderacion, ...comunidad };

const fd = (campos: Record<string, string> = {}) => { const f = new FormData(); for (const [k, v] of Object.entries(campos)) f.set(k, v); return f; };
const verificado = new Date("2026-01-01T00:00:00Z");
const persona = (rol: string, extra: Record<string, unknown> = {}) => ({ id: `u-${rol}`, email: `${rol}@x.es`, name: "Prueba", role: rol, emailVerifiedAt: verificado, notifyEmails: true, passwordHash: "x", fighter: null, ...extra });
const iniciarSesion = (u: Record<string, unknown> | null) => {
  mundo.estado.usuario = u;
  mundo.estado.respuestas["session.findUnique"] = u ? { id: "s", userId: u.id, expiresAt: new Date(Date.now() + 864e5), user: u } : null;
};
/** Ejecuta una acción y devuelve a dónde redirige (todas terminan en redirección). */
async function destino(accion: (f: FormData) => Promise<unknown>, campos: Record<string, string> = {}): Promise<string> {
  try { await accion(fd(campos)); } catch (e) { if (e instanceof mundo.Redireccion) return e.destino; throw e; }
  return "(sin redirección)";
}

beforeEach(() => { mundo.estado.respuestas = {}; mundo.estado.escrituras = []; iniciarSesion(null); });

const SOLO_MODERADORES = ["adminDecide", "decideClaim", "decideOrganizer", "setGymVerified", "resolveReport"] as const;
const SOLO_ORGANIZADORES = ["createEvent", "addCartelBout", "setBoutResult"] as const;
const EXIGEN_CORREO_VERIFICADO = ["createMyFighter", "updateMyFighter", "saveDiscipline", "addBout", "setMyBoutResult", "respondBout", "requestClaim", "requestOrganizer", "setBoutEvidence", "createReport"] as const;
const EXIGEN_SESION = ["updateAccount", "changePassword", "deleteAccount", "resendVerification", "giveAura", "removeAura", "toggleFollow"] as const;

// Acciones que cualquiera puede lanzar (se protegen por sí solas: enlace de un solo uso, límites de intentos, contraseña…).
const PUBLICAS = ["register", "login", "logout", "requestPasswordReset", "resetPassword", "unsubscribeEmails", "verifyEmail"] as const;

describe("clasificación de las acciones", () => {
  it("toda acción exportada está en una lista de autorización (si añades una, clasifícala arriba)", () => {
    const clasificadas = new Set<string>([...SOLO_MODERADORES, ...SOLO_ORGANIZADORES, ...EXIGEN_CORREO_VERIFICADO, ...EXIGEN_SESION, ...PUBLICAS]);
    expect(Object.keys(acciones).filter((n) => !clasificadas.has(n))).toEqual([]);
    expect([...clasificadas].filter((n) => !(n in acciones))).toEqual([]);
  });
});

describe("sin iniciar sesión", () => {
  for (const nombre of [...SOLO_MODERADORES]) {
    it(`${nombre} manda a entrar y no escribe nada`, async () => {
      expect(await destino(acciones[nombre])).toBe("/entrar?next=%2Fmoderacion&problema=sin_sesion");
      expect(mundo.estado.escrituras).toEqual([]);
    });
  }
  for (const nombre of [...SOLO_ORGANIZADORES, ...EXIGEN_CORREO_VERIFICADO, ...EXIGEN_SESION]) {
    it(`${nombre} manda a entrar y no escribe nada`, async () => {
      expect(await destino(acciones[nombre])).toMatch(/^\/entrar/);
      expect(mundo.estado.escrituras).toEqual([]);
    });
  }
});

describe("con la cuenta sin verificar", () => {
  beforeEach(() => iniciarSesion(persona("FIGHTER", { emailVerifiedAt: null })));
  for (const nombre of [...EXIGEN_CORREO_VERIFICADO, ...SOLO_ORGANIZADORES, "giveAura" as const]) {
    it(`${nombre} pide verificar el correo electrónico y no escribe nada`, async () => {
      expect(await destino(acciones[nombre])).toBe("/verificar");
      expect(mundo.estado.escrituras).toEqual([]);
    });
  }
});

describe("una persona sin permisos de moderación", () => {
  for (const rol of ["FAN", "FIGHTER", "ORGANIZER"]) {
    for (const nombre of SOLO_MODERADORES) {
      it(`${rol} no puede ejecutar ${nombre}`, async () => {
        iniciarSesion(persona(rol));
        expect(await destino(acciones[nombre])).toBe("/?problema=solo_moderadores");
        expect(mundo.estado.escrituras).toEqual([]);
      });
    }
  }
});

describe("una persona que no es organizadora", () => {
  for (const rol of ["FAN", "FIGHTER"]) {
    for (const nombre of SOLO_ORGANIZADORES) {
      it(`${rol} no puede ejecutar ${nombre}`, async () => {
        iniciarSesion(persona(rol));
        expect(await destino(acciones[nombre])).toBe("/organizador?problema=sin_permiso");
        expect(mundo.estado.escrituras).toEqual([]);
      });
    }
  }
  it("un organizador no puede tocar la velada de otro organizador", async () => {
    iniciarSesion(persona("ORGANIZER"));
    mundo.estado.respuestas["event.findUnique"] = { id: "e1", slug: "velada-ajena", organizerId: "otra-persona", date: new Date("2026-01-01T12:00:00Z"), discipline: "BOXEO" };
    mundo.estado.respuestas["bout.findUnique"] = { id: "b1", eventId: "e1", event: { organizerId: "otra-persona" }, verification: "VERIFIED" };
    expect(await destino(acciones.addCartelBout, { eventId: "e1" })).toBe("/organizador?problema=sin_permiso");
    expect(await destino(acciones.setBoutResult, { boutId: "b1" })).toBe("/organizador?problema=sin_permiso");
    expect(mundo.estado.escrituras).toEqual([]);
  });
});

describe("combates ajenos", () => {
  const combate = { id: "b1", eventId: "e1", fighterAId: "fa", fighterBId: "fb", createdById: "otra-persona", verification: "SELF_REPORTED", event: { organizerId: "org", date: new Date("2026-01-01T12:00:00Z"), discipline: "BOXEO" } };
  it("quien no participa no puede cambiar el enlace de evidencia", async () => {
    iniciarSesion(persona("FIGHTER", { fighter: { id: "otra-ficha", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate;
    expect(await destino(acciones.setBoutEvidence, { boutId: "b1", evidenceUrl: "https://example.com" })).toBe("/mi-ficha?problema=sin_permiso");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("quien no es el rival no puede confirmar ni rechazar el combate", async () => {
    iniciarSesion(persona("FIGHTER", { fighter: { id: "otra-ficha", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate;
    expect(await destino(acciones.respondBout, { boutId: "b1", decision: "confirm" })).toBe("/mi-ficha?problema=sin_permiso");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("quien no registró el combate no puede indicar su resultado", async () => {
    iniciarSesion(persona("FIGHTER", { fighter: { id: "fb", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate;
    expect(await destino(acciones.setMyBoutResult, { boutId: "b1", outcome: "WIN", method: "UD" })).toBe("/mi-ficha?problema=sin_permiso");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("un combate ya confirmado no admite un cambio de evidencia de sus participantes", async () => {
    iniciarSesion(persona("FIGHTER", { fighter: { id: "fa", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = { ...combate, verification: "CONFIRMED", createdById: "u-FIGHTER" };
    expect(await destino(acciones.setBoutEvidence, { boutId: "b1", evidenceUrl: "https://example.com" })).toBe("/mi-ficha?problema=evidencia_bloqueada");
    expect(mundo.estado.escrituras).toEqual([]);
  });
});

describe("resultado y confirmación de un combate", () => {
  const dia = new Date("2026-01-01T12:00:00Z"); // ya celebrado
  const combate = (extra: Record<string, unknown> = {}) => ({ id: "b1", eventId: "e1", fighterAId: "fa", fighterBId: "fb", createdById: "u-FIGHTER", verification: "SELF_REPORTED", result: "A_WIN", method: "UD", endRound: null, rounds: null, event: { organizerId: null, date: dia, discipline: "BOXEO" }, ...extra });
  const version = "A_WIN|UD|";

  it("el rival que confirma con un resultado distinto al que vio no confirma nada", async () => {
    iniciarSesion(persona("FIGHTER", { id: "u-rival", fighter: { id: "fb", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate({ result: "A_WIN", method: "KO", endRound: 2 }); // el autor lo corrigió después
    expect(await destino(acciones.respondBout, { boutId: "b1", decision: "confirm", version })).toBe("/mi-ficha?problema=combate_cambiado");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("si el combate cambia justo mientras se confirma, la escritura condicionada no encuentra nada y se avisa", async () => {
    iniciarSesion(persona("FIGHTER", { id: "u-rival", fighter: { id: "fb", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate();
    mundo.estado.respuestas["bout.updateMany"] = { count: 0 };
    expect(await destino(acciones.respondBout, { boutId: "b1", decision: "confirm", version })).toBe("/mi-ficha?problema=combate_cambiado");
    expect(mundo.estado.escrituras).not.toContain("auditLog.create");
  });
  it("con la huella correcta el rival confirma y queda constancia en el historial", async () => {
    iniciarSesion(persona("FIGHTER", { id: "u-rival", fighter: { id: "fb", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate();
    mundo.estado.respuestas["bout.updateMany"] = { count: 1 };
    expect(await destino(acciones.respondBout, { boutId: "b1", decision: "confirm", version })).toBe("/mi-ficha?aviso=combate_confirmado");
    expect(mundo.estado.escrituras).toContain("auditLog.create");
  });
  it("si el rival solo confirmó el combate cuando no tenía resultado, el autor puede añadirlo y vuelve a quedar pendiente de confirmar", async () => {
    iniciarSesion(persona("FIGHTER", { fighter: { id: "fa", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate({ verification: "CONFIRMED", result: null, method: null });
    mundo.estado.respuestas["bout.updateMany"] = (args: { data: Record<string, unknown> }) => { expect(args.data.verification).toBe("SELF_REPORTED"); return { count: 1 }; };
    expect(await destino(acciones.setMyBoutResult, { boutId: "b1", outcome: "WIN", method: "UD" })).toBe("/mi-ficha?aviso=resultado_guardado_confirmar");
  });
  it("un combate confirmado CON resultado ya no lo puede cambiar su autor", async () => {
    iniciarSesion(persona("FIGHTER", { fighter: { id: "fa", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate({ verification: "CONFIRMED" });
    expect(await destino(acciones.setMyBoutResult, { boutId: "b1", outcome: "LOSS", method: "KO" })).toBe("/mi-ficha?problema=sin_permiso");
    expect(mundo.estado.escrituras).toEqual([]);
  });
});

describe("decisiones de moderación", () => {
  beforeEach(() => iniciarSesion(persona("ADMIN")));
  it("con una moderadora, una acción sobre algo que no existe responde «no existe» (la autorización no bloquea todo)", async () => {
    expect(await destino(acciones.adminDecide, { boutId: "no-existe", decision: "verify" })).toBe("/moderacion?problema=no_existe");
  });
  it("rechazar una reclamación exige explicar el motivo y no cambia nada", async () => {
    mundo.estado.respuestas["claimRequest.findUnique"] = { id: "c1", userId: "u2", fighterId: "f1", status: "PENDING", fighter: { firstName: "A", lastName: "B" } };
    expect(await destino(acciones.decideClaim, { claimId: "c1", decision: "reject" })).toBe("/moderacion?problema=motivo_falta");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("aprobar o rechazar a un organizador exige anotar la evidencia o el motivo", async () => {
    mundo.estado.respuestas["organizerRequest.findUnique"] = { id: "o1", userId: "u2", orgName: "Club", status: "PENDING", user: { role: "FAN" } };
    expect(await destino(acciones.decideOrganizer, { requestId: "o1", decision: "approve" })).toBe("/moderacion?problema=evidencia_falta");
    expect(await destino(acciones.decideOrganizer, { requestId: "o1", decision: "reject" })).toBe("/moderacion?problema=motivo_falta");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("el sello de un gimnasio exige la nota con la evidencia comprobada", async () => {
    mundo.estado.respuestas["gym.findUnique"] = { id: "g1", name: "Gimnasio", verifiedAt: null };
    expect(await destino(acciones.setGymVerified, { gymId: "g1", decision: "verify" })).toBe("/moderacion?problema=sello_sin_nota");
    expect(mundo.estado.escrituras).toEqual([]);
  });
});

describe("decisiones concurrentes y ocultar fichas", () => {
  beforeEach(() => iniciarSesion(persona("ADMIN")));
  it("si otra persona de moderación decide a la vez sobre una reclamación, esta decisión se descarta con un aviso y no queda registrada", async () => {
    mundo.estado.respuestas["claimRequest.findUnique"] = { id: "c1", userId: "u2", fighterId: "f1", status: "PENDING", fighter: { firstName: "A", lastName: "B" } };
    mundo.estado.respuestas["fighter.updateMany"] = { count: 1 };
    mundo.estado.respuestas["claimRequest.updateMany"] = { count: 0 }; // ya no estaba pendiente
    expect(await destino(acciones.decideClaim, { claimId: "c1", decision: "approve" })).toBe("/moderacion?problema=solicitud_cambiada");
    expect(mundo.estado.escrituras).not.toContain("auditLog.create");
  });
  it("una solicitud de organizador que cambió mientras se revisaba no se aprueba", async () => {
    mundo.estado.respuestas["organizerRequest.findUnique"] = { id: "o1", userId: "u2", orgName: "Club", message: "web", status: "PENDING", user: { role: "FAN" } };
    mundo.estado.respuestas["organizerRequest.updateMany"] = (args: { where: { orgName: string; message: string } }) => { expect(args.where).toMatchObject({ status: "PENDING", orgName: "Club", message: "web" }); return { count: 0 }; };
    expect(await destino(acciones.decideOrganizer, { requestId: "o1", decision: "approve", note: "Web comprobada" })).toBe("/moderacion?problema=solicitud_cambiada");
    expect(mundo.estado.escrituras).not.toContain("user.update");
  });
  it("un combate que cambió de estado mientras se decidía no se pisa", async () => {
    mundo.estado.respuestas["bout.findUnique"] = { id: "b1", fighterAId: "fa", fighterBId: "fb", verification: "SELF_REPORTED" };
    mundo.estado.respuestas["bout.updateMany"] = (args: { where: { verification: string } }) => { expect(args.where.verification).toBe("SELF_REPORTED"); return { count: 0 }; };
    expect(await destino(acciones.adminDecide, { boutId: "b1", decision: "verify" })).toBe("/moderacion?problema=combate_cambiado");
    expect(mundo.estado.escrituras).not.toContain("auditLog.create");
  });
  const aviso = { id: "r1", entity: "FIGHTER", entityId: "f1", status: "OPEN", reason: "DATOS", userId: "u2" };
  it("ocultar una ficha (borra sus datos personales para siempre) exige anotar el motivo", async () => {
    mundo.estado.respuestas["report.findUnique"] = aviso;
    expect(await destino(acciones.resolveReport, { reportId: "r1", decision: "hide" })).toBe("/moderacion?problema=ocultar_sin_nota");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("no se oculta desde un aviso una ficha que tiene titular (su titular la corrige o la elimina)", async () => {
    mundo.estado.respuestas["report.findUnique"] = aviso;
    mundo.estado.respuestas["fighter.findUnique"] = { userId: "u9" };
    expect(await destino(acciones.resolveReport, { reportId: "r1", decision: "hide", note: "Piden retirarla" })).toBe("/moderacion?problema=ficha_con_titular");
    expect(mundo.estado.escrituras).not.toContain("fighter.update");
  });
  it("ocultar una ficha que ya no existe da un aviso claro en lugar de un error", async () => {
    mundo.estado.respuestas["report.findUnique"] = aviso;
    mundo.estado.respuestas["fighter.findUnique"] = null;
    expect(await destino(acciones.resolveReport, { reportId: "r1", decision: "hide", note: "Piden retirarla" })).toBe("/moderacion?problema=no_existe");
  });
  it("una ficha sin titular sí se oculta y su historial se vacía de datos personales", async () => {
    mundo.estado.respuestas["report.findUnique"] = aviso;
    mundo.estado.respuestas["fighter.findUnique"] = { userId: null };
    expect(await destino(acciones.resolveReport, { reportId: "r1", decision: "hide", note: "Piden retirarla" })).toBe("/moderacion?aviso=aviso_resuelto_oculto");
    expect(mundo.estado.escrituras.indexOf("auditLog.updateMany")).toBeGreaterThan(mundo.estado.escrituras.indexOf("fighter.update"));
  });
});

describe("eliminar la cuenta", () => {
  it("la única moderadora no puede eliminar su cuenta (nadie quedaría a cargo)", async () => {
    iniciarSesion(persona("ADMIN"));
    mundo.estado.respuestas["user.count"] = 1;
    mundo.estado.respuestas["user.findUnique"] = persona("ADMIN");
    // la contraseña no es correcta en esta simulación: se comprueba que, sin ella, tampoco se borra nada
    expect(await destino(acciones.deleteAccount, { confirm: "on", current: "cualquiera" })).toMatch(/^\/mi-cuenta\/eliminar\?problema=/);
    expect(mundo.estado.escrituras).not.toContain("user.delete");
  });
  it("al eliminar la cuenta se vacían los datos personales del historial de cambios (nombre real antes y después) antes de dejar el apunte", async () => {
    iniciarSesion(persona("FIGHTER", { passwordHash: await hashPassword("contraseña-buena-1") }));
    mundo.estado.respuestas["rateHit.create"] = { id: "h1" }; // la reserva del intento de contraseña
    mundo.estado.respuestas["fighter.findUnique"] = { id: "f1", _count: { boutsAsA: 0, boutsAsB: 0 } };
    expect(await destino(acciones.deleteAccount, { confirm: "on", current: "contraseña-buena-1" })).toBe("/?aviso=cuenta_eliminada");
    const e = mundo.estado.escrituras;
    expect(e.filter((x) => x === "auditLog.updateMany")).toHaveLength(2); // el historial de la ficha y el de la cuenta
    expect(e.lastIndexOf("auditLog.updateMany")).toBeLessThan(e.indexOf("auditLog.create"));
  });
  it("sin marcar la confirmación no se borra nada", async () => {
    iniciarSesion(persona("FAN"));
    expect(await destino(acciones.deleteAccount, { current: "x" })).toBe("/mi-cuenta/eliminar?problema=eliminar_sin_confirmar");
    expect(mundo.estado.escrituras).toEqual([]);
  });
});
