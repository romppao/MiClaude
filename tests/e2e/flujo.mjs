import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
// Prueba de extremo a extremo del flujo principal. Requiere el servidor en marcha con la BD de pruebas.
//   BASE_URL      servidor (por defecto http://localhost:3111)
//   MAIL_LOG      fichero donde el servidor escribe su salida (los enlaces de verificación salen en el log de correo)
//   DATABASE_URL  para promover a un usuario a ADMIN (única acción que no se puede hacer desde la web)
//   CHROMIUM_PATH ejecutable de Chromium (opcional)
const B = process.env.BASE_URL ?? "http://localhost:3111", rnd = Date.now();
const MAIL_LOG = process.env.MAIL_LOG ?? "/tmp/next.log";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });
const check = (label, cond) => { console.log(cond ? "OK  " : "FAIL", label); if (!cond) process.exitCode = 1; };
const btn = (p, t) => p.click(`main button:has-text("${t}")`);
const link = (email) => { const log = readFileSync(MAIL_LOG, "utf8"); const i = log.lastIndexOf(`to=${email}`); return log.slice(i).match(/https?:\/\/[^\s/]+(\/verificar\?token=\w+)/)[1]; };

async function newUser(name, role = "FAN", verify = true) {
  const email = `${name.toLowerCase()}${rnd}@test.es`;
  const p = await (await browser.newContext()).newPage();
  await p.goto(B + "/registro");
  await p.fill("[name=name]", name); await p.fill("[name=email]", email); await p.fill("[name=password]", "contraseña123"); await p.selectOption("[name=role]", role);
  await btn(p, "Crear mi cuenta"); await p.waitForURL("**/verificar");
  if (verify) { await p.goto(B + link(email)); await btn(p, "Confirmar"); await p.waitForSelector("text=Email verificado"); }
  return { p, email };
}

// 1) email sin verificar: no puede valorar ni crear ficha
const unv = await newUser("Sinverificar", "BOXER", false);
await unv.p.goto(B + "/mi-ficha"); check("sin verificar → redirige a /verificar", unv.p.url().includes("/verificar"));

// 2) Pepe crea ficha y registra combate contra un rival aún sin cuenta
const pepe = (await newUser("Pepe", "BOXER")).p;
await pepe.goto(B + "/mi-ficha");
await pepe.fill("[name=firstName]", "Pepe"); await pepe.fill("[name=lastName]", `Uno${rnd}`); await pepe.fill("[name=gym]", `Gym Test ${rnd}`); await btn(pepe, "Crear mi ficha");
await pepe.waitForSelector("text=Registrar un combate");
await pepe.fill("[name=eventName]", "Velada Claim Test"); await pepe.fill("[name=date]", "2026-08-01");
await pepe.fill("[name=oppFirst]", "Luis"); await pepe.fill("[name=oppLast]", `Dos${rnd}`); await pepe.fill("[name=evidenceUrl]", "javascript:alert(1)"); await btn(pepe, "Registrar");
await pepe.waitForSelector("text=1-0-0");
check("aviso claro tras registrar el combate", await pepe.locator("[role=status]", { hasText: "Combate registrado" }).count() === 1);

// Coherencia: el mismo enfrentamiento no se puede registrar dos veces en la misma velada
await pepe.fill("[name=eventName]", "Velada Claim Test"); await pepe.fill("[name=date]", "2026-08-01");
await pepe.fill("[name=oppFirst]", "Luis"); await pepe.fill("[name=oppLast]", `Dos${rnd}`); await btn(pepe, "Registrar este combate");
await pepe.waitForSelector("[role=alert]:has-text('ya está registrado')");
check("combate duplicado bloqueado con mensaje claro", await pepe.locator(".notice-bad", { hasText: "ya está registrado" }).count() === 1);

// Evidencia: una URL peligrosa no se guarda; una inválida da error; una válida aparece como enlace público
await pepe.goto(B + `/boxeadores/pepe-uno${rnd}`);
check("URL javascript: no se guarda como evidencia", await pepe.locator("a:has-text('evidencia')").count() === 0);
await pepe.goto(B + "/mi-ficha");
await pepe.fill("main table input[name=evidenceUrl]", "esto no es una url"); await pepe.click("main table button:has-text('Guardar')");
await pepe.waitForSelector("[role=alert]:has-text('no es válido')");
await pepe.fill("main table input[name=evidenceUrl]", `https://example.com/acta-${rnd}`); await pepe.click("main table button:has-text('Guardar')");
await pepe.waitForLoadState("networkidle");
await pepe.goto(B + `/boxeadores/pepe-uno${rnd}`);
check("enlace de evidencia visible en la ficha pública", await pepe.locator(`a[href="https://example.com/acta-${rnd}"][rel*=noopener]`).count() === 1);

