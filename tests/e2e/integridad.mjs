// Pruebas de integridad de la verificación y del aura (lo que la auditoría marcó como fallos confirmados):
// combates de hoy y futuros, fichas de terceros sin listar, combates rechazados que no cuentan, comentarios de aura
// denunciables y claves heredadas de objetos en las direcciones. Requiere el servidor en marcha (ver ayudas.mjs).
import { slugDe, B, rnd, browser, seen, check, btn, hoyMadrid, enDias, registrar, newUser, hacerAdmin, terminarDiagnosticos } from "./ayudas.mjs";

const anon = await (await browser.newContext()).newPage();
const cuerpo = (p) => p.locator("body").innerText();

// Personas: una peleadora, una aficionada que da aura, otra que avisa y una moderadora
const ana = (await newUser("Ana", "FIGHTER")).p;
const fan = (await newUser("Fanatica", "FAN")).p;
const aviso = (await newUser("Vigilante", "FAN")).p;
const moderadora = await newUser("Moderadora", "FAN"); hacerAdmin(moderadora.email);
const mod = moderadora.p;

await ana.goto(B + "/mi-ficha");
await ana.fill("[name=firstName]", "Ana"); await ana.fill("[name=lastName]", `Integra${rnd}`);
await btn(ana, "Crear mi ficha");
await ana.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();

// 1) Un combate celebrado hoy conserva su resultado; uno futuro no admite resultado
await registrar(ana, { evento: `Velada de Hoy ${rnd}`, fecha: hoyMadrid, rivalNombre: "Bruno", rivalApellidos: `Tercero${rnd}` });
await ana.locator("[role=status]", { hasText: "Combate registrado" }).waitFor();
check("un combate de hoy conserva su resultado en el récord", await seen(ana.locator(".rec", { hasText: /^\s*1-0-0\s*$/ }).first()));
await registrar(ana, { evento: `Velada Futura Ana ${rnd}`, fecha: enDias(10), rivalNombre: "Carlos", rivalApellidos: `Futuro${rnd}` });
check("un combate que aún no se ha celebrado no admite resultado y lo explica", await seen(ana.locator(".notice-bad", { hasText: "todavía no se ha celebrado" })));
await registrar(ana, { evento: `Velada Futura Ana ${rnd}`, fecha: enDias(10), rivalNombre: "Carlos", rivalApellidos: `Futuro${rnd}`, resultado: null });
check("sin resultado, el combate futuro se registra y se avisa de cuándo añadirlo", await seen(ana.locator("[role=status]", { hasText: "todavía no se ha celebrado" })));
await registrar(ana, { evento: `Velada Lejana ${rnd}`, fecha: enDias(900), rivalNombre: "Diego", rivalApellidos: `Lejos${rnd}`, resultado: null });
check("una fecha a más de un año vista se rechaza con un mensaje", await seen(ana.locator(".notice-bad", { hasText: "fecha" })));

// 2) La ficha que crea un tercero para su rival no se lista, no se indexa y solo enseña la inicial del apellido
await anon.goto(B + `/peleadores?q=Tercero${rnd}`);
check("la ficha creada por un tercero no sale en el listado", !(await cuerpo(anon)).includes(`Tercero${rnd}`));
await anon.goto(B + `/buscar?q=Tercero${rnd}`);
check("ni en la búsqueda", await anon.locator(`a:has-text("Tercero${rnd}")`).count() === 0); // la página repite lo buscado, así que se comprueba que no haya enlace a la ficha
const slugRival = slugDe(`Tercero${rnd}`);
check("la dirección de la ficha provisional no lleva el apellido", slugRival.startsWith("bruno-t") && !slugRival.includes("tercero"));
await anon.goto(B + `/peleadores/${slugRival}`);
const fichaRival = await cuerpo(anon);
check("su ficha enseña solo la inicial del apellido y avisa de que no está reclamada", fichaRival.includes("Bruno T.") && !fichaRival.includes(`Tercero${rnd}`) && fichaRival.includes("sin reclamar"));
check("y pide a los buscadores que no la indexen", await anon.locator("meta[name=robots][content*=noindex]").count() === 1);

