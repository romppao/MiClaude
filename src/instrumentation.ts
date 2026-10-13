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

/**
 * Cualquier fallo no controlado al mostrar una página, guardar un formulario (acción del servidor) o responder una dirección de datos
 * queda en el registro de fallos (src/lib/common/fallos.ts → /moderacion/fallos). Next.js no llama aquí por las redirecciones ni por
 * «no encontrada», que no son fallos. `routePath` es la ruta con sus huecos («/peleadores/[slug]»): así la ficha 12 y la 13 suman en el mismo fallo.
 */
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { registrarFallo } = await import("./lib/common/fallos");
  const origen = context.routeType === "action" ? "ACCION" : context.routeType === "route" ? "RUTA" : context.routeType === "render" ? "PAGINA" : "SERVIDOR";
  const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest: unknown }).digest) : null;
  await registrarFallo({ origen, error, ruta: context.routePath || request.path, digest });
}
