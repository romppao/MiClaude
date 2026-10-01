import { NextResponse, type NextRequest } from "next/server";

/**
 * Limpieza de la dirección antes de que llegue a ninguna pantalla (un solo sitio para toda la aplicación):
 *  - «constructor» como nombre de parámetro rompe el servidor: Next.js entrega `searchParams` como una promesa a la que añade
 *    cada parámetro como propiedad propia, y ese nombre sustituye el de la propia promesa («TypeError: The .constructor
 *    property is not an object», error 500 en todas las pantallas con filtros);
 *  - un parámetro repetido (`?token=a&token=b`) llega a las pantallas como una lista en vez de un texto y las hace fallar:
 *    se conserva solo el primer valor;
 *  - un carácter nulo (`%00`) en un valor hace fallar a PostgreSQL: se elimina.
 * El resto de la dirección se conserva tal cual.
 */
const PARAMETROS_PELIGROSOS = new Set(["constructor"]);

/** Devuelve la cadena de parámetros limpia, o `null` si ya estaba limpia. */
export function limpiarParametros(search: URLSearchParams): string | null {
  const limpia = new URLSearchParams();
  for (const [clave, valor] of search) {
    if (PARAMETROS_PELIGROSOS.has(clave) || limpia.has(clave)) continue;
    limpia.set(clave, valor.replace(/\u0000/g, ""));
  }
  const texto = limpia.toString();
  return texto === search.toString() ? null : texto;
}

export function middleware(request: NextRequest) {
  const limpia = limpiarParametros(request.nextUrl.searchParams);
  if (limpia === null) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.search = limpia;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
