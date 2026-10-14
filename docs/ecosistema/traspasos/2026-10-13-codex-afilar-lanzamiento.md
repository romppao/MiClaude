# Traspaso Codex — afilar antes del lanzamiento

**Fecha:** 13 de octubre de 2026

**Base:** PR #48, `claude/afilar-y-responsive-20261013`, commit `03233fc7878bcf4c9cba9706e0efbd193b67d241` (responsive, A1–A8, corrección de `ProfileThumbnail` e informe Impeccable).

**Pila:** #48 → #50 `codex/afilar-b-20261013` (0.11.0) → #51 `codex/afilar-c-20261013` (0.11.1). El #49 se cerró sin fusionar porque duplicaba A1–A8 ya incorporados en #48.
**Objetivo:** completar B1–B3 y C sobre la versión responsive revisada, sin rediseñar ni publicar la demo.

## Qué incluye

- A1–A8, responsive y revisión Impeccable están en la base #48; se conserva Marca boxeo/MMA y la retirada de FEKM/MMA España. La RFC de RSS directos sigue siendo propuesta, sin nuevas fuentes.
- **B1:** las veladas pasadas requieren autorización moderadora con nota, auditoría y aviso por correo; hasta decidir no se publican ni cuentan para récord/ránking. Incluye migración aditiva y cola de moderación.
- **B2:** se conserva el récord amateur oculto por defecto en las vistas públicas revisadas. Los organizadores lo ven en solicitudes para participar. Sigue pendiente decidir si moderación puede consultar el detalle; no se cambian permisos. La política sobre menores también sigue abierta.
- **B3:** las declaraciones con resultado cuentan 24 horas después de `Bout.createdAt`, salvo disputa o revisión; confirmación/verificación anticipada cuenta inmediatamente. Se muestra la fecha de inclusión, se explica antes y después de enviar, y no requiere tareas programadas. La migración recupera fechas del historial o usa una fecha histórica para los registros antiguos.
- C actualiza CHANGELOG, DIARIO, LECCIONES, decisiones, mapa, catálogo y este traspaso. Se excluye `next-env.d.ts` del catálogo y el generador del mapa identifica páginas con `path.basename` para funcionar también en Windows.

## Comprobaciones locales tras el rebase

| Comprobación | Resultado |
|---|---|
| `npm.cmd run typecheck` | Pasa en el checkout actual. |
| `npm.cmd test` | 710/710 pruebas, 44 archivos. |
| Catálogo | 368 archivos; generación y `--comprobar` pasan. |
| Mapa funcional | 75 pantallas, 83 acciones y 29 tablas; generación y `mapa:comprobar` pasan. |
| `node --test tests/documentacion/catalogo.test.mjs` | 10/11: las pruebas de catálogo y normalización pasan; la de enlaces simbólicos recibe `EPERM` en Windows. En CI Linux pasaron las 11. |
| `git diff --check` | Pasa. |
| E2E, a11y, build y PostgreSQL | Pendientes de la CI; no se declaran ejecutados localmente. |

## Pendiente

1. #50 apunta a #48 y #51 a #50; ambos siguen en borrador. La base B se actualizó para normalizar huellas entre Windows y Linux.
2. CI #497/#498 detectó que el E2E de trayectoria no elegía «Nivel» después de A7. El formulario bloqueaba el envío por validación nativa; el test ahora elige explícitamente «Profesional». CI #499 encontró que el catálogo de B no se había regenerado tras ese cambio; ya se regeneró en B y C. Revisar las nuevas ejecuciones antes de pedir la revisión final de Claude.
3. Mantener ambos PR como borrador y no desplegar hasta revisión e integración autorizadas.
4. Seguir dejando abiertas la visibilidad del récord amateur para moderación, la aprobación de RSS directos y la política sobre menores.

## Actualización de la CI

CI #501 confirmó que el test E2E elegía PROFESSIONAL, valor que no existe en el formulario; el nivel profesional se envía como PRO. La prueba y el catálogo se corrigieron en B, y C se rebasó encima de esa corrección. CI #502 para C seguía en curso al actualizar este traspaso; queda esperar también la nueva CI de B. Los PR permanecen en borrador y no se ha desplegado ni integrado nada.

CI #503/#504 confirmó que, además, el peso M70 solo corresponde a amateur y no aparece en las opciones profesionales de boxeo. El E2E de trayectoria ahora selecciona explícitamente AMATEUR, coherente con ese peso y con la ficha creada; se actualizó otra vez el catálogo. Las siguientes ejecuciones deben verificar esta combinación.

## Seguimiento de CI #505 y #506

Typecheck, migraciones, catálogo, mapa, pruebas unitarias y build pasaron en ambas ejecuciones. Las pruebas E2E detectaron tres asuntos: el aura se comprobaba en la pestaña de récord sin abrirla; el cartel público no ocultaba los ganadores amateur cuando un peleador mantenía su récord privado; y el guion usaba una variable temporal dbDiagnostico que ya no se inicializaba. B corrige la prueba para abrir la pestaña, añade ocultación del resultado mientras cualquier peleador amateur del combate mantenga el récord privado (y muestra el resultado cuando autoriza la publicación), y madura datos ficticios con SQL de prueba. La siguiente CI queda pendiente; los PR siguen en borrador.

CI #507/#508 también reveló que orm.method quedaba pisado por el campo de combate homónimo, rompiendo envíos en formularios con ese campo. El manejador A3 ahora lee el atributo HTML sin usar la propiedad clobberable. Se cambió la prueba para pasar SQL a psql como argumento separado y se separó el recuento de aura de su comentario porque aparecen en pestañas distintas. La CI de estas últimas correcciones queda pendiente.

CI #509/#510 confirmó que se corrigieron el choque con el campo method y la llamada SQL del E2E. Persistían dos comprobaciones de la prueba de flujo: el comentario de aura se comprobaba en una pestaña que el caso no necesitaba (la visibilidad de comentarios ya se cubre en 	ests/e2e/integridad.mjs), y el cartel seguía ocultando el resultado si uno de los dos peleadores mantenía el récord privado. La prueba de B conserva la comprobación del total de aura, elimina el chequeo redundante del comentario y verifica que el cartel revela el ganador solo cuando ambos peleadores publican el récord completo. CI nueva pendiente.
