function desfaseMin(zona: string, utcMs: number): number {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: zona, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  const comoUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((comoUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}
function aInstante(local: string, zona: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) throw new RangeError("formato no válido");
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d, h, mi));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d || h > 23 || mi > 59) throw new RangeError("fecha no válida");
  const conjetura = t.getTime();
  const o1 = desfaseMin(zona, conjetura - 86400000);
  const o2 = desfaseMin(zona, conjetura + 86400000);
  const validos = [o1, o2].map((o) => conjetura - o * 60000).filter((u) => desfaseMin(zona, u) === (conjetura - u) / 60000);
  return validos.length ? Math.min(...validos) : conjetura - o1 * 60000;
}
export function duracionEnMinutos(inicio: string, fin: string, zona = "Europe/Madrid"): number {
  const a = aInstante(inicio, zona);
  const b = aInstante(fin, zona);
  if (b < a) throw new RangeError("el fin es anterior al inicio");
  return Math.round((b - a) / 60000);
}
