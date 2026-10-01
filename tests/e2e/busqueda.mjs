// Pruebas de búsqueda, paginación, cabeceras de seguridad y buscadores (robots, mapa del sitio, salud).
// Requiere el servidor en marcha (ver ayudas.mjs).
import { B, rnd, browser, seen, check, btn, hoyMadrid, registrar, newUser, sql, terminarDiagnosticos } from "./ayudas.mjs";

const cuerpo = (p) => p.locator("body").innerText();
const anon = await (await browser.newContext()).newPage();
const violaciones = [];
anon.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violaciones.push(m.text()); });

// Datos: un peleador con tildes, gimnasio propio y un rival sin ficha propia
const alvaro = await newUser("Alvaro", "FIGHTER");
await alvaro.p.goto(B + "/mi-ficha");
await alvaro.p.fill("[name=firstName]", "Álvaro"); await alvaro.p.fill("[name=lastName]", `Pérez${rnd} Núñez`); await alvaro.p.fill("[name=gym]", `Gimnasio Meta ${rnd}`);
await btn(alvaro.p, "Crear mi ficha");
await alvaro.p.locator(".notice-ok", { hasText: "ficha de peleador se ha creado" }).waitFor();
await registrar(alvaro.p, { evento: `Velada Búsqueda ${rnd}`, fecha: hoyMadrid, rivalNombre: "Rival", rivalApellidos: `Oculto${rnd}` });
await alvaro.p.locator("[role=status]", { hasText: "Combate registrado" }).waitFor();

// 1) Búsqueda sin tildes, sin mayúsculas y con varias palabras en cualquier orden
const buscar = async (q) => { await anon.goto(B + `/buscar?q=${encodeURIComponent(q)}`); return cuerpo(anon); };
check("«alvaro perez» encuentra a «Álvaro Pérez» sin escribir las tildes", (await buscar(`alvaro perez${rnd}`)).includes(`Álvaro Pérez${rnd} Núñez`));
check("y en otro orden y en mayúsculas", (await buscar(`PÉREZ${rnd} ÁLVARO`)).includes(`Álvaro Pérez${rnd} Núñez`));
check("y con un apellido compuesto por la mitad (nombre y segundo apellido)", (await buscar(`alvaro nunez`)).includes(`Álvaro Pérez${rnd} Núñez`));
check("todas las palabras deben coincidir", !(await buscar(`alvaro zzzz${rnd}`)).includes(`Pérez${rnd}`));
check("la búsqueda encuentra veladas y gimnasios sin tildes", (await buscar(`busqueda ${rnd}`)).includes(`Velada Búsqueda ${rnd}`) && (await buscar(`gimnasio meta ${rnd}`)).includes(`Gimnasio Meta ${rnd}`));
await buscar(`oculto${rnd}`);
check("una ficha creada por un tercero no aparece en la búsqueda", await anon.locator(`a[href*="rival-oculto${rnd}"]`).count() === 0);
const vacio = await buscar(`zzzz${rnd}`);
check("sin resultados, se dice con claridad y se sugiere qué probar", vacio.includes("No hemos encontrado nada") && vacio.includes("Prueba con menos palabras"));
check("el campo de búsqueda tiene su etiqueta visible con instrucciones", vacio.includes("Busca peleadores, gimnasios, entrenadores o veladas") && vacio.includes("No hace falta poner tildes"));
check("una búsqueda repetida en la dirección (?q=a&q=b) no rompe la página", (await anon.goto(B + "/buscar?q=alvaro&q=perez")).status() === 200 && (await anon.goto(B + "/peleadores?province=a&province=b&level=x&level=y")).status() === 200);
await anon.goto(B + `/peleadores?q=${encodeURIComponent(`pérez${rnd}`)}`);
check("el listado de peleadores también busca sin tildes", (await cuerpo(anon)).includes(`Álvaro Pérez${rnd} Núñez`));

// 2) Paginación de los listados. Se preparan 30 peleadores propios para no depender de cuántos haya en la base de datos.
sql(`insert into "Fighter"(id, slug, "firstName", "lastName") select 'pag${rnd}-' || i, 'paginado-${rnd}-' || i, 'Pag', 'Paginado${rnd}' from generate_series(1, 30) i;`);
await anon.goto(B + `/peleadores?q=Paginado${rnd}&level=AMATEUR`);
const siguiente = anon.locator("a", { hasText: "Página siguiente" });
check("los listados largos se paginan y dicen cuántos resultados hay", await seen(siguiente.first()) && (await cuerpo(anon)).includes("Mostrando del 1 al 24 de 30 peleadores · página 1 de 2"));
const href = await siguiente.first().getAttribute("href");
check("el enlace a la página siguiente conserva los filtros", href.includes(`q=Paginado${rnd}`) && /level=AMATEUR/.test(href) && /pagina=2/.test(href));
await siguiente.first().click();
check("la segunda página muestra el resto y ofrece volver a la anterior", await seen(anon.locator("a", { hasText: "Página anterior" }).first()) && /pagina=2/.test(anon.url()) && (await cuerpo(anon)).includes("Mostrando del 25 al 30 de 30 peleadores"));
check("una página que no existe muestra la última en lugar de fallar", (await anon.goto(B + "/peleadores?pagina=9999")).status() === 200 && /Mostrando del \d+ al \d+ de/.test(await cuerpo(anon)));
check("un número de página inválido equivale a la primera", (await anon.goto(B + "/peleadores?pagina=abc")).status() === 200 && (await cuerpo(anon)).includes("Mostrando del 1 al"));

