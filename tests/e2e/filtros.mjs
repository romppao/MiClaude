// Categorías de peso por disciplina y nivel, y el panel de filtros de /peleadores: cada disciplina y cada nivel tienen sus propias categorías,
// la lista cambia al elegir disciplina y nivel, y el filtro combina las tres cosas sobre la misma disciplina de la ficha.
import { B, rnd, browser, seen, check, btn, newUser, terminarDiagnosticos } from "./ayudas.mjs";

/** Crea una ficha eligiendo disciplina, nivel y (opcional) categoría con el selector de tres pasos. */
async function crearFicha(usuario, nombre, apellidos, { disciplina, nivel, categoria }) {
  const u = await newUser(usuario, "FIGHTER");
  await u.p.goto(B + "/mi-ficha");
  await u.p.fill("[name=firstName]", nombre); await u.p.fill("[name=lastName]", apellidos);
  await u.p.selectOption("main form select[name=discipline]", disciplina);
  await u.p.selectOption("main form select[name=level]", nivel);
  if (categoria) await u.p.selectOption("main form select[name=weightClass]", categoria);
  await btn(u.p, "Crear mi ficha");
  await u.p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
  return u.p;
}

const etiquetas = async (p, selector) => (await p.locator(`${selector} option`).allInnerTexts()).map((t) => t.trim());

// 1) El selector de la ficha cambia sus categorías con la disciplina y el nivel
const nueva = await newUser("Selector", "FIGHTER");
const p = nueva.p;
await p.goto(B + "/mi-ficha");
const sel = "main form select[name=weightClass]";
await p.selectOption("main form select[name=discipline]", "BOXEO"); await p.selectOption("main form select[name=level]", "PRO");
let cat = await etiquetas(p, sel);
check("boxeo profesional ofrece las 17 categorías con su peso en kilos", cat.includes("Wélter · hasta 66,7 kg") && cat.includes("Minimosca · hasta 47,6 kg") && cat.includes("Pesado · más de 90,7 kg") && cat.filter((t) => t.includes(" kg")).length === 17);
await p.selectOption("main form select[name=level]", "AMATEUR");
cat = await etiquetas(p, sel);
check("boxeo amateur ofrece otras categorías (federación española, masculino y femenino) y ninguna de las profesionales", cat.includes("Masculino · hasta 65 kg") && cat.includes("Femenino · hasta 51 kg") && !cat.some((t) => t.startsWith("Wélter")));
await p.selectOption("main form select[name=discipline]", "MMA");
cat = await etiquetas(p, sel);
check("MMA tiene sus propias categorías, distintas de las del boxeo", cat.includes("Mosca · hasta 56,7 kg") && cat.includes("Ligero · hasta 70,3 kg") && !cat.some((t) => t.includes("Mosca · hasta 50,8")));
await p.selectOption("main form select[name=discipline]", "MUAYTHAI"); await p.selectOption("main form select[name=level]", "PRO");
check("el Muay Thai existe como disciplina y sus categorías profesionales salen con su peso", (await etiquetas(p, sel)).some((t) => t.includes("hasta 50,8 kg")));
await p.selectOption("main form select[name=level]", "AMATEUR");
check("sin una lista confirmada (Muay Thai amateur) no se inventan pesos y se explica qué hacer", (await etiquetas(p, sel)).length === 1 && await seen(p.locator("main form .hint", { hasText: "Todavía no tenemos confirmadas" })));
await p.selectOption("main form select[name=discipline]", "BOXEO"); await p.selectOption("main form select[name=level]", "PRO"); await p.selectOption(sel, "Wélter");
await p.selectOption("main form select[name=level]", "AMATEUR");
check("al cambiar de nivel, una categoría que no existe en el nuevo nivel se vacía y no se queda una incorrecta", await p.inputValue(sel) === "");

// 2) Tres fichas distintas para probar el filtro
const nombreA = `Profesional${rnd}`, nombreB = `Amateur${rnd}`, nombreC = `Mmaligero${rnd}`;
await crearFicha("FiltroUno", "Filtro", nombreA, { disciplina: "BOXEO", nivel: "PRO", categoria: "Wélter" });
await crearFicha("FiltroDos", "Filtro", nombreB, { disciplina: "BOXEO", nivel: "AMATEUR", categoria: "M65" });
await crearFicha("FiltroTres", "Filtro", nombreC, { disciplina: "MMA", nivel: "AMATEUR", categoria: "Ligero" });

