// Entrar y registrarse con Google (T-015). El servidor de pruebas tiene claves de mentira (GOOGLE_CLIENT_ID/SECRET en el CI):
// se comprueba todo lo que ocurre en Lona sin hablar con Google (no hay salida a internet). La prueba real, en la demo (docs/GOOGLE.md).
import AxeBuilder from "@axe-core/playwright";
import { execSync } from "node:child_process";
import { B, rnd, browser, check, seen, terminarDiagnosticos } from "./ayudas.mjs";

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();

// 1) El botón aparece en «Entrar» y lleva a la ruta propia, que prepara el viaje y manda a Google con PKCE.
await p.goto(B + "/entrar?next=%2Franking");
const boton = p.getByRole("link", { name: "Continuar con Google" });
check("«Entrar» ofrece «Continuar con Google»", await seen(boton));
const href = await boton.getAttribute("href");
check("el botón lleva a la ruta de Lona con el modo y la página a la que volver", href === "/api/auth/google?modo=entrar&next=%2Franking");
const ida = await p.request.get(B + href, { maxRedirects: 0 });
const destino = new URL(ida.headers()["location"] ?? "http://invalido");
check("la ruta redirige a Google", ida.status() === 303 && destino.origin + destino.pathname === "https://accounts.google.com/o/oauth2/v2/auth");
check("con el cliente, la vuelta a Lona y solo nombre y correo", destino.searchParams.get("client_id")?.endsWith(".apps.googleusercontent.com") && destino.searchParams.get("redirect_uri") === `${new URL(B).origin}/api/auth/google/callback` && destino.searchParams.get("scope") === "openid email profile");
check("con state, nonce y PKCE (S256)", !!destino.searchParams.get("state") && !!destino.searchParams.get("nonce") && destino.searchParams.get("code_challenge_method") === "S256" && (destino.searchParams.get("code_challenge") ?? "").length >= 43);
const galleta = (ida.headers()["set-cookie"] ?? "");
check("el viaje se guarda en una cookie httpOnly que solo usa esta ruta", /google_oidc=/.test(galleta) && /HttpOnly/i.test(galleta) && /Path=\/api\/auth\/google/i.test(galleta));

// 2) Volver de Google sin el viaje correcto, o cancelando: mensaje claro en «Entrar» y sin sesión.
await p.goto(B + "/api/auth/google/callback?code=falso&state=falso");
check("una vuelta con un state que no es el nuestro se rechaza con un mensaje claro", await seen(p.locator("[role=alert]", { hasText: "ha caducado o no se ha podido comprobar" })) && new URL(p.url()).pathname === "/entrar");
await p.goto(B + "/api/auth/google/callback?error=access_denied&state=x");
check("si la persona cancela en Google, se le explica y puede volver a intentarlo", await seen(p.locator("[role=alert]", { hasText: "No has terminado de entrar con Google" })));
check("y no queda ninguna sesión iniciada", (await ctx.cookies()).every((c) => c.name !== "session"));

// 3) Registro: botón propio en los tipos de persona; las entidades se registran con correo (su solicitud necesita esos datos).
await p.goto(B + "/registro?tipo=peleador");
const reg = p.getByRole("link", { name: "Registrarme con Google" });
check("el registro de peleador ofrece «Registrarme con Google» y explica qué datos usa", await seen(reg) && await seen(p.getByText("Usaremos el nombre y el correo de tu cuenta de Google")));
check("y conserva el tipo de cuenta elegido", (await reg.getAttribute("href"))?.includes("tipo=peleador") === true);
await p.goto(B + "/registro?tipo=entidad");
check("las entidades no tienen el botón y se les explica por qué", await p.getByRole("link", { name: "Registrarme con Google" }).count() === 0 && await seen(p.getByText("se registran con correo y contraseña")));

// 4) Privacidad: explica qué datos llegan de Google.
await p.goto(B + "/privacidad");
check("la privacidad explica qué datos recibe Lona de Google", await seen(p.getByText("Google nos confirma tu nombre, tu correo electrónico")));

// 5) Accesibilidad de «Entrar» con el botón, en los dos temas.
await p.goto(B + "/entrar");
for (const tema of ["light", "dark"]) {
  await p.emulateMedia({ colorScheme: tema }); await p.waitForTimeout(600);
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  check(`«Entrar» con Google (${tema === "light" ? "claro" : "oscuro"}): sin problemas de accesibilidad${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`, r.violations.length === 0);
}
const alto = await boton.evaluate((el) => el.getBoundingClientRect().height);
check("el botón de Google tiene zona táctil de al menos 44 px", alto >= 44);

