# T-018 — El nombre de la aplicación en un solo sitio
**Nivel:** N1 (mecánica) · **Fase:** F1 (preparación del diseño) · **Estado:** lista · **Sugerida a:** Antigravity o Copilot (cada uno en su rama, ver `RANGOS.md`; el primero que la tome) · **Depende de:** —

## Objetivo (una frase)
Que el nombre de la aplicación («Ring España», provisional) esté escrito **una sola vez** en el código, para poder cambiarlo cuando el fundador tenga el nombre oficial.

## Contexto
Palabras del fundador (6 de octubre de 2026): «todavía no tengo un nombre oficial para la app». Hoy «Ring España» está escrito a mano en muchos archivos de `src/` (por ejemplo `layout.tsx`, `NavigationMenu.tsx`, `ayuda/page.tsx`, `buscar/page.tsx`, `global-error.tsx`, las acciones que envían correos y la exportación de datos de cuenta). Hay que localizarlos con `grep -rn "Ring España" src`.

## Pasos
1. Rama `<asistente>/T-018-nombre-app`.
2. Crear `src/lib/common/app.ts` con `export const NOMBRE_APP = "Ring España";` (y, si hace falta en el correo, `NOMBRE_APP_CORTO`). Nada más.
3. Sustituir cada aparición **en textos que ve una persona** (títulos de página, cabecera, pie, correos, avisos, exportación de datos, pantallas de error) por la constante. Respetar la gramática: por ejemplo `` `¿Cómo funciona ${NOMBRE_APP}?` ``. **No** tocar: documentación (`docs/`), comentarios, nombres de variables, mensajes de commit ni los identificadores internos (`Fighter`, etc.).
4. En componentes de cliente (`"use client"`), recibir el nombre por importación de la constante (es un valor estático: no hace falta pasarlo por propiedades).
5. Prueba unitaria `tests/unit/nombre-app.test.ts` que **falla si queda el texto «Ring España» escrito en `src/`** fuera de `src/lib/common/app.ts` (leer los archivos con `node:fs`, recorrer `src/` y comprobar). Debe fallar antes de tu cambio y pasar después.
6. `npm run typecheck`, `npm test`, `npm run test:e2e` y `npm run test:a11y` con base vacía (las pruebas de navegador que miran textos con el nombre deben seguir en verde: **si alguna lo comparaba con un texto escrito, actualízala para usar el mismo valor**, sin relajarla).
7. Documentar: `ARQUITECTURA.md` (una línea: «el nombre de la app vive en `lib/common/app.ts`»), `DIARIO.md`, `LECCIONES.md`, tu registro.

## Criterios de aceptación
- `grep -rn "Ring España" src` solo devuelve `src/lib/common/app.ts`.
- Cambiar la constante cambia el nombre en la cabecera, los títulos de página, los correos y la exportación de datos (comprobarlo cambiándola temporalmente y mirando la pantalla; devolverla a su valor).
- Ninguna prueba se ha saltado ni relajado; el CI en verde.

## No hacer
No cambiar el nombre real. No tocar el diseño ni los textos de producto más allá de sustituir el nombre. No cambiar la URL de la aplicación ni variables de entorno (`APP_URL`).

## Documentar
Lo indicado en el paso 7.
