import { describe, expect, it } from "vitest";
import { computeRecords, formatRecord, type BoutForRecord } from "../../src/lib/fighters/record";

const bout = (over: Partial<BoutForRecord> & { level?: "PRO" | "AMATEUR"; status?: string }): BoutForRecord => ({
  fighterAId: "me",
  result: "A_WIN",
  method: "UD",
  verification: "VERIFIED",
  ...over,
  event: { level: over.level ?? "AMATEUR", status: over.status ?? "COMPLETED", discipline: "BOXEO" },
});

describe("computeRecords", () => {
  it("cuenta victorias y derrotas según la esquina en la que estaba el peleador", () => {
    const r = computeRecords("me", [
      bout({ result: "A_WIN" }), // gana como A
      bout({ fighterAId: "otro", result: "B_WIN" }), // gana como B
      bout({ result: "B_WIN" }), // pierde como A
      bout({ fighterAId: "otro", result: "A_WIN" }), // pierde como B
    ]).BOXEO!.AMATEUR;
    expect(r).toMatchObject({ w: 2, l: 2, d: 0 });
  });

  it("cuenta empates y sin decisión aparte", () => {
    const r = computeRecords("me", [bout({ result: "DRAW" }), bout({ result: "NO_CONTEST" })]).BOXEO!.AMATEUR;
    expect(r).toMatchObject({ w: 0, l: 0, d: 1, nc: 1 });
  });

  it("cuenta como KO las victorias por KO, TKO y abandono, pero no las derrotas", () => {
    const r = computeRecords("me", [
      bout({ method: "KO" }), bout({ method: "TKO" }), bout({ method: "RTD" }), bout({ method: "UD" }),
      bout({ result: "B_WIN", method: "KO" }),
    ]).BOXEO!.AMATEUR;
    expect(r).toMatchObject({ w: 4, l: 1, ko: 3 });
  });

  it("separa profesional y amateur", () => {
    const r = computeRecords("me", [bout({ level: "PRO" }), bout({ level: "AMATEUR", result: "B_WIN" })]);
    expect(r.BOXEO!.PRO).toMatchObject({ w: 1, l: 0 });
    expect(r.BOXEO!.AMATEUR).toMatchObject({ w: 0, l: 1 });
  });

  it("ignora combates sin resultado, disputados o de eventos cancelados", () => {
    const r = computeRecords("me", [
      bout({ result: null }), bout({ verification: "DISPUTED" }), bout({ status: "CANCELLED" }),
    ]);
    expect(r).toEqual({}); // nada cuenta: ni siquiera aparece la disciplina
  });

  it("marca como sin confirmar solo los autodeclarados", () => {
    const r = computeRecords("me", [
      bout({ verification: "SELF_REPORTED" }), bout({ verification: "CONFIRMED" }), bout({ verification: "VERIFIED" }),
    ]).BOXEO!.AMATEUR;
    expect(r).toMatchObject({ w: 3, unverified: 1 });
  });
});

describe("formatRecord", () => {
  it("formatea V-D-E y añade NC solo si hay", () => {
    expect(formatRecord({ w: 5, l: 2, d: 1, nc: 0 })).toBe("5-2-1");
    expect(formatRecord({ w: 5, l: 2, d: 1, nc: 2 })).toBe("5-2-1 (2 NC)");
  });
});

describe("la confirmación del rival es opcional", () => {
  it("muestra declaraciones en ambas esquinas, identificadas como sin confirmar", () => {
    const declared = bout({ verification: "SELF_REPORTED", fighterAId: "otro", result: "A_WIN" });
    expect(computeRecords("me", [declared]).BOXEO!.AMATEUR).toMatchObject({ w: 0, l: 1, unverified: 1 });
    expect(computeRecords("otro", [declared]).BOXEO!.AMATEUR).toMatchObject({ w: 1, l: 0, unverified: 1 });
  });
});
