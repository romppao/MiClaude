/** Denunciar una invitación y pausar el envío (plan aprobado el 17-10-2026): umbral de la pausa y motivos de la denuncia. */
import { describe, expect, it } from "vitest";
import { debePausarse } from "../../src/lib/community/invitaciones-pausa";
import { DENUNCIAS_PARA_PAUSAR_INVITACIONES, REASONS_BY_ENTITY, REPORT_ENTITIES, REPORT_REASONS } from "../../src/lib/community/reports";
import { puedeInvitar } from "../../src/lib/community/invitations";

describe("pausa por denuncias", () => {
  it("la pausa llega con tres personas distintas y no antes", () => {
    expect(DENUNCIAS_PARA_PAUSAR_INVITACIONES).toBe(3);
    expect([0, 1, 2].map(debePausarse)).toEqual([false, false, false]);
    expect([3, 4, 10].map(debePausarse)).toEqual([true, true, true]);
  });

  it("una cuenta en pausa no puede invitar, y una que no lo está, sí", () => {
    const base = { role: "TRAINER", emailVerifiedAt: new Date() };
    expect(puedeInvitar({ ...base, invitacionesSuspendidas: true })).toEqual({ ok: false, problema: "invitacion_suspendida" });
    expect(puedeInvitar({ ...base, invitacionesSuspendidas: false })).toEqual({ ok: true });
  });
});

describe("denuncia de una invitación", () => {
  it("es una entidad denunciable con motivos que existen y que no sirven para otra cosa", () => {
    expect(REPORT_ENTITIES).toContain("INVITACION");
    for (const m of REASONS_BY_ENTITY.INVITACION) expect(REPORT_REASONS[m], m).toBeTruthy();
    expect(REASONS_BY_ENTITY.INVITACION).toEqual(expect.arrayContaining(["NO_SOLICITADO", "ACOSO"]));
    // Los motivos propios de una invitación no se ofrecen en combates ni fichas.
    for (const e of ["BOUT", "FIGHTER", "AURA", "MEDIA", "GYM"] as const) expect(REASONS_BY_ENTITY[e]).not.toContain("NO_SOLICITADO");
  });
});
