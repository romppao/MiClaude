// Acceso anticipado (petición del fundador, 17-10-2026: «haré un acceso anticipado a personas concretas»): moderación lo enciende y lleva la lista;
// encendido, solo crean cuenta —con correo o con Google— los correos invitados; quien ya tenía cuenta entra igual. Al terminar se apaga SIEMPRE,
// para no afectar a los recorridos que vengan después (todos crean cuentas).
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { B, rnd, browser, newUser, btn, check, seen, hacerAdmin, terminarDiagnosticos } from "./ayudas.mjs";

const db = new PrismaClient();
const axe = async (p, que) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(`${que}: sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
};
const AQUI = B + "/moderacion/acceso-anticipado";
const aviso = (p, texto) => seen(p.locator(".notice-ok", { hasText: texto }));
async function registrar(correo, nombre) {
  const p = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto(B + "/registro?tipo=usuario");
  await p.fill("[name=name]", nombre); await p.fill("[name=email]", correo); await p.fill("[name=password]", "contraseña123");
  await btn(p, "Crear mi cuenta");
  await p.waitForLoadState();
  return p;
}

try {
  // Alguien que ya tenía cuenta antes de encenderlo.
  const previa = await newUser("Previa", "FAN");
  const mod = await newUser("ModAcceso", "FAN"); hacerAdmin(mod.email);
  await mod.p.setViewportSize({ width: 390, height: 844 });

  // 1) La pantalla de moderación: apagado por defecto.
  await mod.p.goto(AQUI);
  check("moderación tiene la pantalla «Acceso anticipado», apagada por defecto", await seen(mod.p.getByRole("heading", { name: "Acceso anticipado", level: 1 })) && await seen(mod.p.getByRole("heading", { name: /Apagado/ })));
  await axe(mod.p, "Acceso anticipado");
  await btn(mod.p, "Encender el acceso anticipado");
  check("se enciende y lo confirma", await aviso(mod.p, "Acceso anticipado encendido"));

  // 2) Encendido: el registro lo explica y no deja crear cuenta a quien no está en la lista.
  const fuera = await registrar(`fuera${rnd}@test.es`, "Fuera");
  check("el registro avisa de que está en acceso anticipado", await seen(fuera.locator(".notice-info", { hasText: "acceso anticipado" }).first()));
  check("quien no está en la lista no puede crear cuenta, y se le dice por qué", await seen(fuera.locator(".notice-bad", { hasText: "no está en la lista de invitados" })) && !(await db.user.findUnique({ where: { email: `fuera${rnd}@test.es` } })));

  // 3) Moderación invita (con mayúsculas y un texto que no es un correo).
  await mod.p.goto(AQUI);
  await mod.p.fill("textarea[name=correos]", `Invitada${rnd}@Test.es\nhola\nGoogle${rnd}@gmail.com`);
  await mod.p.fill("input[name=nota]", "Prueba");
  await btn(mod.p, "Añadir a la lista");
  check("añade los correos válidos y avisa de los que no lo son", await aviso(mod.p, "Algunos no parecían correos"));
  check("la lista los guarda en minúsculas y dice que aún no han entrado", await seen(mod.p.locator("li", { hasText: `invitada${rnd}@test.es` }).getByText("Aún no ha creado su cuenta")));

  // 4) Quien está en la lista sí puede (escriba su correo como lo escriba).
  const dentro = await registrar(`INVITADA${rnd}@test.es`, "Invitada");
  check("quien está en la lista crea su cuenta", dentro.url().includes("/registro/") && !!(await db.user.findUnique({ where: { email: `invitada${rnd}@test.es` } })));
  await mod.p.goto(AQUI);
  check("y en la lista ya sale que tiene cuenta", await seen(mod.p.locator("li", { hasText: `invitada${rnd}@test.es` }).getByText("Ya tiene cuenta")));

  // 5) Quien ya tenía cuenta entra igual.
  const entrar = await (await browser.newContext()).newPage();
  await entrar.goto(B + "/entrar"); await entrar.fill("[name=email]", previa.email); await entrar.fill("[name=password]", "contraseña123");
  await btn(entrar, "Entrar en mi cuenta");
  await entrar.waitForURL((u) => !u.pathname.startsWith("/entrar"));
  check("quien ya tenía cuenta entra igual", !entrar.url().includes("/entrar"));

  // 6) Con Google (con el Google simulado del servidor de pruebas; sin él, se omite como en google.mjs).
  const sonda = await (await browser.newContext()).request.get(B + "/api/auth/google?modo=registro&tipo=usuario", { maxRedirects: 0 });
  const hayGoogle = (sonda.headers()["location"] ?? "").startsWith("https://accounts.google.com");
  async function viaje(datos) {
    const pg = await (await browser.newContext()).newPage();
    const i = await pg.request.get(B + "/api/auth/google?modo=registro&tipo=usuario", { maxRedirects: 0 });
    const u = new URL(i.headers()["location"]);
    const code = Buffer.from(JSON.stringify({ iss: "https://accounts.google.com", aud: u.searchParams.get("client_id"), exp: Math.floor(Date.now() / 1000) + 600, nonce: u.searchParams.get("nonce"), email_verified: true, ...datos })).toString("base64url");
    await pg.goto(`${B}/api/auth/google/callback?state=${u.searchParams.get("state")}&code=${code}`);
    return pg;
  }
  if (hayGoogle) {
    const noInvitado = await viaje({ sub: `gna-${rnd}`, email: `noinvitado${rnd}@gmail.com`, name: "No Invitado" });
    if (await noInvitado.locator("[role=alert]", { hasText: "Google no ha podido confirmar tu cuenta" }).count()) {
      console.log("AVISO: el servidor no tiene el Google simulado (tests/e2e/google-falso.mjs): se omite la parte de Google. En el CI sí se comprueba.");
    } else {
      check("con Google, quien no está en la lista tampoco crea cuenta", noInvitado.url().includes("/registro") && await seen(noInvitado.locator(".notice-bad", { hasText: "no está en la lista de invitados" })) && !(await db.user.findUnique({ where: { email: `noinvitado${rnd}@gmail.com` } })));
      await viaje({ sub: `gsi-${rnd}`, email: `google${rnd}@gmail.com`, name: "Invitado Google" });
      check("con Google, quien está en la lista sí", !!(await db.user.findUnique({ where: { email: `google${rnd}@gmail.com` } })));
    }
  }

  // 7) Quitar de la lista y apagar.
  await mod.p.goto(AQUI);
  await mod.p.getByRole("button", { name: `Quitar de la lista a google${rnd}@gmail.com` }).click();
  check("se puede quitar a alguien de la lista", await aviso(mod.p, "ya no está en la lista") && (await mod.p.locator("li", { hasText: `google${rnd}@gmail.com` }).count()) === 0);
  await btn(mod.p, "Apagar el acceso anticipado (abrir a todo el mundo)");
  check("y apagarlo abre el registro a todo el mundo", await aviso(mod.p, "Acceso anticipado apagado"));
  const abierto = await registrar(`abierto${rnd}@test.es`, "Abierto");
  check("apagado, cualquiera vuelve a crear cuenta", !!(await db.user.findUnique({ where: { email: `abierto${rnd}@test.es` } })) && !abierto.url().includes("problema="));

  // 8) Quien no modera no entra a la pantalla.
  const curioso = await newUser("CuriosoAcceso", "FAN");
  await curioso.p.goto(AQUI);
  check("una persona sin permiso no ve la pantalla de acceso anticipado", !curioso.p.url().includes("/moderacion/acceso-anticipado"));
} finally {
  // Pase lo que pase, se deja apagado: el resto de recorridos crean cuentas.
  await db.appSetting.upsert({ where: { key: "acceso_anticipado" }, create: { key: "acceso_anticipado", value: "no" }, update: { value: "no" } });
}

await terminarDiagnosticos();
await db.$disconnect();
await browser.close();
if (process.exitCode) console.error("Acceso anticipado: hay comprobaciones fallidas");
