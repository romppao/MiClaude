// Ámbito nacional y disciplinas sin prioridades editoriales. Solo datos ficticios en la base de pruebas.
import { B, rnd, browser, seen, check, sql, enDias, newUser, terminarDiagnosticos } from "./ayudas.mjs";
const prefix = `000Inclusiva${rnd}`;
const disciplinas = [["BOXEO", "Boxeo", "Madrid", "AMATEUR"], ["JIUJITSU", "Jiu-jitsu", "Valencia", "PRO"], ["K1", "K-1", "Sevilla", "AMATEUR"], ["KICKBOXING", "Kickboxing", "Asturias", "PRO"], ["MMA", "MMA", "Las Palmas", "PRO"], ["MUAYTHAI", "Muay Thai", "A Coruña", "AMATEUR"]];
for (const [d, label, provincia, nivel] of disciplinas) {
  const id = `${prefix}${d}`;
  sql(`insert into "Fighter" (id,slug,"firstName","lastName",city,province,level) values ('${id}','${id.toLowerCase()}','Prueba ${label}','${prefix}','${provincia}','${provincia}','${nivel}');
    insert into "FighterDiscipline" ("fighterId",discipline,level) values ('${id}','${d}','${nivel}');
    insert into "Event" (id,slug,name,date,discipline,level,venue,city,province) values ('${id}','${id.toLowerCase()}','${prefix} ${label}','${enDias(0)}T12:00:00Z','${d}','${nivel}','Recinto de prueba','${provincia}','${provincia}'), ('${id}Pasada','${id.toLowerCase()}-pasada','Prueba pasada ${label}','${enDias(-1)}T12:00:00Z','${d}','${nivel}','Recinto de prueba','${provincia}','${provincia}');`);
}
sql(`insert into "Fighter" (id,slug,"firstName","lastName",listed) values ('${prefix}Rival','${prefix.toLowerCase()}-rival','Rival','Prueba',false);
  insert into "User" (id,email,name,"passwordHash") values ('${prefix}Fan','${prefix.toLowerCase()}@test.es','Prueba','sin-acceso');`);
for (const [d] of disciplinas) {
  const id = `${prefix}${d}`;
  sql(`insert into "Bout" (id,"eventId","fighterAId","fighterBId",result,verification) values ('${id}','${id}Pasada','${id}','${prefix}Rival','A_WIN','VERIFIED');
    insert into "Aura" (id,"userId","fighterId","boutId","updatedAt") values ('${id}','${prefix}Fan','${id}','${id}',now());`);
}
// Una misma persona compite en dos disciplinas: sus auras deben quedar separadas.
sql(`insert into "Bout" (id,"eventId","fighterAId","fighterBId",result,verification) values ('${prefix}Mixto','${prefix}BOXEOPasada','${prefix}MMA','${prefix}Rival','A_WIN','VERIFIED');
  insert into "Aura" (id,"userId","fighterId","boutId","updatedAt") values ('${prefix}Mixto','${prefix}Fan','${prefix}MMA','${prefix}Mixto',now());`);
