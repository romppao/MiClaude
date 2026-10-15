import { db } from "../../../../lib/common/db";
import { eventCalendar } from "../../../../lib/events/calendar";

/** Descarga pública de una velada publicada. Nunca exporta datos de asistencia. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.event.findFirst({ where: { slug, status: { in: ["SCHEDULED", "COMPLETED"] } }, select: { id: true, name: true, date: true, venue: true, city: true } });
  if (!event) return new Response("Velada no encontrada", { status: 404 });
  return new Response(eventCalendar(event), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="velada.ics"', "Cache-Control": "no-store" } });
}
