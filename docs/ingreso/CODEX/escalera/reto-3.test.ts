import { expect,it } from "vitest"; import { duracionEnMinutos } from "./reto-3";
it("respeta los cambios de hora en Madrid",()=>{expect(duracionEnMinutos("2026-03-29T01:30","2026-03-29T03:30")).toBe(60);expect(duracionEnMinutos("2026-10-25T01:30","2026-10-25T03:30")).toBe(180);expect(duracionEnMinutos("2026-03-29T02:30","2026-03-29T03:30")).toBe(0);});
it("valida formato, zona y orden",()=>{expect(()=>duracionEnMinutos("2026-02-30T10:00","2026-02-30T10:01")).toThrow(RangeError);expect(()=>duracionEnMinutos("2026-01-01T10:00","2026-01-01T09:59","UTC")).toThrow(RangeError);});
