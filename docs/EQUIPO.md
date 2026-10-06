# Equipo de desarrollo: cómo colaboramos

**Petición expresa del fundador (6 de octubre de 2026):** «necesito que documentéis todo lo que hagáis para mantenerlos comunicados entre vosotros […] Antigravity, Codex, Open Code, GitHub Copilot, que son nuestros hermanos. Formamos el equipo de desarrollo. Es nuestro ecosistema.» La comunicación entre asistentes **es este repositorio**: ninguno ve la conversación de los demás.

## Quién es quién

| Asistente | Dónde trabaja | Qué puede ejecutar | Su registro |
|---|---|---|---|
| **Claude** (Claude Code en la nube) | Contenedor propio con PostgreSQL 16, Node 22 y Chromium | Pruebas unitarias, compilación, **batería completa de navegador y accesibilidad con base vacía**, capturas de pantalla | [`APORTACIONES-CLAUDE.md`](APORTACIONES-CLAUDE.md) |
| **Codex** | Conector de GitHub; sin PostgreSQL local en las últimas sesiones | Edita y valida a través del CI de GitHub | [`APORTACIONES-CODEX.md`](APORTACIONES-CODEX.md) |
| **GitHub Copilot**, **Open Code**, **Antigravity** | Según cada uno | Anotar aquí lo que cada uno pueda y no pueda ejecutar la primera vez que trabaje | Crear `APORTACIONES-<NOMBRE>.md` con el mismo formato |

Las instrucciones del fundador están en [`CLAUDE.md`](../CLAUDE.md) y **valen para todos**, aunque el fichero se llame así. Los atajos `AGENTS.md` y `.github/copilot-instructions.md` apuntan aquí.

## Reglas comunes (obligatorias para todos)

1. **Leer antes de tocar:** `CLAUDE.md`, este documento, el relevo más reciente de cada asistente ([`APORTACIONES-CODEX.md`](APORTACIONES-CODEX.md), [`APORTACIONES-CLAUDE.md`](APORTACIONES-CLAUDE.md)), [`PULIDO-FUNCIONAL.md`](PULIDO-FUNCIONAL.md) y la última entrada de [`DIARIO.md`](DIARIO.md).
2. **Una rama por trabajo y por asistente**, con su prefijo: `claude/…`, `codex/…`, `copilot/…`, `opencode/…`, `antigravity/…`. Nunca se escribe en la rama de otro ni se fuerza un `push`. Se integra mediante propuesta (PR) con el CI en verde; el fundador decide qué se integra.
3. **Antes de empezar:** `git fetch` y comprobar qué ha cambiado y qué PR hay abiertos; no repetir ni pisar trabajo ajeno. Antes de publicar: volver a comprobar el SHA remoto.
4. **Ficheros compartidos y delicados** (avisar en el registro propio si se tocan): `CLAUDE.md`, `src/app/layout.tsx`, `src/app/globals.css`, `prisma/schema.prisma` (y toda migración), `src/lib/common/disciplines.ts` y `competition.ts`, `package.json`, `.github/workflows/ci.yml`, `render.yaml`. Una migración nunca se edita después de integrada: se añade otra.
5. **Documentar cada bloque** como pide `CLAUDE.md`: `DIARIO.md` (al final), `IDEAS.md`, `LECCIONES.md`, `ARQUITECTURA.md`, mapa funcional (`npm run mapa`) **y el registro propio del asistente** con: qué se pidió (con palabras del fundador), qué se cambió y por qué, **qué se ejecutó y qué no** (distinguir «lo ejecuté» de «lo valida el CI»), qué falló y qué debe hacer el siguiente.
6. **Honestidad ante todo:** no se declara aprobado lo que no se ha ejecutado; no se salta, relaja ni borra una prueba para ponerla en verde; un fallo intermitente sin causa se anota como tal.
7. **Decisiones del fundador** (aura, menores, diseño, precios, categorías oficiales, datos de terceros…) las toma solo él. Se anotan en `TRASLADO.md` §7 y se le preguntan; no se deducen.
8. **Reglas técnicas** de `CLAUDE.md` (acciones públicas, `hasOwn/lookup`, importaciones relativas, pruebas con `seen()` y datos únicos, etc.) y **ninguna regresión de las pruebas** (`npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run test:a11y`).
9. **Cero enlaces o botones muertos:** lo que parece pulsable lleva a un sitio o hace algo visible. `tests/e2e/enlaces.mjs` lo comprueba para todos los papeles; si no hay destino, se quita el enlace.
10. **Prioridad vigente (6 de octubre de 2026): el móvil primero.** Casi todo el uso será desde iOS y Android y el objetivo es publicar la aplicación en App Store y Google Play. Toda pantalla se diseña y se prueba primero en móvil (360–430 px de ancho, táctil); el escritorio es secundario. Ver [`MOVIL.md`](MOVIL.md).

## Cómo trabaja Claude (para que los demás sepan qué esperar)

- Corre en un contenedor efímero en la nube: tras un reinicio hay que volver a arrancar PostgreSQL y los servidores locales. No ve las skills instaladas en el ordenador del fundador ni su pantalla; el diseño se contrasta con capturas que él pueda ver en la demo.
- Su red está restringida: no abre la demo de Render ni webs de federaciones; las fuentes se consultan por búsqueda web.
- Tiene límites de uso semanales: puede quedarse sin créditos de golpe. Por eso **todo se escribe en el repositorio**, nunca solo en la conversación.
- Herramientas propias útiles para todos: `scripts/entorno-aislado.sh iniciar <nombre> <puerto> [--semilla]` (base y servidor propios), `scripts/demo.sh`, `scripts/arranque-demo.sh`, `tests/e2e/ayudas.mjs` (helpers de pruebas) y `tests/e2e/enlaces.mjs`.
- Siempre ejecuta la batería completa con **base vacía** (igual que el CI) antes de dar algo por bueno: las pruebas que pasan en una base con datos pueden fallar en limpio.

## Plantilla de relevo (copiar al final de tu registro)

```markdown
## <fecha> — <título corto>
**Pedido por el fundador:** «…»
**Base:** rama y SHA de partida. **Rama de trabajo:** `<asistente>/…`. **PR:** #…
**Qué cambié y por qué:** (archivos, comportamiento)
**Qué ejecuté yo:** (comandos y resultados) · **Qué solo valida el CI:** …
**Qué salió mal / sin causa conocida:** …
**Qué debe hacer el siguiente asistente:** 1) … 2) …
**Decisiones del fundador abiertas:** …
```
