export interface OpcionesLimitador { maximo: number; ventanaMs: number; ahora?: () => number; maxClaves?: number }
export interface Decision { permitido: boolean; restantes: number; reintentarEnMs: number }
export function crearLimitador(op: OpcionesLimitador) {
  const { maximo, ventanaMs } = op;
  const maxClaves = op.maxClaves ?? 10000;
  if (!Number.isInteger(maximo) || maximo < 1) throw new RangeError("maximo");
  if (!Number.isFinite(ventanaMs) || ventanaMs <= 0) throw new RangeError("ventanaMs");
  if (!Number.isInteger(maxClaves) || maxClaves < 1) throw new RangeError("maxClaves");
  const reloj = op.ahora ?? (() => Date.now());
  let visto = -Infinity;
  const claves = new Map<string, number[]>();
  const hora = () => { visto = Math.max(visto, reloj()); return visto; };
  return {
    permitir(clave: string): Decision {
      const ahora = hora();
      let hist = claves.get(clave);
      if (hist === undefined) {
        if (claves.size >= maxClaves) claves.delete(claves.keys().next().value as string);
        hist = [];
      } else claves.delete(clave);
      claves.set(clave, hist);
      while (hist.length && hist[0] <= ahora - ventanaMs) hist.shift();
      if (hist.length >= maximo) return { permitido: false, restantes: 0, reintentarEnMs: hist[0] + ventanaMs - ahora };
      hist.push(ahora);
      return { permitido: true, restantes: maximo - hist.length, reintentarEnMs: 0 };
    },
    tamano: () => claves.size,
    limpiar() {
      const ahora = hora();
      for (const [k, h] of claves) if (!h.some((t) => t > ahora - ventanaMs)) claves.delete(k);
    },
  };
}
