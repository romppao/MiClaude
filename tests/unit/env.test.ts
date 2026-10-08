import { describe, expect, it } from "vitest";
import { validateEnv } from "../../src/lib/common/env";

const prod = (extra: Record<string, string> = {}) => ({ NODE_ENV: "production", DATABASE_URL: "postgresql://x", APP_URL: "https://ringespana.es", RESEND_API_KEY: "k", MAIL_FROM: "Ring España <hola@ringespana.es>", CONTACT_EMAIL: "privacidad@ringespana.es", R2_ACCOUNT_ID: "c", R2_ACCESS_KEY_ID: "k", R2_SECRET_ACCESS_KEY: "s", R2_BUCKET: "videos", CREADOR_CORREO: "fundador@ringespana.es", ...extra }) as NodeJS.ProcessEnv;

describe("comprobación del entorno", () => {
  it("en desarrollo no exige nada", () => {
    expect(validateEnv({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toEqual({ errors: [], warnings: [] });
  });
  it("una configuración completa de producción es válida y sin avisos", () => {
    expect(validateEnv(prod())).toEqual({ errors: [], warnings: [] });
  });
  it("sin APP_URL o sin base de datos no arranca", () => {
    expect(validateEnv(prod({ APP_URL: "" })).errors.join()).toContain("APP_URL");
    expect(validateEnv(prod({ DATABASE_URL: "" })).errors.join()).toContain("DATABASE_URL");
    expect(validateEnv(prod({ APP_URL: "ringespana.es" })).errors.join()).toContain("http");
    // espacios o saltos de línea al final (un error típico al copiar la variable) romperían todos los enlaces de los correos
    for (const mala of ["https://ringespana.es ", "https://ringespana.es\n", "https://ring espana.es", "https://ringespana.es/ruta"]) expect(validateEnv(prod({ APP_URL: mala })).errors.join(), JSON.stringify(mala)).toContain("APP_URL");
    expect(validateEnv(prod({ APP_URL: "https://ringespana.es/" })).errors).toEqual([]);
  });
  it("con proveedor de correo hace falta el remitente", () => {
    expect(validateEnv(prod({ MAIL_FROM: "" })).errors.join()).toContain("MAIL_FROM");
  });
  it("sin proveedor de correo avisa, salvo que se pida el modo de registro en el log", () => {
    expect(validateEnv(prod({ RESEND_API_KEY: "" })).warnings.join()).toContain("proveedor de correo");
    expect(validateEnv(prod({ RESEND_API_KEY: "", MAIL_TRANSPORT: "log" })).warnings).toEqual([]);
  });
  it("sin almacén de vídeos avisa de que solo habrá enlaces; a medias, no arranca", () => {
    const sinR2 = prod({ R2_ACCOUNT_ID: "", R2_ACCESS_KEY_ID: "", R2_SECRET_ACCESS_KEY: "", R2_BUCKET: "" });
    expect(validateEnv(sinR2).warnings.join()).toContain("almacén de vídeos");
    expect(validateEnv(prod({ R2_BUCKET: "" })).errors.join()).toContain("almacén de vídeos");
  });
  it("avisa si no hay contacto de privacidad", () => {
    expect(validateEnv(prod({ CONTACT_EMAIL: "" })).warnings.join()).toContain("CONTACT_EMAIL");
    expect(validateEnv(prod({ CREADOR_CORREO: " " })).warnings.join()).toContain("CREADOR_CORREO");
  });
  it("avisa si APP_URL no usa https", () => {
    expect(validateEnv(prod({ APP_URL: "http://ringespana.es" })).warnings.join()).toContain("https");
    expect(validateEnv(prod({ APP_URL: "http://localhost:3111" })).warnings).toEqual([]);
  });
});
