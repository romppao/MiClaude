import { describe, expect, it } from "vitest";
import { COMPETITION_DIVISIONS, divisionById, divisionEligible, divisionsFor, knownBoxingAgeEligible } from "../../src/lib/common/competition";
import { parseCompetitionChoice, weightClassesFor } from "../../src/lib/common/disciplines";
import { rankByCategory } from "../../src/lib/aura/ranking";
const day=(s:string)=>new Date(`${s}T00:00:00Z`);
const rfe=(age:string,sex="M")=>`RFE2026:${age}:${sex}`;
const cadete="Cadete / Schoolboys–Schoolgirls";

describe("divisiones federativas y pesos",()=>{
  it("RFEBoxeo 2026 incluye siete edades, sin convertir la formación en combate",()=>{
    const ds=divisionsFor("BOXEO","AMATEUR");
    expect(new Set(ds.map(d=>d.ageGroup)).size).toBe(7);
    expect(ds).toHaveLength(14);
    expect(divisionById(rfe("Benjamín"))?.combat).toBe(false);
    expect(divisionById(rfe("Prebenjamín"))?.weights).toEqual([]);
    expect(parseCompetitionChoice("BOXEO","AMATEUR","M30",rfe("Benjamín"))).toBeNull();
    expect(parseCompetitionChoice("BOXEO","AMATEUR","",rfe("Benjamín"))?.divisionId).toBe(rfe("Benjamín"));
  });
  it("un peso de élite no se acepta como júnior o infantil; el sexo pertenece a la división",()=>{
    expect(parseCompetitionChoice("BOXEO","AMATEUR","M65",rfe("Júnior"))).toBeNull();
    expect(parseCompetitionChoice("BOXEO","AMATEUR","M66",rfe("Júnior"))?.weightClass).toBe("M66");
    expect(parseCompetitionChoice("BOXEO","AMATEUR","M47-50",rfe("Infantil"))).toBeNull();
    expect(parseCompetitionChoice("BOXEO","AMATEUR","M50",rfe("Júnior","F"))).toBeNull();
    expect(parseCompetitionChoice("BOXEO","PRO","M50",rfe("Júnior"))).toBeNull();
    expect(parseCompetitionChoice("MMA","AMATEUR","M50",rfe("Júnior"))).toBeNull();
  });
  it("los abiertos y los intervalos iniciales escolares son los de la circular, incluidos los femeninos",()=>{
    const values=(age:string,sex="M")=>weightClassesFor("BOXEO","AMATEUR",rfe(age,sex)).map(w=>w.valor);
    expect(values("Júnior")).toHaveLength(13);
    expect(values(cadete)).toHaveLength(17);
    expect(values(cadete,"F")).toHaveLength(16);
    expect(values(cadete)[0]).toBe("M38-40");
    expect(values(cadete,"F").at(-1)).toBe("F+80");
    expect(values("Infantil")).toHaveLength(20);
    expect(values("Infantil")[0]).toBe("M25-28");
    expect(values("Infantil","F").at(-1)).toBe("F+70");
  });
  it("WAKO ring y tatami no comparten categorías infantiles; K-1 solo usa las de ring",()=>{
    expect(divisionsFor("K1","AMATEUR").every(d=>d.minAge>=15)).toBe(true);
    expect(divisionsFor("KICKBOXING","AMATEUR").some(d=>d.minAge===7 && d.ageGroup.startsWith("Tatami"))).toBe(true);
    expect(parseCompetitionChoice("K1","AMATEUR","M18","WAKO2022-TATAMI:Tatami · Niños:M")).toBeNull();
    expect(parseCompetitionChoice("K1","AMATEUR","F36","WAKO2022-K1:Ring · Júnior joven:F")?.weightClass).toBe("F36");
  });
  it("IFMA no ofrece excepciones élite como pesos ordinarios ni inventa categorías abiertas para U8",()=>{
    expect(weightClassesFor("MUAYTHAI","AMATEUR","IFMA2026:Élite:M").some(w=>w.valor==="M45")).toBe(false);
    expect(weightClassesFor("MUAYTHAI","AMATEUR","IFMA2026:U24:M")[0].valor).toBe("M45");
    expect(weightClassesFor("MUAYTHAI","AMATEUR","IFMA2026:U8:F").at(-1)?.valor).toBe("F26");
    expect(weightClassesFor("MUAYTHAI","AMATEUR","IFMA2026:Masters 40+:M").some(w=>w.valor==="M+91")).toBe(false);
  });
  it("no traslada los pesos masculinos adultos a MMA juvenil o jiu-jitsu infantil",()=>{
    expect(weightClassesFor("MMA","AMATEUR","IMMAF2026:Youth C:F")).toEqual([]);
    expect(weightClassesFor("JIUJITSU","AMATEUR","IBJJF2024:Mighty Mite I:M")).toEqual([]);
    expect(parseCompetitionChoice("MMA","AMATEUR","Mosca","IMMAF2026:Youth C:M")).toBeNull();
  });
  it("las declaraciones antiguas no se convierten por deducción en élite ni en masculino",()=>{
    expect(parseCompetitionChoice("BOXEO","AMATEUR","M65","")).toEqual({discipline:"BOXEO",level:"AMATEUR",weightClass:"M65",divisionId:null});
    expect(parseCompetitionChoice("BOXEO","AMATEUR","","__proto__")).toBeNull();
    expect(weightClassesFor("BOXEO","AMATEUR","constructor")).toEqual([]);
    expect(new Set(COMPETITION_DIVISIONS.map(d=>d.id)).size).toBe(COMPETITION_DIVISIONS.length);
  });
});

