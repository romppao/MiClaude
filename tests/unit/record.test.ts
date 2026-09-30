import { describe, expect, it } from "vitest";
import { computeRecords, formatRecord, type BoutForRecord } from "../../src/lib/record";

const bout = (over: Partial<BoutForRecord> & { level?: "PRO" | "AMATEUR"; status?: string }): BoutForRecord => ({
  fighterAId: "me",
  result: "A_WIN",
  method: "UD",
  verification: "VERIFIED",
  ...over,
  event: { level: over.level ?? "AMATEUR", status: over.status ?? "COMPLETED" },
});

describe("computeRecords", () => {
  it("cuenta victorias y derrotas según la esquina en la que estaba el peleador", () => {
    const r = computeRecords("me", [
      bout({ result: "A_WIN" }), // gana como A
      bout({ fighterAId: "otro", result: "B_WIN" }), // gana como B
      bout({ result: "B_WIN" }), // pierde como A
      bout({ fighterAId: "otro", result: "A_WIN" }), // pierde como B
    ]).AMATEUR;
    expect(r).toMatchObject({ w: 2, l: 2, d: 0 });
  });

  it("cuenta empates y sin decisión aparte", () => {
    const r = computeRecords("me", [bout({ result: "DRAW" }), bout({ result: "NO_CONTEST" })]).AMATEUR;
    expect(r).toMatchObject({ w: 0, l: 0, d: 1, nc: 1 });
  });

  it("cuenta como KO las victorias por KO, TKO y abandono, pero no las derrotas", () => {
    const r = computeRecords("me", [
      bout({ method: "KO" }), bout({ method: "TKO" }), bout({ method: "RTD" }), bout({ method: "UD" }),
      bout({ result: "B_WIN", method: "KO" }),
    ]).AMATEUR;
    expect(r).toMatchObject({ w: 4, l: 1, ko: 3 });
  });

  it("separa profesional y amateur", () => {
    const r = computeRecords("me", [bout({ level: "PRO" }), bout({ level: "AMATEUR", result: "B_WIN" })]);
    expect(r.PRO).toMatchObject({ w: 1, l: 0 });
    expect(r.AMATEUR).toMatchObject({ w: 0, l: 1 });
  });

  it("ignora combates sin resultado, disputados o de eventos cancelados", () => {
    const r = computeRecords("me", [
      bout({ result: null }), bout({ verification: "DISPUTED" }), bout({ status: "CANCELLED" }),
    ]).AMATEUR;
    expect(r).toMatchObject({ w: 0, l: 0, d: 0, nc: 0 });
  });

  it("marca como sin confirmar solo los autodeclarados", () => {
    const r = computeRecords("me", [
      bout({ verification: "SELF_REPORTED" }), bout({ verification: "CONFIRMED" }), bout({ verification: "VERIFIED" }),
    ]).AMATEUR;
    expect(r).toMatchObject({ w: 3, unverified: 1 });
  });
});

describe("formatRecord", () => {
  it("formatea V-D-E y añade NC solo si hay", () => {
    expect(formatRecord({ w: 5, l: 2, d: 1, nc: 0, ko: 3, unverified: 0 })).toBe("5-2-1");
    expect(formatRecord({ w: 5, l: 2, d: 1, nc: 2, ko: 3, unverified: 0 })).toBe("5-2-1 (2 NC)");
  });
});
