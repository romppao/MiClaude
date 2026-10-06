import type { Discipline, Level } from "@prisma/client";
import type { CategoriaPeso } from "./disciplines";

/** Referencias versionadas: una actualización no cambia el significado de una división ya guardada. */
export type CompetitionDivision = {
  id: string; discipline: Discipline; level: Level; ageGroup: string; sex: "M" | "F";
  minAge: number; maxAge: number | null; ageRule: "YEAR" | "BIRTHDAY" | "YEAR_U18";
  label: string; source: string; note: string; weights: CategoriaPeso[]; combat: boolean;
  year?: number;
  ageException?: "WAKO_RING_SENIOR" | "WAKO_TATAMI_SENIOR";
};
const RFE = "https://feboxeo.es/download/104/documentos-competicion/7554/circular-24-2025-clasificacion-en-categorias-y-pesos-ano-2026-rfeboxeo-v2.pdf";
const IFMA = "https://muaythai.sport/wp-content/uploads/2026/05/IFMA-Rules-and-Regulations-v3.057_110526.pdf";
const WAKO = "https://www.wako.sport/_files/ugd/6445bf_4945eef1b6a649b7bf055956396dace0.pdf";
const IMMAF = "https://immaf.org/2025/11/18/immaf-adopts-year-born-system-for-youth-divisions-from-2026/";
const IBJJF = "https://ibjjf.com/books-videos";
const sexLabel = (sex: "M" | "F") => sex === "M" ? "Masculino" : "Femenino";
/** Intervalos iniciales, límites superiores y categoría abierta; no calcula cortes de peso ni autoriza la participación. */
const weights = (sex: "M" | "F", limits: string[]): CategoriaPeso[] => limits.map((kg) => ({
  valor: `${sex}${kg}`,
  etiqueta: `${sexLabel(sex)} · ${kg.includes("-") ? `de ${kg.replace("-", " a ")} kg` : kg.startsWith("+") ? `más de ${kg.slice(1).replace(".", ",")} kg` : `hasta ${kg.replace(".", ",")} kg`}`,
}));
const divisions: CompetitionDivision[] = [];
function pair(discipline: Discipline, version: string, ageGroup: string, minAge: number, maxAge: number | null, male: string[], female: string[], source: string, note: string, options: Partial<Pick<CompetitionDivision, "combat" | "ageRule" | "year" | "ageException">> = {}) {
  for (const sex of ["M", "F"] as const) divisions.push({
    id: `${version}:${ageGroup}:${sex}`, discipline, level: "AMATEUR", ageGroup, sex, minAge, maxAge,
    label: `${ageGroup} (${maxAge === null ? `${minAge}+` : minAge === maxAge ? minAge : `${minAge}–${maxAge}`} años) · ${sexLabel(sex)}`,
    source, note, weights: weights(sex, sex === "M" ? male : female), combat: true, ageRule: "YEAR", ...options,
  });
}
const eliteM = ["47-50","55","60","65","70","75","80","85","90","+90"];
const eliteF = ["45-48","51","54","57","60","65","70","75","80","+80"];
const junior = ["44-46","48","50","52","54","57","60","63","66","70","75","80","+80"];
const cadete = ["38-40","42","44","46","48","50","52","54","57","60","63","66","70","75","80"];
const infantil = ["25-28","30","32","34","36","38","40","42","44","46","48","50","52","54","57","60","63","66","70","+70"];
const rfeNote = "RFEBoxeo, circular 24/2025 v2, año 2026. Edad por año de nacimiento. La inscripción requiere comprobar licencia y requisitos federativos.";
pair("BOXEO","RFE2026","Élite",19,40,eliteM,eliteF,RFE,`${rfeNote} Primera licencia de competición hasta los 34 años; renovación hasta los 40.`,{year:2026});
pair("BOXEO","RFE2026","Joven",17,18,eliteM,eliteF,RFE,rfeNote,{year:2026});
pair("BOXEO","RFE2026","Júnior",15,16,junior,junior,RFE,rfeNote,{year:2026});
pair("BOXEO","RFE2026","Cadete / Schoolboys–Schoolgirls",13,14,[...cadete,"90","+90"],[...cadete,"+80"],RFE,rfeNote,{year:2026});
pair("BOXEO","RFE2026","Infantil",11,12,infantil,infantil,RFE,rfeNote,{year:2026});
for (const [age,min,max] of [["Benjamín",9,10],["Prebenjamín",7,8]] as const) pair("BOXEO","RFE2026",age,min,max,[],[],RFE,"Solo formación: RFEBoxeo no permite combates ni establece categorías de peso para este grupo.",{combat:false,year:2026});

