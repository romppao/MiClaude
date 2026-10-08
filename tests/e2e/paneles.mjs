// Registro por tipos de cuenta y aterrizaje por papel.
// Petición del fundador (6 de octubre de 2026): «tiene que ser profesional; Panel A para el usuario normal… Panel B peleadores. Panel C promotoras, federaciones».
// Diseño v3 (7 de octubre de 2026): cuatro tipos (aficionado, peleador, entrenador y promotora, federación o club) y un último paso propio de cada uno.
// Requiere el servidor en marcha (ver ayudas.mjs).
import { execSync } from "node:child_process";
import { B, rnd, browser, seen, check, btn, link, newUser, hacerAdmin, aprobarOrganizador, terminarDiagnosticos } from "./ayudas.mjs";

const consulta = (q) => execSync(`psql "${process.env.DATABASE_URL}" -tA`, { input: q }).toString().trim();
const nueva = async () => (await browser.newContext()).newPage();
const cuerpo = (p) => p.locator("body").innerText();
const avisoMalo = (p, texto) => p.locator("[role=alert]", { hasText: texto });

// 1) La pantalla de registro: cuatro paneles claros y ningún texto antiguo
const v = await nueva();
await v.goto(B + "/registro");
const textoPaneles = await cuerpo(v);
check("el registro ofrece cuatro paneles: aficionado, peleador, entrenador y promotora, federación o club", await v.locator("a.panel-registro").count() === 4 && ["Aficionado", "Peleador", "Entrenador", "Promotora, federación o club"].every((t) => textoPaneles.includes(t)));
check("sin desplegable de rol ni las frases antiguas", await v.locator("select[name=role]").count() === 0 && !/¿Qué quieres hacer|Dar aura a peleadores y consultar|Tener mi ficha de peleador/.test(textoPaneles));
check("cada panel es una zona táctil de al menos 44 px", (await v.locator("a.panel-registro").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))).every((h) => h >= 44));
check("hay un enlace para quien ya tiene cuenta", await v.locator("main a[href='/entrar']").count() === 1);
await v.goto(B + "/registro?tipo=administrador");
check("un tipo inventado en la dirección vuelve a mostrar los cuatro paneles", await v.locator("a.panel-registro").count() === 4);

// 2) Panel A: aficionado (solo nombre, correo y contraseña)
await v.goto(B + "/registro");
await v.locator("a.panel-registro", { hasText: "Aficionado" }).click();
check("el panel «Aficionado» pide solo nombre, correo y contraseña", await seen(v.locator("[name=password]")) && await v.locator("main form input:not([type=hidden])").count() === 3 && await v.locator("main form select").count() === 0);
check("y ofrece volver a elegir otro tipo de cuenta", await v.locator("main a", { hasText: "Elegir otro tipo de cuenta" }).count() === 1);
const correoUsuario = `panela${rnd}@test.es`;
await v.fill("[name=name]", "Panel Usuario"); await v.fill("[name=email]", correoUsuario); await v.fill("[name=password]", "contraseña123");
await btn(v, "Crear mi cuenta"); await v.waitForURL("**/registro/intereses**");
check("después ofrece elegir disciplinas y peleadores para seguir, y se puede dejar para después", await seen(v.getByRole("heading", { name: "¿Qué te gusta ver?" })) && await v.locator("main input[name=disciplina]").count() === 6 && await v.getByRole("link", { name: "Lo haré después" }).count() === 1);
await v.locator("label.chip", { hasText: "Muay Thai" }).click(); await v.locator("label.chip", { hasText: "K-1" }).click();
await btn(v, "Terminar"); await v.waitForURL("**/verificar**");
check("las disciplinas elegidas se guardan en la cuenta", consulta(`select interests from "User" where email='${correoUsuario}'`) === "{K1,MUAYTHAI}");
check("la cuenta de usuario tiene el papel de usuario y ninguna solicitud", consulta(`select role from "User" where email='${correoUsuario}'`) === "FAN" && consulta(`select count(*) from "OrganizerRequest" r join "User" u on u.id=r."userId" where u.email='${correoUsuario}'`) === "0");

