const produccion = process.env.NODE_ENV === "production";

// Política de contenido: solo se carga lo que sirve la propia web. Next.js necesita scripts y estilos «inline» para funcionar;
// lo importante aquí es impedir que otra web incruste la nuestra (frame-ancestors), que los formularios envíen datos fuera
// (form-action) y que se cargue nada de terceros. En desarrollo no se aplica porque el modo de desarrollo necesita eval.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Miniaturas de los vídeos de las noticias (src/lib/news/parse.ts, HOSTS_DE_IMAGEN).
  "img-src 'self' data: https://i.ytimg.com",
  "font-src 'self'",
  // Vídeos subidos al almacén R2 (src/lib/media/storage.ts): el navegador los sube y los reproduce directamente desde allí.
  "connect-src 'self' https://*.r2.cloudflarestorage.com",
  "media-src 'self' https://*.r2.cloudflarestorage.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "9mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          ...(produccion
            ? [
                { key: "Content-Security-Policy", value: csp },
                { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
              ]
            : []),
        ],
      },
    ];
  },
};
export default nextConfig;
