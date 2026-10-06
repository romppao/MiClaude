# Aportaciones de Claude y relevo para el resto del equipo

Registro de Claude (Claude Code en la nube). Formato y reglas comunes en [`EQUIPO.md`](EQUIPO.md). Lo anterior al 6 de octubre de 2026 está en `DIARIO.md`, `LECCIONES.md` y `TRASLADO.md`; este fichero resume lo esencial y deja el relevo.

## Qué ha hecho Claude en el proyecto (resumen)

- **Estructura y organización (1 oct):** acciones por dominio (`src/app/actions/*`), lógica por dominio (`src/lib/*`), reglas de dependencias comprobadas (`tests/unit/arquitectura.test.ts`), autorización de **todas** las acciones comprobada (`tests/unit/autorizacion.test.ts`: toda acción nueva debe clasificarse), mapa funcional generado (`npm run mapa`).
- **Seguridad y robustez:** límites de intentos reservados antes del cálculo, decisiones condicionadas al estado leído, IP del cliente desde el proxy de confianza, middleware que limpia parámetros hostiles, borrado de datos completo.
- **Pruebas por personas y revisión de código** (ver `docs/pruebas/hallazgos-2026-10-01.md`): corregidos los hallazgos reproducidos; segunda tanda: doble envío, avisos al rival, quitar combate, cartel editable, fichas sin callejones.
- **Demo alojada (2 oct):** `render.yaml`, `scripts/arranque-demo.sh`, modo demostración (`DEMO_MODE=si`: confirmar correo y cambiar de papel).
- **Categorías de peso por disciplina y nivel (2 oct):** fuentes en `DISENO-PESOS.md` (luego ampliadas por Codex con edad y sexo).
- **Revisión del trabajo de Codex (6 oct):** ejecutada desde cero con base vacía: tipos, 406 unitarias, compilación, 16 guiones de navegador y axe, todo en verde; ver `DIARIO.md`.

## 6 de octubre de 2026 — enlaces muertos, cabecera y móvil

**Pedido por el fundador:** «no puede haber botones ni enlaces inservibles […] mejor quítalo»; «nos tenemos que enfocar al mil por mil en cómo funciona la aplicación en dispositivos móviles»; «documentad todo para mantenernos comunicados».
**Base:** `1d0f6d7` (rama `claude/ring-espana-mvp`). **Rama de trabajo:** la misma (pequeñas correcciones directas; CI en cada push).
**Qué cambié y por qué:**
- Cabecera de escritorio: los 5 enlaces se apilaban en vertical junto al botón «Menú» (`nav` con `flex:1` y `wrap` se encogía); ahora no se encoge y la cuenta y el buscador pasan a una segunda línea en pantallas estrechas (`globals.css`).
- «Quitar filtros» solo aparece con filtros activos (`BotonesFiltro` pide `hayFiltros`); el aviso de ránking vacío ya no enlaza a la misma pantalla.
- Textos: «Grupo de edad y categoría sin confirmar» → «Edad y categoría sin indicar».
- **Auditorías nuevas dentro de `test:e2e`:** `enlaces.mjs` (enlaces y botones muertos, por papel) y `movil.mjs` (iPhone/Android emulados: desbordes, zonas táctiles de 44 px, letra de 16 px, zoom, barra inferior).
- Móvil: ayudas de campo de 15 → 16 px, margen inferior para la barra fija, «Entra para seguir / dar aura» pasan a botón táctil, enlaces de las tablas apiladas con 44 px de alto.
**Qué ejecuté yo:** tipos, 406 unitarias, compilación y batería completa con **base vacía** (resultado en `DIARIO.md`). **Solo lo valida el CI:** nada relevante; no puedo ejecutar WebKit (Safari) ni dispositivos reales.
**Sin causa conocida:** el fallo intermitente de `flujo.mjs` («ficha sin titular con tu nombre») no se ha reproducido en 11 arranques en frío; Codex reporta el mismo síntoma en el CI (run 83). Si vuelve a salir: bajar el artefacto de capturas del CI y mirar el HTML antes de tocar nada.
**Qué debe hacer el siguiente asistente:**
1. Conciliar PR #13 (móvil, de Codex/Work) con `NavigationMenu` y volver a pasar `movil.mjs`; no duplicar menú.
2. Cerrar PRs obsoletos: #9 (ya incluido en #10) y las 5 propuestas de Dependabot con saltos mayores que fallan el CI (Next 16, Prisma 7, TypeScript 7; la regla del proyecto es TypeScript 5.x).
3. PWA: manifiesto, iconos, `theme-color`, página sin conexión (ver `MOVIL.md`).
4. Escalabilidad antes del diseño: fotos de perfil fuera de PostgreSQL (almacenamiento de objetos + CDN), caché de páginas públicas (hoy casi todo es `force-dynamic`), cola de correos, base de datos gestionada con copias y prueba de restauración, prueba de carga.
**Decisiones del fundador abiertas:** ver `TRASLADO.md` §7 y `PULIDO-FUNCIONAL.md` (menores, aura, correo/responsable, paneles A/B/C al registrarse, almacenamiento de fotos, camino hacia las tiendas).
