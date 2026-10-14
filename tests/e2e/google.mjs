// Entrar y registrarse con Google (T-015). El servidor de pruebas tiene claves de mentira (GOOGLE_CLIENT_ID/SECRET en el CI):
// se comprueba todo lo que ocurre en Lona sin hablar con Google (no hay salida a internet). La prueba real, en la demo (docs/GOOGLE.md).
import AxeBuilder from "@axe-core/playwright";
import { B, browser, check, seen, terminarDiagnosticos } from "./ayudas.mjs";

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

await terminarDiagnosticos();
await browser.close();
