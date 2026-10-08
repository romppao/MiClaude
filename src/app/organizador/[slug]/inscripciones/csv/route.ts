import { NextResponse } from "next/server";
import { db } from "../../../../../lib/common/db";
import { getUser } from "../../../../../lib/accounts/auth";
import { loginPath } from "../../../../../lib/common/paths";
import { PROVINCES } from "../../../../../lib/common/labels";
import { categoryLabel } from "../../../../../lib/common/disciplines";
import { ESTADOS_LISTA, REG_STATUS_LABEL, filtrarYOrdenar, numeroDeFiltro, parseEstadoLista, parseOrden } from "../../../../../lib/events/registrations";
import { solicitudesDeEvento } from "../../../../../lib/events/registrations-data";
import { APP_URL } from "../../../../../lib/common/mail";

export const dynamic = "force-dynamic";

/** Una celda de CSV: entre comillas, y sin que una hoja de cálculo la tome por una fórmula (empieza por =, +, - o @). */
const celda = (v: string | number | null | undefined) => {
  const t = v === null || v === undefined ? "" : String(v);
  return `"${(/^[=+\-@\t\r]/.test(t) ? `'${t}` : t).replace(/"/g, '""')}"`;
};

/**
 * La lista de solicitudes de un evento en CSV, con los mismos filtros y el mismo orden que la pantalla (para trabajarla en una hoja de
 * cálculo o imprimirla). Solo para su organizador o para la administración.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL(loginPath(`/organizador/${slug}/inscripciones`), request.url));
  const event = await db.event.findUnique({ where: { slug } });
  if (!event) return new NextResponse("No existe ese evento.", { status: 404 });
  if (event.organizerId !== user.id && user.role !== "ADMIN") return new NextResponse("Solo su organizador puede descargar esta lista.", { status: 403 });
  const q = new URL(request.url).searchParams;
  const val = (k: string) => q.get(k) ?? undefined;
  const provincia = val("provincia");
  const lista = filtrarYOrdenar(await solicitudesDeEvento(event), {
    estado: ESTADOS_LISTA[parseEstadoLista(val("estado"))], orden: parseOrden(val("orden")), texto: val("q")?.slice(0, 80) || undefined,
    weightClass: val("peso") || undefined, divisionId: val("division") || undefined, provincia: provincia && (PROVINCES as readonly string[]).includes(provincia) ? provincia : undefined,
    minCombates: numeroDeFiltro(val("mincomb")), maxCombates: numeroDeFiltro(val("maxcomb")), minEdad: numeroDeFiltro(val("minedad")), maxEdad: numeroDeFiltro(val("maxedad")), minPeso: numeroDeFiltro(val("minpeso")), maxPeso: numeroDeFiltro(val("maxpeso")),
  });
  const cabecera = ["Nombre", "Estado", "Gimnasio", "Provincia", "Edad", "Peso declarado (kg)", "Categoría", "Victorias", "Derrotas", "Empates", "Combates", "Aura", "Mensaje", "Tu respuesta", "Correo (si está aceptada)", "Fecha de la solicitud", "Ficha"];
  const filas = lista.map((r) => [r.nombre, REG_STATUS_LABEL[r.status], r.gimnasio, r.provincia, r.edad, r.weightKg === null ? "" : String(r.weightKg).replace(".", ","), categoryLabel(event.discipline, event.level, r.divisionId, r.weightClass), r.victorias, r.derrotas, r.empates, r.combates, r.aura, r.message, r.reply, r.correo, r.createdAt.toISOString().slice(0, 10), `${APP_URL}/peleadores/${r.slug}`]);
  // Separador «;» y marca BOM: así lo abre bien Excel en español; LibreOffice y Google Sheets también lo reconocen.
  const csv = "\uFEFF" + [cabecera, ...filas].map((f) => f.map(celda).join(";")).join("\r\n") + "\r\n";
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="solicitudes-${event.slug}.csv"`, "Cache-Control": "no-store" },
  });
}
