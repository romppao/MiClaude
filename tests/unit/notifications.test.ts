import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ notification: { upsert: vi.fn() }, bout: { findUnique: vi.fn() }, follow: { findMany: vi.fn() } }));
vi.mock("../../src/lib/common/db", () => ({ db }));
vi.mock("../../src/lib/common/fallos", () => ({ registrarFallo: vi.fn() }));
import { notificationId, dailyAuraKey, notificationCutoff, notifyFollowedBout, putNotification } from "../../src/lib/community/notifications";
beforeEach(() => { vi.clearAllMocks(); db.notification.upsert.mockResolvedValue({}); });

describe("avisos personales", () => {
  it("la identidad del hecho incluye al destinatario; el aura se agrupa por día de Madrid", () => {
    expect(notificationId("a", "combate")).not.toBe(notificationId("b", "combate"));
    expect(notificationId("a", "combate")).toBe(notificationId("a", "combate"));
    expect(dailyAuraKey("f", new Date("2026-10-14T22:30:00Z"))).toBe("aura:f:2026-10-15");
    expect(notificationCutoff(new Date("2026-10-14T12:00:00Z"))).toEqual(new Date("2025-10-14T12:00:00Z"));
  });
  it("los destinos externos se sustituyen y solo el aura nueva del día reabre el aviso", async () => {
    await putNotification("a", "AURA_RECEIVED", "Aura", "https://externo.example", "dia", undefined, true);
    expect(db.notification.upsert.mock.calls[0][0]).toMatchObject({ create: { href: "/mi-panel", userId: "a" }, update: { readAt: null } });
    await putNotification("a", "CLASS_ANSWER", "Respuesta", "/mis-reservas", "clase");
    expect(db.notification.upsert.mock.calls[1][0].update).toEqual({});
  });
  it("no avisa sobre veladas ocultas ni resultados disputados", async () => {
    const base = { id: "b", result: "A_WIN", verification: "VERIFIED", fighterA: { listed: true }, fighterB: { listed: true }, event: { date: new Date("2020-01-01"), status: "PENDING_AUTHORIZATION" } };
    for (const status of ["PENDING_AUTHORIZATION", "REJECTED", "CANCELLED"]) {
      db.bout.findUnique.mockResolvedValue({ ...base, event: { ...base.event, status } });
      await notifyFollowedBout("b", "BOUT_RESULT");
    }
    db.bout.findUnique.mockResolvedValue({ ...base, verification: "DISPUTED", event: { ...base.event, status: "COMPLETED" } });
    await notifyFollowedBout("b", "BOUT_RESULT");
    expect(db.follow.findMany).not.toHaveBeenCalled();
    expect(db.notification.upsert).not.toHaveBeenCalled();
  });
  it("seguir a ambos peleadores produce un aviso genérico, sin revelar el resultado privado ni depender del correo", async () => {
    db.bout.findUnique.mockResolvedValue({ id: "b", fighterAId: "a", fighterBId: "b", result: "A_WIN", method: "KO", verification: "VERIFIED", fighterA: { listed: true, recordPublic: false }, fighterB: { listed: true, recordPublic: false }, event: { status: "COMPLETED", slug: "evento", date: new Date("2020-01-01") } });
    db.follow.findMany.mockResolvedValue([{ userId: "uno" }, { userId: "uno" }, { userId: "dos" }]);
    await notifyFollowedBout("b", "BOUT_RESULT");
    expect(db.notification.upsert).toHaveBeenCalledTimes(2);
    expect(db.follow.findMany.mock.calls[0][0].where).not.toHaveProperty("user.notifyEmails");
    expect(db.notification.upsert.mock.calls[0][0].create.title).toBe("Hay un resultado nuevo de un peleador que sigues");
  });
});
