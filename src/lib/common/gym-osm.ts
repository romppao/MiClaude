/** Transformación pura de datos OSM. Se usa en el importador con Node strip-types y en pruebas, sin red ni base. */
type OsmElement = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
type ContactDiscipline = "BOXEO" | "MMA" | "JIUJITSU" | "K1" | "KICKBOXING" | "MUAYTHAI";
export const gymNameKey = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const safeWeb = (raw: string | undefined) => {
  try { const u = new URL(raw ?? ""); return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password ? u.href : null; } catch { return null; }
};

/** Provincia canónica de las etiquetas o de un área OSM que contenga las coordenadas. */
export function osmProvince(raw: string, provinces: string[]) {
  const aliases: Record<string, string> = { gerona: "Girona", lerida: "Lleida", alacant: "Alicante", castello: "Castellón", orense: "Ourense", "la coruna": "A Coruña", vizcaya: "Bizkaia", guipuzcoa: "Gipuzkoa", alava: "Álava", "illes balears": "Baleares", baleares: "Baleares", "islas baleares": "Baleares" };
  const key = gymNameKey(raw.replace(/^provincia de /i, ""));
  return provinces.find((p) => gymNameKey(p) === key) ?? aliases[key] ?? null;
}

/** Interpreta las áreas administrativas de Overpass is_in para el punto del gimnasio, sin aproximaciones por capital. */
export function osmAreaProvince(areas: { tags?: Record<string, string> }[], provinces: string[]) {
  return areas.flatMap((a) => [a.tags?.["name:es"], a.tags?.name]).filter((x): x is string => !!x).map((n) => osmProvince(n, provinces)).find((p) => p !== null) ?? null;
}

/** Descarta negocios ajenos y provincias excluidas. Datos sin provincia/disciplinas o contactos dudosos se conservan sin publicar. */
export function osmGymCandidate(el: OsmElement, province: string | null, excluded: (p: string) => boolean) {
  if (!["node", "way", "relation"].includes(el.type) || !Number.isSafeInteger(el.id) || el.id <= 0) return null;
  const t = el.tags ?? {}, name = t.name?.trim();
  if (!name || (province && excluded(province))) return null;
  const sports = gymNameKey([t.sport, t.martial_art, t.martial_arts].filter(Boolean).join(" "));
  const description = gymNameKey([name, t.sport, t.martial_art, t.martial_arts].filter(Boolean).join(" "));
  if (/\bfitboxing\b/.test(gymNameKey(name)) || /\b(yoga|pilates)\b/.test(description) && !/boxing|boxeo|jiu|mma|kickboxing|muay/.test(sports)) return null;
  const disciplines: ContactDiscipline[] = [];
  if (/boxing|boxeo/.test(description.replace(/kick ?boxing/g, ""))) disciplines.push("BOXEO");
  if (/\bmma\b|mixed martial|artes marciales mixtas/.test(description)) disciplines.push("MMA");
  if (/jiu|bjj|grappling|jujitsu/.test(description)) disciplines.push("JIUJITSU");
  if (/\bk ?1\b/.test(description)) disciplines.push("K1");
  if (/kick ?boxing/.test(description)) disciplines.push("KICKBOXING");
  if (/muay ?thai|thai ?boxing/.test(description)) disciplines.push("MUAYTHAI");
  if (!disciplines.length && !/martial|marciales|dojo/.test(description)) return null;
  const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
  const reasons: string[] = [];
  if (!province) reasons.push("Provincia por resolver");
  if (!disciplines.length) reasons.push("Disciplinas por comprobar");
  const city = t["addr:city"] || t["addr:town"] || t["addr:village"] || "";
  if (!city) reasons.push("Ciudad por comprobar");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) reasons.push("Coordenadas ausentes");
  const website = safeWeb(t.website || t["contact:website"]);
  const phoneRaw = (t["contact:phone"] || t.phone || "").replace(/[\s().-]/g, "");
  const emailRaw = (t["contact:email"] || t.email || "").toLowerCase().trim();
  // Solo fijo español y correo cuyo dominio coincide con la web del negocio. Lo demás requiere revisión y no se guarda públicamente.
  const phone = /^(?:\+34|0034)?[89]\d{8}$/.test(phoneRaw) ? phoneRaw : null;
  const host = website ? new URL(website).hostname.replace(/^www\./, "") : "";
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) && host && emailRaw.split("@")[1] === host ? emailRaw : null;
  if ((phoneRaw && !phone) || (emailRaw && !email) || t["contact:name"]) reasons.push("Contacto profesional por revisar; dato dudoso no publicado");
  const instagramRaw = safeWeb(t["contact:instagram"] || t.instagram);
  const instagram = instagramRaw && ["instagram.com", "www.instagram.com"].includes(new URL(instagramRaw).hostname) ? instagramRaw : null;
  return { name, city, province: province ?? "", address: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || null, phone, email, website, instagram, disciplines, source: "OSM" as const, sourceRef: `${el.type}/${el.id}`, sourceLicense: "ODbL-1.0", lat: Number.isFinite(lat) ? lat! : null, lng: Number.isFinite(lng) ? lng! : null, geoSource: "osm", status: reasons.length ? "PENDING" as const : "PUBLISHED" as const, reviewNote: reasons.join("; ") || null };
}
