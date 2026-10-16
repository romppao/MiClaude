import manifiesto from "../../../docs/datos/gimnasios-logos.json";
import { lookup } from "./safe";

/**
 * Logotipos de gimnasios encontrados en su propia web (scripts/logos-gimnasios.ts, 17-10-2026, petición del fundador). Cada uno anota de dónde salió
 * en docs/datos/gimnasios-logos.json para poder retirarlo si el gimnasio lo pide. El logotipo que sube el propio gimnasio siempre manda sobre este.
 */
const LOGOS: Record<string, { archivo: string }> = manifiesto;

/** Dirección del logotipo de un gimnasio (por su dirección en la web), o null si no se ha encontrado ninguno. */
export const logoDeGimnasio = (slug: string | null | undefined): string | null => {
  const e = lookup(LOGOS, slug);
  return e ? `/gimnasios/logos/${e.archivo}` : null;
};
