# T-016 — Base visual «Todos los deportes» aplicada a la aplicación
**Nivel:** N3 · **Fase:** F4 · **Estado:** bloqueada hasta T-015 · **Sugerida a:** Codex, **una pantalla o área por PR** · **Depende de:** T-015

## Objetivo (una frase)
Aplicar el ambiente «Todos los deportes» de la maqueta a las pantallas reales, usando solo las variables de tema, para que T-017 pueda cambiarlas por deporte sin tocar el código de las pantallas.

## Contexto
La referencia visual es la maqueta [`mezcla-por-deporte.html`](../diseno/direcciones/mezcla-por-deporte.html) con `?deporte=todos`, y la especificación [`SISTEMA-TEMAS.md`](../diseno/SISTEMA-TEMAS.md). Reglas del fundador: móvil primero, español claro, una acción principal por pantalla, botones con verbos, 5 enlaces como máximo en la navegación, nada de emojis, cero enlaces muertos. **Claude revisa cada PR visual** con capturas.

## Pasos (un PR por cada punto; en este orden)
1. **Cabecera y menú:** marca, 5 enlaces (Deportistas, Veladas, Clubes, Ránking, Entrar), regla decorativa superior y selector «Tu deporte». Menú móvil con los 5 destinos accesibles (no dejar enlaces ocultos sin alternativa).
2. **Ficha de peleador:** cabecera con nombre, disciplinas, retrato, marcador (victorias, derrotas, empates, aura), últimos combates con su **origen visible** y próxima velada.
3. **Listados** (peleadores, ránking, veladas, gimnasios, entrenadores): filas con puesto, nombre, datos y cifra; filtros como botones de 44 px.
4. **Veladas:** calendario y ficha de velada con la entrada como talonario.
5. **Formularios y cuenta** (registro, entrar, mi ficha, mi cuenta): etiquetas visibles, errores que explican cómo arreglarlos, estados vacíos con una acción.
6. **Moderación y ayuda:** solo tokens y legibilidad; sin diseño nuevo.

En todos: sustituir colores y fuentes escritos a mano por variables; ningún estilo específico de deporte (eso es T-017).

## Criterios de aceptación
- Cada PR adjunta capturas en 390 y 1280 px que coinciden con la maqueta; sin desbordes, zonas táctiles ≥ 44 px, texto ≥ 14 px (cuerpo ≥ 16 px).
- `test:a11y` en verde (0 incumplimientos graves o críticos) y `tests/e2e/enlaces.mjs` y `movil.mjs` en verde.
- Ningún color escrito a mano nuevo (revisar `globals.css` y los componentes).

## No hacer
No inventar elementos que la aplicación no tiene (datos, botones sin destino, sparring, reservas). No cambiar textos de producto ni permisos. No usar emojis. No incorporar marcas de terceros.

## Documentar
`DISENO.md` (qué se aplicó y qué se decidió), `DIARIO.md`, `LECCIONES.md`, mapa funcional (en Linux o CI), tu registro.
