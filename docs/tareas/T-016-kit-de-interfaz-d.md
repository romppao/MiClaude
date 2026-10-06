# T-016 — Kit de interfaz «D» (variables y componentes)
**Nivel:** N3 · **Fase:** F4 · **Estado:** lista (la parte con movimiento queda detrás del [ADR-004](../decisiones/ADR-004-animacion-gsap-lenis.md)) · **Asignada a:** **Claude** · **Depende de:** —

## Objetivo (una frase)
Tener en `src/app/ui/` las variables de diseño y los componentes reutilizables del diseño «D» ([`SISTEMA-D.md`](../diseno/SISTEMA-D.md)), ya con las correcciones de accesibilidad, para que las pantallas (Codex) solo los compongan.

## Contexto
Referencia: [`referencia/D-awwwards-ring-3.html`](../diseno/referencia/D-awwwards-ring-3.html). La aplicación usa CSS propio (`src/app/globals.css`); **no se añade Tailwind**. T-015 (Codex) toca `layout.tsx` y la acción del tema; este kit **no** edita esos archivos: va en carpeta nueva (`src/app/ui/`) y en un archivo de estilos nuevo (`src/app/ui/diseno-d.css`) que `layout.tsx` importará cuando T-015 lo integre.

## Pasos
1. Rama `claude/T-016-kit-d`.
2. `src/app/ui/diseno-d.css`: variables (`--fondo #050505`, `--marca #BE33F5`, `--texto`, `--texto-2` (≥ 7:1), `--linea`, `--vidrio`, radios, sombras, escalas tipográficas con `clamp`) y clases de los componentes. Todo con `:focus-visible` por dentro (`outline-offset` negativo).
3. Componentes de servidor (sin JavaScript): `TarjetaCristal`, `Metrica` (valor ya escrito en el HTML + `data-objetivo`), `PalabrasDeFondo` (`aria-hidden`), `Etiqueta`, `PildoraDeporte`, `Boton` (principal violeta, secundario), `Campo` (etiqueta visible, ayuda, error con icono y texto), `AvisoEstado` (vacío, error, confirmación) y `FilaDeListado`.
4. Selector de deporte accesible `SelectorDeporte` (`radiogroup`, flechas, `aria-checked`) que **funciona como formulario sin JavaScript** (lo cablea T-015).
5. Tipografías con `next/font` (Syncopate 700 e Inter 300–800), alojadas por la aplicación.
6. **Cuando se apruebe el ADR-004:** `src/app/ui/movimiento/` (componentes de cliente, carga diferida): `Revelar`, `ContarHasta`, `Parallax`, `ScrollSuave`, `Cursor`. Cada uno **no hace nada** con `prefers-reduced-motion` y el cursor solo con `(pointer: fine)` sin ocultar el del sistema.
7. Página de pruebas interna `/diseno` (solo si `DEMO_MODE=si`; si no, 404) que muestra todos los componentes en los tres deportes, para revisar con capturas.
8. Pruebas: unitaria de contraste de cada par de variables (≥ 4,5:1; texto de apoyo ≥ 7:1), `tests/e2e/diseno.mjs` (la página `/diseno` sin desbordes a 390 px, zonas táctiles ≥ 44 px, ningún texto < 14 px, foco visible con teclado) y `test:a11y` con 0 incumplimientos graves o críticos.
9. Documentar: `DISENO.md`, `ARQUITECTURA.md`, `DIARIO.md`, `LECCIONES.md`, `APORTACIONES-CLAUDE.md`, mapa funcional (en Linux o CI).

## Criterios de aceptación
- Los componentes se ven como la maqueta en 390 y 1280 px (capturas comparadas).
- Los 12 puntos del §3 de `SISTEMA-D.md` cumplidos en el kit.
- Sin JavaScript todo se lee; con «reducir movimiento» no hay movimiento.
- Sin dependencias de la maqueta (Tailwind, CDN).

## No hacer
No tocar `layout.tsx` ni `globals.css` (los toca T-015/Codex). No instalar GSAP ni Lenis antes de que se apruebe el ADR-004. No usar fotos de terceros ni enlazadas.

## Documentar
Lo indicado en el paso 9.
