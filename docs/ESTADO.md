# Estado vivo de Lona — lo primero que se lee

> **Para qué sirve (petición del fundador, 14 de octubre de 2026):** Claude en la nube o en el móvil, Claude Code en el portátil, Codex y cualquier otro asistente **no se pueden hablar entre sí**. El repositorio es su único canal. Este archivo es la página corta que dice cómo está todo **ahora**, para no repetir lo que el fundador ya hizo o dijo en otra sesión ni pisarse el trabajo.
>
> **15-10-2026, tarde: Claude Code, empieza por [`ecosistema/traspasos/2026-10-15-claude-nube-a-claude-code.md`](ecosistema/traspasos/2026-10-15-claude-nube-a-claude-code.md).**
>
> **Al empezar:** `git fetch` y `node scripts/estado.mjs` (lo que dice la realidad en directo: demo, ramas y PR en curso, ficheros que dos trabajos tocan a la vez) y lee esta página. **Antes de un trabajo grande:** `node scripts/estado.mjs reservar <asistente> "<tema>"`. **Al terminar:** actualiza tu fila y lo que cambie. Reglas completas al final.

**Última revisión completa:** 15 de octubre de 2026 (Claude, nube). Si el script avisa de que tiene más de 3 días, no te fíes sin mirar el script.

## 1. Dónde estamos