// 3) Panel B: peleador
const pb = await nueva();
await pb.goto(B + "/registro?tipo=peleador");
check("el panel «Peleador» explica que la ficha se crea después", await seen(pb.locator("main p", { hasText: "crear tu ficha" })));
const correoPeleador = `panelb${rnd}@test.es`;
await pb.fill("[name=name]", "Panel Peleador"); await pb.fill("[name=email]", correoPeleador); await pb.fill("[name=password]", "contraseña123");
await btn(pb, "Crear mi cuenta de peleador"); await pb.waitForURL("**/registro/ficha**");
check("la cuenta del peleador tiene el papel de peleador", consulta(`select role from "User" where email='${correoPeleador}'`) === "FIGHTER");
check("el último paso pide disciplina, nivel, categoría y provincia con botones grandes", await seen(pb.getByRole("heading", { name: "Crea tu ficha" })) && await pb.locator("label.chip input[name=discipline]").count() === 6);
await pb.locator("label.chip", { hasText: "Muay Thai" }).click(); await pb.locator(".segmentos label", { hasText: "Profesional" }).click();
await pb.locator("label.chip-doble", { hasText: "hasta 61,2 kg" }).click(); await pb.selectOption("[name=province]", "Valencia");
await btn(pb, "Guardar mi ficha"); await pb.waitForURL("**/verificar**");
check("lo elegido se guarda para la ficha, sin publicar nada hasta confirmar el correo", JSON.parse(consulta(`select onboarding from "User" where email='${correoPeleador}'`)).weightClass === "Ligero" && consulta(`select count(*) from "Fighter" f join "User" u on u.id=f."userId" where u.email='${correoPeleador}'`) === "0");
await pb.goto(B + link(correoPeleador)); await btn(pb, "Confirmar");
check("tras confirmar el correo se ofrece ir a la ficha", await seen(pb.locator("main button", { hasText: "Ir a mi ficha de peleador" })));
await pb.goto(B + "/mi-ficha");
const crear = pb.locator("main form").filter({ has: pb.getByRole("button", { name: "Crear mi ficha", exact: true }) });
check("«Mi ficha» llega rellenada con lo elegido al registrarse", await crear.locator("[name=discipline]").inputValue() === "MUAYTHAI" && await crear.locator("[name=level]").inputValue() === "PRO" && await crear.locator("[name=weightClass]").inputValue() === "Ligero" && await crear.locator("[name=province]").inputValue() === "Valencia");

// 4) Panel C: federación (cuenta y solicitud juntas)
const pc = await nueva();
await pc.goto(B + "/registro?tipo=entidad");
const nombreFed = `Federación Panel ${rnd}`;
const correoFed = `panelc${rnd}@test.es`;
check("el panel de entidades pide los datos de la entidad: promotora, federación o club", await seen(pc.locator("[name=orgName]")) && await pc.locator("input[name=entityKind]").count() === 3 && await pc.locator("[name=website]").count() === 1);
check("y avisa de que un moderador revisará la solicitud", (await cuerpo(pc)).includes("Un moderador revisará tu solicitud"));
await pc.fill("[name=name]", "Persona Federación"); await pc.fill("[name=email]", correoFed); await pc.fill("[name=password]", "contraseña123");
await pc.fill("[name=orgName]", nombreFed); await pc.locator(".segmentos label", { hasText: "Federación" }).click(); await pc.fill("[name=website]", "ftp://no-vale"); await pc.fill("[name=message]", "Web oficial y redes");
await btn(pc, "Enviar solicitud");
check("una dirección web que no empieza por http se rechaza con un mensaje", await seen(avisoMalo(pc, "enlace")) && consulta(`select count(*) from "User" where email='${correoFed}'`) === "0");
check("y no se crea la cuenta a medias", consulta(`select count(*) from "User" where email='${correoFed}'`) === "0");
await pc.fill("[name=name]", "Persona Federación"); await pc.fill("[name=email]", correoFed); await pc.fill("[name=password]", "contraseña123");
await pc.fill("[name=orgName]", nombreFed); await pc.locator(".segmentos label", { hasText: "Federación" }).click(); await pc.fill("[name=website]", "https://federacion-panel.example"); await pc.fill("[name=message]", "Web oficial y redes");
await btn(pc, "Enviar solicitud"); await pc.waitForURL("**/verificar*");
check("se confirma que la solicitud se ha recibido y qué pasará ahora", await seen(pc.locator("[role=status]", { hasText: "un moderador la revisará y te responderá por correo electrónico" })));
check("la cuenta y la solicitud (tipo federación y web) se guardan juntas, y el papel sigue siendo de usuario", consulta(`select u.role||'|'||r.kind||'|'||r.website||'|'||r.status from "OrganizerRequest" r join "User" u on u.id=r."userId" where u.email='${correoFed}'`) === "FAN|FEDERACION|https://federacion-panel.example/|PENDING");
await pc.goto(B + link(correoFed)); await btn(pc, "Confirmar");
check("tras confirmar el correo se ofrece ver el estado de la solicitud", await seen(pc.locator("main button", { hasText: "Ver el estado de mi solicitud" })));

