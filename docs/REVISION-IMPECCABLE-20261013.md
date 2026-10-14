# Auditoría Impeccable — PR #47 integrado con A1–A8 (13 de octubre de 2026)

- **Rama:** `claude/afilar-y-responsive-20261013`. Contiene el PR #47 de Codex más los commits `54a46e6` (A1–A8) y `96cd109` (corrección encontrada en esta auditoría).
- **Alcance:** los cambios responsive del PR #47:
  - cabecera y navegación;
  - noticias (`Noticias.tsx`, `PortadaNoticia.tsx`);
  - tarjetas (`Tarjetas.tsx`);
  - alternativas cuando falta la foto (`Foto.tsx`, `ProfileThumbnail.tsx`);
  - `globals.css` y `apariencia.ts`.

  Es una auditoría técnica y no rediseña nada: la marca Lona aprobada se conserva.
- **Contexto:** Impeccable 4.3.1 (`impeccable context`). No hay `PRODUCT.md` ni `DESIGN.md` en formato Impeccable, así que la autoridad visual es la implementación actual y `docs/DISENO.md`.

## Puntuación

| # | Dimensión | Nota | Hallazgo principal |
|---|---|---|---|
| 1 | Accesibilidad | 4 | axe (wcag2a, wcag2aa, wcag22aa): 0 infracciones en 24 combinaciones (6 páginas, 375 y 1440 px, tema claro y oscuro) |
| 2 | Rendimiento | 3 | Imágenes con `loading="lazy"` y `decoding="async"`; en esta pasada no se midió con Lighthouse |
| 3 | Responsive | 4 | `responsive.mjs`: 106 de 106, con 8 anchos (320–2560 px) y los 2 temas. Sin desbordes. Zonas táctiles de cabecera y navegación de 44 px o más |
| 4 | Temas | 4 | Tokens en los dos temas; el contraste aguanta en oscuro |
| 5 | Integridad de implementación | 4 | El detector de Impeccable no encuentra nada (0 hallazgos) en los 7 archivos del PR, ni tampoco después de la corrección |
| **Total** | | **19/20** | **Excelente: retoques menores** |

## Veredicto de integridad
**Aprobado.** El sistema es coherente con la marca Lona y el detector no encuentra nada. Se encontró y corrigió un fallo de implementación (P2).

## Hallazgos

### [P2] Icono de imagen rota sobre las iniciales en el listado de peleadores. CORREGIDO en `96cd109`
- **Dónde:** `src/app/components/ProfileThumbnail.tsx`, usado en `/peleadores`.
- **Impacto:** a cada peleador sin foto le aparecía el símbolo de imagen rota encima de sus iniciales. Daba aspecto de fallo.
- **Causa:** la ruta del avatar responde 204 cuando no hay foto. La imagen fallaba antes de la hidratación y `onError` no llegaba a dispararse.
- **Arreglo:** `ProfileThumbnail` usa ahora `Foto`, que también detecta la imagen que falló antes de hidratar.
- **Comprobación:** 9 de 9 tarjetas sin imagen rota, con captura de pantalla a 375 px.

### [P3] Imagen de noticia del seed que apunta a `httpbin.org/status/404`
Parece intencionada, para probar la alternativa. La alternativa funciona. No requiere acción.

### [P3] Insignia «N» de Next.js en desarrollo sobre la barra inferior
Solo aparece en el modo de desarrollo y no llega a producción.

## Ronda final, después de la corrección
- El detector de Impeccable sobre `ProfileThumbnail.tsx` y `Foto.tsx` devuelve `[]`.
- `BASE_URL=http://127.0.0.1:3217 node tests/browser/responsive.mjs` da 106 comprobaciones sin fallos.
- `tests/e2e/hidratacion.mjs` sale OK en todas las rutas, en las zonas horarias de Madrid y de Nueva York.
- `npm run typecheck` sale limpio; `vitest` pasa 695 de 697 (los 2 fallos son los conocidos de rutas de Windows en `multimedia.test.ts`).

## Lo que funciona bien
- Cabecera de una sola fila en móvil (logotipo y «Menú»). En escritorio, la navegación queda centrada.
- Tarjetas de noticias compactas: miniatura, fuente y antigüedad, título en dos líneas y la disciplina en lima.
- Los filtros pasan de línea sin romper la página.
- La ficha del peleador en móvil cabe entera: iniciales, nombre largo, insignias y cifras.

## Acciones recomendadas
1. **[P3] `/impeccable polish`:** solo si el fundador pide un pulido visual final antes del 1 de noviembre.
2. Crear `PRODUCT.md` y `DESIGN.md` en formato Impeccable (`/impeccable init` y `/impeccable document`) cuando se retome el diseño, para que las próximas auditorías tengan contexto propio.
