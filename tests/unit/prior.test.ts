import { describe, expect, it } from "vitest";
import { parsePrior } from "../../src/lib/prior";
import { combinedRecord, computeRecords, emptyTally, priorIsDetailed, type BoutForRecord } from "../../src/lib/record";

describe("parsePrior (récord de partida declarado)", () => {
  it("sin nada rellenado no hay récord de partida", () => {
    expect(parsePrior({})).toEqual({ ok: true, prior: { total: null, wins: null, losses: null, draws: null } });
  });
  it("si solo recuerda cuántos combates lleva, se guarda solo el total", () => {
    expect(parsePrior({ total: "12" })).toEqual({ ok: true, prior: { total: 12, wins: null, losses: null, draws: null } });
  });
  it("si recuerda el récord, el total sale de la suma", () => {
    expect(parsePrior({ wins: "8", losses: "3", draws: "1" })).toEqual({ ok: true, prior: { total: 12, wins: 8, losses: 3, draws: 1 } });
  });
  it("las cifras del récord que deja en blanco cuentan como 0", () => {
    expect(parsePrior({ wins: "5", losses: "2" })).toEqual({ ok: true, prior: { total: 7, wins: 5, losses: 2, draws: 0 } });
  });
  it("si da el total y el récord, deben coincidir", () => {
    expect(parsePrior({ total: "12", wins: "8", losses: "3", draws: "1" }).ok).toBe(true);
    expect(parsePrior({ total: "20", wins: "8", losses: "3", draws: "1" })).toEqual({ ok: false, error: "prior_suma" });
  });
  it("rechaza negativos, decimales, texto y cifras absurdas", () => {
    for (const bad of ["-1", "2.5", "abc", "5000"]) expect(parsePrior({ total: bad })).toEqual({ ok: false, error: "prior_numero" });
  });
});

describe("combinedRecord", () => {
  const t = { ...emptyTally(), w: 2, l: 1, d: 0 };
  it("suma el récord de partida solo si tiene detalle", () => {
    const c = combinedRecord(t, { total: 12, wins: 8, losses: 3, draws: 1 });
    expect(c).toMatchObject({ w: 10, l: 4, d: 1, priorTotal: 12, priorDetailed: true });
  });
  it("si solo se conoce el total, no lo mezcla con victorias y derrotas", () => {
    const c = combinedRecord(t, { total: 12, wins: null, losses: null, draws: null });
    expect(c).toMatchObject({ w: 2, l: 1, d: 0, priorTotal: 12, priorDetailed: false });
  });
  it("sin récord de partida devuelve solo lo registrado", () => {
    expect(combinedRecord(t, null)).toMatchObject({ w: 2, l: 1, d: 0, priorTotal: 0, priorDetailed: false });
    expect(priorIsDetailed(null)).toBe(false);
  });
});

describe("computeRecords por disciplina", () => {
  const b = (discipline: BoutForRecord["event"]["discipline"], method: BoutForRecord["method"], result: BoutForRecord["result"] = "A_WIN"): BoutForRecord => ({
    fighterAId: "me", result, method, verification: "VERIFIED", event: { level: "AMATEUR", status: "COMPLETED", discipline },
  });
  it("separa el récord de cada disciplina", () => {
    const r = computeRecords("me", [b("BOXEO", "KO"), b("MMA", "SUBMISSION"), b("MMA", "UD", "B_WIN")]);
    expect(r.BOXEO?.AMATEUR).toMatchObject({ w: 1, l: 0, ko: 1 });
    expect(r.MMA?.AMATEUR).toMatchObject({ w: 1, l: 1, sub: 1, ko: 0 });
    expect(r.JIUJITSU).toBeUndefined();
  });
});
