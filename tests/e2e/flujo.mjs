import { datosDeAlta, B, rnd, MAIL_LOG, browser, seen, check, btn, esperarCorreo, hoyMadrid, enDias, registrar, newUser, hacerAdmin, solicitarOrganizador, anadirAlCartel, aprobarOrganizador, terminarDiagnosticos } from "./ayudas.mjs";
// Prueba de extremo a extremo del flujo principal. Requiere el servidor en marcha con la BD de pruebas.
// Variables de entorno: ver tests/e2e/ayudas.mjs.
import { readFileSync } from "node:fs";
import { execFileSync, execSync } from "node:child_process";
const futura = enDias(120); // la aplicación no admite veladas a más de un año vista

// 1) email sin verificar: no puede dar aura ni crear ficha
const unv = await newUser("Sinverificar", "FIGHTER", false);
await unv.p.goto(B + "/mi-ficha"); check("sin verificar → redirige a /verificar", unv.p.url().includes("/verificar"));

// 2) Pepe crea ficha y registra combate contra un rival aún sin cuenta
const pepe = (await newUser("Pepe", "FIGHTER")).p;
await pepe.goto(B + "/mi-ficha");
await pepe.fill("[name=firstName]", "Pepe"); await pepe.fill("[name=lastName]", `Uno${rnd}`); await pepe.fill("[name=gym]", `Gym Test ${rnd}`); await datosDeAlta(pepe); await btn(pepe, "Crear mi ficha");
await pepe.waitForSelector("text=Registrar un combate");
await registrar(pepe, { evento: "Velada Claim Test", fecha: "2026-08-01", rivalNombre: "Luis", rivalApellidos: `Dos${rnd}`, evidencia: "javascript:alert(1)" });
check("un enlace peligroso se rechaza con un mensaje claro y no se guarda nada", await seen(pepe.locator(".notice-bad", { hasText: "El enlace no es válido" })));
await registrar(pepe, { evento: "Velada Claim Test", fecha: "2026-08-01", rivalNombre: "Luis", rivalApellidos: `Dos${rnd}` });
await pepe.locator("tbody tr", { hasText: "Velada Claim Test" }).waitFor();
check("aviso claro tras registrar el combate y plazo de 24 horas", await pepe.locator("[role=status]", { hasText: "Combate registrado. Contará en tu récord a partir del" }).count() === 1);
check("el combate recién declarado todavía no suma en el récord", !(await pepe.locator("main").innerText()).includes("1-0-0"));

// Coherencia: el mismo enfrentamiento no se puede registrar dos veces en la misma velada
await registrar(pepe, { evento: "Velada Claim Test", fecha: "2026-08-01", rivalNombre: "Luis", rivalApellidos: `Dos${rnd}` });
check("si ya hay fichas con el nombre del rival se pide elegir cuál es", await seen(pepe.locator("h1", { hasText: "¿Quién es tu rival?" })));
check("y cada candidata dice cuántos combates tienes contra ella y cuándo se creó su ficha", await seen(pepe.locator("main .card", { hasText: "Ficha creada el" }).first()) && (await pepe.locator("main").innerText()).includes("contra esta persona"));
await btn(pepe, "Es esta persona");
await pepe.waitForSelector("[role=alert]:has-text('ya está registrado')");
check("combate duplicado bloqueado con mensaje claro", await pepe.locator(".notice-bad", { hasText: "ya está registrado" }).count() === 1);