// 3) Luis (con cuenta) reclama su ficha existente; admin aprueba
const luis = (await newUser("Luis", "BOXER")).p;
await luis.goto(B + `/mi-ficha?q=Dos${rnd}`);
await luis.fill("[name=message]", "Entreno en el mismo gimnasio"); await btn(luis, "Reclamar");
await luis.waitForSelector("text=Solicitud enviada");
const admin = await newUser("Admin");
execSync(`psql "${process.env.DATABASE_URL}" -c "update \\"User\\" set role='ADMIN' where email='${admin.email}'"`);
await admin.p.goto(B + "/admin");
check("admin ve la reclamación", await admin.p.locator("body").innerText().then((t) => t.includes(`Dos${rnd}`)));
await admin.p.locator("tr", { hasText: `Dos${rnd}` }).locator("button:has-text('Aprobar')").click(); await admin.p.waitForLoadState("networkidle");
await luis.goto(B + "/mi-ficha");
check("Luis ya tiene la ficha reclamada", await luis.locator("body").innerText().then((t) => t.includes("Registrar un combate")));
await btn(luis, "Sí, es correcto"); await luis.waitForLoadState("networkidle");
check("aviso claro tras confirmar el combate", await luis.locator("[role=status]", { hasText: "Has confirmado el combate" }).count() === 1);
await pepe.goto(B + `/boxeadores/pepe-uno${rnd}`);
check("combate confirmado por el rival", await pepe.locator(".tag", { hasText: "confirmado" }).count() > 0);

// 4) valorar: fan sin verificar no puede; verificado sí
const fanU = await newUser("Fanuno", "FAN", false);
await fanU.p.goto(B + `/boxeadores/pepe-uno${rnd}`);
check("fan sin verificar no ve el formulario de valoración", await fanU.p.locator("button:has-text('Valorar')").count() === 0 && await fanU.p.locator("text=Confirma tu correo electrónico para valorar").count() > 0);
const fanAcc = await newUser("Fandos");
const fan = fanAcc.p;
await fan.goto(B + `/boxeadores/pepe-uno${rnd}`);
await fan.selectOption("select[name=score]", "4"); await fan.click("button:has-text('Valorar')"); await fan.waitForLoadState("networkidle");
check("aviso claro tras valorar", await fan.locator("[role=status]", { hasText: "Tu valoración se ha guardado" }).count() === 1);
await fan.reload();
check("valoración registrada", await fan.locator("body").innerText().then((t) => t.includes("4.0 / 5")));

// 4a) un usuario avisa de un error; solo puede hacerlo una vez mientras siga abierto; el moderador lo resuelve
await fan.goto(B + `/boxeadores/pepe-uno${rnd}`);
const report = async () => {
  const det = fan.locator("main table details").first();
  await det.locator("summary").click();
  await det.locator("select[name=reason]").selectOption("RESULTADO");
  await det.locator("input[name=message]").fill(`Aviso ${rnd}`);
  await det.locator("button").click();
};
await report();
await fan.locator(".notice-ok", { hasText: "Hemos recibido tu aviso" }).waitFor();
check("aviso de error enviado con confirmación clara", await fan.locator(".notice-ok").count() === 1);
await report();
await fan.locator(".notice-bad", { hasText: "Ya nos avisaste" }).waitFor();
check("no se puede repetir un aviso abierto", await fan.locator(".notice-bad").count() === 1);
await admin.p.goto(B + "/admin");
const repRow = admin.p.locator("tr", { hasText: `Aviso ${rnd}` });
check("el moderador ve el aviso con su motivo", await repRow.count() === 1 && (await repRow.innerText()).includes("El resultado no es correcto"));
await repRow.locator("button:has-text('Resuelto')").click();
await repRow.waitFor({ state: "detached" });
check("el aviso resuelto sale de la cola", await admin.p.locator("tr", { hasText: `Aviso ${rnd}` }).count() === 0);

