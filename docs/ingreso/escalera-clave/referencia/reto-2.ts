export type Resultado = "V" | "D" | "E" | "SR";
export type Metodo = "KO" | "TKO" | "SUMISION" | "DECISION" | "DESCALIFICACION";
export interface Combate { fecha: string; resultado: Resultado; metodo?: Metodo }
export interface RecordDeportivo {
  victorias: number; derrotas: number; empates: number; sinResultado: number;
  victoriasPorKO: number; victoriasPorSumision: number; victoriasPorDecision: number;
  racha: { tipo: "V" | "D" | "E" | null; longitud: number };
}
const RESULTADOS = ["V", "D", "E", "SR"];
const METODOS = ["KO", "TKO", "SUMISION", "DECISION", "DESCALIFICACION"];
function fechaReal(f: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f);
  if (!m) return false;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}
export function calcularRecord(combates: readonly Combate[]): RecordDeportivo {
  for (const c of combates) {
    if (!RESULTADOS.includes(c.resultado)) throw new RangeError("resultado no válido");
    if (!fechaReal(c.fecha)) throw new RangeError("fecha no válida");
    if (c.metodo !== undefined && !METODOS.includes(c.metodo)) throw new RangeError("método no válido");
  }
  const r: RecordDeportivo = { victorias: 0, derrotas: 0, empates: 0, sinResultado: 0, victoriasPorKO: 0, victoriasPorSumision: 0, victoriasPorDecision: 0, racha: { tipo: null, longitud: 0 } };
  const ordenados = combates.map((c, i) => ({ c, i })).sort((a, b) => (a.c.fecha < b.c.fecha ? -1 : a.c.fecha > b.c.fecha ? 1 : a.i - b.i));
  for (const { c } of ordenados) {
    if (c.resultado === "SR") { r.sinResultado++; continue; }
    if (c.resultado === "V") {
      r.victorias++;
      if (c.metodo === "KO" || c.metodo === "TKO") r.victoriasPorKO++;
      else if (c.metodo === "SUMISION") r.victoriasPorSumision++;
      else if (c.metodo === "DECISION") r.victoriasPorDecision++;
    } else if (c.resultado === "D") r.derrotas++;
    else r.empates++;
    if (r.racha.tipo === c.resultado) r.racha.longitud++;
    else r.racha = { tipo: c.resultado, longitud: 1 };
  }
  return r;
}
