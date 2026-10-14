import { dayKey } from "../common/dates";

/** Calendario público de día completo: no incluye nombres ni identificadores de asistentes. Escapa campos para impedir inyección ICS. */
export function eventCalendar(event: { id: string; name: string; date: Date; venue: string; city: string }, now = new Date()) {
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
  const start = dayKey(event.date).replace(/-/g, "");
  const end = dayKey(new Date(event.date.getTime() + 864e5)).replace(/-/g, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lona//Veladas//ES", "BEGIN:VEVENT", `UID:${escape(event.id)}@lona`, `DTSTAMP:${now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${escape(event.name)}`, `LOCATION:${escape(`${event.venue}, ${event.city}`)}`, "END:VEVENT", "END:VCALENDAR"];
  // RFC 5545: plegado por octetos sin partir caracteres UTF-8.
  return lines.map((line) => {
    let folded = "", bytes = 0;
    for (const char of line) {
      const size = Buffer.byteLength(char);
      if (bytes + size > 75) { folded += "\r\n "; bytes = 1; }
      folded += char; bytes += size;
    }
    return folded;
  }).join("\r\n") + "\r\n";
}
