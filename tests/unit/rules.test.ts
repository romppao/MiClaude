import { describe, expect, it } from "vitest";
import { pairKey, validateOutcome } from "../../src/lib/bouts/rules";
import { canGiveAura, type BoutForAura } from "../../src/lib/aura/rules";
import { publicFighterName, publicUserName, normalizeName } from "../../src/lib/common/names";
import { firstTooLong, isEmail, oneLine } from "../../src/lib/common/text";

const NOW = new Date("2026-09-30T10:00:00Z");
const bout = (over: Partial<BoutForAura> = {}, event: Partial<BoutForAura["event"]> = {}): BoutForAura => ({
  fighterAId: "a", fighterBId: "b", verification: "VERIFIED", result: "A_WIN",
  event: { date: new Date("2026-09-01T12:00:00Z"), status: "COMPLETED", ...event }, ...over,
});

describe("canGiveAura", () => {
  it("permite dar aura en un combate celebrado, con resultado y a un peleador que participó", () => {
    expect(canGiveAura({ bout: bout(), fighterId: "a", now: NOW })).toEqual({ ok: true });
    expect(canGiveAura({ bout: bout(), fighterId: "b", now: NOW })).toEqual({ ok: true });
  });
  it("rechaza a un peleador que no participó", () => {
    expect(canGiveAura({ bout: bout(), fighterId: "x", now: NOW })).toEqual({ ok: false, problema: "aura_no_existe" });
  });
  it("rechaza combates en revisión, cancelados, futuros o sin resultado", () => {
    expect(canGiveAura({ bout: bout({ verification: "DISPUTED" }), fighterId: "a", now: NOW })).toEqual({ ok: false, problema: "aura_revision" });
    expect(canGiveAura({ bout: bout({}, { status: "CANCELLED" }), fighterId: "a", now: NOW })).toEqual({ ok: false, problema: "aura_cancelado" });
    expect(canGiveAura({ bout: bout({}, { date: new Date("2026-10-15T12:00:00Z") }), fighterId: "a", now: NOW })).toEqual({ ok: false, problema: "aura_futuro" });
    expect(canGiveAura({ bout: bout({ result: null }), fighterId: "a", now: NOW })).toEqual({ ok: false, problema: "aura_sin_resultado" });
  });
  it("los participantes no pueden dar aura, tampoco al rival", () => {
    expect(canGiveAura({ bout: bout(), fighterId: "b", viewerFighterId: "a", now: NOW })).toEqual({ ok: false, problema: "aura_propio" });
    expect(canGiveAura({ bout: bout(), fighterId: "a", viewerFighterId: "b", now: NOW })).toEqual({ ok: false, problema: "aura_propio" });
    expect(canGiveAura({ bout: bout(), fighterId: "a", viewerFighterId: "otro", now: NOW })).toEqual({ ok: true });
  });
  it("un combate de hoy con resultado ya admite aura aunque sean las 8:00", () => {
    const hoy = bout({}, { date: new Date("2026-09-30T12:00:00Z") });
    expect(canGiveAura({ bout: hoy, fighterId: "a", now: new Date("2026-09-30T06:00:00Z") })).toEqual({ ok: true });
  });
});