// 6) Vuelta completa con el Google simulado del servidor de pruebas (tests/e2e/google-falso.mjs, cargado en el CI al arrancar).
const consulta = (q) => execSync(`psql "${process.env.DATABASE_URL}" -tAc "${q.replace(/"/g, '\\"')}"`).toString().trim();
const CLIENTE = destino.searchParams.get("client_id");
async function viaje(inicio, datos) {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pg = await c.newPage();
  const ida = await pg.request.get(B + inicio, { maxRedirects: 0 });
  const g = new URL(ida.headers()["location"]);
  const code = Buffer.from(JSON.stringify({ iss: "https://accounts.google.com", aud: CLIENTE, exp: Math.floor(Date.now() / 1000) + 600, nonce: g.searchParams.get("nonce"), email_verified: true, ...datos })).toString("base64url");
  await pg.goto(`${B}/api/auth/google/callback?state=${g.searchParams.get("state")}&code=${code}`);
  return { c, pg };
}
const prueba = await viaje("/api/auth/google?modo=entrar", { sub: `sondeo-${rnd}`, email: `sondeo${rnd}@gmail.com`, name: "Sondeo" });
if (await prueba.pg.locator("[role=alert]", { hasText: "Google no ha podido confirmar tu cuenta" }).count()) {
  console.log("AVISO: el servidor no tiene el Google simulado (tests/e2e/google-falso.mjs): se omite la vuelta completa. En el CI sí se comprueba.");
} else {
  let v = await viaje("/api/auth/google?modo=registro&tipo=peleador", { sub: `g-${rnd}`, email: `nuevo${rnd}@gmail.com`, name: "Nuevo Google" });
  check("cuenta nueva con Google: va al paso de su ficha y lo explica", v.pg.url().includes("/registro/ficha") && await seen(v.pg.locator("[role=status]", { hasText: "Tu cuenta se ha creado con Google" })));
  check("cuenta nueva con Google: correo confirmado, tipo peleador y vinculada", consulta(`select role||'|'||("emailVerifiedAt" is not null)||'|'||"googleSub" from "User" where email='nuevo${rnd}@gmail.com'`) === `FIGHTER|true|g-${rnd}`);
  check("cuenta nueva con Google: queda con la sesión iniciada", (await v.c.cookies()).some((x) => x.name === "session"));
  v = await viaje("/api/auth/google?modo=entrar", { sub: `g-${rnd}`, email: `nuevo${rnd}@gmail.com`, name: "Nuevo Google" });
  check("al volver con Google entra en la misma cuenta, sin crear otra", consulta(`select count(*) from "User" where email='nuevo${rnd}@gmail.com'`) === "1" && (await v.c.cookies()).some((x) => x.name === "session"));
  consulta(`insert into "User"(id,email,name,role,"passwordHash","emailVerifiedAt") values ('ex-${rnd}','existe${rnd}@gmail.com','Existe','FAN','x',now())`);
  v = await viaje("/api/auth/google?modo=entrar", { sub: `ge-${rnd}`, email: `existe${rnd}@gmail.com`, name: "Existe" });
  check("una cuenta con ese correo ya confirmado se vincula, sin tocar su contraseña", await seen(v.pg.locator("[role=status]", { hasText: "Has entrado con Google" })) && consulta(`select "googleSub"||'|'||"passwordHash" from "User" where id='ex-${rnd}'`) === `ge-${rnd}|x`);
  consulta(`insert into "User"(id,email,name,role,"passwordHash") values ('sc-${rnd}','sinconf${rnd}@gmail.com','Sin','FAN','puesta-por-otro')`);
  await viaje("/api/auth/google?modo=entrar", { sub: `gs-${rnd}`, email: `sinconf${rnd}@gmail.com`, name: "Sin" });
  check("si esa cuenta no había confirmado el correo, su contraseña anterior deja de valer", consulta(`select ("passwordHash"<>'puesta-por-otro')||'|'||("emailVerifiedAt" is not null)||'|'||"googleSub" from "User" where id='sc-${rnd}'`) === `true|true|gs-${rnd}`);
  v = await viaje("/api/auth/google?modo=entrar", { sub: `gx-${rnd}`, email: `x${rnd}@gmail.com`, email_verified: false });
  check("un correo sin confirmar en Google se rechaza con un mensaje claro y sin crear cuenta", await seen(v.pg.locator("[role=alert]", { hasText: "no tiene el correo electrónico confirmado" })) && consulta(`select count(*) from "User" where email='x${rnd}@gmail.com'`) === "0");
  const creador = (process.env.CREADOR_CORREO ?? "").toLowerCase();
  if (creador) {
    consulta(`insert into "User"(id,email,name,role,"passwordHash","emailVerifiedAt") values ('cr-${rnd}','${creador}','Creador','FAN','x',now()) on conflict (email) do nothing`);
    v = await viaje("/api/auth/google?modo=entrar", { sub: consulta(`select coalesce("googleSub",'gc-${rnd}') from "User" where email='${creador}'`), email: creador, name: "Creador" });
    check("el creador que entra con Google pasa por el segundo paso", v.pg.url().includes("/entrar/segundo-paso"));
    const mod = await v.pg.request.get(B + "/moderacion", { maxRedirects: 0 });
    check("y sin el segundo paso no puede entrar en moderación", mod.status() >= 300 && mod.status() < 400);
  }
}

await terminarDiagnosticos();
await browser.close();
