/**
 * Modo demostración: solo para una copia de prueba con datos ficticios (variable DEMO_MODE=si, que únicamente pone el despliegue de demostración).
 * Permite confirmar el correo con un botón (la demo no envía correos) y cambiar de papel para recorrer toda la aplicación con una sola cuenta.
 * En una instalación real la variable no existe y las acciones de demostración se niegan.
 */
export const demoActiva = (env: NodeJS.ProcessEnv = process.env): boolean => env.DEMO_MODE === "si";

/** Papeles entre los que se puede cambiar en la demostración, con su nombre en lenguaje llano. */
export const DEMO_PAPELES = { FAN: "Aficionado", FIGHTER: "Peleador", ORGANIZER: "Organizador", ADMIN: "Moderador" } as const;