const p = await (await browser.newContext()).newPage();
await p.goto(B);
check("la portada se presenta como comunidad de toda España", await seen(p.getByRole("heading", { name: /Tu deporte\.\s*Tu gente\./ })) && (await p.locator("main").innerText()).includes("Tu comunidad de deportes de contacto en toda España"));
const enlaces = p.locator(".community-discovery a.card");
check("las seis disciplinas tienen igual énfasis y orden alfabético", JSON.stringify(await enlaces.allInnerTexts()) === JSON.stringify(disciplinas.map(d => d[1])) && (await enlaces.evaluateAll(xs => xs.map(x => getComputedStyle(x).fontWeight))).every(x => x === "500"));
const eventos = await p.locator("main .grid").nth(1).innerText();
check("la portada incluye veladas de seis disciplinas, varias provincias y ambos niveles", disciplinas.every(([,label]) => eventos.includes(`${prefix} ${label}`)) && eventos.includes("Valencia") && eventos.includes("Profesional") && eventos.includes("Amateur"));
check("las fichas recientes incluyen las seis altas de toda España", (await p.locator("main .grid").nth(2).innerText()).split(prefix).length - 1 === 6);
await p.goto(B + "/ranking");
check("el ránking comienza en todas las disciplinas, niveles y España", await p.inputValue("[name=disciplina]") === "" && await p.inputValue("[name=nivel]") === "" && await p.inputValue("[name=provincia]") === "all");
for (const [, label,, nivel] of disciplinas) {
  const seccion = p.locator("main section").filter({ has: p.getByRole("heading", { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} · ${nivel === "PRO" ? "Profesional" : "Amateur"} ·`) }) });
  check(`el ránking incluye ${label} con su propio nivel y aura`, await seen(seccion.getByRole("link", { name: `Prueba ${label} ${prefix}`, exact: true })) && (await seccion.locator("tbody tr").filter({ hasText: `Prueba ${label} ${prefix}` }).locator("td").last().innerText()) === "1");
}
await p.selectOption("[name=disciplina]", "MMA"); await p.selectOption("[name=provincia]", "Las Palmas");
await p.getByRole("button", { name: "Ver ránking", exact: true }).click(); await p.waitForURL("**disciplina=MMA*");
check("un filtro explícito conserva disciplina y provincia", await seen(p.getByRole("link", { name: `Prueba MMA ${prefix}`, exact: true })) && (await p.locator("main section h2").allInnerTexts()).every(t => t.startsWith("MMA ·")));
await p.goto(B + "/ranking?disciplina=BOXEO&provincia=Las%20Palmas");
const mixto = p.locator("tbody tr").filter({ hasText: `Prueba MMA ${prefix}` });
check("el aura de la misma persona se cuenta por la disciplina del combate", await seen(mixto) && await mixto.locator("td").last().innerText() === "1");
const alta = await newUser("InclusivaAlta", "FIGHTER");
await alta.p.goto(B + "/mi-ficha");
const form = alta.p.locator("main form").filter({ has: alta.p.getByRole("button", { name: "Crear mi ficha", exact: true }) });
check("una ficha nueva no supone ciudad, provincia ni disciplina", await form.locator("[name=city]").inputValue() === "" && await form.locator("[name=province]").inputValue() === "" && await form.locator("[name=discipline]").inputValue() === "");
await form.locator("[name=firstName]").fill("Prueba Inclusiva"); await form.locator("[name=lastName]").fill(String(rnd));
check("la ficha pide elegir provincia y disciplina antes de enviar", !await form.evaluate(f => f.checkValidity()));
await form.locator("[name=province]").selectOption("Sevilla"); await form.locator("[name=discipline]").selectOption("JIUJITSU"); await form.locator("[name=level]").selectOption("PRO");
await form.getByRole("button", { name: "Crear mi ficha", exact: true }).click(); await alta.p.getByRole("link", { name: "Ver mi ficha pública", exact: true }).click();
check("se guarda y muestra una ficha de jiu-jitsu profesional en Sevilla", await seen(alta.p.getByRole("heading", { name: `Prueba Inclusiva ${rnd}`, exact: true })) && (await alta.p.locator("main").innerText()).includes("Sevilla") && (await alta.p.locator("main").innerText()).includes("Jiu-jitsu"));
const org = await newUser("InclusivaOrg"); sql(`update "User" set role='ORGANIZER' where email='${org.email}';`);
await org.p.goto(B + "/organizador");
check("una velada nueva también pide provincia y disciplina sin asumir ciudad", await org.p.inputValue("[name=city]") === "" && await org.p.inputValue("[name=province]") === "" && await org.p.inputValue("[name=discipline]") === "");
await org.p.fill("[name=name]", `Inclusiva velada ${rnd}`); await org.p.fill("[name=date]", enDias(3)); await org.p.selectOption("[name=province]", "Asturias"); await org.p.selectOption("[name=discipline]", "KICKBOXING");
await org.p.getByRole("button", { name: "Crear velada", exact: true }).click(); await org.p.waitForURL("**/organizador/*");
await org.p.getByRole("link", { name: "Ver la página pública", exact: true }).click();
check("se guarda una velada de kickboxing fuera de Madrid", (await org.p.locator("main").innerText()).includes("Kickboxing") && (await org.p.locator("main").innerText()).includes("Asturias"));
// Estos datos en bloque no deben cambiar los conjuntos de los siguientes guiones.
sql(`delete from "Event" where id like '${prefix}%'; delete from "Fighter" where id like '${prefix}%'; delete from "User" where id='${prefix}Fan';`);
await terminarDiagnosticos(); await browser.close();
