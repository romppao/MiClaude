import { describe, expect, it } from "vitest";
import { parsePrior } from "../../src/lib/fighters/prior";
import { combinedRecord, computeRecords, emptyTally, priorIsDetailed, type BoutForRecord } from "../../src/lib/fighters/record";

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

describe("parsePrior: casos límite", () => {
  it("acepta el 0 como cifra válida y los espacios alrededor", () => {
    expect(parsePrior({ total: " 0 " })).toEqual({ ok: true, prior: { total: 0, wins: null, losses: null, draws: null } });
    expect(parsePrior({ wins: "0", losses: "0", draws: "0" })).toEqual({ ok: true, prior: { total: 0, wins: 0, losses: 0, draws: 0 } });
  });
  it("acepta ceros a la izquierda y rechaza dígitos que no son ASCII", () => {
    expect(parsePrior({ total: "007" })).toEqual({ ok: true, prior: { total: 7, wins: null, losses: null, draws: null } });
    expect(parsePrior({ total: "１２" })).toEqual({ ok: false, error: "prior_numero" });
  });
  it("el tope de 1000 vale para cada cifra y también para la suma", () => {
    expect(parsePrior({ total: "1000" }).ok).toBe(true);
    expect(parsePrior({ total: "1001" })).toEqual({ ok: false, error: "prior_numero" });
    expect(parsePrior({ wins: "600", losses: "600" })).toEqual({ ok: false, error: "prior_numero" });
    expect(parsePrior({ wins: "500", losses: "500" }).ok).toBe(true);
  });
  it("una cifra en blanco con las demás vacías no inventa un récord", () => {
    expect(parsePrior({ total: "", wins: " ", losses: "", draws: "" })).toEqual({ ok: true, prior: { total: null, wins: null, losses: null, draws: null } });
  });
  it("el total solo y un récord que no suma dan el error de la suma, no el del número", () => {
    expect(parsePrior({ total: "5", wins: "2" })).toEqual({ ok: false, error: "prior_suma" });
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
