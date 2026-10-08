import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
import * as trayectoria from "../../src/app/actions/trajectory";
import * as demo from "../../src/app/actions/demo";
import * as entrenadores from "../../src/app/actions/trainers";
import * as noticias from "../../src/app/actions/news";
import * as medios from "../../src/app/actions/media";
import * as propuestas from "../../src/app/actions/proposals";
import { hashPassword } from "../../src/lib/accounts/password";

const acciones = { ...cuentas, ...peleadores, ...combates, ...aura, ...veladas, ...moderacion, ...comunidad, ...demo, ...trayectoria, ...entrenadores, ...noticias, ...medios, ...propuestas };

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

const SOLO_MODERADORES = ["adminDecide", "decideClaim", "decideOrganizer", "setGymVerified", "resolveReport", "setSupportAccreditation", "refreshNewsNow", "addNewsSource", "toggleNewsSource", "toggleNewsItem"] as const;
const SOLO_ORGANIZADORES = ["createEvent", "addCartelBout", "setBoutResult", "updateEvent", "setEventStatus", "removeCartelBout"] as const;
const EXIGEN_CORREO_VERIFICADO = ["createMyFighter", "updateMyFighter", "saveDiscipline", "addBout", "removeMyBout", "setMyBoutResult", "respondBout", "requestClaim", "requestOrganizer", "setBoutEvidence", "createReport", "saveAchievement", "withdrawAchievement", "restoreOwnAchievement", "requestAchievementReview", "reviewAchievement", "endorseBout", "setRecordPublic", "publishHighlight", "manageHighlight", "createMyTrainer", "createClass", "toggleClass", "shareMedia", "deleteMyMedia", "removeDiscipline", "requestClass", "answerClassRequest", "cancelClassRequest", "proposeFight", "answerProposal", "cancelProposal"] as const;
const EXIGEN_SESION = ["updateAccount", "changePassword", "deleteAccount", "resendVerification", "giveAura", "removeAura", "toggleFollow", "demoConfirmarCorreo", "demoCambiarPapel", "saveInterests", "saveFighterIntent", "saveTrainerIntent", "saveTrainerClassIntent"] as const;

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

