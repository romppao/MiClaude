import { createHash, createHmac } from "node:crypto";

/**
 * Firma de direcciones temporales («URL prefirmadas») con AWS Signature Version 4, el estándar que admiten Cloudflare R2, Amazon S3,
 * Backblaze B2 y otros almacenes compatibles. Sin dependencias: así se puede cambiar de proveedor sin tocar el código (petición del
 * fundador: herramientas de mínimo coste y fáciles de cambiar). Probado con el ejemplo oficial de la documentación de AWS.
 */
export type Credenciales = { accessKeyId: string; secretAccessKey: string; region: string };

/** Codificación de la especificación (RFC 3986): como encodeURIComponent, pero también ! ' ( ) *. */
export const codificar = (t: string) => encodeURIComponent(t).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const sha256 = (t: string) => createHash("sha256").update(t, "utf8").digest("hex");
const hmac = (clave: Buffer | string, t: string) => createHmac("sha256", clave).update(t, "utf8").digest();

export function presignar(o: { metodo: "GET" | "PUT" | "HEAD" | "DELETE"; url: string; credenciales: Credenciales; fecha?: Date; segundos: number; consulta?: Record<string, string> }): string {
  const u = new URL(o.url);
  const amz = (o.fecha ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dia = amz.slice(0, 8);
  const ambito = `${dia}/${o.credenciales.region}/s3/aws4_request`;
  const params: Record<string, string> = {
    ...o.consulta,
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${o.credenciales.accessKeyId}/${ambito}`,
    "X-Amz-Date": amz,
    "X-Amz-Expires": String(o.segundos),
    "X-Amz-SignedHeaders": "host",
  };
  const consulta = Object.keys(params).sort().map((k) => `${codificar(k)}=${codificar(params[k])}`).join("&");
  const ruta = u.pathname.split("/").map((s) => codificar(decodeURIComponent(s))).join("/");
  const peticion = [o.metodo, ruta, consulta, `host:${u.host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const aFirmar = ["AWS4-HMAC-SHA256", amz, ambito, sha256(peticion)].join("\n");
  let clave = hmac(`AWS4${o.credenciales.secretAccessKey}`, dia);
  for (const parte of [o.credenciales.region, "s3", "aws4_request"]) clave = hmac(clave, parte);
  const firma = createHmac("sha256", clave).update(aFirmar, "utf8").digest("hex");
  return `${u.protocol}//${u.host}${ruta}?${consulta}&X-Amz-Signature=${firma}`;
}
