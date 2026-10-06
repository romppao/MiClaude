import { expect, it } from "vitest";
import { calcularRecord } from "./reto-2";
it("calcula subtotales y racha cronológica sin mutar", () => { const x=[{fecha:"2026-02-01",resultado:"V" as const,metodo:"TKO" as const},{fecha:"2026-01-01",resultado:"D" as const},{fecha:"2026-03-01",resultado:"SR" as const},{fecha:"2026-04-01",resultado:"V" as const,metodo:"SUMISION" as const}]; Object.freeze(x); expect(calcularRecord(x)).toMatchObject({victorias:2,derrotas:1,victoriasPorKO:1,victoriasPorSumision:1,racha:{tipo:"V",longitud:2}}); });
it("valida fechas reales y métodos",()=>{expect(()=>calcularRecord([{fecha:"2026-02-30",resultado:"V"}])).toThrow(RangeError);expect(()=>calcularRecord([{fecha:"2026-01-01",resultado:"V",metodo:"X" as never}])).toThrow(RangeError);});
