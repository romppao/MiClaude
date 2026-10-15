import type { MetadataRoute } from "next";
import { APP_URL } from "../lib/common/mail";
import { demoActiva } from "../lib/common/demo";

// Se calcula en cada petición: si se generara al compilar, llevaría la APP_URL que hubiera en ese momento y no la del servidor en marcha.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const rules = [{ userAgent: "*", allow: "/", disallow: ["/mi-cuenta", "/mi-ficha", "/moderacion", "/organizador", "/recuperar", "/baja", "/verificar", "/siguiendo", "/salud"] }];
  // La demo no anuncia su mapa del sitio. Sigue dejando entrar a los buscadores para que vean su «noindex» (layout.tsx):
  // si se les cerrara la puerta, Google conservaría lo que ya hubiera guardado de ella.
  return demoActiva() ? { rules } : { rules, sitemap: `${APP_URL}/sitemap.xml` };
}
