// Afilado tras la revisión del 13 de octubre de 2026 (bloque A del encargo): estado de un combate sin resultado (A5),
// titulares repetidos y diagnóstico de fuentes de noticias (A1) y enlaces de entradas solo con https (A8).
import { describe, expect, it } from "vitest";
import { estadoSinResultado } from "../../src/lib/bouts/status";
import { enlaceNormalizado, fusionarNoticias, tituloNormalizado } from "../../src/lib/news/deduplicate";
import { diagnosticoFuente } from "../../src/lib/news/diagnosis";
import { safeHttpsUrl } from "../../src/lib/common/url";

// Las veladas se guardan a las 12:00 UTC de su día (lib/common/dates.ts).
const velada = (dia: string) => ({ date: new Date(`${dia}T12:00:00Z`) });
const ahora = new Date("2026-10-13T10:00:00Z"); // 12:00 en Madrid

describe("estadoSinResultado: un combate futuro no sale como verificado", () => {
  it("antes del día de la velada es «Programado», tenga o no resultado anotado", () => {
    expect(estadoSinResultado({ result: null, event: velada("2026-10-20") }, ahora)).toBe("Programado");
    expect(estadoSinResultado({ result: "A_WIN", event: velada("2026-10-14") }, ahora)).toBe("Programado");
  });
  it("llegado el día sin resultado, queda «Resultado por anotar»", () => {
    expect(estadoSinResultado({ result: null, event: velada("2026-10-13") }, ahora)).toBe("Resultado por anotar");
    expect(estadoSinResultado({ result: null, event: velada("2026-09-01") }, ahora)).toBe("Resultado por anotar");
  });
  it("con resultado y el día alcanzado no añade estado (se muestra la verificación)", () => {
    expect(estadoSinResultado({ result: "DRAW", event: velada("2026-10-13") }, ahora)).toBeNull();
  });
  it("el día se cuenta en hora de Madrid: a las 00:30 del día de la velada ya ha llegado", () => {
    expect(estadoSinResultado({ result: null, event: velada("2026-10-14") }, new Date("2026-10-13T22:30:00Z"))).toBe("Resultado por anotar");
    expect(estadoSinResultado({ result: null, event: velada("2026-10-14") }, new Date("2026-10-13T21:30:00Z"))).toBe("Programado");
  });
});

describe("fusionarNoticias: un titular repetido sale una sola vez", () => {
  const n = (title: string, url: string, disciplines: string[] = [], imageUrl: string | null = null) => ({ title, url, disciplines, imageUrl });

  it("normaliza enlaces (ancla, utm_, fbclid, orden de parámetros y barra final) y títulos (tildes, mayúsculas, signos)", () => {
    expect(enlaceNormalizado("https://medio.es/noticia/?utm_source=x&b=2&a=1#arriba")).toBe(enlaceNormalizado("https://medio.es/noticia?a=1&b=2&fbclid=z"));
    expect(tituloNormalizado("¡Campeón de España!  Gana por KO")).toBe(tituloNormalizado("campeon de espana: gana por ko"));
  });
  it("fusiona por el mismo enlace normalizado, une disciplinas y aprovecha la foto disponible", () => {
    const r = fusionarNoticias([
      n("Velada en Valencia", "https://aebox.es/n/1?utm_medium=rss", ["BOXEO"]),
      n("Otra redacción del titular", "https://aebox.es/n/1", ["KICKBOXING"], "https://aebox.es/foto.jpg"),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].title).toBe("Velada en Valencia");
    expect(r[0].disciplines).toEqual(["BOXEO", "KICKBOXING"]);
    expect(r[0].imageUrl).toBe("https://aebox.es/foto.jpg");
  });
  it("fusiona por el mismo título normalizado aunque lo publiquen dos fuentes con enlaces distintos", () => {
    const r = fusionarNoticias([n("Gran velada en Bilbao", "https://aebox.es/a", ["BOXEO"]), n("GRAN VELADA EN BILBAO", "https://news.google.com/x", ["BOXEO"])]);
    expect(r).toHaveLength(1);
    expect(r[0].url).toBe("https://aebox.es/a");
  });
  it("fusiona duplicados transitivos y no toca titulares distintos", () => {
    const r = fusionarNoticias([n("A", "https://x.es/1"), n("B", "https://x.es/1"), n("b", "https://y.es/2"), n("Otra noticia", "https://z.es/3")]);
    expect(r.map((x) => x.title)).toEqual(["A", "Otra noticia"]);
  });
});

describe("diagnosticoFuente: explica solo lo registrado", () => {
  const f = (lastError: string | null, lastOkAt: Date | null = null) => ({ url: "https://ejemplo.es/feed", lastError, lastOkAt });

  it("sin error no hay diagnóstico", () => expect(diagnosticoFuente(f(null))).toBeNull());
  it("distingue si la fuente funcionó alguna vez", () => {
    expect(diagnosticoFuente(f("HTTP 503", new Date()))).toMatch(/^La fuente funcionó anteriormente\./);
    expect(diagnosticoFuente(f("HTTP 503"))).toMatch(/^Nunca se ha completado una lectura correcta\./);
  });
  it("un 503 no se presenta como bloqueo de IP confirmado", () => {
    const d = diagnosticoFuente(f("HTTP 503"))!;
    expect(d).toContain("503");
    expect(d).toContain("no permite confirmar un bloqueo de IP");
  });
  it("reconoce acceso denegado, canal retirado, respuesta no RSS y fallos de conexión", () => {
    expect(diagnosticoFuente(f("HTTP 403"))).toContain("deniega el acceso");
    expect(diagnosticoFuente(f("HTTP 404"))).toContain("no existe o ha sido retirada");
    expect(diagnosticoFuente(f("La respuesta es HTML, no RSS"))).toContain("no contiene noticias RSS/Atom válidas");
    expect(diagnosticoFuente(f("fetch failed"))).toContain("No se pudo completar la conexión");
  });
  it("cualquier otra causa se muestra tal cual quedó registrada", () => {
    expect(diagnosticoFuente(f("certificado caducado"))).toContain("Última causa registrada: certificado caducado");
  });
});

describe("safeHttpsUrl: el enlace de entradas debe usar https", () => {
  it("acepta https", () => expect(safeHttpsUrl("https://entradas.es/velada")).toBe("https://entradas.es/velada"));
  it("rechaza http aunque sea una dirección web válida", () => expect(safeHttpsUrl("http://entradas.es/velada")).toBeNull());
  it("rechaza esquemas peligrosos y texto suelto", () => {
    for (const u of ["javascript:alert(1)", "data:text/html,x", "ftp://x.es", "", "entradas.es"]) expect(safeHttpsUrl(u)).toBeNull();
  });
});