// 3) Cabeceras de seguridad y política de contenido
const r = await anon.goto(B + "/");
const h = r.headers();
check("la web no se puede incrustar en otras (X-Frame-Options y frame-ancestors)", h["x-frame-options"] === "DENY" && /frame-ancestors 'none'/.test(h["content-security-policy"] ?? ""));
check("se impide el envío de formularios a otros sitios y la carga de contenido de terceros", /form-action 'self'/.test(h["content-security-policy"] ?? "") && /default-src 'self'/.test(h["content-security-policy"] ?? ""));
check("nosniff, política de referencia, permisos del navegador y HSTS", h["x-content-type-options"] === "nosniff" && !!h["referrer-policy"] && /camera=\(\)/.test(h["permissions-policy"] ?? "") && /max-age=/.test(h["strict-transport-security"] ?? ""));
check("no se anuncia la tecnología del servidor", !("x-powered-by" in h));
await anon.goto(B + "/buscar"); await anon.fill("[name=q]", "prueba"); await btn(anon, "Buscar");
await seen(anon.locator("h2, p:has-text('No hemos encontrado')").first());
await anon.goto(B + "/registro");
check("la política de contenido no bloquea nada de la propia web (scripts, estilos, formularios)", violaciones.length === 0);

// 4) Buscadores: robots, mapa del sitio y comprobación de salud
const robots = await (await anon.request.get(B + "/robots.txt")).text();
check("robots.txt indica el mapa del sitio y oculta las zonas privadas", /Sitemap: .*\/sitemap\.xml/.test(robots) && /Disallow: \/moderacion/.test(robots) && /Disallow: \/mi-cuenta/.test(robots));
const mapa = await (await anon.request.get(B + "/sitemap.xml")).text();
check("el mapa del sitio incluye las fichas públicas y no las provisionales", mapa.includes(`/peleadores/alvaro-perez${rnd}-nunez`) && !mapa.includes(`rival-oculto${rnd}`));
const salud = await anon.request.get(B + "/salud");
check("la comprobación de salud responde que todo funciona", salud.ok() && (await salud.json()).estado === "ok");

// 5) Títulos propios en las fichas
await anon.goto(B + `/gimnasios/gimnasio-meta-${rnd}-madrid`);
check("la ficha de un gimnasio tiene su propio título", (await anon.title()).startsWith(`Gimnasio Meta ${rnd}`));
await anon.goto(B + `/peleadores/alvaro-perez${rnd}-nunez`);
check("la ficha de un peleador tiene su propio título", (await anon.title()).startsWith(`Álvaro Pérez${rnd} Núñez`));

// 6) Direcciones con parámetros raros (los filtra src/middleware.ts): nunca provocan un error del servidor.
//    Antes daban 500: «constructor» como nombre, un carácter nulo (%00) en un valor y parámetros repetidos en /ranking y /recuperar/nueva.
const raras = ["constructor=y", "q=%00&entity=%00&id=%00", "q=a&q=b&token=a&token=b&provincia=a&provincia=b&next=a&next=b", "__proto__=x&then=x&pagina=abc"];
const fallos = [];
for (const ruta of ["/peleadores", "/veladas", "/gimnasios", "/entrenadores", "/ranking", "/buscar", "/entrar", "/recuperar/nueva", "/baja", "/verificar", "/moderacion/historial"]) {
  for (const q of raras) { const r = await anon.request.get(B + `${ruta}?${q}`); if (r.status() >= 500) fallos.push(`${ruta}?${q} → ${r.status()}`); }
}
check(`ninguna dirección con parámetros raros provoca un error del servidor${fallos.length ? ": " + fallos.join(", ") : ""}`, fallos.length === 0);
const conservada = await anon.request.get(B + `/peleadores?constructor=y&q=alvaro%20perez${rnd}`);
check("y el resto de la dirección se conserva (la búsqueda sigue funcionando)", (await conservada.text()).includes(`Pérez${rnd}`) );

await terminarDiagnosticos();
await browser.close();
if (process.exitCode) console.error("\nBúsqueda: hay comprobaciones fallidas");
