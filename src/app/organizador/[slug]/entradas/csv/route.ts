import { NextResponse } from "next/server";
import { db } from "../../../../../lib/common/db";
import { getUser } from "../../../../../lib/accounts/auth";
import { loginPath } from "../../../../../lib/common/paths";
import { ESTADO_ENTRADA, parseFiltroReservas, reservasDeVelada } from "../../../../../lib/events/entradas";

export const dynamic = "force-dynamic";

/** Una celda de CSV: entre comillas, y sin que una hoja de cálculo la tome por una fórmula (como en la lista de solicitudes). */
const celda = (v: string | number | null | undefined) => {
  const t = v === null || v === undefined ? "" : String(v);
  return `"${(/^[=+\-@\t\r]/.test(t) ? `'${t}` : t).replace(/"/g, '""')}"`;
};
const fechaHora = (d: Date | null) => (d ? d.toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "short", timeStyle: "short" }) : "");

/** Las reservas de entradas de una velada en CSV (para imprimir la lista de la puerta). Solo para su promotora o la administración. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL(loginPath(`/organizador/${slug}/entradas`), request.url));
  const event = await db.event.findUnique({ where: { slug }, select: { id: true, slug: true, organizerId: true } });
  if (!event) return new NextResponse("No existe ese evento.", { status: 404 });
  if (event.organizerId !== user.id && user.role !== "ADMIN") return new NextResponse("Solo su organizador puede descargar esta lista.", { status: 403 });
  const q = new URL(request.url).searchParams;
  const lista = await reservasDeVelada(event.id, parseFiltroReservas(q.get("estado") ?? undefined), q.get("q") ?? undefined);
  const cabecera = ["Código", "Estado", "Nombre", "Correo", "Entradas", "Total (€)", "Señal (€)", "En la puerta (€)", "Reservada", "Plazo de la señal", "Confirmada", "Validada", "Cancelada"];
  const filas = lista.map((r) => [r.code, ESTADO_ENTRADA[r.status], r.user.name, r.user.email, r.quantity, r.totalEuros, r.depositEuros, r.totalEuros - r.depositEuros, fechaHora(r.createdAt), fechaHora(r.depositUntil), fechaHora(r.confirmedAt), fechaHora(r.checkedInAt), fechaHora(r.cancelledAt)]);
  const csv = "﻿" + [cabecera, ...filas].map((f) => f.map(celda).join(";")).join("\r\n") + "\r\n";
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="entradas-${event.slug}.csv"`, "Cache-Control": "no-store" },
  });
}