describe("edad en la competición, no edad actual",()=>{
  it("RFE calcula por año natural: un júnior puede tener todavía 14 el día del combate",()=>{
    expect(divisionEligible(rfe("Júnior"),day("2011-12-31"),day("2026-01-01"))).toBe(true);
    expect(divisionEligible(rfe("Júnior"),day("2012-01-01"),day("2026-12-31"))).toBe(false);
    expect(divisionEligible(rfe("Élite"),day("1985-12-31"),day("2026-01-01"))).toBe(false);
    expect(divisionEligible(rfe("Júnior"),null,day("2027-01-01"))).toBe(false);
    expect(divisionEligible(rfe("Benjamín"),null,day("2026-10-03"))).toBe(false);
  });
  it("IMMAF 2026 usa los años de su nueva circular y mantiene la excepción de Youth A",()=>{
    expect(divisionEligible("IMMAF2026:Youth D:M",day("2014-12-31"),day("2026-01-01"))).toBe(true);
    expect(divisionEligible("IMMAF2026:Youth D:M",day("2013-12-31"),day("2026-01-01"))).toBe(false);
    expect(divisionEligible("IMMAF2026:Youth A:F",day("2008-10-10"),day("2026-10-01"),day("2026-10-09"))).toBe(true);
    expect(divisionEligible("IMMAF2026:Youth A:F",day("2008-10-10"),day("2026-10-01"),day("2026-10-10"))).toBe(false);
    expect(divisionEligible("IMMAF2026:Júnior:M",day("2008-10-10"),day("2026-10-09"))).toBe(false);
    expect(divisionEligible("IMMAF2026:Júnior:M",day("2008-10-10"),day("2026-10-10"))).toBe(true);
  });
  it("IBJJF máster expresa mínimos sin inventar máximos y permite la categoría adulta",()=>{
    expect(divisionEligible("IBJJF2024:Máster 1:F",day("1960-12-31"),day("2026-01-01"))).toBe(true);
    expect(divisionEligible("IBJJF2024:Máster 1:F",day("2000-01-01"),day("2026-01-01"))).toBe(false);
    expect(divisionEligible("IBJJF2024:Adulto:F",day("1960-12-31"),day("2026-01-01"))).toBe(true);
  });
});
it("el ránking no mezcla edad, sexo, modalidad o una división sin confirmar aunque coincida el peso",()=>{
  const e=(name:string,divisionId:string|null,weightClass="M60")=>({fighterId:name,slug:name,name,level:"AMATEUR" as const,weightClass,divisionId,aura:2});
  const r=rankByCategory([e("Junior",rfe("Júnior")),e("Elite",rfe("Élite")),e("Unknown",null),e("Female",rfe("Júnior","F"),"F60")],"BOXEO");
  expect(r).toHaveLength(4);
  expect(r.every(g=>g.entries.length===1 && g.entries[0].position===1)).toBe(true);
  expect(r.at(-1)?.divisionId).toBeNull();
});

it("dejar la división vacía no permite un combate de boxeo de un benjamín cuyo nacimiento conocemos",()=>{
  expect(knownBoxingAgeEligible("BOXEO","AMATEUR",day("2017-01-01"),day("2026-10-03"))).toBe(false);
  expect(knownBoxingAgeEligible("BOXEO","AMATEUR",day("2015-12-31"),day("2026-01-01"))).toBe(true);
});

it("las excepciones WAKO no se rechazan por aplicar solo la franja sénior general",()=>{
  const ring="WAKO2022-K1:Ring · Sénior:M", tatami="WAKO2022-TATAMI:Tatami · Sénior:F";
  expect(divisionEligible(ring,day("2008-10-10"),day("2026-10-09"))).toBe(false);
  expect(divisionEligible(ring,day("2008-10-10"),day("2026-10-10"))).toBe(true);
  expect(divisionEligible(tatami,day("2010-12-31"),day("2026-01-01"))).toBe(true);
  expect(divisionEligible(tatami,day("2011-01-01"),day("2026-12-31"))).toBe(false);
  expect(divisionEligible(ring,day("1971-12-31"),day("2026-01-01"))).toBe(true);
  expect(divisionEligible(ring,day("1970-12-31"),day("2026-01-01"))).toBe(false);
  expect(divisionById(ring)?.note).toContain("autorización especial");
});