// IFMA v3.057, reglas 4 y 5. 45 kg élite masculino es una excepción para determinados eventos: no se ofrece como división ordinaria.
const ifmaM = ["48","51","54","57","60","63.5","67","71","75","81","86","91","+91"];
const ifmaF = ["45","48","51","54","57","60","63.5","67","71","75","+75"];
const ifmaNote = "IFMA v3.057 (11/05/2026), reglas 4 y 5. Edad por año de nacimiento. La modalidad y el nivel Khan deben comprobarse con la organización.";
pair("MUAYTHAI","IFMA2026","Élite",18,40,ifmaM,ifmaF,IFMA,ifmaNote);
pair("MUAYTHAI","IFMA2026","U24",18,23,["45",...ifmaM],ifmaF,IFMA,ifmaNote);
pair("MUAYTHAI","IFMA2026","U18",16,17,["45",...ifmaM],["42",...ifmaF],IFMA,ifmaNote);
pair("MUAYTHAI","IFMA2026","U16",14,15,["38","40","42","45","48","51","54","57","60","63.5","67","71","75","81","+81"],["36","38","40","42","45","48","51","54","57","60","63.5","67","71","+71"],IFMA,ifmaNote);
pair("MUAYTHAI","IFMA2026","U14",12,13,["32","34","36","38","40","42","44","46","48","50","52","54","56","58","60","63.5","67","71","+71"],["32","34","36","38","40","42","44","46","48","50","52","54","56","58","60","63.5","+63.5"],IFMA,ifmaNote);
pair("MUAYTHAI","IFMA2026","U12",10,11,["30","32","34","36","38","40","42","44","46","48","50","52","54","56","58","60","63.5","67","+67"],["30","32","34","36","38","40","42","44","46","48","50","52","54","56","58","60","+60"],IFMA,ifmaNote);
pair("MUAYTHAI","IFMA2026","U10",8,9,["20","22","24","26","28","30","32","34","36"],["18","20","22","24","26","28","30","32"],IFMA,ifmaNote);
pair("MUAYTHAI","IFMA2026","U8",6,7,["16","18","20","22","24","26","28"],["16","18","20","22","24","26"],IFMA,ifmaNote);
for (const [age,min,max] of [["Masters 35+",35,39],["Masters 40+",40,44],["Masters 45+",45,50]] as const) pair("MUAYTHAI","IFMA2026",age,min,max,min>=40?ifmaM.filter(w=>w!=="+91"):ifmaM,ifmaF,IFMA,ifmaNote);

// WAKO distingue ring y tatami: las categorías infantiles de tatami no habilitan K-1 ni full contact.
const wakoM = ["51","54","57","60","63.5","67","71","75","81","86","91","+91"];
const wakoF = ["48","52","56","60","65","70","+70"];
for (const d of ["KICKBOXING","K1"] as const) {
  const note = "WAKO, revisión 3 (25/10/2022), capítulo 7, artículo 3. Solo ring (full contact, low kick y K-1); edad por año de nacimiento. Consultar excepciones de participación sénior y cambios de 2026 con la federación.";
  pair(d,`WAKO2022-${d}`,"Ring · Júnior joven",15,16,["42","45","48","51","54","57","60","63.5","67","71","75","81","+81"],["36","40","44","48","52","56","60","+60"],WAKO,note);
  pair(d,`WAKO2022-${d}`,"Ring · Júnior mayor",17,18,wakoM,wakoF,WAKO,note);
  pair(d,`WAKO2022-${d}`,"Ring · Sénior",19,40,wakoM,wakoF,WAKO,`${note} Excepciones: júnior mayor desde los 18 años cumplidos; veteranos de 41–55 solo con autorización especial y certificación médica. La app comprueba la edad; la organización debe comprobar la autorización.`,{ageException:"WAKO_RING_SENIOR"});
}
const tatamiNote = "WAKO, revisión 3, capítulos 1 y 2. Tatami: niños y cadetes jóvenes solo point fighting; cadetes mayores también light contact y kick light. No usar estas divisiones para ring ni K-1.";
const tM=["57","63","69","74","79","84","89","94","+94"],tF=["50","55","60","65","70","+70"];
for (const [age,min,max,m,f] of [
  ["Tatami · Niños",7,9,["18","21","24","27","30","33","36","+36"],["18","21","24","27","30","33","36","+36"]],
  ["Tatami · Cadete joven",10,12,["28","32","37","42","47","+47"],["28","32","37","42","47","+47"]],
  ["Tatami · Cadete mayor",13,15,["32","37","42","47","52","57","63","69","+69"],["32","37","42","46","50","55","60","65","+65"]],
  ["Tatami · Júnior",16,18,tM,tF],["Tatami · Sénior",19,40,tM,tF],
  ["Tatami · Veteranos",41,55,["63","74","84","94","+94"],["55","65","+65"]],
] as const) pair("KICKBOXING","WAKO2022-TATAMI",age,min,max,[...m],[...f],WAKO,age==="Tatami · Sénior" ? `${tatamiNote} También pueden participar júnior de 16–18 años; veteranos de 41–55 necesitan autorización especial y certificación médica, que debe comprobar la organización.` : tatamiNote, age==="Tatami · Sénior" ? {ageException:"WAKO_TATAMI_SENIOR"} : {});

