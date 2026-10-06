# T-017 — Ficha de peleador con el diseño «D»
**Nivel:** N3 · **Fase:** F4 · **Estado:** bloqueada hasta T-015 y T-016 · **Sugerida a:** Codex · **Depende de:** T-015, T-016

## Objetivo (una frase)
Que la ficha pública de un peleador (`/peleadores/[slug]`) tenga el aspecto de la maqueta [`referencia/D-awwwards-ring-3.html`](../diseno/referencia/D-awwwards-ring-3.html), **con los datos reales** de la aplicación y las correcciones de [`SISTEMA-D.md`](../diseno/SISTEMA-D.md) §3.

## Contexto
La maqueta muestra solo cuatro datos y tres deportes. La ficha real tiene más y **cada dato lleva su origen**. No se inventa ningún dato ni se pierde ninguno de los actuales. Reglas del fundador: móvil primero, español claro, cero enlaces muertos, una acción principal («Dar aura a este peleador»).

## Pasos
1. Rama `codex/T-017-ficha-d`. Usa solo los componentes de `src/app/ui/` (T-016) y el motor de temas (T-015); si falta un componente, **pídelo** en tu PR o en una propuesta: no lo improvises.
2. Composición (escritorio): fotografía del peleador (ver «Fotografías»), **palabras de fondo** con el deporte activo (`temas.ts`), y las tarjetas de cristal: **Categoría y nivel**, **Récord** (victorias, derrotas, empates y cómo terminaron) con **el origen de cada resultado** («Confirmado por el rival», «Respaldado por federación», «Declarado por el peleador»), **Aura** con su enlace «¿Cómo se calcula?», **Club** y **Próxima velada**.
3. Debajo: **Últimos combates** (lista), **Títulos y trayectoria** y **Seguir / Dar aura / Reclamar ficha** según permisos actuales (no cambiar permisos).
4. Móvil (390 px): foto arriba, tarjetas apiladas a todo el ancho, selector de deporte en una fila que se desplaza, sin parallax ni cursor.
5. Fichas ocultas, anónimas y de terceros siguen mostrando lo mismo que hoy (no publicar datos que hoy no se publican).
6. Si el peleador practica varias disciplinas: el deporte activo es el elegido por la persona; el selector permite cambiar entre las suyas.
7. Pruebas: `perfiles.mjs`, `flujo.mjs` y `enlaces.mjs` en verde; `tests/e2e/ficha-d.mjs` nuevo (los datos de la maqueta aparecen, el origen del récord es visible, sin desbordes a 390 px, tamaños mínimos); `test:a11y` con 0 incumplimientos graves o críticos; con JavaScript desactivado la ficha se lee entera.
8. Documentar: `DISENO.md`, `DIARIO.md`, `LECCIONES.md`, mapa funcional (en Linux o CI), tu registro.

## Fotografías
Mientras no haya fotos propias: **marcador** con las iniciales y el color de marca, no una foto de terceros. La foto real viene del almacén de imágenes de T-004 (recorte sin fondo y blanco y negro aplicados con CSS). **Prohibido** enlazar imágenes desde otros sitios.

## Criterios de aceptación
- Capturas en 390 y 1280 px de los tres deportes de la maqueta, comparadas con ella.
- Todos los datos que hoy muestra la ficha siguen presentes; el origen del récord es visible.
- Lista de revisión de `SISTEMA-D.md` §7 cumplida.

## No hacer
No cambiar datos, permisos ni reglas del aura. No usar fotos de terceros. No añadir dependencias.

## Documentar
Lo indicado en el paso 8.
