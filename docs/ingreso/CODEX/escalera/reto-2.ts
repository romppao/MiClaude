export type Resultado = "V" | "D" | "E" | "SR";
export type Metodo = "KO" | "TKO" | "SUMISION" | "DECISION" | "DESCALIFICACION";
export interface Combate { fecha: string; resultado: Resultado; metodo?: Metodo }
export interface RecordDeportivo { victorias: number; derrotas: number; empates: number; sinResultado: number; victoriasPorKO: number; victoriasPorSumision: number; victoriasPorDecision: number; racha: { tipo: "V" | "D" | "E" | null; longitud: number } }
const resultados = new Set<Resultado>(["V", "D", "E", "SR"]), metodos = new Set<Metodo>(["KO", "TKO", "SUMISION", "DECISION", "DESCALIFICACION"]);
function fechaValida(fecha: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false; const [y,m,d]=fecha.split("-").map(Number); const x=new Date(Date.UTC(y,m-1,d)); return x.getUTCFullYear()===y && x.getUTCMonth()===m-1 && x.getUTCDate()===d; }
export function calcularRecord(combates: readonly Combate[]): RecordDeportivo {
  for (const c of combates) if (!resultados.has(c.resultado) || (c.metodo !== undefined && !metodos.has(c.metodo)) || !fechaValida(c.fecha)) throw new RangeError("Combate inválido");
  const r: RecordDeportivo={victorias:0,derrotas:0,empates:0,sinResultado:0,victoriasPorKO:0,victoriasPorSumision:0,victoriasPorDecision:0,racha:{tipo:null,longitud:0}};
  for (const c of combates) { if(c.resultado==="V"){r.victorias++; if(c.metodo==="KO"||c.metodo==="TKO")r.victoriasPorKO++; if(c.metodo==="SUMISION")r.victoriasPorSumision++; if(c.metodo==="DECISION")r.victoriasPorDecision++;} else if(c.resultado==="D")r.derrotas++; else if(c.resultado==="E")r.empates++; else r.sinResultado++; }
  const ordenados=combates.map((c,i)=>({c,i})).sort((a,b)=>a.c.fecha.localeCompare(b.c.fecha)||a.i-b.i).map(x=>x.c).filter(c=>c.resultado!=="SR");
  const ultimo=ordenados.at(-1)?.resultado; if(ultimo){r.racha.tipo=ultimo; for(let i=ordenados.length-1;i>=0&&ordenados[i].resultado===ultimo;i--)r.racha.longitud++;} return r;
}
