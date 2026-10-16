export function recortarTexto(texto: string, maximo: number): string {
  if (!Number.isInteger(maximo)) throw new RangeError("El máximo debe ser un entero");
  if (maximo <= 0) return "";
  const caracteres = Array.from(texto);
  if (caracteres.length <= maximo) return texto;
  let trozo = caracteres.slice(0, maximo - 1);
  if (!/^\s$/u.test(caracteres[maximo - 1] ?? "")) {
    const ultimoEspacio = trozo.map((c, i) => /^\s$/u.test(c) ? i : -1).reduce((a, i) => Math.max(a, i), -1);
    if (ultimoEspacio >= 0) trozo = trozo.slice(0, ultimoEspacio);
  }
  while (trozo.length && (/^\s$/u.test(trozo[trozo.length - 1]) || /[,;:.!?]/u.test(trozo[trozo.length - 1]))) trozo.pop();
  return `${trozo.join("")}…`;
}