// 3) El aura solo se da una vez por combate, no a uno mismo, y no cuenta si el combate se rechaza
await ana.goto(B + `/peleadores/ana-integra${rnd}`);
check("nadie puede darse aura a sí mismo", await ana.locator("button:has-text('Dar aura')").count() === 0);
await fan.goto(B + `/peleadores/ana-integra${rnd}`);
await fan.fill("input[name=comment]", `Gran pelea ${rnd}`);
await fan.click("button:has-text('Dar aura')");
await fan.locator(".notice-ok", { hasText: "aura" }).waitFor();
check("el aura se suma en la ficha", await seen(fan.locator(".rec", { hasText: /^\s*1\s*$/ }).first()));
check("no se puede dar aura dos veces al mismo combate", await fan.locator("button:has-text('Dar aura')").count() === 0 && await fan.locator("button:has-text('Quitar mi aura')").count() === 1);

const filaCombate = () => mod.locator("tr", { hasText: `Velada de Hoy ${rnd}` });
await mod.goto(B + "/moderacion");
await filaCombate().locator("button:has-text('Marcar como no correcto')").click();
await filaCombate().locator("button:has-text('Restaurar')").waitFor();
await anon.goto(B + `/peleadores/ana-integra${rnd}`);
const rechazado = await cuerpo(anon);
check("un combate rechazado no cuenta en el récord", !rechazado.includes("1-0-0"));
check("ni suma aura", await anon.locator(".rec", { hasText: /^\s*0\s*$/ }).count() >= 1 && !rechazado.includes(`Gran pelea ${rnd}`));
check("y no se muestra el resultado como un hecho: se dice que está en revisión", rechazado.includes("Resultado en revisión"));
await mod.goto(B + "/moderacion");
check("los combates rechazados aparecen en la cola «en revisión» de moderación", await seen(filaCombate().locator("button:has-text('Restaurar')")));
await filaCombate().locator("button:has-text('Restaurar')").click();
await filaCombate().locator("button:has-text('Marcar como no correcto')").waitFor();
await anon.goto(B + `/peleadores/ana-integra${rnd}`);
check("al restaurarlo vuelve a contar el aura recibida", await seen(anon.locator(".rec", { hasText: /^\s*1\s*$/ }).first()) && (await cuerpo(anon)).includes(`Gran pelea ${rnd}`));

// 4) Un comentario de aura inapropiado se puede denunciar y el moderador lo retira
await aviso.goto(B + `/peleadores/ana-integra${rnd}`);
const detalles = aviso.locator("details", { hasText: "Avisar de este comentario" });
await detalles.locator("summary").click();
await detalles.locator("select[name=reason]").selectOption({ index: 1 });
await detalles.locator("button:has-text('Enviar aviso')").click();
await aviso.locator(".notice-ok").waitFor();
await mod.goto(B + "/moderacion");
const filaAviso = mod.locator("tr", { hasText: `Gran pelea ${rnd}` });
check("el moderador ve el comentario denunciado", await seen(filaAviso.first()));
await filaAviso.locator("button:has-text('Resolver y retirar el comentario')").click();
await filaAviso.waitFor({ state: "detached" });
await anon.goto(B + `/peleadores/ana-integra${rnd}`);
const trasRetirar = await cuerpo(anon);
check("el comentario retirado deja de verse, pero el aura sigue contando", trasRetirar.includes("Comentario retirado por moderación") && !trasRetirar.includes(`Gran pelea ${rnd}`) && await anon.locator(".rec", { hasText: /^\s*1\s*$/ }).count() >= 1);

// 5) Valores como «constructor» o «__proto__» en las direcciones no rompen ninguna pantalla
for (const ruta of ["/peleadores?disciplina=constructor&level=__proto__&province=toString", "/?aviso=constructor&problema=__proto__", "/ranking?disciplina=constructor&categoria=__proto__&periodo=toString", "/veladas?disciplina=hasOwnProperty&past=constructor", `/mi-ficha?aviso=valueOf`]) {
  const r = await anon.goto(B + ruta);
  await anon.waitForTimeout(1000); // el error de una pantalla de cliente solo aparece después de cargarla en el navegador
  const texto = await cuerpo(anon);
  check(`la dirección ${ruta.slice(0, 40)}… no falla con claves heredadas`, r.status() < 500 && !texto.includes("function") && !texto.includes("Algo no ha salido como esperábamos"));
}

await terminarDiagnosticos();
await browser.close();
if (process.exitCode) console.error("\nIntegridad: hay comprobaciones fallidas");