const anon = await (await browser.newContext()).newPage();
const nombres = async () => (await anon.locator("main .card strong").allInnerTexts()).filter((t) => t.includes(String(rnd)));
const ver = async (consulta) => { await anon.goto(B + `/peleadores?q=Filtro&${consulta}`); await anon.locator("main h1").waitFor(); return nombres(); };

let r = await ver("");
check("sin filtros salen las tres fichas", r.length === 3);
r = await ver("disciplina=BOXEO&level=PRO&categoria=W%C3%A9lter");
check("boxeo + profesional + wélter encuentra solo al profesional", r.length === 1 && r[0].includes(nombreA));
r = await ver("disciplina=BOXEO&level=AMATEUR&categoria=M65");
check("boxeo + amateur + masculino 65 kg encuentra solo al amateur", r.length === 1 && r[0].includes(nombreB));
r = await ver("disciplina=BOXEO");
check("solo boxeo: los dos de boxeo y no el de MMA", r.length === 2 && !r.some((t) => t.includes(nombreC)));
r = await ver("level=AMATEUR");
check("solo amateur: el amateur de boxeo y el de MMA", r.length === 2 && !r.some((t) => t.includes(nombreA)));
r = await ver("disciplina=MMA&categoria=Ligero");
check("MMA + ligero encuentra al de MMA", r.length === 1 && r[0].includes(nombreC));
r = await ver("disciplina=BOXEO&level=PRO&categoria=M65");
check("una combinación que no existe (boxeo profesional con una categoría amateur) no mezcla resultados", r.length === 0);

// 3) El panel: orden, dependencia y resumen de filtros aplicados
await anon.goto(B + "/peleadores?q=Filtro");
const etiquetasPanel = (await anon.locator("main form.search label > span:first-child").allInnerTexts()).map((t) => t.trim());
check("el panel sigue un orden lógico: nombre, disciplina, nivel, categoría de peso, provincia", ["Nombre o alias", "Disciplina", "Nivel", "Categoría de peso", "Provincia"].every((t, i) => etiquetasPanel[i] === t));
check("sin disciplina elegida, la categoría está desactivada y dice qué hacer", await anon.locator("main form select[name=categoria]").isDisabled() && (await etiquetas(anon, "main form select[name=categoria]"))[0].includes("Primero elige una disciplina"));
await anon.selectOption("main form select[name=disciplina]", "BOXEO");
check("al elegir disciplina se activa y ofrece las categorías separadas por nivel", await anon.locator("main form select[name=categoria]").isEnabled() && await anon.locator("main form select[name=categoria] optgroup").count() === 2);
await anon.selectOption("main form select[name=level]", "PRO");
await anon.selectOption("main form select[name=categoria]", "Wélter");
await btn(anon, "Aplicar filtros");
await anon.waitForURL("**categoria=W*");
check("el resumen enseña lo aplicado y cuántos resultados hay", await seen(anon.locator("[role=group][aria-label='Filtros aplicados']", { hasText: "Wélter · hasta 66,7 kg" })) && await seen(anon.locator("main p", { hasText: /\d+ peleadores? encontrados?\./ })));
await anon.click("[role=group][aria-label='Filtros aplicados'] a:has-text('Profesional')");
await anon.waitForURL((u) => !u.search.includes("level="));
check("cada filtro se quita por separado desde el resumen", !(await anon.url()).includes("level=") && (await anon.url()).includes("disciplina=BOXEO"));
check("las fichas muestran su disciplina, nivel y categoría con kilos", (await anon.locator("main").innerText()).includes("Boxeo · Profesional · Wélter · hasta 66,7 kg"));

// 4) Direcciones raras no rompen el filtro
const raras = ["level=SEMIPRO", "disciplina=NATACION&categoria=x", "categoria=%00", "level=PRO&level=AMATEUR", "disciplina=constructor&level=__proto__&categoria=toString"];
const fallos = [];
for (const q of raras) { const resp = await anon.request.get(B + `/peleadores?${q}`); if (resp.status() >= 500) fallos.push(`${q} → ${resp.status()}`); }
check(`ningún filtro raro provoca un error del servidor${fallos.length ? ": " + fallos.join(", ") : ""}`, fallos.length === 0);

await terminarDiagnosticos();
await browser.close();
