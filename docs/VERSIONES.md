# Control de versiones de Lona

> **Petición del fundador, 13 de octubre de 2026:** «Es importante llevar un buen manejo de versiones para la aplicación, tenlo en cuenta
> y en caso de que no lo estés haciendo, aplícalo».
>
> Hasta ese día no se hacía. `package.json` decía `0.1.0` desde el principio, no había etiquetas ni registro de cambios, y la única
> forma de saber qué había en la demo era leer el diario o la lista de PR. Ese mismo día se implantó lo que explica este documento y se
> reconstruyeron las versiones anteriores (0.1.0 a 0.8.0) a partir de los PR fusionados.

## Para qué sirve

- **Saber qué hay en marcha.** La versión se ve en la ayuda (abajo del todo), en el panel de moderación («Estado de la aplicación», con
  el commit), en `/salud` y en cada fallo registrado.
- **Saber qué cambió y cuándo.** [`CHANGELOG.md`](../CHANGELOG.md) cuenta cada versión en lenguaje llano. De ahí sale lo que se cuenta a
  los usuarios («Novedades») y lo que se explica a quien se incorpore al equipo.
- **Relacionar fallos con cambios.** Cada fallo del registro guarda la versión en la que apareció por primera vez y la última. Si un
  fallo resuelto reaparece en una versión posterior, el arreglo no funcionó.
- **Volver atrás con seguridad.** Cada versión tiene su etiqueta `vX.Y.Z` en GitHub, creada solo si pasó todas las pruebas: es un punto
  conocido y probado al que se puede volver.
- **Las tiendas lo exigen.** App Store y Google Play piden un número de versión que suba en cada publicación ([`PUBLICACION.md`](PUBLICACION.md)).

## Cómo se numera (versionado semántico adaptado)

`MAYOR.MENOR.PARCHE`, por ejemplo `0.9.0`.

| Se sube… | Cuándo | Ejemplo |
|---|---|---|
| **PARCHE** (`0.9.0 → 0.9.1`) | Arreglos, textos, documentación, pruebas o dependencias. Nada nuevo para el usuario. | Corregir un contraste; actualizar una librería. |
| **MENOR** (`0.9.1 → 0.10.0`) | Algo nuevo o un cambio notable en lo que ya existía. | El mapa de gimnasios; el tema claro. |
| **MAYOR** (`0.x → 1.0.0`) | Un hito decidido por el fundador, o un cambio que obliga a algo a quien ya usa la aplicación (por ejemplo, volver a aceptar condiciones o perder un dato). | **1.0.0 = lanzamiento público del 15 de noviembre de 2026** ([`LANZAMIENTO.md`](LANZAMIENTO.md)). |

- Mientras la versión empiece por **0**, la aplicación está en preparación: el lanzamiento público será la 1.0.0.
- Los cambios de la base de datos (migraciones) no suben la versión mayor por sí solos si se aplican sin que el usuario haga nada.
- Si un PR mezcla cosas, manda la más grande: si trae algo nuevo, es MENOR aunque también arregle fallos.

## Qué hay que hacer en cada PR (personas y asistentes)

1. Mientras trabajas, apunta lo que cambia en `## [Sin publicar]` de [`CHANGELOG.md`](../CHANGELOG.md), en sus grupos: **Añadido**,
   **Cambiado**, **Corregido**, **Eliminado** y **Seguridad**. Escríbelo para personas, no para programadores. «La lista de gimnasios
   queda debajo del mapa» sí; «refactor de MapaGimnasios.tsx» no.
