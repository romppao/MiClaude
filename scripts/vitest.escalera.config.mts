import { defineConfig } from "vitest/config";

/** Configuración de la prueba «Escalera» (docs/PRUEBA-ESCALERA.md). Por defecto ejecuta las pruebas que cada aspirante escribe en su carpeta. */
export default defineConfig({ test: { include: [process.env.ESCALERA_INCLUDE ?? "docs/ingreso/*/escalera/**/*.test.ts"] } });
