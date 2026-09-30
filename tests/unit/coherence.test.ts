import { describe, expect, it } from "vitest";
import { proximityFlags } from "../../src/lib/coherence";

const d = (s: string) => new Date(`${s}T12:00:00Z`);

describe("proximityFlags", () => {
  it("sin otros combates no hay señales", () => {
    expect(proximityFlags(d("2026-05-10"), [])).toEqual([]);
  });
  it("otro combate el mismo día", () => {
    expect(proximityFlags(d("2026-05-10"), [d("2026-05-10")])).toEqual(["MISMO_DIA"]);
  });
  it("combates con menos de 7 días de diferencia, antes o después", () => {
    expect(proximityFlags(d("2026-05-10"), [d("2026-05-05")])).toEqual(["MUY_SEGUIDOS"]);
    expect(proximityFlags(d("2026-05-10"), [d("2026-05-16")])).toEqual(["MUY_SEGUIDOS"]);
  });
  it("7 días o más no es sospechoso", () => {
    expect(proximityFlags(d("2026-05-10"), [d("2026-05-17"), d("2026-05-03")])).toEqual([]);
  });
  it("puede dar las dos señales a la vez y sin repetirlas", () => {
    const f = proximityFlags(d("2026-05-10"), [d("2026-05-10"), d("2026-05-10"), d("2026-05-12")]);
    expect(f.sort()).toEqual(["MISMO_DIA", "MUY_SEGUIDOS"]);
  });
});
