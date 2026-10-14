// Google simulado SOLO para el servidor de pruebas (CI): sustituye la respuesta del endpoint de tokens de Google para que
// tests/e2e/google.mjs recorra la vuelta completa (crear, entrar, vincular, proteger, creador) sin salir a internet.
// El «code» que manda la prueba lleva en base64url los datos del id_token (la prueba conoce el nonce porque lo lee en la
// dirección de Google). Se carga al arrancar: node --import ./tests/e2e/google-falso.mjs node_modules/next/dist/bin/next start
// No afecta a ninguna otra petición. Nunca se usa fuera de las pruebas.
const original = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (String(url) === "https://oauth2.googleapis.com/token") {
    const code = new URLSearchParams(String(opts?.body ?? "")).get("code") ?? "";
    let claims;
    try { claims = JSON.parse(Buffer.from(code, "base64url").toString("utf8")); } catch { return new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }); }
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    return new Response(JSON.stringify({ id_token: `${b64({ alg: "RS256" })}.${b64(claims)}.firma` }), { status: 200, headers: { "content-type": "application/json" } });
  }
  return original(url, opts);
};
