import manifiesto from "./gimnasios-logos.json";
import { lookup } from "./safe";

/**
 * Logotipos de gimnasios encontrados en su propia web (scripts/logos-gimnasios.ts, 17-10-2026, petición del fundador). Cada uno anota de dónde salió
 * en src/lib/common/gimnasios-logos.json (junto al código: la imagen de producción no incluye docs/) para poder retirarlo si el gimnasio lo pide. El logotipo que sube el propio gimnasio siempre manda sobre este.
 */
const LOGOS: Record<string, { archivo: string }> = manifiesto;

/** Dirección del logotipo de un gimnasio (por su dirección en la web), o null si no se ha encontrado ninguno. */
export const logoDeGimnasio = (slug: string | null | undefined): string | null => {
  const e = lookup(LOGOS, slug);
  return e ? `/gimnasios/logos/${e.archivo}` : null;
};
