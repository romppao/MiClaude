# Estado vivo de Lona — lo primero que se lee

> **Para qué sirve (petición del fundador, 14 de octubre de 2026):** Claude en la nube o en el móvil, Claude Code en el portátil, Codex y cualquier otro asistente **no se pueden hablar entre sí**. El repositorio es su único canal. Este archivo es la página corta que dice cómo está todo **ahora**, para no repetir lo que el fundador ya hizo o dijo en otra sesión ni pisarse el trabajo.
>
> **Al empezar:** `git fetch` y `node scripts/estado.mjs` (lo que dice la realidad en directo: demo, ramas y PR en curso, ficheros que dos trabajos tocan a la vez) y lee esta página. **Antes de un trabajo grande:** `node scripts/estado.mjs reservar <asistente> "<tema>"`. **Al terminar:** actualiza tu fila y lo que cambie. Reglas completas al final.

**Última revisión completa:** 15 de octubre de 2026 (Claude, nube). Si el script avisa de que tiene más de 3 días, no te fíes sin mirar el script.

## 1. Dónde estamos

- **Demo** (rama `claude/ring-espana-mvp`, https://ring-espana-demo.onrender.com/): versión **0.15.x** (mira el script). Es solo para pruebas y no sale en los buscadores. Trae el mapa de gimnasios, el control de versiones, las veladas pasadas con autorización de moderación, el récord amateur oculto, la regla de las 24 horas, la búsqueda de sparring por ciudad y gimnasio, entrar con Google (el botón solo sale cuando hay claves en Render) y los arreglos de los paneles del bloque E.
- **Calendario** ([`LANZAMIENTO.md`](LANZAMIENTO.md)): aplicación lista el **1 de noviembre**, lanzamiento público el **15 de noviembre**.
- **Repositorio:** sigue **público**. El fundador debe pasarlo a privado (Settings → Change visibility); ningún asistente puede hacerlo.
- **Versiones:** cada PR sube la versión y apunta su cambio ([`VERSIONES.md`](VERSIONES.md)). Con varios PR abiertos a la vez, el que se fusiona después renumera.

## 2. En curso (cada asistente edita solo su fila)

| Quién | Qué | Rama y PR | Estado |
|---|---|---|---|
| Claude (nube, el chat del móvil) | **Integrar los paneles F y G** (los de #69/#70, actualizados sobre la 0.16.1) y después **D y H de Codex** con las correcciones de la revisión. Antes, fusionados: 0.15.1 (demo separada), 0.16.0 (bloqueos, aviso sin cuenta, correos de moderación) y 0.16.1 (fotos fuera de la base) | `claude-nube/integrar-paneles-f-g`, versión 0.17.0 | en curso |
| Claude Code (portátil) | Hizo el relevo de Codex en F y G (#69, #70); sin actividad desde las 05:35 del 15-10. **Claude (nube) los integra** por petición del fundador (agilizar) | `claude/paneles-f`, `claude/paneles-g` | sustituidos |
| Codex | **Parado** por créditos (15-10-2026): todo lo suyo pasa a Claude. Ramas F (#56), G (#62), D (#64), H (local, sin subir); T-016 (#60); RFC-001 (#61) | varias | parado |
| Dependabot | Actualizaciones de librerías | #17, #19, #20 | sin revisar |

⚠ **El encargo de los paneles** (bloques F, G y H) que citan el diario y `IDEAS.md` —`docs/ecosistema/traspasos/2026-10-14-claude-encargo-codex-paneles-por-usuario.md`— **no está en el repositorio**: no existe en ninguna rama. Quien lo tenga (el portátil) debe subirlo; sin él, nadie más puede continuar G y H.

## 3. Lo que solo puede hacer el fundador

0. **Desenganchar ya lonaclub.es de la demo** (paso 0 de [`PRODUCCION.md`](PRODUCCION.md)): quitar el dominio en Render y borrar el A y el CNAME `www` en Infomaniak, sin tocar MX, SPF ni DMARC.
1. **Poner el repositorio en privado.**
2. **Claves de Google** ([`GOOGLE.md`](GOOGLE.md)): proyecto en Google Cloud, ID de cliente con la dirección de vuelta de la demo, y pegar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en Render (nunca en el chat). Mientras no haya dominio propio, **no pulsar «Publicar aplicación»** (Google pide verificar los dominios); basta el modo de prueba con él como usuario. Con el dominio real habrá que añadir su dirección de vuelta.
3. **Cuentas de producción** de #57 (facturación de Google Cloud, R2, Resend y Sentry), cuando el fundador decida montar la versión real. **R2 es imprescindible** desde la 0.16.1: guarda las fotos (sin él, la base gratuita se llenaría). Neon ya está; **la demo ya usa su base de Neon** (`lona-demo`) desde el 14-10-2026, así que la caducidad de la base de Render ya no la afecta.
4. **UptimeRobot** y cambiar la clave de noticias `CRON_SECRET`.
5. **Decisiones:** menores (T-014: abrir solo a mayores de 18 o hacer la política), abogado para condiciones de uso y privacidad, y los gastos que falten por aprobar ([`LANZAMIENTO.md`](LANZAMIENTO.md), sección 2).

## 4. Lo que el fundador ha dicho (para no repetírselo)

- **Codex sin créditos (14 oct):** «hazlo tú, todo lo que haya que hacer, hazlo tú». Si Claude también se queda sin créditos, deja una ficha o un texto completo para que Codex lo haga cuando se le regeneren (ejemplo: [`tareas/T-015-entrar-con-google.md`](tareas/T-015-entrar-con-google.md)). Todo se escribe en el repositorio, nunca solo en el chat.
- **Orden de trabajo:** primero validar, corregir y publicar lo anterior; solo entonces empezar lo nuevo.
- **Entrar con Google sí; Apple aplazado** hasta el lanzamiento (Apple lo exigirá en la tienda si hay otros inicios de sesión de terceros).
- **Dominio:** lona.es y lona.com están ocupados. Pidió más nombres; según #57 se eligió **lonaclub.es**. Falta que el fundador lo confirme por escrito aquí. También mencionó Infomaniak (dominio y correo); sin decidir y sin precios comprobados.
- **Mejoras de las veladas:** dijo que tenía y que las daría; sigue a la espera de su lista.
- **Versión real (14 oct, tarde):** primero hay que comprobar que la app está bien desarrollada y, solo después, montar la versión oficial en lonaclub.es. Tiene que ser «la aplicación real y definitiva»: sin datos de prueba, sin avisos de demo y completamente independiente de la demo. Habrá un espacio de pruebas aparte (la demo) para las próximas actualizaciones. No hay que pulsar «Publicar app» en Google hasta entonces. **No poner `APP_URL=https://lonaclub.es` en Render**.
- **lonaclub.es, esperar (15 oct, después):** «por el momento vamos a dejarlo así… No hagas nada en cuanto a eso, porque… todavía no hemos terminado de perfilar la aplicación, entonces todavía no tiene sentido que ya lancemos la aplicación web». **No montar nada en lonaclub.es** (ni versión real ni «próximamente») hasta que lo diga. Ahora toca: «procede con todo lo que hay que hacer, todas las correcciones para dejar la aplicación lista y perfecta para el uso cotidiano del usuario».
- **Agilizar, Claude corrige a Codex (15 oct):** «Si ves que Codex ha fallado en alguna prueba o está a medias de algo, tú mismo ya corrígele… y le dices, mira, necesito que esto lo hagas así… Esto para agilizar el trabajo es importante». Y: «no hace falta que me informes sobre cualquier cosa». Claude corrige e integra lo de Codex en su propia rama (nunca escribe en la de Codex) y le deja instrucciones en el PR; al fundador solo se le escribe lo que necesita de él.
- **Cambio de visión y RFC-001 de Codex (15 oct):** «he tenido un cambio de visión que todavía no sé si aplicaremos». Sobre la RFC-001 (#61): «no estoy seguro si es la que definitivamente acepté… Sé que dije dos versiones… hubo una… que me convenció más. Pero no estoy seguro de cuál es la que hizo Codex». Y el orden: «Eso es el final. Primero hacemos todo el plan para finalizar el proyecto, hacer la promoción mediante vídeos y todo más, y ya pues valoraremos si el enfoque va a ser ese o no». **Nadie aplica la RFC-001 ni cambia el enfoque** hasta que el fundador confirme cuál de las dos versiones aceptó (puede habérselo dicho a Claude Code en el portátil: si lo sabes, apúntalo aquí).
- **Separar ya (15 oct):** no quiere que quien busque el nombre llegue a la demo con su aviso. «Quiero separarlo ya… la demo de render… es donde haremos las pruebas para corregir pequeñas cosas, hacer configuraciones nuevas, actualizaciones. Pero la parte de oficial de la web, ahí es donde pues estará la web de verdad.» lonaclub.es **nunca** vuelve a apuntar a Render; la demo no se indexa.
- **Dominio confirmado:** lonaclub.es (Infomaniak, comprado el 14-10-2026), con el buzón info@lonaclub.es.
- **Siempre:** no tocar ni quitar lo que funciona sin que lo pida; avisarle de lo que un diseño aprobado trae y no está hecho; nada de pago sin su aprobación; todo en español.

## 5. Siguiente, por orden

0. **Textos legales (0.14.0):** borradores hechos (`docs/LEGAL.md`). El fundador tiene sus tareas y las preguntas para el abogado en `MiProyectoAI/LEGAL-LONA/`. Programación: bloquear usuarios, aviso sin cuenta y correos de la decisión, **hechos en la 0.16.0**; falta T-013 (aviso al salir a enlaces externos).
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
