// Copia el «trabajador» de MapLibre (el código que dibuja el mapa en segundo plano) a public/vendor/, con la versión en el nombre
// de la carpeta para que cada actualización cambie la dirección y el navegador no use una copia vieja.
// Se ejecuta solo antes de compilar y de arrancar en desarrollo (npm run build / npm run dev). Mapa de gimnasios: docs/DISENO.md.
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const origen = "node_modules/maplibre-gl/dist";
const { version } = JSON.parse(readFileSync("node_modules/maplibre-gl/package.json", "utf8"));
rmSync("public/vendor/maplibre", { recursive: true, force: true });
const destino = join("public/vendor/maplibre", version);
mkdirSync(destino, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(join(origen, f), join(destino, f));
console.log(`MapLibre ${version}: trabajador copiado en ${destino}`);
