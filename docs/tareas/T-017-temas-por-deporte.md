# T-017 — Un tema por deporte (inmersión completa)
**Nivel:** N2 (cada sub-tarea) · **Fase:** F4 · **Estado:** **bloqueada** (T-015 y T-016) · **Sugerida a:** Codex, **un PR por deporte** · **Depende de:** T-015, T-016

## Objetivo (una frase)
Que al elegir su deporte, la persona vea la aplicación completa en el ambiente de ese deporte (color, tipografía, regla, textura, formas y vocabulario), tal como en la maqueta.

## Sub-tareas (un PR por cada una; el orden lo marca el fundador, propuesta: boxeo, Muay Thai, MMA, kickboxing, K-1, jiu-jitsu)
**T-017a boxeo · T-017b Muay Thai · T-017c MMA · T-017d kickboxing · T-017e K-1 · T-017f jiu-jitsu**

## Pasos de cada sub-tarea
1. Rama `codex/T-017x-<deporte>`.
2. Copiar de la maqueta [`mezcla-por-deporte.html`](../diseno/direcciones/mezcla-por-deporte.html) (con `?deporte=<clave>`) los valores del ambiente a `globals.css` (los bloques de T-015 ya existen: **ajustar solo lo que falte**: textura, regla, formas, sellos).
3. Cargar con `next/font` **solo** las tipografías de ese ambiente (alojadas por la aplicación, subconjunto latino, `display: swap`) y comprobar la licencia de cada una.
4. Vocabulario del deporte en `src/lib/common/temas.ts` (por ejemplo «asalto» en boxeo y Muay Thai, «ronda» en MMA y kickboxing, «torneo» en K-1, «cinturón» en jiu-jitsu) y usarlo en las pantallas que hoy dicen «ronda» o «asalto». **Los datos no cambian**, solo el texto mostrado.
5. Revisar cada pantalla de T-016 en ese ambiente: contraste, foco visible, zonas táctiles, desbordes en 390 px; arreglar con variables, **no con excepciones por pantalla**.
6. Capturas de las pantallas principales en 390 y 1280 px adjuntas al PR (ficha, listado, velada, formulario).
7. Documentar.

## Criterios de aceptación
- Coincide con la maqueta del ambiente (Claude lo revisa con las capturas).
- Prueba de contraste de ese tema y `test:a11y` con ese ambiente activo: 0 incumplimientos graves o críticos.
- `tests/e2e/temas.mjs` cubre el ambiente. Sin desbordes ni zonas táctiles menores de 44 px.
- Peso de las tipografías del ambiente medido y anotado en el PR.

## No hacer
No tocar los datos ni las reglas de aura o verificación. No dejar en un ambiente texto de otro deporte. No usar fotografías que no sean propias o con autorización: usar marcadores hasta que el fundador aporte imágenes. No usar símbolos religiosos, nacionales o culturales como decoración (el ambiente se construye con material del propio deporte: cuerdas, jaula, vendas, tatami, cinturones).

## Documentar
`DISENO.md` (decisiones por ambiente), `DIARIO.md`, `LECCIONES.md`, tu registro.
