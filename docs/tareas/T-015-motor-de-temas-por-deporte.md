# T-015 — Motor de temas por deporte (sin cambiar el aspecto)
**Nivel:** N3 · **Fase:** F4 · **Estado:** **lista** (visto bueno del fundador a la maqueta el 6 oct 2026: «perfecto, continúa»; las preguntas abiertas de [`SISTEMA-TEMAS.md`](../diseno/SISTEMA-TEMAS.md) se resuelven con las propuestas de ese documento hasta que el fundador diga otra cosa) · **Sugerida a:** Codex · **Depende de:** —

## Objetivo (una frase)
Que la aplicación pueda cambiar de ambiente visual según el deporte elegido (cookie `deporte` + `data-deporte` en `<html>`), con la infraestructura lista, **sin cambiar todavía el aspecto actual**.

## Contexto
Lee `docs/diseno/SISTEMA-TEMAS.md` (lista de variables, registro de temas, cookie y preguntas abiertas) y abre la maqueta en el navegador con `?deporte=boxeo`, `mma`, etc. Archivos delicados que se tocan (avisar en tu registro): `src/app/layout.tsx` y `src/app/globals.css`. Las disciplinas ya existen en `src/lib/common/disciplines.ts` (`Discipline`). Las acciones de servidor van en `src/app/actions/<dominio>.ts` y la lógica en `src/lib/<dominio>`.

## Pasos
1. Rama `codex/T-015-temas`.
2. `src/lib/common/temas.ts`: tipo `ClaveTema` (`todos|boxeo|mma|muaythai|kickboxing|k1|jiujitsu`), `temaDeDisciplina(d: Discipline)`, `esClaveTema(x)` (validar con `hasOwn` de `lib/common/safe.ts`, nunca fiarse del valor de la cookie), nombre visible de cada tema y su vocabulario (`ronda`: «asalto»/«ronda»; `graduacion`; `torneo`). Sin colores aquí.
3. `src/app/actions/tema.ts`: acción de servidor `elegirDeporte(f: FormData)` que valida la clave, guarda la cookie (`deporte`, un año, `SameSite=Lax`, `Path=/`, **sin** datos personales) y vuelve a la página de origen con `internalPath` (como el resto de acciones). Clasificarla en `tests/unit/autorizacion.test.ts` como pública.
4. `src/app/layout.tsx`: leer la cookie en el servidor y poner `<html lang="es" data-deporte={clave}>`; clave desconocida → `todos`.
5. `src/app/globals.css`: añadir los bloques `[data-deporte="…"]` **solo con las variables** de `SISTEMA-TEMAS.md` y los siete valores de la maqueta (copiar de `mezcla-por-deporte.html`). **No** cambiar ningún estilo existente: en esta ficha los componentes aún no usan esas variables.
6. Componente `SelectorDeporte` (`src/app/components/`): formulario sin JavaScript con siete botones (`role="radiogroup"` visible para lectores de pantalla, la opción activa con `aria-checked`), zonas táctiles de 44 px. Colócalo bajo la cabecera.
7. Prueba unitaria `tests/unit/temas.test.ts`: la clave de cada `Discipline` existe; una clave inventada, `__proto__` o vacía cae en `todos`.
8. Prueba unitaria de contraste: para cada tema, calcular la razón de contraste de `--fg`/`--bg`, `--fg-2`/`--bg`, `--fg-2`/`--bg-2`, `--on-bg-accent`/`--bg` y `--on-bg-accent`/`--card`, y fallar por debajo de 4,5. Los valores se leen del propio `globals.css` para que no puedan desalinearse.
9. `tests/e2e/temas.mjs` (añadir a `test:e2e`): elegir cada deporte, comprobar `data-deporte`, recargar y ver que persiste, y que con la cookie manipulada la página sigue funcionando.
10. Documentar: `ARQUITECTURA.md`, `PLAN.md`, `.env.example` (si procede), `DIARIO.md`, `LECCIONES.md`, `docs/MAPA-FUNCIONAL.md` (`npm run mapa`, **en Linux o en el CI**), tu registro.

## Criterios de aceptación
- El aspecto actual **no cambia** (capturas antes/después idénticas en 390 y 1280 px).
- Elegir deporte guarda la cookie, la página la respeta al recargar y sin JavaScript.
- Una cookie inválida nunca rompe la página.
- Prueba de contraste de los siete temas en verde.
- `typecheck`, `test`, `test:e2e` y `test:a11y` en verde con base vacía.

## No hacer
No rediseñar pantallas (eso es T-016 y T-017). No añadir campos a la base de datos. No cargar tipografías todavía (lo hace T-017). No hacer que la elección filtre los listados hasta que el fundador lo decida.

## Documentar
Lo indicado en el paso 10.
