# T-015 — Motor de deporte activo (cookie, selector y textos por deporte)
**Nivel:** N3 · **Fase:** F4 · **Estado:** **lista** · **Sugerida a:** Codex · **Depende de:** — (después, T-016 en otro PR)

## Objetivo (una frase)
Que la aplicación sepa cuál es el **deporte activo** de cada persona (cookie `deporte` → `data-deporte` en `<html>`) y que cada deporte aporte sus **textos y datos de ambiente** (palabras de fondo, vocabulario, categorías), sin cambiar todavía el aspecto actual.

## Contexto
Diseño elegido por el fundador: [`SISTEMA-D.md`](../diseno/SISTEMA-D.md) y la maqueta [`referencia/D-awwwards-ring.html`](../diseno/referencia/D-awwwards-ring.html). En el diseño «D» el color de marca (violeta) **no cambia** con el deporte: cambian la fotografía, las **palabras de fondo** («BOXEO / ESPAÑA», «ARTES / MIXTAS», «NAK / MUAY»), el vocabulario y los datos. Archivos delicados que se tocan (avisar en tu registro): `src/app/layout.tsx`. Disciplinas existentes: `src/lib/common/disciplines.ts` (`Discipline`).

## Pasos
1. Rama `codex/T-015-deporte-activo`.
2. `src/lib/common/temas.ts`: tipo `ClaveDeporte` (`todos|boxeo|mma|muaythai|kickboxing|k1|jiujitsu`), `claveDeDisciplina(d: Discipline)`, `esClaveDeporte(x)` (con `hasOwn` de `lib/common/safe.ts`; nunca fiarse de la cookie) y, por deporte: nombre visible, **dos palabras de fondo**, vocabulario (`asalto`/`ronda`, graduación, torneo) y la lista de categorías de peso que ya existe en `disciplines.ts`. **Sin colores ni estilos aquí.** Para kickboxing, K-1 y jiu-jitsu (no están en la maqueta) usa el mismo patrón y deja las palabras de fondo marcadas «pendiente de Antigravity».
3. `src/app/actions/tema.ts`: acción `elegirDeporte(f: FormData)`: valida la clave, guarda la cookie (`deporte`, un año, `SameSite=Lax`, `Path=/`, sin datos personales) y vuelve con `internalPath`. Clasificada como pública en `tests/unit/autorizacion.test.ts`.
4. `src/app/layout.tsx`: leer la cookie en el servidor y poner `<html lang="es" data-deporte={clave}>`; clave desconocida → `todos`.
5. `SelectorDeporte` **provisional** (formulario sin JavaScript, `role="radiogroup"`, flechas, zonas de 44 px) en `src/app/components/`; cuando exista el de T-016 se sustituirá por él.
6. Pruebas: `tests/unit/temas.test.ts` (cada `Discipline` tiene clave; `__proto__`, vacío o inventado → `todos`) y `tests/e2e/deporte.mjs` (elegir deporte, `data-deporte` correcto, persiste al recargar, cookie manipulada no rompe la página). Añadirla a `test:e2e`.
7. Documentar: `ARQUITECTURA.md`, `PLAN.md`, `DIARIO.md`, `LECCIONES.md`, mapa funcional (`npm run mapa` **en Linux o CI**), tu registro.

## Criterios de aceptación
- El aspecto actual no cambia (capturas idénticas en 390 y 1280 px).
- El deporte elegido se guarda, sobrevive a recargar y funciona sin JavaScript.
- Una cookie inválida nunca rompe la página.
- `typecheck`, `test`, `test:e2e` y `test:a11y` en verde con base vacía.

## No hacer
No rediseñar pantallas. No añadir campos a la base de datos. No instalar dependencias. No filtrar listados según el deporte (decisión pendiente del fundador).

## Documentar
Lo indicado en el paso 7.