- **Demo** (rama `claude/ring-espana-mvp`, https://ring-espana-demo.onrender.com/): versión **0.17.0** (mira el script). Es solo para pruebas y no sale en los buscadores. Trae el mapa de gimnasios, el control de versiones, las veladas pasadas con autorización de moderación, el récord amateur oculto, la regla de las 24 horas, la búsqueda de sparring por ciudad y gimnasio, entrar con Google (el botón solo sale cuando hay claves en Render) y los arreglos de los paneles del bloque E.
- **Calendario** ([`LANZAMIENTO.md`](LANZAMIENTO.md)): aplicación lista el **1 de noviembre**, lanzamiento público el **15 de noviembre**.
- **Repositorio:** sigue **público**. El fundador debe pasarlo a privado (Settings → Change visibility); ningún asistente puede hacerlo.
- **Versiones:** cada PR sube la versión y apunta su cambio ([`VERSIONES.md`](VERSIONES.md)). Con varios PR abiertos a la vez, el que se fusiona después renumera.

## 2. En curso (cada asistente edita solo su fila)

| Quién | Qué | Rama y PR | Estado |
|---|---|---|---|
| Claude (nube, el chat del móvil) | **En pausa** (15-10, tarde). Su relevo está en `docs/ecosistema/traspasos/2026-10-15-claude-nube-a-claude-code.md` | — | en pausa |
| Claude Code (portátil) | 17-10 (tarde): invitaciones a peleadores (0.23.0, rama `claude-code/invitaciones-a-peleadores-contacto-entre-20261016`; PR por abrir, el fundador da el «sí»). Siguiente: denunciar invitaciones y el papel de moderador. 16-10 (tarde): directorios con foto fusionados en la 0.21.0 (#97); ahora, pantallas de acción guiadas, «Completa tu ficha», ayuda con índice y datos al día (0.22.0, PR de `claude-code/menos-scroll-pr`); antes: #92 fusionado; #93 (fase 1, 0.20.0) con las correcciones de la revisión crítica, esperando CI y el «sí» del fundador. **Red de seguridad y flota** (este PR): `APROBADO.md`, `npm run verificar`, CI que no se para en el primer fallo, `scripts/flota.mjs` y `MODELOS-Y-ESFUERZO.md`. Siguiente: regresión visual. | `claude-code/veladas-entradas` (#93), `claude-code/red-seguridad` | en curso |
| Codex | Actualiza #90 tras invitaciones y cesiones; corrección de selector conservada. | `codex/pr90-integracion-20261016` | Preparación local sobre base candidata0.20.4; CI pendiente. |
| Antigravity | Cuatro ajustes de móvil en Lona (375 px): portada, gimnasios, veladas y peleadores. Tipos, 858 unitarias y capturas antes/después verificadas. Versión 0.18.10. | `antigravity/ajustes-movil` | Completado localmente, pendiente de revisión de Claude Code |
| Dependabot | Actualizaciones de librerías | #17, #19, #20 | sin revisar |

⚠ **El encargo de los paneles** (bloques F, G y H) que citan el diario y `IDEAS.md` —`docs/ecosistema/traspasos/2026-10-14-claude-encargo-codex-paneles-por-usuario.md`— **no está en el repositorio**: no existe en ninguna rama. Quien lo tenga (el portátil) debe subirlo; sin él, nadie más puede continuar G y H.

## 3. Lo que solo puede hacer el fundador

0. **Dominio:** proteger lonaclub.es (renovación automática, bloqueo de transferencia y verificación en dos pasos en Infomaniak) y, cuando quiera, desengancharlo de la demo **siguiendo [`DOMINIO.md`](DOMINIO.md)**: primero el DNS en Infomaniak y después Render, sin tocar MX, SPF ni DMARC. **Ningún asistente toca el dominio.**
1. **Poner el repositorio en privado.**
2. **Claves de Google** ([`GOOGLE.md`](GOOGLE.md)): proyecto en Google Cloud, ID de cliente con la dirección de vuelta de la demo, y pegar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en Render (nunca en el chat). Mientras no haya dominio propio, **no pulsar «Publicar aplicación»** (Google pide verificar los dominios); basta el modo de prueba con él como usuario. Con el dominio real habrá que añadir su dirección de vuelta.
3. **Cuentas de producción** de #57 (facturación de Google Cloud, R2, Resend y Sentry), cuando el fundador decida montar la versión real. **R2 es imprescindible** desde la 0.16.1: guarda las fotos (sin él, la base gratuita se llenaría). Neon ya está; **la demo ya usa su base de Neon** (`lona-demo`) desde el 14-10-2026, así que la caducidad de la base de Render ya no la afecta.
4. **UptimeRobot** y cambiar la clave de noticias `CRON_SECRET`.
5. **Decisiones:** menores (T-014: abrir solo a mayores de 18 o hacer la política), abogado para condiciones de uso y privacidad, y los gastos que falten por aprobar ([`LANZAMIENTO.md`](LANZAMIENTO.md), sección 2).

## 4. Lo que el fundador ha dicho (para no repetírselo)

- **Nuevo encargo a Codex (15 oct):** «No toques los paneles F, G, D ni H (#56, #62, #64, #71)». Claude Code ha integrado F/G en #69/#70 y decide qué versión se queda; no se actualizan hasta que lo diga esta página. Codex toma T-013 desde la demo tras fusionar #73 y después agrupa Dependabot #17/#18/#19/#65/#66 en un PR con pruebas, versión y registros.

- **Codex sin créditos (14 oct):** «hazlo tú, todo lo que haya que hacer, hazlo tú». Si Claude también se queda sin créditos, deja una ficha o un texto completo para que Codex lo haga cuando se le regeneren (ejemplo: [`tareas/T-015-entrar-con-google.md`](tareas/T-015-entrar-con-google.md)). Todo se escribe en el repositorio, nunca solo en el chat.
- **Orden de trabajo:** primero validar, corregir y publicar lo anterior; solo entonces empezar lo nuevo.
- **Entrar con Google sí; Apple aplazado** hasta el lanzamiento (Apple lo exigirá en la tienda si hay otros inicios de sesión de terceros).
- **Dominio:** lona.es y lona.com están ocupados. Pidió más nombres; según #57 se eligió **lonaclub.es**. Falta que el fundador lo confirme por escrito aquí. También mencionó Infomaniak (dominio y correo); sin decidir y sin precios comprobados.
- **Mejoras de las veladas:** dijo que tenía y que las daría; sigue a la espera de su lista.
- **Versión real (14 oct, tarde):** primero hay que comprobar que la app está bien desarrollada y, solo después, montar la versión oficial en lonaclub.es. Tiene que ser «la aplicación real y definitiva»: sin datos de prueba, sin avisos de demo y completamente independiente de la demo. Habrá un espacio de pruebas aparte (la demo) para las próximas actualizaciones. No hay que pulsar «Publicar app» en Google hasta entonces. **No poner `APP_URL=https://lonaclub.es` en Render**.
- **lonaclub.es, esperar (15 oct, después):** «por el momento vamos a dejarlo así… No hagas nada en cuanto a eso, porque… todavía no hemos terminado de perfilar la aplicación, entonces todavía no tiene sentido que ya lancemos la aplicación web». **No montar nada en lonaclub.es** (ni versión real ni «próximamente») hasta que lo diga. Ahora toca: «procede con todo lo que hay que hacer, todas las correcciones para dejar la aplicación lista y perfecta para el uso cotidiano del usuario».
- **Dominio, máximo cuidado (15 oct):** «ten muchísimo cuidado, porque a lo mejor me roban el dominio… documéntalo al pie de la letra, explicando el porqué, el cómo, dónde… he invertido dinero ahí». Todo cambio del dominio va en [`DOMINIO.md`](DOMINIO.md), con cómo deshacerlo, y solo lo hace el fundador.
- **Agilizar, Claude corrige a Codex (15 oct):** «Si ves que Codex ha fallado en alguna prueba o está a medias de algo, tú mismo ya corrígele… y le dices, mira, necesito que esto lo hagas así… Esto para agilizar el trabajo es importante». Y: «no hace falta que me informes sobre cualquier cosa». Claude corrige e integra lo de Codex en su propia rama (nunca escribe en la de Codex) y le deja instrucciones en el PR; al fundador solo se le escribe lo que necesita de él.
- **Cambio de visión y RFC-001 de Codex (15 oct):** «he tenido un cambio de visión que todavía no sé si aplicaremos». Sobre la RFC-001 (#61): «no estoy seguro si es la que definitivamente acepté… Sé que dije dos versiones… hubo una… que me convenció más. Pero no estoy seguro de cuál es la que hizo Codex». Y el orden: «Eso es el final. Primero hacemos todo el plan para finalizar el proyecto, hacer la promoción mediante vídeos y todo más, y ya pues valoraremos si el enfoque va a ser ese o no». **Nadie aplica la RFC-001 ni cambia el enfoque** hasta que el fundador confirme cuál de las dos versiones aceptó (puede habérselo dicho a Claude Code en el portátil: si lo sabes, apúntalo aquí).
- **Separar ya (15 oct):** no quiere que quien busque el nombre llegue a la demo con su aviso. «Quiero separarlo ya… la demo de render… es donde haremos las pruebas para corregir pequeñas cosas, hacer configuraciones nuevas, actualizaciones. Pero la parte de oficial de la web, ahí es donde pues estará la web de verdad.» lonaclub.es **nunca** vuelve a apuntar a Render; la demo no se indexa.
- **Dominio confirmado:** lonaclub.es (Infomaniak, comprado el 14-10-2026), con el buzón info@lonaclub.es.
- **Sin ránking de gimnasios ni de entrenadores (16 oct):** «no pongas un ránking de gimnasios, ya que esto puede ser muy perjudicial, únicamente para los peleadores […] puedes poner los más populares, pero no un ránking de quién es mejor que otro». Solo los peleadores se clasifican; para gimnasios y entrenadores, «populares» (cuánta gente hay) sí, «mejores» y puestos, no.
- **Siempre:** no tocar ni quitar lo que funciona sin que lo pida; avisarle de lo que un diseño aprobado trae y no está hecho; nada de pago sin su aprobación; todo en español.

## 5. Siguiente, por orden

0. **Gimnasios reales (petición del fundador, 15-10):**
   - **Hecho (15-10):** secreto `DEMO_DATABASE_URL` puesto. Recuento de la lista en la demo: 191 se crearían, **solo 1 publicado** (Ludus) y 190 por revisar, porque no tienen `fechaFuente`. **No cargar todavía:** primero revisar las fechas, para no llenar moderación con 190 fichas.
   - **OpenStreetMap:** el recuento falló por tiempo de espera de Overpass (servidor saturado) y la acción salió en verde igualmente; repetir más tarde y revisar que la acción falle cuando falla el script.
   - **Claude Code (portátil, con internet completo):** ampliar `docs/datos/gimnasios-investigados.json` con Castilla-La Mancha, Extremadura, Canarias, Huesca y Castilla y León, y con más clubes del resto. Solo de deportes de contacto, cada uno con su fuente **de menos de un año** (`fechaFuente`: «información actualizada… de no más de un año», fundador 15-10) y comprobando las disciplinas de hoy; sin copiar de Google Maps. Revisar también las 190 entradas actuales, que no tienen fecha.

0. **Textos legales (0.14.0):** borradores hechos (`docs/LEGAL.md`). El fundador tiene sus tareas y las preguntas para el abogado en `MiProyectoAI/LEGAL-LONA/`. Programación: bloquear usuarios, aviso sin cuenta y correos de la decisión, **hechos en la 0.16.0**; T-013 (aviso al salir a enlaces externos), **hecha en la 0.18.5**.
0. **Revisión completa antes de la versión oficial:** [`tareas/T-016-revision-previa-al-lanzamiento.md`](tareas/T-016-revision-previa-al-lanzamiento.md). Es lo que pidió el fundador antes de montar lonaclub.es y publicar en Google. Sin empezar: el primer intento se cortó por un fallo del servicio.
1. Resolver #57 (producción) y #56 (bloque F): revisar, retargetar y renumerar.
2. **Probar «Continuar con Google»** en la demo en cuanto el fundador ponga las claves.
3. Paneles por tipo de usuario: **G** (funciones para Madrid) y **H**, a partir del encargo (hay que subirlo, ver arriba).
4. Vigilar que la pantalla a veces se carga dos veces seguidas tras algunos envíos, y el error de carga #418 de React (causa sin confirmar).
5. Desvincular Google desde «Mi cuenta»; entrar con Apple antes de las tiendas.
6. **Pruebas definitivas por tipo de cuenta** antes del 20 de octubre ([`LANZAMIENTO.md`](LANZAMIENTO.md), sección 4).

## 6. Dónde está el detalle de cada sesión

- **Claude (nube):** [`DIARIO.md`](DIARIO.md) (al final) y [`APORTACIONES-CLAUDE.md`](APORTACIONES-CLAUDE.md).
- **Codex:** [`ecosistema/traspasos/`](ecosistema/traspasos/) y [`APORTACIONES-CODEX.md`](APORTACIONES-CODEX.md).
- **Qué cambió en cada versión:** [`CHANGELOG.md`](../CHANGELOG.md). **Por qué:** [`decisiones/`](decisiones/).

## 7. Cómo se mantiene esta página

1. **Empezar:** `git fetch`, `node scripts/estado.mjs` y leer esta página. Si el script enseña un trabajo igual al tuyo, **no lo empieces**: avisa al fundador.
2. **Reservar** (trabajo de más de una hora): `node scripts/estado.mjs reservar <asistente> "<tema>"` crea una rama desde la demo con un commit vacío y la sube. No lanza el CI, así que no gasta minutos, y las demás sesiones la ven en el resumen. Gana quien reservó primero.
3. **Terminar un bloque:** en el mismo PR, actualiza **tu fila** de la sección 2 y lo que cambie en las secciones 1, 3 y 5, además de `DIARIO.md`, `LECCIONES.md`, `IDEAS.md` y el `CHANGELOG`.
4. **Lo que diga el fundador en una conversación** y afecte a otros asistentes se apunta en la sección 4, con sus palabras. Así no hay que decírselo dos veces.
5. **Cada asistente toca solo su fila** y no escribe en la rama de otro: así casi nunca hay conflictos.
6. **Si algo es incierto, dilo** («no consta cuál», «sin comprobar»). Esta página vale lo que valga su honestidad.
7. **Breve.** Si crece de unas 90 líneas, lo que sobre va a `DIARIO.md`. Es una portada, no un archivo.