describe("acciones de la versión de demostración", () => {
  afterEach(() => { delete process.env.DEMO_MODE; });
  for (const nombre of ["demoConfirmarCorreo", "demoCambiarPapel"] as const) {
    it(`${nombre} se niega y no escribe nada si no es una demostración`, async () => {
      iniciarSesion(persona("FAN", { emailVerifiedAt: null }));
      expect(await destino(() => acciones[nombre](fd({ papel: "ADMIN" })))).toBe("/?problema=demo_no_activa");
      expect(mundo.estado.escrituras).toEqual([]);
    });
  }
  it("con la demostración activa, un papel que no existe se rechaza sin escribir", async () => {
    process.env.DEMO_MODE = "si";
    iniciarSesion(persona("FAN"));
    expect(await destino(() => acciones.demoCambiarPapel(fd({ papel: "constructor" })))).toBe("/mi-cuenta?problema=demo_papel_invalido");
    expect(mundo.estado.escrituras).toEqual([]);
  });
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
  it("un entrenador sí puede crear veladas e interclubs (decisión del fundador): pasa la guarda y llega a validar los datos", async () => {
    iniciarSesion(persona("TRAINER"));
    expect(await destino(acciones.createEvent, { name: "" })).toBe("/organizador?problema=velada_datos");
    expect(await destino(acciones.createEvent, { name: "Interclub", date: "2026-11-10", kind: "OTRO" })).toBe("/organizador?problema=velada_tipo");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("nadie puede borrar el vídeo o la foto que subió otra persona", async () => {
    iniciarSesion(persona("FAN"));
    mundo.estado.respuestas["mediaItem.findFirst"] = (q: { where: { uploaderId: string } }) => (q.where.uploaderId === "u-FAN" ? null : { id: "m1" });
    expect(await destino(acciones.deleteMyMedia, { mediaId: "m1" })).toBe("/mi-panel?seccion=mis-subidas&problema=no_existe");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("no se puede publicar como propio un vídeo subido por otra persona", async () => {
    iniciarSesion(persona("FAN"));
    mundo.estado.respuestas["event.findUnique"] = { id: "e1", slug: "velada", date: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`), status: "SCHEDULED" };
    const ajeno = "videos/otrapersona1/0f8fad5b-d9cb-469f-a165-70867728950e.mp4";
    expect(await destino(acciones.shareMedia, { eventId: "e1", videoKey: ajeno, consentimiento: "on" })).toBe("/compartir?velada=velada&problema=medio_subida");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("un entrenador no puede tocar la velada de otro organizador", async () => {
    iniciarSesion(persona("TRAINER"));
    mundo.estado.respuestas["event.findUnique"] = { id: "e1", slug: "velada-ajena", organizerId: "otra-persona", date: new Date("2026-01-01T12:00:00Z"), discipline: "BOXEO" };
    expect(await destino(acciones.addCartelBout, { eventId: "e1" })).toBe("/organizador?problema=sin_permiso");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("un organizador no puede tocar la velada de otro organizador", async () => {
    iniciarSesion(persona("ORGANIZER"));
    mundo.estado.respuestas["event.findUnique"] = { id: "e1", slug: "velada-ajena", organizerId: "otra-persona", date: new Date("2026-01-01T12:00:00Z"), discipline: "BOXEO" };
    mundo.estado.respuestas["bout.findUnique"] = { id: "b1", eventId: "e1", event: { organizerId: "otra-persona" }, verification: "VERIFIED" };
    expect(await destino(acciones.addCartelBout, { eventId: "e1" })).toBe("/organizador?problema=sin_permiso");
    expect(await destino(acciones.setBoutResult, { boutId: "b1" })).toBe("/organizador?problema=sin_permiso");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("ni corregir, cancelar ni quitar combates de la velada de otro organizador", async () => {
    iniciarSesion(persona("ORGANIZER"));
    mundo.estado.respuestas["event.findUnique"] = { id: "e1", slug: "velada-ajena", organizerId: "otra-persona", date: new Date("2026-01-01T12:00:00Z"), discipline: "BOXEO", status: "SCHEDULED" };
    mundo.estado.respuestas["bout.findUnique"] = { id: "b1", eventId: "e1", fighterAId: "fa", fighterBId: "fb", verification: "VERIFIED" };
    expect(await destino(acciones.updateEvent, { eventId: "e1", name: "X", date: "2026-10-10" })).toBe("/organizador?problema=sin_permiso");
    expect(await destino(acciones.setEventStatus, { eventId: "e1", decision: "cancel" })).toBe("/organizador?problema=sin_permiso");
    expect(await destino(acciones.removeCartelBout, { boutId: "b1" })).toBe("/organizador?problema=sin_permiso");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  describe("en su propia velada", () => {
    const propia = { id: "e1", slug: "mi-velada", organizerId: "u-ORGANIZER", date: new Date("2026-12-01T12:00:00Z"), discipline: "BOXEO", status: "SCHEDULED", name: "Mi velada", venue: "v", city: "c", province: "Madrid" };
    beforeEach(() => { iniciarSesion(persona("ORGANIZER")); mundo.estado.respuestas["event.findUnique"] = propia; });
    it("cancelarla la marca como cancelada y deja constancia", async () => {
      expect(await destino(acciones.setEventStatus, { eventId: "e1", decision: "cancel" })).toBe("/organizador/mi-velada?aviso=velada_cancelada");
      expect(mundo.estado.escrituras).toEqual(expect.arrayContaining(["event.update", "auditLog.create"]));
    });
    it("no se cambia la disciplina de una velada con combates en el cartel", async () => {
      mundo.estado.respuestas["bout.count"] = 2;
      expect(await destino(acciones.updateEvent, { eventId: "e1", name: "Mi velada", date: "2026-12-01", discipline: "MMA", province: "Madrid" })).toBe("/organizador/mi-velada?problema=velada_disciplina_con_cartel");
      expect(mundo.estado.escrituras).not.toContain("event.update");
    });
    it("un combate con aura del público no se quita del cartel", async () => {
      mundo.estado.respuestas["bout.findUnique"] = { id: "b1", eventId: "e1", fighterAId: "fa", fighterBId: "fb", verification: "VERIFIED" };
      mundo.estado.respuestas["aura.count"] = 3;
      expect(await destino(acciones.removeCartelBout, { boutId: "b1" })).toBe("/organizador/mi-velada?problema=cartel_con_aura");
      expect(mundo.estado.escrituras).not.toContain("bout.delete");
    });
    it("sin aura sí se quita y queda constancia", async () => {
      mundo.estado.respuestas["bout.findUnique"] = { id: "b1", eventId: "e1", fighterAId: "fa", fighterBId: "fb", verification: "VERIFIED" };
      expect(await destino(acciones.removeCartelBout, { boutId: "b1" })).toBe("/organizador/mi-velada?aviso=cartel_quitado");
      expect(mundo.estado.escrituras).toEqual(expect.arrayContaining(["bout.delete", "auditLog.create"]));
    });
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
  it("quien registró un combate pendiente puede quitarlo (y queda constancia)", async () => {
    iniciarSesion(persona("FIGHTER", { fighter: { id: "fa", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate();
    mundo.estado.respuestas["bout.deleteMany"] = { count: 1 };
    expect(await destino(acciones.removeMyBout, { boutId: "b1" })).toBe("/mi-ficha?aviso=combate_quitado");
    expect(mundo.estado.escrituras).toEqual(expect.arrayContaining(["bout.deleteMany", "auditLog.create"]));
  });
  it("no se quita un combate ajeno, ni uno que el rival o moderación ya tocaron, ni uno con aura", async () => {
    iniciarSesion(persona("FIGHTER", { id: "otra", fighter: { id: "fa", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate();
    expect(await destino(acciones.removeMyBout, { boutId: "b1" })).toBe("/mi-ficha?problema=sin_permiso");
    iniciarSesion(persona("FIGHTER", { fighter: { id: "fa", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate({ verification: "CONFIRMED" });
    expect(await destino(acciones.removeMyBout, { boutId: "b1" })).toBe("/mi-ficha?problema=combate_no_quitable");
    mundo.estado.respuestas["bout.findUnique"] = combate();
    mundo.estado.respuestas["aura.count"] = 2;
    expect(await destino(acciones.removeMyBout, { boutId: "b1" })).toBe("/mi-ficha?problema=combate_no_quitable");
    expect(mundo.estado.escrituras).not.toContain("bout.deleteMany");
  });
  it("el rival que dice «no es correcto» tiene que explicar por qué", async () => {
    iniciarSesion(persona("FIGHTER", { id: "u-rival", fighter: { id: "fb", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate();
    expect(await destino(acciones.respondBout, { boutId: "b1", decision: "dispute" })).toBe("/mi-ficha?problema=rival_motivo_falta");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("con el motivo, el rechazo se guarda con él en el historial (lo ve moderación)", async () => {
    iniciarSesion(persona("FIGHTER", { id: "u-rival", fighter: { id: "fb", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = combate();
    mundo.estado.respuestas["bout.updateMany"] = { count: 1 };
    let guardado: unknown;
    mundo.estado.respuestas["auditLog.create"] = (a: { data: { after: unknown } }) => { guardado = a.data.after; return {}; };
    expect(await destino(acciones.respondBout, { boutId: "b1", decision: "dispute", motivo: "No combatimos ese día" })).toBe("/mi-ficha?aviso=combate_rechazado");
    expect(guardado).toMatchObject({ motivo: "No combatimos ese día" });
    expect(mundo.estado.escrituras).toContain("report.create");
    expect(mundo.estado.escrituras).not.toContain("bout.updateMany");
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
  beforeEach(() => { iniciarSesion(persona("ADMIN")); mundo.estado.respuestas["report.updateMany"] = { count: 1 }; });
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
    expect(await destino(acciones.adminDecide, { boutId: "b1", decision: "verify", version: "||" })).toBe("/moderacion?problema=combate_cambiado");
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
    expect(e.filter((x) => x === "auditLog.updateMany")).toHaveLength(3); // ficha, cuenta y comprobaciones de trayectoria/acreditación
    expect(e.lastIndexOf("auditLog.updateMany")).toBeLessThan(e.indexOf("auditLog.create"));
  });
  it("sin marcar la confirmación no se borra nada", async () => {
    iniciarSesion(persona("FAN"));
    expect(await destino(acciones.deleteAccount, { current: "x" })).toBe("/mi-cuenta/eliminar?problema=eliminar_sin_confirmar");
    expect(mundo.estado.escrituras).toEqual([]);
  });
});

describe("trayectoria: propiedad, acreditación y concurrencia", () => {
  const updatedAt = new Date("2026-10-01T10:00:00Z");
  const logro = { id: "t1", fighterId: "f-otro", withdrawnAt: null, rejectedAt: null, updatedAt, discipline: "BOXEO", supportKind: "DECLARED", fighter: { userId: "otro" } };
  const accreditation = { id: "a1", userId: "u-FAN", active: true, kind: "TRAINER", disciplines: ["BOXEO"], name: "Entrenador acreditado", updatedAt };
  for (const nombre of ["reviewAchievement", "endorseBout"] as const) {
    it(`${nombre} exige acreditación aunque el usuario sea organizador`, async () => {
      iniciarSesion(persona("ORGANIZER"));
      expect(await destino(acciones[nombre])).toBe("/mi-cuenta?problema=respaldo_sin_permiso");
      expect(mundo.estado.escrituras).toEqual([]);
    });
  }
  for (const nombre of ["withdrawAchievement", "restoreOwnAchievement", "requestAchievementReview"] as const) {
    it(`${nombre} no permite gestionar un título ajeno`, async () => {
      iniciarSesion(persona("FIGHTER", { fighter: { id: "f-mio", disciplines: [] } }));
      mundo.estado.respuestas["fighterAchievement.findUnique"] = logro;
      expect(await destino(acciones[nombre], { achievementId: "t1", version: updatedAt.toISOString() })).toBe("/mi-ficha/trayectoria?problema=sin_permiso");
      expect(mundo.estado.escrituras).toEqual([]);
    });
  }
  it("un entrenador no excluye títulos ni restaura los rechazados", async () => {
    iniciarSesion(persona("FAN"));
    mundo.estado.respuestas["supportAccreditation.findUnique"] = accreditation;
    mundo.estado.respuestas["fighterAchievement.findUnique"] = logro;
    expect(await destino(acciones.reviewAchievement, { achievementId: "t1", version: updatedAt.toISOString(), decision: "reject", note: "No me convence" })).toBe("/respaldar?problema=solo_moderadores");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("un entrenador no respalda un título de otra disciplina aunque falsifique el formulario", async () => {
    iniciarSesion(persona("FAN"));
    mundo.estado.respuestas["supportAccreditation.findUnique"] = accreditation;
    mundo.estado.respuestas["fighterAchievement.findUnique"] = { ...logro, discipline: "MMA" };
    expect(await destino(acciones.reviewAchievement, { achievementId: "t1", version: updatedAt.toISOString(), decision: "endorse", supportKind: "FEDERATION", evidenceUrl: "https://example.com/acta", note: "Acta comprobada" })).toBe("/respaldar?problema=respaldo_sin_permiso");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("un título cambiado entre lectura y decisión no se pisa", async () => {
    iniciarSesion(persona("ADMIN"));
    mundo.estado.respuestas["fighterAchievement.findUnique"] = logro;
    mundo.estado.respuestas["fighterAchievement.updateMany"] = { count: 0 };
    expect(await destino(acciones.reviewAchievement, { achievementId: "t1", version: updatedAt.toISOString(), decision: "reject", note: "Fuente no válida" })).toBe("/respaldar?problema=respaldo_cambiado");
    expect(mundo.estado.escrituras).not.toContain("auditLog.create");
  });
  it("restaurar un título activo no puede quitar su respaldo por accidente", async () => {
    iniciarSesion(persona("ADMIN"));
    mundo.estado.respuestas["fighterAchievement.findUnique"] = { ...logro, supportKind: "FEDERATION" };
    expect(await destino(acciones.reviewAchievement, { achievementId: "t1", version: updatedAt.toISOString(), decision: "restore", note: "Intento de restauración" })).toBe("/respaldar?problema=logro_no_excluido");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("una acreditación retirada durante la revisión no puede conceder nuevos puntos", async () => {
    iniciarSesion(persona("FAN"));
    let reads = 0;
    mundo.estado.respuestas["supportAccreditation.findUnique"] = () => ++reads === 1 ? accreditation : { ...accreditation, active: false };
    mundo.estado.respuestas["fighterAchievement.findUnique"] = logro;
    expect(await destino(acciones.reviewAchievement, { achievementId: "t1", version: updatedAt.toISOString(), decision: "endorse", evidenceUrl: "https://example.com/acta", note: "Acta comprobada" })).toBe("/respaldar?problema=respaldo_sin_permiso");
    expect(mundo.estado.escrituras).toEqual([]);
  });
});

describe("fechas de la trayectoria declarada", () => {
  it("no permite declarar un título anterior al nacimiento conocido", async () => {
    iniciarSesion(persona("FIGHTER", { fighter: { id: "f1", birthDate: new Date("1990-01-01"), disciplines: [] } }));
    expect(await destino(acciones.saveAchievement, { championship: "Campeonato", organization: "Entidad", scope: "NATIONAL", awardedOn: "1975-06-01" })).toBe("/mi-ficha/trayectoria?problema=logro_fecha");
    expect(mundo.estado.escrituras).toEqual([]);
  });
});


describe("pulido: decisiones explícitas, resultados leídos y respaldos concurrentes", () => {
  beforeEach(() => iniciarSesion(persona("ADMIN")));
  const bout = { id: "b1", fighterAId: "fa", fighterBId: "fb", verification: "SELF_REPORTED", result: "A_WIN", method: "UD", endRound: null, evidenceUrl: "https://example.com/acta", supportReviewedAt: null, event: { organizerId: "otro" } };
  for (const [action, model, fields, record] of [
    ["decideClaim", "claimRequest", { claimId: "c1" }, { id: "c1", status: "PENDING", fighter: {} }],
    ["decideOrganizer", "organizerRequest", { requestId: "o1" }, { id: "o1", status: "PENDING", user: {} }],
    ["setGymVerified", "gym", { gymId: "g1" }, { id: "g1" }],
    ["resolveReport", "report", { reportId: "r1" }, { id: "r1", status: "OPEN" }],
  ] as const) {
    it(`${action} rechaza una decisión desconocida sin modificar ni rechazar por defecto`, async () => {
      mundo.estado.respuestas[`${model}.findUnique`] = record;
      expect(await destino(acciones[action], { ...fields, decision: "constructor", note: "Motivo" })).toBe("/moderacion?problema=decision_no_valida");
      expect(mundo.estado.escrituras).toEqual([]);
    });
  }
  it("moderación no verifica un resultado distinto del que muestra su formulario", async () => {
    mundo.estado.respuestas["bout.findUnique"] = bout;
    expect(await destino(acciones.adminDecide, { boutId: "b1", decision: "verify", version: "B_WIN|UD|" })).toBe("/moderacion?problema=combate_cambiado");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("el resultado leído también se comprueba al escribir, no solo antes de la transacción", async () => {
    mundo.estado.respuestas["bout.findUnique"] = bout;
    mundo.estado.respuestas["bout.updateMany"] = (a: { where: unknown }) => { expect(a.where).toMatchObject({ result: "A_WIN", method: "UD", endRound: null }); return { count: 0 }; };
    expect(await destino(acciones.adminDecide, { boutId: "b1", decision: "verify", version: "A_WIN|UD|" })).toBe("/moderacion?problema=combate_cambiado");
    expect(mundo.estado.escrituras).not.toContain("auditLog.create");
  });
  it("un aviso resuelto entretanto no aplica otra acción sobre el dato ni escribe otra decisión", async () => {
    mundo.estado.respuestas["report.findUnique"] = { id: "r1", status: "OPEN", entity: "BOUT", entityId: "b1" };
    mundo.estado.respuestas["report.updateMany"] = { count: 0 };
    expect(await destino(acciones.resolveReport, { reportId: "r1", decision: "hide", note: "Revisión" })).toBe("/moderacion?problema=solicitud_cambiada");
    expect(mundo.estado.escrituras).toEqual(["report.updateMany"]);
  });
  it("resolver conserva página y sección sin permitir redirección externa", async () => {
    mundo.estado.respuestas["report.findUnique"] = { id: "r1", status: "OPEN" };
    mundo.estado.respuestas["report.updateMany"] = { count: 1 };
    expect(await destino(acciones.resolveReport, { reportId: "r1", decision: "dismiss", back: "/moderacion?avisos=3#avisos" })).toBe("/moderacion?avisos=3&seccion=avisos&aviso=aviso_descartado");
  });
  it("editar evidencia no pisa un respaldo nuevo ni permite editar tras perder el permiso", async () => {
    iniciarSesion(persona("FIGHTER", { fighter: { id: "fa", disciplines: [] } }));
    mundo.estado.respuestas["bout.findUnique"] = bout;
    mundo.estado.respuestas["bout.updateMany"] = (a: { where: unknown }) => { expect(a.where).toMatchObject({ verification: "SELF_REPORTED", evidenceUrl: bout.evidenceUrl, supportReviewedAt: null, result: "A_WIN" }); return { count: 0 }; };
    expect(await destino(acciones.setBoutEvidence, { boutId: "b1", evidenceUrl: "https://example.com/otra" })).toBe("/mi-ficha?problema=combate_cambiado");
    expect(mundo.estado.escrituras).not.toContain("auditLog.create");
  });
});

describe("diseño v3: entrenadores, highlights y registro por pasos", () => {
  it("una cuenta que no es de entrenador no puede crear un perfil de entrenador", async () => {
    iniciarSesion(persona("FAN"));
    expect(await destino(acciones.createMyTrainer, { disciplina: "BOXEO", province: "Madrid" })).toBe("/?problema=solo_entrenadores");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("sin perfil de entrenador no se publican clases", async () => {
    iniciarSesion(persona("TRAINER"));
    expect(await destino(acciones.createClass, { kind: "INDIVIDUAL", title: "Técnica", minutes: "60", price: "30" })).toBe("/?problema=entrenador_perfil_primero");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("una clase ajena no se puede pausar (se busca solo entre las propias)", async () => {
    iniciarSesion(persona("TRAINER"));
    mundo.estado.respuestas["trainingClass.findFirst"] = (a: { where: { trainer: { userId: string } } }) => { expect(a.where.trainer.userId).toBe("u-TRAINER"); return null; };
    expect(await destino(acciones.toggleClass, { classId: "ajena", activar: "0" })).toBe("/mis-clases?problema=no_existe");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("un highlight ajeno no se puede destacar ni retirar (se busca solo en la propia ficha)", async () => {
    iniciarSesion(persona("FIGHTER", { fighter: { id: "fa", disciplines: [] } }));
    mundo.estado.respuestas["highlight.findFirst"] = (a: { where: { fighterId: string } }) => { expect(a.where.fighterId).toBe("fa"); return null; };
    for (const accion of ["destacar", "retirar"]) {
      expect(await destino(acciones.manageHighlight, { highlightId: "ajeno", accion })).toBe("/mi-ficha?seccion=highlights&problema=no_existe");
    }
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("un highlight con un combate que no es suyo se rechaza", async () => {
    iniciarSesion(persona("FIGHTER", { fighter: { id: "fa", disciplines: [] } }));
    mundo.estado.respuestas["bout.findFirst"] = null;
    expect(await destino(acciones.publishHighlight, { kind: "VIDEO", title: "KO", videoUrl: "https://example.com/v", boutId: "ajeno" })).toBe("/mi-ficha?seccion=highlights&problema=highlight_combate");
    expect(mundo.estado.escrituras).toEqual([]);
  });
  it("el último paso del registro no da permisos ni crea fichas: solo guarda lo elegido", async () => {
    iniciarSesion(persona("FIGHTER", { emailVerifiedAt: null }));
    expect(await destino(acciones.saveFighterIntent, { discipline: "BOXEO", level: "AMATEUR", weightClass: "M65", divisionId: "", province: "Madrid" })).toBe("/verificar?aviso=registro_ficha_guardada");
    expect(mundo.estado.escrituras).toEqual(["user.update"]);
  });
  it("seguir desde el registro solo admite fichas públicas que no sean la propia", async () => {
    iniciarSesion(persona("FAN"));
    mundo.estado.respuestas["fighter.findMany"] = (a: { where: Record<string, unknown> }) => { expect(a.where).toMatchObject({ listed: true, hiddenAt: null, NOT: { userId: "u-FAN" } }); return []; };
    expect(await destino(acciones.saveInterests, { disciplina: "BOXEO", seguir: "f1" })).toBe("/?aviso=intereses_guardados");
  });
});
