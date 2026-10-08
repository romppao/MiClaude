import { getUser } from "../../lib/accounts/auth";
import { HORA, addHit, isBlocked } from "../../lib/accounts/ratelimit";
import { TIPOS_DE_VIDEO, almacenDeVideos, nuevaClave } from "../../lib/media/storage";
import { hasOwn } from "../../lib/common/safe";

export const dynamic = "force-dynamic";

const error = (status: number, mensaje: string) => Response.json({ error: mensaje }, { status });

/**
 * Pide permiso para subir un vídeo: devuelve a dónde subirlo (R2 con una dirección firmada, o este mismo servidor en desarrollo y en la
 * demo). El vídeo se publica después con el formulario, que comprueba que la subida existe y es de quien la publica.
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return error(415, "Petición no válida.");
  const user = await getUser();
  if (!user) return error(401, "Tu sesión ha caducado. Vuelve a entrar para subir el vídeo.");
  if (!user.emailVerifiedAt) return error(403, "Confirma tu correo electrónico para poder subir vídeos.");
  const almacen = almacenDeVideos();
  if (!almacen) return error(503, "Ahora mismo no se pueden subir vídeos a Ring España. Pega un enlace de YouTube, Instagram o TikTok.");
  const datos = (await request.json().catch(() => null)) as { tipo?: unknown; bytes?: unknown } | null;
  const tipo = typeof datos?.tipo === "string" ? datos.tipo : "";
  const bytes = typeof datos?.bytes === "number" ? datos.bytes : 0;
  if (!hasOwn(TIPOS_DE_VIDEO, tipo)) return error(400, "Formato no admitido: sube un vídeo MP4, MOV o WebM.");
  if (!(bytes > 0)) return error(400, "El vídeo está vacío.");
  if (bytes > almacen.maxBytes) return error(413, `El vídeo pesa demasiado: el máximo es ${Math.round(almacen.maxBytes / 1024 / 1024)} MB. Recórtalo o pega un enlace.`);
  const clave = `subida:${user.id}`;
  if (await isBlocked(clave, 30, 24 * HORA)) return error(429, "Has subido muchos vídeos hoy. Vuelve a intentarlo mañana.");
  await addHit(clave);
  const videoKey = nuevaClave(user.id, tipo);
  return Response.json({ clave: videoKey, ...almacen.subida(videoKey, tipo), maxBytes: almacen.maxBytes });
}
