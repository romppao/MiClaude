# T-021 — Formularios y cuenta con el diseño «D»
**Nivel:** N3 · **Fase:** F4 · **Estado:** bloqueada hasta T-015 y T-016 (la ficha de peleador T-017 sirve de modelo) · **Sugerida a:** Codex · **Depende de:** T-015, T-016

## Objetivo (una frase)
Que el registro, entrar, mi ficha y mi cuenta usen el diseño «D» con formularios claros y accesibles.

## Contexto
Sistema de diseño: [`SISTEMA-D.md`](../diseno/SISTEMA-D.md) (§3 correcciones obligatorias, §4 cómo extender el diseño al resto, §7 lista de revisión). Maqueta de referencia: [`referencia/D-awwwards-ring-3.html`](../diseno/referencia/D-awwwards-ring-3.html). Usa **solo** los componentes de `src/app/ui/` (T-016): si falta alguno, pídelo en el PR. Reglas del fundador: móvil primero, español claro, 5 enlaces como máximo, cero enlaces muertos, sin emojis, una acción principal por pantalla.

## Pasos
1. Rama `codex/T-021-formularios-d`.
2. Registro con los tres paneles actuales (usuario, peleador, promotora o federación) y elección de deporte en el alta de peleador; **el alta no pide edad** (decisión del fundador).
3. `Campo` con etiqueta siempre visible, ayuda breve y error con icono y texto que explica cómo arreglarlo; contraseña con «Mostrar».
4. Mensajes de éxito y error con `AvisoEstado` (role `status`/`alert`); nada se pierde al fallar.
5. Pruebas: `enlaces.mjs`, `movil.mjs` y los recorridos de esas pantallas en verde; `test:a11y` con 0 incumplimientos graves o críticos; capturas en 390 y 1280 px **de cada deporte**; con JavaScript desactivado todo se lee; sin dependencias nuevas.
6. Documentar: `DISENO.md`, `DIARIO.md`, `LECCIONES.md`, mapa funcional (en Linux o CI), tu registro.

## Criterios de aceptación
Capturas comparadas con la maqueta y con la ficha T-017; lista de revisión de `SISTEMA-D.md` §7 cumplida; ningún dato, permiso ni texto de producto cambia salvo el aspecto.

## No hacer
No cambiar datos, permisos ni reglas. No fotos de terceros. No añadir dependencias.

## Documentar
Pasos 5 y 6.
