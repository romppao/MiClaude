import { redirect } from "next/navigation";
import { getUser, requireVerifiedUser } from "./auth";
import { loginPath } from "../common/paths";
import { puedeOrganizar } from "./landing";

// Quién puede hacer qué: las guardas de permisos, en un solo sitio. Las usan por igual las acciones del servidor y las pantallas.
// (requireUser y requireVerifiedUser, que solo dependen de la sesión, están en ./auth.)
// Cuando una guarda deniega, la persona siempre termina en una pantalla que le explica qué ha pasado.

/** Solo moderación. Sin sesión lleva a «Entrar» (y vuelve a `next`); con otro rol, a la portada con el motivo. */
export async function requireAdmin(next = "/moderacion") {
  const u = await getUser();
  if (!u) redirect(loginPath(next));
  if (u.role !== "ADMIN") redirect("/?problema=solo_moderadores");
  return u;
}

/** Quien puede organizar veladas e interclubs (entidad aprobada, entrenador o moderación) con el correo electrónico verificado. */
export async function requireOrganizer() {
  const user = await requireVerifiedUser();
  if (!puedeOrganizar(user.role)) redirect("/organizador?problema=sin_permiso");
  return user;
}
