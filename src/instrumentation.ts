// Se ejecuta una vez al arrancar el servidor de Next.js.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateEnv } = await import("./lib/env");
  const { errors, warnings } = validateEnv();
  for (const w of warnings) console.warn(`[configuración] ${w}`);
  if (errors.length) throw new Error(`Configuración incompleta:\n- ${errors.join("\n- ")}`);
}