// IMMAF cambió la edad juvenil en 2026: no reutilizar el PDF antiguo de cumpleaños para Youth D/C/B/A.
for (const [age,min,max] of [["Youth D",11,12],["Youth C",13,14],["Youth B",15,16],["Youth A",17,18],["Júnior",18,20],["Sénior",18,null]] as const) pair("MMA","IMMAF2026",age,min,max,[],[],IMMAF,"IMMAF 2026: Youth D nacidos en 2014–2015; C en 2012–2013; B en 2010–2011; A en 2008–2009. Youth por año de nacimiento; Youth A exige no cumplir 18 antes ni durante la competición. Júnior y sénior por edad cumplida. Pesos no catalogados para estas divisiones: confirmar con la organización; no se aplican automáticamente los de adulto masculino.",{year: age.startsWith("Youth") ? 2026 : undefined, ageRule:age==="Youth A"?"YEAR_U18":age.startsWith("Youth")?"YEAR":"BIRTHDAY"});
for (const d of divisions.filter(d=>d.discipline==="MMA" && d.ageGroup==="Youth A")) d.label = `Youth A (nacidos 2008–2009, máximo 17 años cumplidos) · ${sexLabel(d.sex)}`;
// IBJJF: edades por año natural; adulto y máster tienen mínimo, sin máximo. Sexo y edad no bastan: también kimono/sin kimono y cinturón.
for (const [age,min,max] of [
  ...["Mighty Mite I","Mighty Mite II","Mighty Mite III","Pee Wee I","Pee Wee II","Pee Wee III","Junior I","Junior II","Junior III","Teen I","Teen II","Teen III","Juvenile I","Juvenile II"].map((age,i)=>[age,i+4,i+4] as const),
  ["Adulto",18,null],["Máster 1",30,null],["Máster 2",36,null],["Máster 3",41,null],["Máster 4",46,null],["Máster 5",51,null],["Máster 6",56,null],["Máster 7",61,null],
] as const) pair("JIUJITSU","IBJJF2024",age,min,max,[],[],IBJJF,"IBJJF 6.1 (2024), General Competition Guidelines, art. 1. Edad por año de nacimiento. El peso requiere además kimono/sin kimono y cinturón: todavía no está catalogado para esta división.");
// Profesional/amateur no constituye una clasificación federativa IBJJF: la misma división se puede declarar en ambos niveles locales.
for (const d of divisions.filter(d=>d.discipline==="JIUJITSU")) divisions.push({...d,id:`${d.id}:PRO`,level:"PRO"});

export const COMPETITION_DIVISIONS: readonly CompetitionDivision[] = divisions;
export const divisionById = (id?: string | null) => divisions.find(d=>d.id===id);
export const divisionsFor = (discipline: Discipline, level: Level) => divisions.filter(d=>d.discipline===discipline && d.level===level);
export const divisionLabel = (id?: string | null) => divisionById(id)?.label ?? (id || "Edad y categoría sin indicar");

/** Comprobación deportiva, no licencia médica/federativa. Sin nacimiento la edad queda declarada, sin afirmar que se haya verificado. */
export function divisionAgeEligible(id: string, birth: Date | null, start: Date, end = start): boolean {
  const d = divisionById(id);
  if (!d || end < start || (d.year && start.getUTCFullYear()!==d.year)) return false;
  if (!birth) return true;
  if (birth > start) return false;
  const birthdayAge = (date: Date) => date.getUTCFullYear()-birth.getUTCFullYear() - (date.getUTCMonth()<birth.getUTCMonth() || (date.getUTCMonth()===birth.getUTCMonth() && date.getUTCDate()<birth.getUTCDate()) ? 1 : 0);
  const min = d.ageRule==="BIRTHDAY"?birthdayAge(start):start.getUTCFullYear()-birth.getUTCFullYear();
  const max = d.ageRule==="BIRTHDAY"?birthdayAge(end):end.getUTCFullYear()-birth.getUTCFullYear();
  // WAKO cap. 1 permite subir júnior a sénior y autorizar veteranos. Esto comprueba edad, no sustituye autorización/licencia.
  if (d.ageException) return min >= (d.ageException === "WAKO_RING_SENIOR" ? 18 : 16) && max <= 55 && (d.ageException !== "WAKO_RING_SENIOR" || birthdayAge(start) >= 18);
  return min>=d.minAge && (d.maxAge===null || max<=d.maxAge) && (d.ageRule!=="YEAR_U18" || birthdayAge(end)<18);
}

export function divisionEligible(id: string, birth: Date | null, start: Date, end = start): boolean {
  return !!divisionById(id)?.combat && divisionAgeEligible(id, birth, start, end);
}
/** Evita eludir la edad mínima/máxima de boxeo dejando la división vacía cuando se conoce el nacimiento. */
export function knownBoxingAgeEligible(discipline: Discipline, level: Level, birth: Date | null, date: Date): boolean {
  if (discipline !== "BOXEO" || level !== "AMATEUR" || !birth || date.getUTCFullYear() !== 2026) return true;
  const age = 2026-birth.getUTCFullYear();
  return age>=11 && age<=40;
}
