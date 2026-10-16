---
description: Lanza una tarea por el flujo Claude + Codex (ejecutor, puertas, revisión) y decide con el informe
argument-hint: <ficha T-xxx.md | revisar> [crítico]
---

Sigue el flujo de la flota de Lona (`docs/RED-DE-SEGURIDAD.md`, apartado «El flujo Claude + Codex»). Argumentos recibidos: $ARGUMENTS

1. Si el argumento es una ficha `docs/tareas/T-….md`, ejecútala con `node scripts/flota.mjs todo <ficha>` (añade `--riesgo critico` si el segundo argumento es «crítico» o la ficha lo dice). Si no existe todavía, escribe antes la ficha con `docs/tareas/PLANTILLA-FLOTA.md`, con el objetivo, las reglas aprobadas, lo que está fuera de alcance y las pruebas exigidas.
2. Si el argumento es «revisar», haz solo la revisión de los cambios actuales: `node scripts/flota.mjs revisar` (con `--riesgo critico` si tocan dinero, permisos, datos personales o secretos).
3. Lee el informe de `docs/logs/flota/<T-xxx>/ronda-N/resumen.md`. **Verifica cada hallazgo leyendo el código antes de aceptarlo o descartarlo** (los revisores se equivocan). Decide: aprobar, otra ronda (máximo tres, con los hallazgos verificados como nueva ficha) o rechazar.
4. Si apruebas: pasa `npm run verificar` y los recorridos afectados (`npm run verificar -- --e2e --solo …`), guarda en una rama, sube la versión (`node scripts/version.mjs`), CHANGELOG, DIARIO y ESTADO, abre el PR y espera el CI.
5. Nunca fusiones sin el «sí» expreso del fundador ni con el CI en rojo. Cuéntale al fundador el resultado en español claro, sin tecnicismos.
