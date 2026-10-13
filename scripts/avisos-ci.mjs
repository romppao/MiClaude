// Resume en un solo aviso del CI («::error::») los fallos de las pruebas de navegador y lo que se veía en cada página guardada
// (test-results/*.html, ver volcarDiagnostico en tests/e2e/ayudas.mjs). Así se leen desde la API del PR, sin descargar el registro
// ni las capturas (GitHub muestra como mucho 10 avisos por paso: por eso va todo en uno).
// Uso: node scripts/avisos-ci.mjs test-results/e2e.log
import { existsSync, readFileSync, readdirSync } from "node:fs";

const registro = process.argv[2];
const lineas = registro && existsSync(registro) ? readFileSync(registro, "utf8").split("\n") : [];
const fallos = lineas.filter((l) => /^(FAIL|FALLO)\b|^\w*Error\b|^\s+at .*tests\/e2e\//.test(l)).slice(0, 30);
const paginas = existsSync("test-results") ? readdirSync("test-results").filter((f) => f.endsWith(".html")).slice(0, 6) : [];
const textoDe = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();
const partes = [`Fallos (${fallos.length}):`, ...fallos];
for (const f of paginas) {
  const html = readFileSync(`test-results/${f}`, "utf8");
  partes.push("", `Página guardada ${f} — ${(html.match(/^<!-- (.*?) -->/) ?? [])[1] ?? "?"}`, textoDe(html).slice(0, 700));
}
const escapar = (s) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
console.log(`::error title=Pruebas de navegador::${escapar(partes.join("\n"))}`);