// 4b) un visitante sin sesión que quiere valorar vuelve a la misma ficha tras entrar
const visitor = await (await browser.newContext()).newPage();
await visitor.goto(B + `/boxeadores/pepe-uno${rnd}`);
await visitor.click("text=Entra para valorar");
await visitor.fill("[name=email]", fanAcc.email); await visitor.fill("[name=password]", "contraseña123"); await btn(visitor, "Entrar");
await visitor.waitForURL(`**/boxeadores/pepe-uno${rnd}`);
check("tras entrar vuelve a la ficha donde iba a valorar", visitor.url().endsWith(`/boxeadores/pepe-uno${rnd}`));

// 5) organizador
const org = (await newUser("Orga")).p;
await org.goto(B + "/organizador"); await org.fill("[name=orgName]", "Club Demo Madrid"); await btn(org, "Solicitar");
await org.waitForSelector("text=Solicitud enviada");
await admin.p.goto(B + "/admin"); await admin.p.locator("tr", { hasText: "Club Demo Madrid" }).locator("button:has-text('Aprobar')").click(); await admin.p.waitForLoadState("networkidle");
await org.goto(B + "/organizador");
await org.fill("[name=name]", `Gran Velada Org ${rnd}`); await org.fill("[name=date]", "2026-07-20"); await btn(org, "Crear velada");
await org.waitForURL(`**/organizador/gran-velada-org-${rnd}-2026-07-20?*`);
await org.fill("[name=boxerA]", `pepe-uno${rnd}`); await org.fill("[name=boxerB]", `luis-dos${rnd}`); await btn(org, "Añadir");
await org.waitForSelector("text=vs");
await org.selectOption("select[name=outcome]", "WIN"); await org.selectOption("select[name=method]", "KO"); await btn(org, "Guardar resultado"); await org.waitForLoadState("networkidle");
await fan.goto(B + `/veladas/gran-velada-org-${rnd}-2026-07-20`);
const t = await fan.locator("body").innerText();
check("velada pública con cartel y resultado", t.includes(`Uno${rnd}`) && t.includes("Gana rojo") && t.includes("KO"));
// 6) un fan no puede entrar al panel de otra velada
await fan.goto(B + `/organizador/gran-velada-org-${rnd}-2026-07-20`);
check("fan no accede a gestionar velada ajena", !fan.url().includes("/gran-velada-org-"));
// Sello de verificado del gimnasio (exige nota con la evidencia) e historial de cambios
await admin.p.goto(B + "/admin");
const gymRow = () => admin.p.locator("tr", { hasText: `Gym Test ${rnd}` });
await gymRow().locator("button:has-text('Verificar')").click(); await admin.p.waitForLoadState("networkidle");
check("sello sin nota se rechaza", await admin.p.locator("body").innerText().then((t) => t.includes("necesita una nota")));
await gymRow().locator("input[name=note]").fill("Web y Google Maps comprobadas, llamada al responsable");
await gymRow().locator("button:has-text('Verificar')").click();
await gymRow().locator("button:has-text('Retirar sello')").waitFor(); // la acción ha terminado
await pepe.goto(B + `/gimnasios/gym-test-${rnd}`);
check("gimnasio muestra el sello de verificado", await pepe.locator("h1 .tag", { hasText: "verificado" }).count() === 1);
check("la nota interna no se expone públicamente", !(await pepe.locator("body").innerText()).includes("Google Maps"));
await admin.p.goto(B + "/admin/historial?entity=BOUT");
const hist = await admin.p.locator("body").innerText();
check("historial registra creación y evidencia del combate", hist.includes("CREATED") && hist.includes("EVIDENCE_SET"));
await admin.p.goto(B + "/admin/historial?entity=GYM");
check("historial registra el sello del gimnasio", await admin.p.locator("body").innerText().then((t) => t.includes("VERIFIED")));
// Coherencia: un segundo combate a 2 días del primero se guarda, pero queda marcado para el moderador
await pepe.goto(B + "/mi-ficha");
await pepe.fill("[name=eventName]", "Velada Cercana"); await pepe.fill("[name=date]", "2026-08-03");
await pepe.fill("[name=oppFirst]", "Tercero"); await pepe.fill("[name=oppLast]", `Tres${rnd}`); await btn(pepe, "Registrar este combate");
await pepe.waitForSelector("[role=status]:has-text('Combate registrado')");
await admin.p.goto(B + "/admin");
const adminText = await admin.p.locator("body").innerText();
check("la cola de moderación marca los combates muy seguidos", adminText.includes("Menos de 7 días"));
await browser.close();
if (process.exitCode) console.error("\nE2E: hay comprobaciones fallidas");
