import type { MetadataRoute } from "next";
import { APP_URL } from "../lib/common/mail";

// Se calcula en cada petición: si se generara al compilar, llevaría la APP_URL que hubiera en ese momento y no la del servidor en marcha.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/mi-cuenta", "/mi-ficha", "/moderacion", "/organizador", "/recuperar", "/baja", "/verificar", "/siguiendo", "/salud"] }],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
