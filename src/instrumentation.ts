// Se ejecuta una vez al arrancar el servidor de Next.js.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateEnv } = await import("./lib/common/env");
  const { errors, warnings } = validateEnv();
  for (const w of warnings) console.warn(`[configuración] ${w}`);
  if (errors.length) {
    // Un servidor a medio configurar que sigue respondiendo (con errores) es peor que uno que no arranca: se detiene el proceso con un mensaje claro.
    console.error(`[configuración] Configuración incompleta, el servidor se detiene:\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }
}
