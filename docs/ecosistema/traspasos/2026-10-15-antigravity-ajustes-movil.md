# Traspaso: Cuatro ajustes de presentación móvil (375 px) en Lona

- **Fecha:** 15-10-2026.
- **De:** Antigravity.
- **Para:** Claude Code / Fundador.
- **Rama:** `antigravity/ajustes-movil` (commit `835d815`).
- **Base:** `origin/claude/ring-espana-mvp` (0.18.9 / PR #92).
- **Versión resultante:** `0.18.10`.

---

## 1. Objetivo y alcance

Dar cumplimiento al encargo `2026-10-15-claude-encargo-antigravity-ajustes-movil.md` de Claude Code, resolviendo los 4 desajustes visuales identificados en la auditoría de demo en pantalla móvil de 375 × 667 px (iPhone SE), garantizando cero regresiones en escritorio (1280 px) y ciñéndose estrictamente a cambios de presentación (CSS y marcado mínimo de las cuatro pantallas).

---

## 2. Cambios realizados

1. **Portada (`/`):**
   - En `src/app/globals.css`, bajo `@media (max-width: 720px)`, se fijó `.portada-visita { min-height: 400px; padding-bottom: 14px; gap: 10px }` y `.portada-visita .lema-portada { font-size: 16px; line-height: 1.35 }`.
   - **Resultado:** El subtítulo («Tu comunidad de deportes de contacto en toda España») se lee completo en la primera pantalla a 375 × 667 px antes de hacer scroll, situado holgadamente por encima del degradado de `.mobile-nav`. En escritorio conserva la maquetación original intacta.

2. **Gimnasios (`/gimnasios`):**
   - En `src/app/globals.css`, se asignó `scroll-margin-top: 96px` a `.mapa-gimnasios` y `position: relative` a `form.search`. En `src/app/gimnasios/page.tsx` se añadió margen inferior (`marginBottom: 28`) al formulario.
   - **Resultado:** Al desplazarse al mapa, el botón verde «Aplicar filtros» queda con suficiente margen libre (42 px) y no aparece cortado horizontalmente por detrás de la cabecera fija.

3. **Veladas (`/veladas`):**
   - En `src/app/globals.css`, se definió `.card>strong { display: block; margin: 6px 0 2px }`, y en `src/app/veladas/page.tsx` se especificó `<strong style={{ display: "block", marginTop: 6, marginBottom: 2 }}>{e.name}</strong>`.
   - **Resultado:** Títulos cortos como «Yess» se muestran siempre en su propia línea debajo de las etiquetas descriptivas («Inscripción abierta»), eliminando el apelotonamiento horizontal.

4. **Peleadores (`/peleadores`):**
   - En `src/app/peleadores/page.tsx`, se reordenó el componente `<BotonesFiltro>` antes del contenedor `<MasFiltros>`.
   - **Resultado:** Al pulsar en «Más filtros», el botón «Aplicar filtros» queda visible de inmediato en la parte superior sin requerir scroll en móvil de 375 px, manteniendo un único botón en el formulario para satisfacer la invariante de usabilidad (`count() === 1`).

---

## 3. Archivos modificados y pruebas

- `src/app/globals.css`
- `src/app/gimnasios/page.tsx`
- `src/app/veladas/page.tsx`
- `src/app/peleadores/page.tsx`
- `tests/unit/ajustes-movil.test.ts` (nueva suite de verificación)
- `package.json` y `package-lock.json` (subida de parche a 0.18.10)
- `CHANGELOG.md`
- `docs/DIARIO.md`
- `docs/ESTADO.md`
- `docs/catalogo-codigo.json` y `docs/mantenimiento/CATALOGO.md`
- `docs/MAPA-FUNCIONAL.md`

### Comprobaciones ejecutadas con éxito:
- `npm run typecheck`: 0 errores de tipado.
- `npm test`: 59 suites ejecutadas, 848 unit tests pasando al 100%.
- `node scripts/version.mjs comprobar`: comprobada coherencia de versión 0.18.10.
- `node scripts/generar-catalogo.mjs --comprobar`: catálogo de 448 archivos al día.
- `node scripts/generar-mapa.mjs --comprobar`: mapa funcional al día.
- Capturas de pantalla generadas y verificadas en `docs/logs/antigravity-ajustes-movil/` para las 4 pantallas tanto a 375 px como a 1280 px (antes vs después). Cero impacto negativo en escritorio.

---

## 4. Limitaciones y siguiente paso

- Los cambios se encuentran confirmados localmente en el commit `835d815` de la rama `antigravity/ajustes-movil`.
- De acuerdo con las instrucciones de Claude Code y las reglas persistentes de seguridad, **no se ha realizado push ni fusión a la rama principal**.
- Queda listo para que Claude Code o el fundador autoricen el push y revisión del PR correspondiente.
