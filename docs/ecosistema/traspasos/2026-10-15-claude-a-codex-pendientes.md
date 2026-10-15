# Claude (nube) → Codex: lo único pendiente (15-10-2026, tarde)

Codex se quedó sin créditos a las 12:30 mientras rehacía la bandeja de moderación. El fundador pidió a Claude que revisara todo lo de Codex, lo corrigiera y le dejara aquí lo que queda: «Mira, tienes que hacer esto, esto y esto. Y ya está.»

## Lo que ya está hecho (no lo repitas)
| Trabajo | Estado |
|---|---|
| T-013, enlaces externos (#77) | Revisado y bien hecho. Lo integra Claude con la numeración corregida (lo tenías en 0.17.1 y la demo ya va por la 0.18), y conserva el enlace «Gimnasio» de los avisos de moderación, que tu versión borraba. |
| T-002, Dependabot (#78) | Revisado y bien hecho. Lo integra Claude con el `package-lock.json` regenerado sobre la 0.18. Se cierran #17, #18, #19, #65 y #66. |
| F, G, D y H | Integrados por Claude en la 0.17.0 y la 0.18.0, con las correcciones de su revisión. |
| Bandeja única de moderación | **No llegó nada al repositorio**: la rama `codex/bandeja-unica-de-moderacion-20261015` solo tiene el commit de reserva. Si no conservas el trabajo local, empieza de nuevo (punto 1). |

## Antes de empezar
1. `git fetch` y `node scripts/estado.mjs`, y lee `docs/ESTADO.md`. Parte de `origin/claude/ring-espana-mvp` actualizada, no de tus ramas antiguas.
2. **Si `npm ci` da errores de integridad** (`EINTEGRITY`): el `package-lock.json` cambió con T-002. Ejecuta `npm cache clean --force` y después `npm ci`. No regeneres el `package-lock.json` a mano ni lo borres: si sigue fallando, apúntalo en tu PR y deja que Claude lo mire.

## Tienes que hacer esto, por orden (un PR por punto)
1. **Bandeja única de moderación**, sobre la `src/app/moderacion/page.tsx` actual:
   - «Poner en revisión» envía `decision=dispute`. `adminDecide` solo admite `verify`, `dispute` y `restore`.
   - Admite avisos sin cuenta: `r.user` puede ser `null`, así que muestra `reporterName` y `reporterEmail`. Admite también los avisos `PAGINA` (enlace a la página, sin botón de retirar y con la nota de que se actúa desde la página) y los avisos `GYM` (enlace «Gimnasio» a `/mis-gimnasios?gimnasio=…`).
   - Una etiqueta por tipo de decisión («Resolver y ocultar la ficha», «Resolver y rechazar el combate», «Resolver y retirar el comentario/la foto/el vídeo»), con la ayuda de «nota obligatoria» y de «la nota se envía por correo».
   - Todo enlace que abra otra pestaña lo avisa (T-013: `enlaces.mjs` lo comprueba).
   - Actualiza en el mismo PR las pruebas que buscan filas `tr` o esos botones: `integridad.mjs`, `flujo.mjs`, `fase2a.mjs`, `escenarios.mjs`, `pulido.mjs`, `usabilidad.mjs`, `paneles.mjs` y `ayudas.mjs`.
   - Añade una prueba que pulse las tres decisiones de combate y compruebe su efecto, y vuelve a poner en `paneles-avisos.mjs` las comprobaciones de la bandeja (orden por urgencia, anclas antiguas y axe).
2. **Vincular miembros a un gimnasio por solicitud.** El titular invita y la persona acepta o rechaza, como `ClassRequest` y `FightProposal`. Comprueba `hayBloqueo`. Hoy `setGymMember` con `link` es solo de moderación: mantén eso para moderación.
3. **Ceder un gimnasio con aceptación.** El titular envía una invitación y la otra persona la acepta. La respuesta es la misma tenga o no cuenta ese correo. Comprueba `hayBloqueo` y envía un correo a las dos personas con `sendMail`. Hoy `transferGym` es solo de moderación.
4. **Gimnasios creados desde las fichas.** `fighters.ts` (crear y editar la ficha) y `profiles.ts` (gimnasio del entrenador) los crean `PUBLISHED`. Que queden `PENDING`, salvo si lo hace moderación, como en `saveGym`.
5. **T-009, ampliar escenarios** (`docs/tareas/T-009-ampliar-escenarios.md`): todos los tipos de cuenta, para las pruebas definitivas antes del lanzamiento.

## Reglas que han cambiado hoy (respétalas en todo)
- **Bloqueos** (`src/lib/community/bloqueos.ts`): todo contacto nuevo entre personas comprueba `hayBloqueo`, y toda lista de lo que publica otra persona filtra `bloqueadosPor(quien mira)`.
- **Fotos** (`src/lib/media/fotos.ts`): solo con `guardarFoto`, `leerFoto` y `borrarFotos` y las columnas `*Key`, nunca los bytes a mano.
- **Correos**: solo con `sendMail`. Ya pasa por la cola (`cola-correo.ts`); para los de la cuenta, `prioridad: 0`.
- **Fallos**: `registrarFallo`. Con `SENTRY_DSN` también avisa a Sentry.
- **Dominio**: no toques nada del dominio ni del DNS (`docs/DOMINIO.md`).
- **`package.json`**: en los conflictos, une scripts y dependencias a mano, sin tomar un lado entero.
- **Versión**: siempre mayor que la de la rama de la demo en el momento de abrir el PR.
- **En cada PR**: pruebas, `CHANGELOG`, versión, catálogo y mapa regenerados, tu fila de `ESTADO.md` y `APORTACIONES-CODEX.md`. Todo en español.

Claude revisará cada PR, lo corregirá si hace falta y lo fusionará.
