/**
 * Media bayesiana: evita que un boxeador con una sola nota de 5 supere a uno con 40 notas de 4,8.
 * `prior` es la media global y `weight` el nº de votos "virtuales" que le damos.
 */
export function bayesian(avg: number, count: number, prior: number, weight = 3) {
  return (weight * prior + avg * count) / (weight + count);
}
