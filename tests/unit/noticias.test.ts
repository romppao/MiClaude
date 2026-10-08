import { describe, expect, it } from "vitest";
import { clasificar, decodificar, detectarDisciplinas, enEspanol, parseFeed, textoPlano, variar } from "../../src/lib/news/parse";
import { FUENTES_INICIALES, FUENTES_RETIRADAS, googleNoticias } from "../../src/lib/news/sources";
import { haceTiempo } from "../../src/lib/common/dates";

const AHORA = new Date("2026-10-08T12:00:00Z");

const RSS_AGREGADOR = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>"boxeo" - Google Noticias</title>
<item><title>Sandra Pérez retiene el título europeo en Valencia - Diario Deportivo</title><link>https://news.google.com/rss/articles/abc?oc=5</link><guid isPermaLink="false">abc</guid><pubDate>Wed, 08 Oct 2026 09:30:00 GMT</pubDate><description>&lt;a href="https://x"&gt;Sandra Pérez retiene el título europeo en Valencia&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font color="#6f6f6f"&gt;Diario Deportivo&lt;/font&gt;</description><source url="https://diario.example">Diario Deportivo</source></item>
<item><title><![CDATA[Crónica: noche de K-1 & kickboxing en Bilbao]]></title><link>https://medio.example/cronica</link><pubDate>Tue, 07 Oct 2026 20:00:00 +0200</pubDate><description><![CDATA[<p>Doce combates <b>amateur</b> y dos profesionales.</p>]]></description><media:content url="https://cdn.medio.example/foto.jpg" medium="image"/></item>
<item><title>Sin enlace</title><pubDate>Tue, 07 Oct 2026 20:00:00 GMT</pubDate></item>
<item><title>Enlace peligroso</title><link>javascript:alert(1)</link><pubDate>Tue, 07 Oct 2026 20:00:00 GMT</pubDate></item>
<item><title>Fecha imposible</title><link>https://medio.example/x</link><pubDate>ayer por la tarde</pubDate></item>
<item><title>Del futuro</title><link>https://medio.example/futuro</link><pubDate>Wed, 08 Oct 2036 09:30:00 GMT</pubDate></item>
</channel></rss>`;

const ATOM_YOUTUBE = `<?xml version="1.0" encoding="UTF-8"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
<link rel="self" href="http://www.youtube.com/feeds/videos.xml?channel_id=UC1"/><title>Canal</title>
<entry><id>yt:video:VID123</id><yt:videoId>VID123</yt:videoId><title>Resumen del combate estelar | Muay Thai</title><link rel="alternate" href="https://www.youtube.com/watch?v=VID123"/><published>2026-10-07T18:00:00+00:00</published><updated>2026-10-08T01:00:00+00:00</updated>
<media:group><media:title>Resumen</media:title><media:thumbnail url="https://i.ytimg.com/vi/VID123/hqdefault.jpg" width="480" height="360"/><media:description>Lo mejor de la noche.</media:description></media:group></entry>
</feed>`;

describe("lector de noticias (RSS y Atom)", () => {
  it("lee un agregador: quita el medio del titular, lo guarda aparte y limpia el HTML del resumen", () => {
    const [a, b, ...resto] = parseFeed(RSS_AGREGADOR, AHORA);
    expect(a).toMatchObject({ guid: "abc", url: "https://news.google.com/rss/articles/abc?oc=5", title: "Sandra Pérez retiene el título europeo en Valencia", publisher: "Diario Deportivo", imageUrl: null });
    expect(a.publishedAt.toISOString()).toBe("2026-10-08T09:30:00.000Z");
    expect(b).toMatchObject({ title: "Crónica: noche de K-1 & kickboxing en Bilbao", summary: "Doce combates amateur y dos profesionales.", guid: "https://medio.example/cronica", publisher: null });
    expect(b.imageUrl).toBeNull(); // dominio de imagen no permitido por la política de seguridad
    expect(b.publishedAt.toISOString()).toBe("2026-10-07T18:00:00.000Z");
    // Sin enlace, con enlace que no es http(s) o con fecha ilegible: se descartan. Una fecha futura se recorta a «ahora».
    expect(resto.map((x) => x.title)).toEqual(["Del futuro"]);
    expect(resto[0].publishedAt).toEqual(AHORA);
  });
  it("lee un canal de vídeo (Atom) con su miniatura", () => {
    const [v] = parseFeed(ATOM_YOUTUBE, AHORA);
    expect(v).toMatchObject({ guid: "yt:video:VID123", url: "https://www.youtube.com/watch?v=VID123", title: "Resumen del combate estelar | Muay Thai", summary: "Lo mejor de la noche.", imageUrl: "https://i.ytimg.com/vi/VID123/hqdefault.jpg" });
    expect(v.publishedAt.toISOString()).toBe("2026-10-07T18:00:00.000Z");
  });
  it("no se rompe con contenido que no es un canal", () => {
    expect(parseFeed("<html><body>No encontrado</body></html>", AHORA)).toEqual([]);
    expect(parseFeed("", AHORA)).toEqual([]);
  });
  it("decodifica entidades y quita etiquetas", () => {
    expect(decodificar("Tom &amp; Jerry &#8211; &#x41; &lt;b&gt; &desconocida;")).toBe("Tom & Jerry – A <b> &desconocida;");
    expect(textoPlano("&lt;p&gt;Hola&lt;/p&gt;   <i>mundo</i>")).toBe("Hola mundo");
  });
});

describe("disciplinas de cada noticia", () => {
  it("detecta la disciplina por palabras clave", () => {
    expect(detectarDisciplinas("La boxeadora vasca, campeona del CMB")).toEqual(["BOXEO"]);
    expect(detectarDisciplinas("Gala de kickboxing y K-1 en Málaga")).toEqual(["KICKBOXING", "K1"]);
    expect(detectarDisciplinas("Torneo de jiu jitsu brasileño")).toEqual(["JIUJITSU"]);
    expect(detectarDisciplinas("La UFC vuelve a Europa")).toEqual(["MMA"]);
    expect(detectarDisciplinas("Campeonato de boxeo tailandés")).toEqual(["MUAYTHAI"]);
    expect(detectarDisciplinas("Previa del partido de fútbol")).toEqual([]);
  });
  it("«kick boxing» y «thai boxing» no cuentan como boxeo", () => {
    expect(detectarDisciplinas("Velada de kick boxing en Alicante")).toEqual(["KICKBOXING"]);
    expect(detectarDisciplinas("Thai boxing championship")).toEqual(["MUAYTHAI"]);
    expect(detectarDisciplinas("Topuria defenderá su cinturón")).toEqual(["MMA"]);
  });
});

describe("cada noticia, solo en su disciplina (petición del fundador)", () => {
  const busqueda = { kind: "AGREGADOR", disciplines: ["BOXEO"] as const };
  const medioDeBoxeo = { kind: "PRENSA", disciplines: ["BOXEO"] as const };
  const general = { kind: "FEDERACION", disciplines: [] as const };
  const n = (title: string, summary: string | null = null) => ({ title, summary });
  it("una noticia de MMA que llega por la búsqueda de boxeo va a MMA, no a boxeo", () => {
    expect(clasificar({ ...busqueda, disciplines: ["BOXEO"] }, n("La UFC anuncia su gala en Madrid"))).toEqual(["MMA"]);
  });
  it("un titular que mezcla disciplinas no va a ninguna: solo a la portada común", () => {
    expect(clasificar({ ...busqueda, disciplines: ["BOXEO"] }, n("Noche de boxeo y MMA en Valencia"))).toEqual([]);
  });
  it("de una búsqueda, un titular que no nombra la disciplina no se asigna", () => {
    expect(clasificar({ ...busqueda, disciplines: ["BOXEO"] }, n("Gran noche en el Palacio de los Deportes"))).toEqual([]);
  });
  it("de un medio dedicado a una disciplina, se asigna aunque el titular no la nombre, salvo que el resumen hable de otra", () => {
    expect(clasificar({ ...medioDeBoxeo, disciplines: ["BOXEO"] }, n("Gran noche en el Palacio de los Deportes"))).toEqual(["BOXEO"]);
    expect(clasificar({ ...medioDeBoxeo, disciplines: ["BOXEO"] }, n("Gran noche en el Palacio", "Habrá también combates de kickboxing"))).toEqual([]);
  });
  it("de una fuente general, lo que no es de deportes de contacto se descarta", () => {
    expect(clasificar({ ...general, disciplines: [] }, n("La federación española de fútbol elige presidente"))).toBeNull();
    expect(clasificar({ ...general, disciplines: [] }, n("La Federación Española de Boxeo presenta el campeonato"))).toEqual(["BOXEO"]);
  });
});

describe("solo noticias en español", () => {
  it("acepta titulares en español y rechaza los que están en inglés", () => {
    expect(enEspanol("Sandra Fernández, campeona de Europa del peso pluma")).toBe(true);
    expect(enEspanol("El boxeador vasco gana por KO en el sexto asalto")).toBe(true);
    expect(enEspanol("Fighter wins the title after a five-round war")).toBe(false);
    expect(enEspanol("Highlights: the best knockouts of the night")).toBe(false);
  });
  it("un titular solo con nombres propios se acepta (todas las fuentes son en español)", () => {
    expect(enEspanol("Topuria - Holloway")).toBe(true);
  });
});

describe("variedad de medios en la portada", () => {
  it("un mismo medio no acapara las primeras posiciones", () => {
    const n = (clave: string, h: number) => ({ clave, publishedAt: new Date(Date.UTC(2026, 9, 8, h)) });
    const lista = [n("A", 10), n("A", 9), n("A", 8), n("A", 7), n("B", 6), n("C", 5)];
    expect(variar(lista, 5).map((x) => `${x.clave}${x.publishedAt.getUTCHours()}`)).toEqual(["A10", "A9", "B6", "C5", "A8"]);
  });
});

describe("fuentes iniciales", () => {
  it("son variadas (prensa, vídeo, varios medios y federaciones), cubren todas las disciplinas y no se repiten", () => {
    expect(new Set(FUENTES_INICIALES.map((f) => f.kind))).toEqual(new Set(["AGREGADOR", "VIDEO", "FEDERACION", "PRENSA"]));
    expect(new Set(FUENTES_INICIALES.flatMap((f) => f.disciplines))).toEqual(new Set(["BOXEO", "JIUJITSU", "K1", "KICKBOXING", "MMA", "MUAYTHAI"]));
    expect(new Set(FUENTES_INICIALES.map((f) => f.url)).size).toBe(FUENTES_INICIALES.length);
    for (const f of FUENTES_INICIALES) expect(f.url.startsWith("https://")).toBe(true);
  });
  it("no vuelven las retiradas (canales en inglés y búsquedas que mezclaban disciplinas)", () => {
    for (const f of FUENTES_INICIALES) expect(FUENTES_RETIRADAS).not.toContain(f.url);
    expect(FUENTES_RETIRADAS.some((u) => u.includes("UCvgfXK4nTYKudb0rFR6noLA"))).toBe(true); // UFC en inglés
  });
  it("las búsquedas de cada disciplina excluyen las demás", () => {
    const q = (n: string) => new URL(FUENTES_INICIALES.find((f) => f.name === n)!.url).searchParams.get("q")!;
    expect(q("Prensa española: boxeo")).toContain("-MMA");
    expect(q("Prensa española: boxeo")).toContain("-kickboxing");
    expect(q("Prensa española: MMA")).toContain("-boxeo");
  });
  it("buscan en español de España en la última semana", () => {
    const u = new URL(googleNoticias('"muay thai"'));
    expect(u.searchParams.get("q")).toBe('"muay thai" when:7d');
    expect([u.searchParams.get("hl"), u.searchParams.get("gl"), u.searchParams.get("ceid")]).toEqual(["es", "ES", "ES:es"]);
  });
});

describe("cuándo se publicó", () => {
  it("dice el tiempo en palabras", () => {
    expect(haceTiempo(new Date("2026-10-08T11:59:40Z"), AHORA)).toBe("Ahora");
    expect(haceTiempo(new Date("2026-10-08T11:30:00Z"), AHORA)).toBe("Hace 30 min");
    expect(haceTiempo(new Date("2026-10-08T07:00:00Z"), AHORA)).toBe("Hace 5 h");
    expect(haceTiempo(new Date("2026-10-07T07:00:00Z"), AHORA)).toBe("Ayer");
    expect(haceTiempo(new Date("2026-10-01T07:00:00Z"), AHORA)).toMatch(/^1 oct/);
  });
});
