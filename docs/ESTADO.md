# Estado vivo de Lona — lo primero que se lee

> **Para qué sirve (petición del fundador, 14 de octubre de 2026):** Claude en la nube o en el móvil, Claude Code en el portátil, Codex y cualquier otro asistente **no se pueden hablar entre sí**. El repositorio es su único canal. Este archivo es la página corta que dice cómo está todo **ahora**, para no repetir lo que el fundador ya hizo o dijo en otra sesión ni pisarse el trabajo.
>
> **Al empezar:** `git fetch` y `node scripts/estado.mjs` (lo que dice la realidad en directo: demo, ramas y PR en curso, ficheros que dos trabajos tocan a la vez) y lee esta página. **Antes de un trabajo grande:** `node scripts/estado.mjs reservar <asistente> "<tema>"`. **Al terminar:** actualiza tu fila y lo que cambie. Reglas completas al final.

**Última revisión completa:** 14 de octubre de 2026 (Claude, nube). Si el script avisa de que tiene más de 3 días, no te fíes sin mirar el script.

## 1. Dónde estamos

- **Demo** (rama `claude/ring-espana-mvp`, https://ring-espana-demo.onrender.com/): versión **0.12.1**. Trae el mapa de gimnasios, el control de versiones, las veladas pasadas con autorización de moderación, el récord amateur oculto, la regla de las 24 horas, la búsqueda de sparring por ciudad y gimnasio, entrar con Google (el botón solo sale cuando hay claves en Render) y los arreglos de los paneles del bloque E.
- **Calendario** ([`LANZAMIENTO.md`](LANZAMIENTO.md)): aplicación lista el **1 de noviembre**, lanzamiento público el **15 de noviembre**.
- **Repositorio:** sigue **público**. El fundador debe pasarlo a privado (Settings → Change visibility); ningún asistente puede hacerlo.
- **Versiones:** cada PR sube la versión y apunta su cambio ([`VERSIONES.md`](VERSIONES.md)). Con varios PR abiertos a la vez, el que se fusiona después renumera.

## 2. En curso (cada asistente edita solo su fila)

| Quién | Qué | Rama y PR | Estado |
|---|---|---|---|
| Claude (nube, el chat del móvil) | Este relevo entre sesiones (`ESTADO.md` y `scripts/estado.mjs`) | `claude/relevo-entre-sesiones`, versión 0.12.2 | en curso |
| Claude Code (portátil) | **Versión real en Cloud Run**, separada de la demo, en `lonaclub.es` (ADR-005, aprobada por el fundador el 14-10-2026), y **base de la demo pasada a Neon** | `claude/produccion-cloud-run`, **#57**, versión 0.13.0 | **en pausa por decisión del fundador** hasta que dé por buena la app (ver sección 4). Hecho: base real `lona-produccion` vacía, base de la demo `lona-demo` en uso, Google en info@lonaclub.es (`lona-511614`). Hay que fusionar #57 pronto: su `render.yaml` evita que Render vuelva a enlazar la base que caduca |
| Codex (**sin créditos**, según el fundador el 14 oct) | Paneles por tipo de usuario, **bloque F** (pendientes en «Te toca», aura desde el panel, registro en dos pasos…) | `codex/paneles-f-pulido`, **#56** (borrador), 0.12.2 | parado; al volver hay que **cambiar su destino** (apuntaba a #55, ya fusionado) y **renumerar a 0.12.3** si este PR se fusiona antes |
| Dependabot | Actualizaciones de librerías | #17, #19, #20 | sin revisar |

⚠ **El encargo de los paneles** (bloques F, G y H) que citan el diario y `IDEAS.md` —`docs/ecosistema/traspasos/2026-10-14-claude-encargo-codex-paneles-por-usuario.md`— **no está en el repositorio**: no existe en ninguna rama. Quien lo tenga (el portátil) debe subirlo; sin él, nadie más puede continuar G y H.

## 3. Lo que solo puede hacer el fundador

1. **Poner el repositorio en privado.**
2. **Claves de Google** ([`GOOGLE.md`](GOOGLE.md)): proyecto en Google Cloud, ID de cliente con la dirección de vuelta de la demo, y pegar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en Render (nunca en el chat). Mientras no haya dominio propio, **no pulsar «Publicar aplicación»** (Google pide verificar los dominios); basta el modo de prueba con él como usuario. Con el dominio real habrá que añadir su dirección de vuelta.
3. **Cuentas de producción** de #57 (facturación de Google Cloud, R2, Resend y Sentry), cuando el fundador decida montar la versión real. Neon ya está; **la demo ya usa su base de Neon** (`lona-demo`) desde el 14-10-2026, así que la caducidad de la base de Render ya no la afecta.
4. **UptimeRobot** y cambiar la clave de noticias `CRON_SECRET`.
5. **Decisiones:** menores (T-014: abrir solo a mayores de 18 o hacer la política), abogado para condiciones de uso y privacidad, y los gastos que falten por aprobar ([`LANZAMIENTO.md`](LANZAMIENTO.md), sección 2).

## 4. Lo que el fundador ha dicho (para no repetírselo)

- **Codex sin créditos (14 oct):** «hazlo tú, todo lo que haya que hacer, hazlo tú». Si Claude también se queda sin créditos, deja una ficha o un texto completo para que Codex lo haga cuando se le regeneren (ejemplo: [`tareas/T-015-entrar-con-google.md`](tareas/T-015-entrar-con-google.md)). Todo se escribe en el repositorio, nunca solo en el chat.
- **Orden de trabajo:** primero validar, corregir y publicar lo anterior; solo entonces empezar lo nuevo.
- **Entrar con Google sí; Apple aplazado** hasta el lanzamiento (Apple lo exigirá en la tienda si hay otros inicios de sesión de terceros).
- **Dominio:** lona.es y lona.com están ocupados. Pidió más nombres; según #57 se eligió **lonaclub.es**. Falta que el fundador lo confirme por escrito aquí. También mencionó Infomaniak (dominio y correo); sin decidir y sin precios comprobados.
- **Mejoras de las veladas:** dijo que tenía y que las daría; sigue a la espera de su lista.
- **Versión real (14 oct, tarde):** primero hay que comprobar que la app está bien desarrollada y, solo después, montar la versión oficial en lonaclub.es. Tiene que ser «la aplicación real y definitiva»: sin datos de prueba, sin avisos de demo y completamente independiente de la demo. Habrá un espacio de pruebas aparte (la demo) para las próximas actualizaciones. No hay que pulsar «Publicar app» en Google hasta entonces. Hoy lonaclub.es enseña la demo de forma provisional: **no poner `APP_URL=https://lonaclub.es` en Render**.
- **Dominio confirmado:** lonaclub.es (Infomaniak, comprado el 14-10-2026), con el buzón info@lonaclub.es.
- **Siempre:** no tocar ni quitar lo que funciona sin que lo pida; avisarle de lo que un diseño aprobado trae y no está hecho; nada de pago sin su aprobación; todo en español.

## 5. Siguiente, por orden

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
