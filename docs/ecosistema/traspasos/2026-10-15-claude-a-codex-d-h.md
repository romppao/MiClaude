# Claude (nube) → Codex: D y H integrados; lo que queda para ti (15-10-2026)

El fundador pidió agilizar: «Si ves que Codex ha fallado en alguna prueba o está a medias de algo, tú mismo ya corrígele… y le dices… cómo hacerlo». Claude (nube) ha integrado tu trabajo en sus propias ramas, sin tocar las tuyas:
- **F y G:** #75, versión 0.17.0. Era la versión de Claude Code de tus #56 y #62, que eran idénticas salvo C5-02 y una prueba. #56, #62, #69 y #70 están cerrados.
- **D y H:** el PR de la 0.18.0, con las correcciones de la revisión (comentarios en #64 y #71). **No sigas actualizando** `codex/paneles-*` ni `codex/gimnasios-reales-*`: parte siempre de la rama de la demo.

## Lo que queda para ti, por orden

1. **Rehacer la lista única de moderación (H).** No se ha integrado. Hazla sobre la `moderacion/page.tsx` actual:
   - «Poner en revisión» debe enviar `decision=dispute`; `adminDecide` no admite `reject`.
   - Admite avisos sin cuenta (`r.user` puede ser `null`: muestra `reporterName` y `reporterEmail`) y avisos `PAGINA`: enlace a la página, sin botón de retirar y con la indicación de que se actúa desde la página.
   - Conserva una etiqueta por tipo («Resolver y ocultar la ficha», «Resolver y rechazar el combate», «Resolver y retirar el comentario/la foto/el vídeo»), la ayuda de «nota obligatoria» y la de «la nota se envía por correo».
   - Actualiza en el mismo PR las pruebas que buscan esos botones: `integridad.mjs`, `flujo.mjs`, `fase2a.mjs`, `escenarios.mjs`, `pulido.mjs`, `usabilidad.mjs`, `paneles.mjs` y `ayudas.mjs`. Añade una que pulse cada botón de decisión de combates.
   - Vuelve a poner en `paneles-avisos.mjs` las comprobaciones de la bandeja que se quitaron.
2. **Vincular miembros a un gimnasio por solicitud.** Hoy solo moderación vincula. Haz que el titular invite y que el peleador o entrenador acepte, como las clases (`ClassRequest`) y las propuestas (`FightProposal`), comprobando `hayBloqueo`.
3. **Ceder un gimnasio con aceptación.** Hoy lo hace solo moderación. El titular envía una invitación, la otra persona la acepta y la respuesta es la misma tenga o no cuenta ese correo. Comprueba `hayBloqueo` y envía un correo a las dos personas.
4. **Gimnasios creados desde las fichas.** `fighters.ts` y `profiles.ts` (entrenador) crean gimnasios `PUBLISHED` sin revisión, mientras que `saveGym` los manda a revisión. Unifícalo: `PENDING` si no es moderación.
5. **RFC-002.** De acuerdo en tablas propias con claves foráneas. Pero:
   - no lo llames «aura» para entidades: usa «reconocimiento» y déjalo fuera del ránking;
   - empieza por seguir gimnasios y promotoras;
   - aplica `hayBloqueo` con el titular;
   - añade `PROMOTER` a los tipos de aviso.

   El fundador decide lo de las valoraciones.

## Reglas que han cambiado y debes respetar
- **Bloqueos** (`src/lib/community/bloqueos.ts`). Cualquier contacto nuevo entre personas comprueba `hayBloqueo`. Cualquier lista de lo que publica otra persona filtra `bloqueadosPor(quien mira)`.
- **Fotos** (`src/lib/media/fotos.ts`). Nunca escribas ni leas `avatar`, `banner` o `image` a mano: usa `guardarFoto`, `leerFoto` y `borrarFotos` y las columnas `*Key`.
- **Avisos.** `Report.userId` puede ser `null`, y existen las entidades `PAGINA` y `GYM`. Las decisiones envían un correo (`notificarResolucionDeAviso`).
- **`package.json`.** En los conflictos, une scripts y dependencias a mano: no tomes un lado entero.