// 5) Moderación: ve el tipo y la web, y al aprobar la federación tiene su perfil y su titular
const mod = await newUser("Moderapaneles", "FAN"); hacerAdmin(mod.email);
await mod.p.goto(B + "/moderacion");
const fila = mod.p.locator("tr", { hasText: nombreFed });
check("la cola de moderación muestra el tipo de entidad y el enlace aportado", await seen(fila.locator(".tag", { hasText: "Federación" })) && await fila.locator("a[href='https://federacion-panel.example/']").count() === 1);
await aprobarOrganizador(mod.p, nombreFed);
check("al aprobar, la persona pasa a ser organizadora", consulta(`select role from "User" where email='${correoFed}'`) === "ORGANIZER");
check("y su federación ya tiene perfil en el directorio, con ella como titular y su web", consulta(`select count(*) from "Profile" p join "User" u on u.id=p."ownerId" where p.kind='federacion' and p.name='${nombreFed}' and p.website='https://federacion-panel.example/' and u.email='${correoFed}'`) === "1");
await pc.goto(B + "/federaciones");
check("la federación aparece en el directorio público", await seen(pc.locator("main a.card", { hasText: nombreFed })));

// 6) Panel C: promotora (no crea perfil de federación) y datos obligatorios
const pp = await nueva();
await pp.goto(B + "/registro?tipo=entidad");
const nombreProm = `Promotora Panel ${rnd}`;
await pp.fill("[name=name]", "Persona Promotora"); await pp.fill("[name=email]", `panelp${rnd}@test.es`); await pp.fill("[name=password]", "contraseña123");
await pp.fill("[name=orgName]", nombreProm); await pp.locator(".segmentos label", { hasText: "Promotora" }).click(); await pp.evaluate(() => document.querySelector("[name=message]").removeAttribute("required")); await btn(pp, "Enviar solicitud");
check("sin explicar cómo comprobarla, la solicitud se rechaza con un mensaje que lo explica", await seen(avisoMalo(pp, "Cuéntanos cómo podemos comprobar")));
await pp.fill("[name=name]", "Persona Promotora"); await pp.fill("[name=email]", `panelp${rnd}@test.es`); await pp.fill("[name=password]", "contraseña123");
await pp.fill("[name=orgName]", nombreProm); await pp.locator(".segmentos label", { hasText: "Promotora" }).click(); await pp.fill("[name=message]", "Veladas anteriores en redes");
await btn(pp, "Enviar solicitud"); await pp.waitForURL("**/verificar*");
await aprobarOrganizador(mod.p, nombreProm);
check("una promotora aprobada pasa a ser organizadora sin crear un perfil de federación", consulta(`select role from "User" where email='panelp${rnd}@test.es'`) === "ORGANIZER" && consulta(`select count(*) from "Profile" where kind='federacion' and name='${nombreProm}'`) === "0");

// 7) El servidor no se fía del formulario: un tipo inventado nunca da permisos
const mal = await nueva();
const r = await mal.request.post(B + "/registro?tipo=usuario", { form: { tipo: "admin", role: "ADMIN", name: "Intruso", email: `intruso${rnd}@test.es`, password: "contraseña123" }, maxRedirects: 0 }).catch((e) => ({ error: e }));
check("un envío manual con tipo o papel inventados no crea una cuenta con permisos", consulta(`select count(*) from "User" where email='intruso${rnd}@test.es' and role<>'FAN'`) === "0");

// 8) Aterrizaje por papel al entrar
async function entrarYVer(email, destino, texto) {
  const p = await nueva();
  await p.goto(B + "/entrar"); await p.fill("[name=email]", email); await p.fill("[name=password]", "contraseña123"); await btn(p, "Entrar en mi cuenta");
  await p.waitForURL((u) => !u.pathname.startsWith("/entrar"));
  check(texto, new URL(p.url()).pathname === destino);
}
// Decisión del fundador (8 de octubre de 2026): después de entrar, todas las personas ven la misma portada; lo suyo está en «Mi panel».
await entrarYVer(correoPeleador, "/", "el peleador entra y llega a la portada común");
await entrarYVer(correoFed, "/", "la federación aprobada entra y llega a la portada común");
await entrarYVer(mod.email, "/moderacion", "la moderación entra y llega a su panel");
await terminarDiagnosticos();
await browser.close();
