// Ayudas comunes de las pruebas de extremo a extremo (navegador real contra el servidor en marcha).
//   BASE_URL      servidor (por defecto http://localhost:3111)
//   MAIL_LOG      fichero donde el servidor escribe su salida (los enlaces de verificación salen en el log de correo)
//   DATABASE_URL  para promover a un usuario a ADMIN (única acción que no se puede hacer desde la web)
//   CHROMIUM_PATH ejecutable de Chromium (opcional)
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

export const B = process.env.BASE_URL ?? "http://localhost:3111";
export const rnd = Date.now();
export const MAIL_LOG = process.env.MAIL_LOG ?? "/tmp/next.log";
export const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });
/** Espera a que algo sea visible; devuelve true/false en vez de lanzar error. */
export const seen = (locator, timeout = 8000) => locator.waitFor({ timeout }).then(() => true, () => false);
export const check = (label, cond) => { console.log(cond ? "OK  " : "FAIL", label); if (!cond) process.exitCode = 1; };
export const btn = (p, t) => p.click(`main button:has-text("${t}")`);
export const hoyMadrid = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
export const enDias = (n) => new Date(Date.now() + n * 864e5).toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });

/** Rellena y envía el formulario «Registrar un combate» con un resultado (por defecto, victoria por decisión unánime). */
export const registrar = async (p, o) => {
  await p.fill("[name=eventName]", o.evento); await p.fill("[name=date]", o.fecha);
  await p.fill("[name=oppFirst]", o.rivalNombre); await p.fill("[name=oppLast]", o.rivalApellidos);
  if (o.disciplina) await p.selectOption("select[name=discipline]", o.disciplina);
  if (o.resultado !== null) { await p.selectOption("select[name=outcome]", o.resultado ?? "WIN"); if (o.metodo !== null) await p.selectOption("form select[name=method]", o.metodo ?? "UD"); }
  if (o.evidencia) await p.fill("[name=evidenceUrl]", o.evidencia);
  await btn(p, "Registrar este combate");
};

export const link = (email) => { const log = readFileSync(MAIL_LOG, "utf8"); const i = log.lastIndexOf(`to=${email}`); return log.slice(i).match(/https?:\/\/[^\s/]+(\/verificar\?token=\w+)/)[1]; };

/** Espera el último correo enviado a `email` que contenga un enlace a `ruta` (por ejemplo «/recuperar/nueva») y devuelve ese enlace, o null. */
export async function esperarEnlace(email, ruta, intentos = 40) {
  const patron = new RegExp(`https?://[^\\s/]+(${ruta}\\?token=\\w+)`);
  for (let i = 0; i < intentos; i++) {
    const bloques = readFileSync(MAIL_LOG, "utf8").split("[mail] to=").filter((b) => b.startsWith(`${email} `));
    for (const b of bloques.reverse()) { const m = b.match(patron); if (m) return m[1]; }
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}
/** ¿Se ha enviado algún correo a esta dirección? (espera un poco por si el envío se hace después de responder) */
export async function hayCorreoPara(email, espera = 1500) {
  await new Promise((r) => setTimeout(r, espera));
  return readFileSync(MAIL_LOG, "utf8").includes(`[mail] to=${email} `);
}

/** Crea una cuenta nueva (y, salvo que se pida lo contrario, verifica su correo). */
export async function newUser(name, role = "FAN", verify = true) {
  const email = `${name.toLowerCase()}${rnd}@test.es`;
  const p = await (await browser.newContext()).newPage();
  await p.goto(B + "/registro");
  await p.fill("[name=name]", name); await p.fill("[name=email]", email); await p.fill("[name=password]", "contraseña123"); await p.selectOption("[name=role]", role);
  await btn(p, "Crear mi cuenta"); await p.waitForURL("**/verificar");
  if (verify) { await p.goto(B + link(email)); await btn(p, "Confirmar"); await p.waitForSelector("text=Correo electrónico verificado"); }
  return { p, email };
}

/** Ejecuta SQL directamente en la base de pruebas (solo para preparar datos que la web no permite crear en bloque). */
export const sql = (sentencias) => execSync('psql "$DATABASE_URL" -v ON_ERROR_STOP=1', { input: sentencias, env: process.env, stdio: ["pipe", "ignore", "inherit"] });

/** Convierte a un usuario en moderador (solo posible con acceso a la base de datos). */
export const hacerAdmin = (email) => execSync(`psql "${process.env.DATABASE_URL}" -c "update \\"User\\" set role='ADMIN' where email='${email}'"`);
