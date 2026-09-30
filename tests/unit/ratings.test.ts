import { describe, expect, it } from "vitest";
import { bayesian } from "../../src/lib/ratings";

describe("bayesian", () => {
  it("con pocos votos se acerca a la media global", () => {
    expect(bayesian(5, 1, 3)).toBeCloseTo(3.5);
  });
  it("con muchos votos se acerca a la media propia", () => {
    expect(bayesian(4.8, 1000, 3)).toBeGreaterThan(4.79);
  });
  it("un 5 aislado no supera a 40 notas de 4,8", () => {
    expect(bayesian(5, 1, 3)).toBeLessThan(bayesian(4.8, 40, 3));
  });
  it("sin votos devuelve la media global", () => {
    expect(bayesian(0, 0, 3)).toBe(3);
  });
});
