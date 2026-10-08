/**
 * Panorama español (petición del fundador, 8 de octubre de 2026): «las noticias tienen que ser del panorama español: deportistas españoles
 * o con residencia en España […] la principal idea de la aplicación es fomentar que la gente apoye a los nuestros y crear comunidad en
 * España, en cada comunidad autónoma, en cada municipio […] también españoles reconocidos a nivel mundial, pero principalmente esos
 * luchadores que todavía no tienen el apoyo suficiente».
 *
 * Una noticia es del panorama español si viene de una fuente marcada como «solo panorama español» (NewsSource.local: federaciones y
 * medios que solo cubren España) o si su titular o su resumen nombran España, una comunidad, una provincia o capital, una federación o
 * competición española, o a un peleador español de élite de esta lista. La lista se amplía aquí (y se documenta en docs/NOTICIAS.md).
 */

const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const PAIS = ["espana", "espanol", "espanola", "espanoles", "espanolas", "campeonato de espana", "campeon de espana", "campeona de espana", "seleccion espanola", "federacion espanola", "rfebox", "aebox", "fekm", "felucha", "real federacion espanola"];

const COMUNIDADES = ["andalucia", "andaluz", "andaluza", "aragon", "aragones", "aragonesa", "asturias", "asturiano", "asturiana", "baleares", "balear", "mallorca", "menorca", "ibiza", "canarias", "canario", "canaria", "tenerife", "gran canaria", "lanzarote", "fuerteventura", "cantabria", "cantabro", "cantabra", "castilla y leon", "castilla-la mancha", "castilla la mancha", "manchego", "cataluna", "catalunya", "catalan", "catalana", "extremadura", "extremeno", "extremena", "galicia", "gallego", "gallega", "madrid", "madrileno", "madrilena", "murcia", "murciano", "murciana", "navarra", "navarro", "pais vasco", "euskadi", "vasco", "vasca", "la rioja", "riojano", "riojana", "comunidad valenciana", "valencia", "valenciano", "valenciana", "ceuta", "melilla"];

// Provincias y capitales (sin las que dan muchos falsos positivos: «León» y «Córdoba» también son apellidos y ciudades de América).
const PROVINCIAS = ["alava", "vitoria", "albacete", "alicante", "almeria", "avila", "badajoz", "barcelona", "bilbao", "vizcaya", "bizkaia", "burgos", "caceres", "cadiz", "castellon", "ciudad real", "cuenca", "girona", "gerona", "granada", "guadalajara", "guipuzcoa", "gipuzkoa", "san sebastian", "donostia", "huelva", "huesca", "jaen", "a coruna", "la coruna", "lleida", "lerida", "logrono", "lugo", "malaga", "ourense", "orense", "oviedo", "gijon", "palencia", "pamplona", "pontevedra", "vigo", "salamanca", "santander", "segovia", "sevilla", "soria", "tarragona", "teruel", "toledo", "valladolid", "zamora", "zaragoza", "las palmas", "santa cruz de tenerife", "palma de mallorca"];

// Españoles (o residentes en España) reconocidos internacionalmente, para no perder sus noticias en medios internacionales.
const PELEADORES = ["topuria", "joel alvarez", "kiko martinez", "sandor martin", "jon fernandez"];

const patron = (lista: string[]) => new RegExp(`\\b(${lista.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`);
const SENALES = patron([...PAIS, ...COMUNIDADES, ...PROVINCIAS, ...PELEADORES]);

/** ¿Habla el texto del panorama español? */
export const nombraEspana = (texto: string) => SENALES.test(sinTildes(texto));

/** ¿Es una noticia del panorama español? Las fuentes marcadas como «solo panorama español» no necesitan comprobar cada titular. */
export function delPanoramaEspanol(fuente: { local: boolean }, e: { title: string; summary: string | null }): boolean {
  return fuente.local || nombraEspana(`${e.title} ${e.summary ?? ""}`);
}