2. Antes de pedir la revisión, sube la versión:
   ```bash
   node scripts/version.mjs subir menor     # o parche, o mayor (tabla de arriba)
   ```
   Cambia `package.json` y `package-lock.json` y convierte «Sin publicar» en `## [0.10.0] — fecha`. Revisa el resultado y añade al
   principio de la sección el número del PR («PR #47.»).
3. El CI lo comprueba en cada PR (`node scripts/version.mjs comprobar <versión de la rama de destino>`). Falla si:
   - la versión no es mayor que la de la rama de destino;
   - `package.json` y `package-lock.json` no coinciden;
   - el registro no tiene la sección de la versión, o la tiene vacía.
4. **Si dos PR abiertos suben a la misma versión**, el segundo que se fusione tiene que subirla otra vez: después de traer la rama de
   destino, `node scripts/version.mjs subir parche` (o menor) y juntar sus notas en la nueva sección.
5. Los PR automáticos de dependencias (Dependabot) también deben subir el parche antes de fusionarse: quien los fusiona lo hace.

## Qué pasa al fusionar

Al fusionar en `claude/ring-espana-mvp` (la rama de la demo):
1. Render despliega la demo con esa versión.
2. El CI vuelve a pasar todas las pruebas. Si pasan, el trabajo `etiquetar` crea la etiqueta `vX.Y.Z` en el commit de la fusión. También
   crea las de las versiones anteriores que aún no la tengan, según la línea «Fusión: `commit`» de cada una en el registro. Es el único
   trabajo del CI con permiso de escritura y tarda unos segundos.
3. Si las pruebas fallan después de fusionar, no se crea la etiqueta: la versión no se da por buena hasta que un arreglo (PARCHE) pase.

> Las etiquetas las crea el CI porque desde las sesiones de Claude en la nube no se pueden crear etiquetas en GitHub (el proxy bloquea
> esa escritura). Una persona con acceso puede crearlas también a mano (`git tag v0.9.0 <commit> && git push origin v0.9.0`), pero
> no hace falta.

## Cómo volver a una versión anterior

Si una versión publicada rompe algo grave y el arreglo no es inmediato:
1. **En Render:** en el servicio, «Manual Deploy» → «Deploy a specific commit» con el commit de la etiqueta anterior (lo da
   `git rev-list -n 1 v0.8.0`). Es lo más rápido, porque no toca el repositorio.
2. **Si la versión nueva traía una migración de la base de datos**, comprobar antes que la versión anterior funciona con ese esquema. Las
   migraciones de Lona solo añaden columnas o tablas opcionales, que el código anterior ignora, pero hay que mirarlo en cada caso. Nunca
   se borran datos para volver atrás.
3. Después, el arreglo va en un PR normal con una versión PARCHE nueva, nunca reescribiendo la historia de la rama.
4. Se anota en el [diario](DIARIO.md) y, si hubo un error de proceso, en [lecciones](LECCIONES.md).

## Cuando haya producción (antes del 1 de noviembre)

La versión real (producción) se separará de la demo ([`LANZAMIENTO.md`](LANZAMIENTO.md), punto 1). Entonces:
- la demo seguirá recibiendo cada versión al fusionar;
- producción recibirá **solo versiones etiquetadas** y elegidas a propósito (se despliega una etiqueta, no una rama);
- la 1.0.0 será la primera versión de producción abierta al público.

Esto se detallará aquí cuando se monte producción.

## Dónde está cada pieza

| Pieza | Qué hace |
|---|---|
| [`CHANGELOG.md`](../CHANGELOG.md) | Registro de cambios, de la versión más nueva a la más antigua. |
| `package.json` → `version` | El número de la versión. Única fuente: todo lo demás lo lee de aquí. |
| [`scripts/version.mjs`](../scripts/version.mjs) | `subir`, `comprobar` y `etiquetas`. |
| [`src/lib/common/version.ts`](../src/lib/common/version.ts) | `VERSION` y `commitDesplegado()` para el servidor (nunca en componentes de cliente). |
| `AppError.firstVersion` y `AppError.version` | Versión en la que apareció cada fallo por primera y por última vez. |
| `.github/workflows/ci.yml` | Paso «Comprobar la versión…» y trabajo `etiquetar`. |
