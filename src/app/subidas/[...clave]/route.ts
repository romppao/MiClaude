import { getUser } from "../../../lib/accounts/auth";
import { almacenDeVideos, carpetaEnDisco, claveDe, guardarEnDisco } from "../../../lib/media/storage";

export const dynamic = "force-dynamic";

/** Recibe un vídeo cuando el almacén es el disco del servidor (desarrollo, pruebas y demo). Con R2, el navegador sube directamente allí. */
export async function PUT(request: Request, { params }: { params: Promise<{ clave: string[] }> }) {
  const clave = (await params).clave.join("/");
  const user = await getUser();
  if (!user?.emailVerifiedAt) return new Response("Sin permiso", { status: 403 });
  const almacen = almacenDeVideos();
  const carpeta = carpetaEnDisco();
  if (almacen?.tipo !== "disco" || !carpeta) return new Response("No disponible", { status: 404 });
  if (!claveDe(clave, user.id)) return new Response("Sin permiso", { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > almacen.maxBytes) return new Response("Demasiado grande", { status: 413 });
  if (!request.body) return new Response("Vacío", { status: 400 });
  const bytes = await guardarEnDisco(carpeta, clave, request.body, almacen.maxBytes);
  return bytes ? new Response(null, { status: 201 }) : new Response("No se pudo guardar", { status: 400 });
}
