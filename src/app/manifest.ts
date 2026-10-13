import type { MetadataRoute } from "next";

/**
 * Manifiesto de la aplicación web (instalarla en el móvil desde el navegador). El icono es el oficial de la marca: el ring visto desde
 * arriba (decisión del fundador, 13 de octubre de 2026; archivos en public/brand/lona). Nombre oficial: Lona.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lona",
    short_name: "Lona",
    description: "La comunidad de deportes de contacto de toda España.",
    lang: "es",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0C",
    theme_color: "#0A0A0C",
    icons: [
      { src: "/brand/lona/lona-icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/lona/lona-icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/lona/lona-icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
