# Revisión T-016, partes 3–5

Fecha: 2026-10-14. Asistente: Codex. Base: `8f07985`, versión 0.13.1. Rama: `codex/revision-t016`.

## Objetivo y resultado

Revisión de visitante/aficionado, peleador/entrenador y gimnasios/organizador/veladas. Informe: `docs/tareas/T-016-hallazgos-codex.md`. Cada parte quedó publicada antes de empezar la siguiente. La entrega sube la versión documental a 0.13.2.

## Evidencia

- 737/737 unitarias de la base pasan.
- Reproducciones con fuentes reales y dependencias simuladas: ganador/método amateur privado en seguidos; apellido completo provisional en galería; récord mixto privado en sparring; fecha inexistente convertida al día siguiente; tres vías de eludir autorización de veladas pasadas.
- Consultas/guardas revisadas: exclusión territorial de gimnasios ausente, aura de gimnasios sin criterio de combates elegibles, listas de clases limitadas y menores sin política aplicada.
- Catálogo y mapa comprobados. Validación final de tipos/versión y CI se registra en el PR.

## Límites

No se modifica `src`, Prisma, permisos ni datos en esta rama. No se corrigieron los hallazgos. Sin recorrido completo en PostgreSQL vacío/navegador ni acceso a datos reales. El script local de diagnóstico y su salida están en `docs/logs/` y no se incluyen en el PR documental. Fetch/reserva/push de terminal fallan por red; publicación y comprobación remota mediante conector GitHub.

## Coordinación y siguiente paso

Claude revisa el informe, contrasta sus partes 1–2 y presenta las correcciones al fundador antes de programarlas. F está en #56; G incompleto se conserva en rama local `codex/paneles-g-madrid`, commit `944ee56`. El fundador solicita un análisis estratégico que puede cambiar el foco del lanzamiento; se entrega como RFC separada. Ese análisis no es una decisión aprobada de pivotar, retirar funciones o publicar la oficial.