describe("validateOutcome", () => {
  it("acepta victoria por KO con asalto válido y lo normaliza", () => {
    expect(validateOutcome({ discipline: "BOXEO", outcome: "WIN", method: "KO", endRound: 3, rounds: 6 })).toEqual({ ok: true, result: "A_WIN", method: "KO", endRound: 3 });
  });
  it("una decisión ignora el asalto", () => {
    expect(validateOutcome({ discipline: "BOXEO", outcome: "LOSS", method: "UD", endRound: 5, rounds: 6 })).toEqual({ ok: true, result: "B_WIN", method: "UD", endRound: null });
  });
  it("empate y sin decisión fijan su propia forma de terminar", () => {
    expect(validateOutcome({ discipline: "MMA", outcome: "DRAW", method: "KO" })).toEqual({ ok: true, result: "DRAW", method: "DRAW", endRound: null });
    expect(validateOutcome({ discipline: "MMA", outcome: "NC", method: "" })).toEqual({ ok: true, result: "NO_CONTEST", method: "NC", endRound: null });
  });
  it("una victoria necesita forma de terminar y no puede ser «empate»", () => {
    expect(validateOutcome({ discipline: "BOXEO", outcome: "WIN", method: "" })).toEqual({ ok: false, problema: "combate_metodo_falta" });
    expect(validateOutcome({ discipline: "BOXEO", outcome: "WIN", method: "DRAW" })).toEqual({ ok: false, problema: "combate_metodo" });
  });
  it("respeta las formas de terminar de cada disciplina", () => {
    expect(validateOutcome({ discipline: "BOXEO", outcome: "WIN", method: "SUBMISSION" })).toEqual({ ok: false, problema: "combate_metodo" });
    expect(validateOutcome({ discipline: "MMA", outcome: "WIN", method: "SUBMISSION", endRound: 2, rounds: 3 })).toEqual({ ok: true, result: "A_WIN", method: "SUBMISSION", endRound: 2 });
    expect(validateOutcome({ discipline: "JIUJITSU", outcome: "WIN", method: "POINTS" })).toMatchObject({ ok: true, method: "POINTS" });
    expect(validateOutcome({ discipline: "JIUJITSU", outcome: "WIN", method: "KO" })).toEqual({ ok: false, problema: "combate_metodo" });
  });
  it("el asalto debe estar entre 1 y el número de asaltos", () => {
    expect(validateOutcome({ discipline: "BOXEO", outcome: "WIN", method: "KO", endRound: 0, rounds: 6 })).toEqual({ ok: false, problema: "combate_asalto" });
    expect(validateOutcome({ discipline: "BOXEO", outcome: "WIN", method: "KO", endRound: 7, rounds: 6 })).toEqual({ ok: false, problema: "combate_asalto" });
    expect(validateOutcome({ discipline: "BOXEO", outcome: "WIN", method: "KO", endRound: 13 })).toEqual({ ok: false, problema: "combate_asalto" });
  });
  it("rechaza resultados que no existen, incluidas las claves heredadas", () => {
    for (const bad of ["", "constructor", "__proto__", "toString", "GANE"]) expect(validateOutcome({ discipline: "BOXEO", outcome: bad, method: "KO" })).toEqual({ ok: false, problema: "resultado_invalido" });
  });
});

describe("pairKey", () => {
  it("es igual en cualquier orden", () => {
    expect(pairKey("x", "y")).toBe(pairKey("y", "x"));
    expect(pairKey("x", "y")).not.toBe(pairKey("x", "z"));
  });
});

describe("nombres", () => {
  it("una ficha sin reclamar solo enseña el nombre y la inicial del apellido", () => {
    expect(publicFighterName({ firstName: "Lucía", lastName: "Ramos", listed: false })).toBe("Lucía R.");
    expect(publicFighterName({ firstName: "Lucía", lastName: "Ramos", listed: true })).toBe("Lucía Ramos");
    expect(publicFighterName({ firstName: "Lucía", lastName: "Ramos" })).toBe("Lucía Ramos");
  });
  it("una ficha ocultada no enseña ningún dato", () => {
    expect(publicFighterName({ firstName: "Lucía", lastName: "Ramos", listed: true, hiddenAt: new Date() })).toBe("Peleador anónimo");
  });
  it("el nombre público de una persona usuaria es el nombre y la inicial", () => {
    expect(publicUserName("Ana María López Ruiz")).toBe("Ana M.");
    expect(publicUserName("Ana")).toBe("Ana");
    expect(publicUserName("  ")).toBe("Usuario");
  });
  it("normalizeName ignora tildes, mayúsculas y espacios", () => {
    expect(normalizeName("  José   PÉREZ ")).toBe("jose perez");
  });
});

describe("textos", () => {
  it("firstTooLong detecta el primer campo que no cabe", () => {
    expect(firstTooLong({ a: "x".repeat(5), b: "y" }, { a: 4, b: 10 })).toBe("a");
    expect(firstTooLong({ a: "xx" }, { a: 4 })).toBeNull();
  });
  it("isEmail es estricto", () => {
    for (const ok of ["ana@correo.es", "a.b+c@sub.dominio.com"]) expect(isEmail(ok)).toBe(true);
    for (const bad of ["", "ana", "ana@", "ana@correo", "a b@correo.es", "a@b.es,c@d.es", "a@b.es;c@d.es", "<a@b.es>", "a@b.e", "a".repeat(250) + "@b.es"]) expect(isEmail(bad)).toBe(false);
  });
  it("oneLine quita saltos de línea y caracteres de control", () => {
    expect(oneLine("Hola\r\nBcc: x@y.es\u0000")).toBe("Hola Bcc: x@y.es");
  });
});
