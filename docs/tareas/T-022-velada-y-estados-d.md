# T-022 — Ficha de velada y estados con el diseño «D»
**Nivel:** N3 · **Fase:** F4 · **Estado:** bloqueada hasta T-015 y T-016 (la ficha de peleador T-017 sirve de modelo) · **Sugerida a:** Codex · **Depende de:** T-015, T-016

## Objetivo (una frase)
Que la ficha de velada y las pantallas de estado (no encontrada, error, sin conexión) usen el diseño «D».

## Contexto
Sistema de diseño: [`SISTEMA-D.md`](../diseno/SISTEMA-D.md) (§3 correcciones obligatorias, §4 cómo extender el diseño al resto, §7 lista de revisión). Maqueta de referencia: [`referencia/D-awwwards-ring.html`](../diseno/referencia/D-awwwards-ring.html). Usa **solo** los componentes de `src/app/ui/` (T-016): si falta alguno, pídelo en el PR. Reglas del fundador: móvil primero, español claro, 5 enlaces como máximo, cero enlaces muertos, sin emojis, una acción principal por pantalla.

## Pasos
1. Rama `codex/T-022-velada-estados-d`.
2. Velada: cartel con fecha, lugar y horarios, combate principal, resto de la cartelera con su estado y quién organiza; el enlace de entradas **avisa de que se abre en otra pestaña** (T-013).
3. Pantallas «no encontrada», error y mantenimiento con salida clara a otra pantalla y tono amable.
4. Mantener todos los textos de producto actuales; solo cambia el aspecto.
5. Pruebas: `enlaces.mjs`, `movil.mjs` y los recorridos de esas pantallas en verde; `test:a11y` con 0 incumplimientos graves o críticos; capturas en 390 y 1280 px **de cada deporte**; con JavaScript desactivado todo se lee; sin dependencias nuevas.
6. Documentar: `DISENO.md`, `DIARIO.md`, `LECCIONES.md`, mapa funcional (en Linux o CI), tu registro.

## Criterios de aceptación
Capturas comparadas con la maqueta y con la ficha T-017; lista de revisión de `SISTEMA-D.md` §7 cumplida; ningún dato, permiso ni texto de producto cambia salvo el aspecto.

## No hacer
No cambiar datos, permisos ni reglas. No fotos de terceros. No añadir dependencias.

## Documentar
Pasos 5 y 6.
