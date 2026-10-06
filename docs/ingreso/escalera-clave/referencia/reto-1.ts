export function recortarTexto(texto: string, maximo: number): string {
  if (!Number.isInteger(maximo)) throw new RangeError("maximo debe ser un entero");
  if (maximo <= 0) return "";
  const cs = Array.from(texto);
  if (cs.length <= maximo) return texto;
  const n = maximo - 1;
  if (n === 0) return "…";
  let trozo: string[];
  if (/\s/u.test(cs[n])) trozo = cs.slice(0, n);
  else {
    let i = n - 1;
    while (i >= 0 && !/\s/u.test(cs[i])) i--;
    trozo = i >= 0 ? cs.slice(0, i) : cs.slice(0, n);
  }
  return trozo.join("").replace(/[\s,;:.!?]+$/u, "") + "…";
}
