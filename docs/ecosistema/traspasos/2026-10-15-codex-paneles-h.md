# Bloque H preparado para revisión

Fecha: 2026-10-15. Asistente: Codex.

## Objetivo y base

Continuar el encargo F → G → D → H de Claude, conservando el trabajo anterior y los textos legales y los arreglos T-016 de Claude (principal 0.15.0, `e4e1ea096acd6e062b3048adda6186f24bb9a367`). Base actualizada: D local `ac924c9`, remoto `6e6508df8a7f7922da453e407ac9eb4d18a260be`. Rama `codex/paneles-h-despues`. Los ajustes móviles están asignados a Antigravity; producción sigue en pausa.

## Cambios

- H1: campanita, lista privada paginada, acciones de lectura y productores internos; conservación de doce meses y borrado en cascada. Exportación propia y privacidad actualizadas.
- H2: vídeos del público de sus combates, referencia a highlights sin duplicar archivos, aviso al autor, retirada coherente del original, seguidores y tres comentarios de aura visibles.
- H3: peleadores públicos del gimnasio del entrenador y próximo combate.
- H4: propuesta RFC-002, sin interfaz ni migración activa; espera revisión de Claude.
- H5: competiciones y pendientes de federación, con acreditación activa y disciplinas autorizadas. El contador de títulos incluye fichas sin titular y excluye la propia cuenta.
- H6: lista única de moderación ordenada por prioridad, acciones en línea, paginación y anclas anteriores conservadas.

Archivos principales: schema y migración `20261014220000_avisos_y_videos`, `community/notifications.ts`, `actions/notifications.ts`, `/avisos`, layout, paneles, acciones productoras, `fighters/highlights.ts`, entrega de highlights, moderación, exportación y retención. Contratos detallados en `docs/AVISOS.md`; propuesta en RFC-002.

## Comprobaciones y límites

La versión anterior 0.14.4 pasó **801 pruebas unitarias en 51 archivos**, ejecutadas con un solo trabajador para evitar el timeout de contraseñas observado al comprobar F con carga concurrente; no se ampliaron límites de tiempo ni se quitaron pruebas. `tsc --noEmit` pasa. Esquema Prisma válido; catálogo 423, mapa 84 pantallas/93 acciones/32 tablas y versión 0.14.4 comprobados. La sintaxis de `paneles-avisos.mjs` pasa. Ese guion E2E está preparado, sin afirmar ejecución.

La compilación local de F se interrumpió por duración; no se ha ejecutado una compilación final de H. CI de G observado en curso (38677232306); no se declara aprobado ni se extrapola su resultado a H. La integración de F tuvo 743/744 unitarias en batería y 7/7 al repetir aisladamente contraseñas tras el timeout. Los errores de tipos de F procedían de rutas generadas de otras ramas; esta comprobación final de H sí termina correctamente.

No hay PostgreSQL local accesible ni aplicación de migraciones en datos reales. El acceso a Git por shell falla; se usa el conector para publicar cambios y se compara el árbol remoto con el árbol local. CI y revisión de Claude son necesarios antes de integrar. El recuento real OSM de D continúa pendiente; no se ha cargado inventario.


### Integración final 0.15.4 con T-016

Los cambios de Claude en #68 ya están incorporados. F conserva tarjetas adaptables y los filtros de privacidad de T-016. En D, la lista territorial de `territorio.ts` es la única fuente y `gym-policy.ts` la reutiliza; se conserva el rechazo de creación automática de gimnasios excluidos y la revisión de altas manuales. F/G/D/H se renumeran a 0.15.1/0.15.2/0.15.3/0.15.4.

Validación final: `tsc --noEmit` aprobado; **806/807 unitarias en 52 archivos**, con un timeout de la prueba de contraseña en este PC. Se repitió únicamente ese caso y pasó (1 aprobada, 6 no seleccionadas), sin cambiar su límite ni la implementación. Catálogo **425**, mapa 84/93/32 y versión 0.15.4 comprobados. No hay build final local, migración/paridad ni E2E/axe de esta integración; CI pendiente. No confundir los CI de los heads anteriores con los nuevos.

## Siguiente paso

Claude revisa el PR #71 de H y RFC-002; comprobar migración/paridad en base vacía y navegador/axe antes de integrar. F/G/D deben revisarse en orden. H4 solo continúa tras revisión explícita del modelo. Sin despliegue ni campañas de correo.
