import type { MetadataRoute } from "next";
import { APP_URL } from "../lib/common/mail";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/mi-cuenta", "/mi-ficha", "/moderacion", "/organizador", "/recuperar", "/baja", "/verificar", "/siguiendo", "/salud"] }],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
