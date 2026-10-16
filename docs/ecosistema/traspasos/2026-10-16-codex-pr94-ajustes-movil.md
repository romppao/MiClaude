# Codex — continuación de #94 tras el relevo de #95

- Fecha: 16-10-2026. Esfuerzo medio.
- Objetivo: conservar los tres ajustes móviles aprobados por Claude y retirar el ajuste global de tarjetas de Antigravity.
- Rama propia: `codex/pr94-ajustes-movil-20261016`; la rama ajena no se modifica.
- Base incorporada con merge: candidato de #95 `545018bfd4afe9129f47d9a541e592d5b32f788b`. Versión local: **0.20.2**.

## Cambios

- Se retiran `.card>strong`, el estilo del título de veladas y su caso unitario, exactamente como pidió Claude.
- Permanecen la portada móvil, el buscador/mapa de gimnasios y el botón de filtros de peleadores.
- Archivos de aplicación: `src/app/globals.css`, `src/app/gimnasios/page.tsx`, `src/app/peleadores/page.tsx`; prueba `tests/unit/ajustes-movil.test.ts`.
- Se conservan completas ambas historias del diario y las versiones 0.20.0/0.20.1; catálogo y mapa se regeneran.

## Comprobaciones

- `scripts/verificar.mjs`: tipos, **891 unitarias**, versión, catálogo (**470 archivos**) y mapa correctos.
- Documentación: **33/34**; Windows rechaza crear el enlace simbólico del caso restante (`EPERM`). No se altera ni omite la prueba. El CI de Linux deberá acreditarla.
- Next completó compilación, generación de páginas y tabla de rutas. El envoltorio PowerShell devolvió 1 al tratar una advertencia de Prisma como `NativeCommandError`; no se presenta como una ejecución con código 0.
- `git diff --check` correcto y ningún marcador de conflicto en los archivos resueltos.
- Sin recorridos locales con PostgreSQL: Docker no está accesible en esta sesión. Las capturas antiguas no validan la nueva integración.

## Pendiente

1. #95 fusionado como `a19d103` tras el CI completo 38914459030 en verde. Su árbol coincide con el candidato `545018b` integrado en esta rama.
2. Publicar la corrección de #94 desde la rama propia, comprobar CI completo y revisión independiente Luna antes de fusionar.
3. Comprobar la versión servida por `/salud`; la consulta directa está bloqueada en las herramientas actuales. Render exige confirmar el workspace, pregunta ya enviada al fundador.

Fuentes: comentarios de Claude en #94 (6216510663) y #95 (6217454092); logs locales en `MiClaude/docs/logs/pr94-*-20261016.log`.
