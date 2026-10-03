# Guía de desarrollo

Para quien vaya a tocar el código (una persona nueva en el equipo, o Claude Code al retomar una sesión). Objetivo: que cualquiera sepa **dónde está cada cosa, por qué ruta ir para hacer algo y cuándo un cambio está terminado**, sin tener que descubrirlo leyendo todo.

- ¿Primera vez? Lee antes [`TRASLADO.md`](TRASLADO.md) (puesta en marcha y estado) y las reglas de [`../CLAUDE.md`](../CLAUDE.md).
- ¿Qué hace la aplicación y con qué reglas de negocio? [`ARQUITECTURA.md`](ARQUITECTURA.md).
- ¿Qué pantalla lanza qué acción, quién puede y qué tabla toca? [`MAPA-FUNCIONAL.md`](MAPA-FUNCIONAL.md) (se genera solo).

## 1. Quiero… → voy a…

| Quiero… | Voy a… |
|---|---|
| Añadir o cambiar una **pantalla** | `src/app/<dirección>/page.tsx` (la carpeta es la dirección, en español). Receta 4.1 |
| Añadir o cambiar lo que hace un **formulario o botón** | `src/app/actions/<módulo>.ts` (módulos de la tabla 2). Receta 4.2 |
| Cambiar **quién puede hacer qué** | `src/lib/accounts/permissions.ts` (`requireAdmin`, `requireOrganizer`) y `src/lib/accounts/auth.ts` (`requireUser`, `requireVerifiedUser`). Las usan por igual las acciones y las pantallas |
| Cambiar un **texto que ve la persona** tras una acción | `src/lib/common/messages.ts` (los códigos `?aviso=` / `?problema=`). Receta 4.3 |
| Cambiar una **regla de negocio** (aura, resultados, récord, fechas…) | `src/lib/<dominio>/…` con su prueba en `tests/unit/`. Receta 4.5 |
| Cambiar el **modelo de datos** | `prisma/schema.prisma` + migración. Receta 4.4 |
| Añadir una **disciplina** o una **categoría de peso** | `src/lib/common/disciplines.ts` (y el enum `Discipline` si es una disciplina nueva) |
| Cambiar **correos** que se envían | `src/lib/common/mail.ts` (envío), `src/lib/community/notify.ts` (avisos a seguidores y decisiones), `src/lib/accounts/auth.ts` (verificación y recuperación) |
| Cambiar los **límites de intentos** | `src/lib/accounts/ratelimit.ts` y las constantes de cada acción |
| Saber **qué se borra y cuándo** | `src/lib/accounts/retention.ts` |
| Añadir un **listado con filtros y páginas** | `src/lib/common/search.ts`, `src/lib/common/pagination.ts`, `src/app/components/Filtros.tsx`, `Paginacion.tsx`. Receta 4.6 |
| Entender por qué existe una **regla extraña** | `docs/LECCIONES.md` (errores pasados y la regla que dejaron) y `docs/AUDITORIA.md` |

## 2. Estructura del repositorio

```
CLAUDE.md                 reglas del fundador y del proyecto (se leen siempre primero)
docs/                     toda la documentación (índice en docs/README.md)
prisma/                   schema.prisma, migrations/ (la verdad del esquema) y seed.ts (datos ficticios)
scripts/                  entorno-aislado.sh (base y servidor propios) y generar-mapa.mjs (docs/MAPA-FUNCIONAL.md)
tests/unit/               vitest: reglas, seguridad, autorización de las acciones, organización del código
tests/e2e/                navegador real (playwright-core + axe): flujos, integridad, acceso, cuenta, búsqueda, filtros, calendario, respaldo del récord, usabilidad, accesibilidad
src/
  instrumentation.ts      comprobaciones al arrancar (variables de entorno obligatorias en producción)
  middleware.ts           limpia las direcciones antes de que lleguen a ninguna pantalla (parámetros repetidos, «constructor», caracteres nulos)
  app/                    LA INTERFAZ: una carpeta por pantalla; cada una con su page.tsx
    actions/              LAS ACCIONES DEL SERVIDOR, un módulo por dominio (tabla de abajo) + shared.ts
    components/           componentes compartidos entre pantallas (avisos, filtros, paginación, etiquetas…)
    layout.tsx            cabecera, navegación, avisos y pie de todas las pantallas
  lib/                    LA LÓGICA: sin interfaz y sin saber nada de las pantallas, agrupada por dominio
    common/               utilidades y catálogos que usa todo el mundo (base de datos, textos, fechas, disciplinas, mensajes, correo…)
    accounts/             sesiones, contraseñas, enlaces de un solo uso, límites de intentos, retención de datos
    fighters/             récord, declaración previa, coherencia de fechas, anonimización, búsqueda de nombres parecidos
    bouts/                reglas de los combates (validar el resultado, clave del enfrentamiento)
    aura/                 reglas para dar aura y ránking por categoría
    community/            avisos de error de usuarios y notificaciones a seguidores
```

### Módulos de acciones (`src/app/actions/`)

| Módulo | De qué trata | Quién lo usa |
|---|---|---|
| `accounts.ts` | Registro, acceso, recuperar contraseña, verificar correo, «Mi cuenta», eliminar cuenta | Cualquiera / con sesión |
| `fighters.ts` | Crear y corregir la ficha, disciplinas, reclamar una ficha existente | Peleador con correo verificado |
| `bouts.ts` | Registrar combates, poner el resultado de los propios, responder al rival, adjuntar evidencia | Peleador / organizador |
| `aura.ts` | Dar y retirar aura | Cuenta con sesión |
| `events.ts` | Pedir ser organizador, crear veladas, montar el cartel, poner resultados | Organizador |
| `moderation.ts` | Decisiones de moderación: combates, reclamaciones, organizadores, sello de gimnasios, avisos | Moderación |
| `community.ts` | Avisos de error, seguir a un peleador | Cuenta con sesión |
| `shared.ts` | Ayudantes comunes de las acciones (`go`, `guard`, `withLock`, `str`…) | Solo los módulos de arriba |

### Quién puede depender de quién (lo vigila `tests/unit/arquitectura.test.ts`)

```
app/pantallas ──▶ app/actions/<módulo> ──▶ app/actions/shared ──▶ lib/…
      │                                                              ▲
      └──────────▶ app/components ───────────────────────────────────┤
                                                                     │
lib/community ─▶ lib/accounts ─▶ lib/common ◀─ lib/fighters, lib/bouts, lib/aura
```

- `lib/common` no depende de ningún otro dominio. `accounts`, `fighters`, `bouts` y `aura` solo dependen de `common`; `community` también de `accounts`.
- **`lib` nunca importa de `app`.** La lógica no sabe que existen las pantallas.
- Un módulo de acciones **nunca importa de otro módulo de acciones**: lo compartido va a `shared.ts` (si es de interfaz) o a `lib` (si es lógica).
- Los componentes de `app/components` no importan acciones.
- Importaciones **relativas**, sin el alias `@/`.
- Si de verdad hace falta una dependencia nueva, se discute, se cambia la tabla de `arquitectura.test.ts` **y** este documento en el mismo cambio.

## 3. Convenciones

- **Idioma.** Todo lo que llega a una persona va en español («correo electrónico», «peleador»). Los identificadores del código van en inglés (convención técnica). El glosario de abajo traduce uno a otro. Pasar el código al español exigiría preguntárselo antes al fundador.
- **Seguridad de las acciones.** Todo lo que un módulo de `actions/` exporta es un punto de entrada público (un POST que cualquiera puede lanzar): solo se exportan funciones `async` de verdad públicas; los ayudantes van sin exportar o en `shared.ts`. **Cada acción comprueba por sí misma quién la ejecuta** (nunca se fía de que la pantalla lo haya comprobado) y valida todo lo que recibe.
- **Claves que vienen del usuario:** nunca `in` ni `obj[clave]`; se usa `hasOwn` / `lookup` de `lib/common/safe.ts`. Los parámetros de la dirección llegan ya limpios (`src/middleware.ts`: un solo valor por parámetro, sin `constructor` ni caracteres nulos); los campos de formulario se leen con `str()` de `actions/shared.ts`.
- **Sin sesión nunca se redirige en silencio:** una pantalla privada usa `requireUser("/ruta")` / `requireAdmin("/ruta")` (llevan a «Entrar» con el motivo y vuelven a esa ruta tras entrar); fuera de eso, `loginPath(ruta)` de `lib/common/paths.ts`.
- **Mensajes:** las acciones terminan siempre en `go(ruta, { aviso | problema })`; el texto está en `lib/common/messages.ts`. Nunca una pantalla vacía ni una redirección muda.
- **Registro de cambios:** todo cambio que afecte a la fiabilidad (verificar, rechazar, aprobar, borrar…) llama a `audit()` dentro de la misma transacción.
- **Reglas compartidas, en un solo sitio:** si el servidor y la interfaz necesitan la misma regla (por ejemplo «¿puede esta persona dar aura aquí?»), vive en `lib` y se usa desde los dos lados.
- **Usabilidad:** las 11 comprobaciones del principio fundacional de `CLAUDE.md` se aplican a todo cambio de interfaz (una acción principal por pantalla, botones con verbos, lenguaje llano, etiquetas visibles, errores que explican cómo arreglarlos, respuesta visible a cada acción, accesibilidad, ayuda a mano…).
- **Diseño visual:** pospuesto por petición del fundador. No se toca el aspecto (paleta, estilo) sin su permiso.
- **Commits:** en español, con una primera línea que diga qué cambia para la persona o el sistema, y el cuerpo con el porqué.
- **Datos de ejemplo:** el seed es ficticio; nunca se inventan récords de personas reales.

### Glosario código ↔ producto

| En el código | En la aplicación |
|---|---|
| `Fighter` | peleador (ficha pública con su récord) |
| `Bout` | combate · `Event` velada · `Gym` gimnasio · `Trainer` entrenador |
| `Verification`: `SELF_REPORTED` · `CONFIRMED` · `VERIFIED` · `DISPUTED` | «Declarado · confirmación opcional» · «Confirmado por el rival» · «Verificado» · «En revisión» |
| `Aura` | aura (el reconocimiento del público; un clic por persona y combate) |
| `Role`: `FAN` · `FIGHTER` · `ORGANIZER` · `ADMIN` | aficionado · peleador · organizador · moderación |
| `ClaimRequest` | reclamación de una ficha existente |
| `OrganizerRequest` | solicitud para organizar veladas |
| `Report` | aviso de error de un usuario |
| `AuditLog` | historial de cambios (solo moderación) |
| `EmailToken` (`VERIFY`, `RESET`, `UNSUB`) | enlaces de un solo uso por correo: verificar, nueva contraseña, dejar de recibir avisos |
| `listed: false` | peleador provisional (declarado por un rival; no sale en listados hasta que su titular lo reclama) |

## 4. Recetas

### 4.1 Añadir una pantalla
1. Crea `src/app/<dirección-en-español>/page.tsx` (Server Component). Pon `export const metadata = { title: "…" }` y un único `<h1>` con la acción principal evidente.
2. Si lee datos, hazlo con `db` (`lib/common/db`) en la propia pantalla; si necesita una regla, que viva en `lib/…`, no en la pantalla.
3. Si es privada, empieza por la guarda (`requireUser()`, `requireVerifiedUser()`…) o por la comprobación equivalente. Aunque la pantalla lo compruebe, las acciones que lance lo comprobarán otra vez.
4. Si debe estar en el menú o en el mapa del sitio: `src/app/layout.tsx` (la navegación tiene **5 elementos como máximo**) y `src/app/sitemap.ts`.
5. Añade su caso a `tests/e2e/accesibilidad.mjs` (lista de pantallas medidas con axe) y, si tiene lógica, a la prueba de navegador que corresponda.
6. `npm run mapa` y sube `docs/MAPA-FUNCIONAL.md`.

### 4.2 Añadir una acción del servidor (un formulario o botón que hace algo)
1. Elige el módulo de `src/app/actions/` por dominio (tabla 2). Si no encaja en ninguno, plantea un módulo nuevo antes de forzar uno existente.
2. Escribe `export async function nombre(f: FormData)` con este orden: **guarda de permisos → lectura y validación de lo recibido (`str`, `checkLengths`…) → límites (`allow`, `withLock`) → cambio dentro de `guard(back, …)`/transacción con `audit()` → avisos/correos con `after()` → `go(destino, { aviso })`.**
3. Cada rechazo es un `go(back, { problema: "codigo" })` con un código que **tenga su texto** (receta 4.3).
4. En `tests/unit/autorizacion.test.ts`, añade la acción a la lista que corresponda (solo moderación, solo organizadores, exige correo verificado, exige sesión). La prueba falla si una acción exportada no está clasificada.
5. Añade su comprobación en `tests/e2e/` (camino feliz y al menos un rechazo) esperando a un estado visible (`seen()`), con datos únicos por ejecución.
6. Conecta el formulario en la pantalla con un botón cuyo texto diga lo que hace («Guardar cambios»), y `npm run mapa`.

### 4.3 Añadir o cambiar un mensaje para la persona
1. Añade el código y el texto en `AVISOS` (algo ha ido bien) o `PROBLEMAS` (algo no ha podido hacerse) de `src/lib/common/messages.ts`. Texto en español llano, amable, sin culpar, y que diga **cómo arreglarlo**.
2. `tests/unit/messages.test.ts` falla si usas un código sin texto o un texto vacío.

### 4.4 Cambiar el modelo de datos
1. Edita `prisma/schema.prisma`.
2. `npx prisma migrate dev --name descripcion_del_cambio` (crea la migración en `prisma/migrations/`). **No** uses `--force-reset` ni `db push` fuera de una base desechable; Prisma se niega a `--force-reset` cuando lo lanza una IA y no se debe sortear.
3. Sube schema y migración **juntos**: el CI aplica las migraciones a una base vacía y falla si no reproducen exactamente el esquema.
4. Si cambia algo que afecta a «Mi cuenta → descargar mis datos» o a la eliminación de cuenta (datos personales), actualiza `src/app/mi-cuenta/datos/route.ts` y `lib/fighters/anonymize.ts`, y la política de `/privacidad`.
5. Actualiza `docs/ARQUITECTURA.md` (modelo de datos) y `npm run mapa`.

### 4.5 Añadir una regla de negocio
1. Escríbela como función **pura** en el dominio de `src/lib/` que le toque (sin leer la base de datos ni `redirect`), con su prueba en `tests/unit/` que cubra los casos límite.
2. Úsala desde la acción **y** desde la interfaz si ambas la necesitan.
3. Si el dominio no es obvio, mira la tabla de dependencias de la sección 2 antes de crear la importación.

### 4.6 Añadir un listado con filtros
1. Consulta con `searchIds`/los ayudantes de `lib/common/search.ts` (búsqueda sin tildes) y pagina con `lib/common/pagination.ts`.
2. Usa `Filtros.tsx` (campo con etiqueta visible, «Aplicar filtros» y «Quitar filtros») y `Paginacion.tsx`.
3. Lee los parámetros de la dirección con `flatParams`/`oneParam` y `lookup` (nunca con `obj[clave]`).

### 4.7 Añadir un dominio nuevo en `src/lib`
Crea la carpeta, añádela a `PERMITIDAS` en `tests/unit/arquitectura.test.ts` con sus dependencias, y descríbela en la sección 2 de este documento. La prueba falla si aparece una carpeta que no está declarada.

## 5. Cómo se prueba

| Qué | Cómo | Cuándo |
|---|---|---|
| Tipos | `npm run typecheck` | siempre, antes de subir |
| Unitarias | `npm test` | siempre (reglas, seguridad, autorización, mensajes, organización del código) |
| Navegador | `npm run test:e2e` y `npm run test:a11y` con el servidor en marcha (README) | cuando cambia una pantalla o una acción |
| Entorno propio | `scripts/entorno-aislado.sh iniciar <nombre> <puerto> --semilla` | para probar sin pisar a otra persona (cada una tiene su base y su servidor) |
| Recorridos por personas | Guion en `docs/pruebas/personas.md`; con Claude Code, `docs/pruebas/qa-por-personas.workflow.js` lanza agentes que lo recorren en navegador real (instrucciones en el propio fichero). Cada hallazgo se reproduce antes de corregirlo y se anota en `docs/pruebas/hallazgos-<fecha>.md` | antes de dar por bueno un bloque de funcionalidad |

Reglas aprendidas (detalle en [`LECCIONES.md`](LECCIONES.md)): las pruebas de navegador **esperan a un estado visible** (`seen()`), usan **datos únicos por ejecución** y no dependen del volumen de la base; una comprobación negativa solo vale si se ha visto fallar contra el código roto; tras reiniciar el servidor local se comprueba que no hay `EADDRINUSE`.

## 6. Definición de «terminado»

Un cambio no está terminado hasta que:

1. **Funciona de principio a fin** en el navegador (no solo compila): lo has probado como lo haría una persona, incluido el caso en que algo sale mal.
2. `npm run typecheck`, `npm test` y las pruebas de navegador afectadas pasan, y el CI está en verde.
3. Cumple el principio de usabilidad de `CLAUDE.md` (lenguaje llano, un botón principal, errores que explican cómo arreglarlos, accesibilidad).
4. Tiene prueba: una unitaria si hay regla, una de navegador si hay flujo; y la de autorización si es una acción.
5. `npm run mapa` está ejecutado y `docs/MAPA-FUNCIONAL.md` sube con el cambio.
6. La documentación está al día: entrada **al final** de `docs/DIARIO.md` (qué se pidió, qué se decidió y por qué, qué se hizo, qué salió mal, estado y próximos pasos), `docs/IDEAS.md`, `docs/LECCIONES.md` (cada error con su causa real y la regla resultante) y `docs/ARQUITECTURA.md` si cambia el estado técnico.

## 7. Trabajo en equipo

- Una rama por tarea, con un nombre que diga qué hace; cambios pequeños y con su prueba. El CI se ejecuta en cada subida y cancela la anterior de la misma rama.
- Antes de empezar una tarea, mira `docs/TRASLADO.md` (estado y pendientes) y `docs/AUDITORIA.md` (qué se sabe roto).
- Cada persona (o agente) prueba en **su propio entorno aislado** para no pisar la base de datos de otra.
- Las decisiones que no son técnicas (política de menores, texto legal de privacidad, estilo visual, tú/usted…) **las toma el fundador**: están listadas en `docs/TRASLADO.md` §7. No se deciden por él.

## 8. Equivalencias con las rutas antiguas

Los documentos históricos (`DIARIO.md`, `AUDITORIA.md`) citan los ficheros con las rutas que tenían entonces. Hasta el 1 de octubre de 2026 el código estaba plano (`src/app/actions.ts` con todas las acciones y `src/lib/*.ts` sin carpetas). Para encontrar algo que citan:

| Antes | Ahora |
|---|---|
| `src/app/actions.ts` | `src/app/actions/<módulo>.ts` (cuentas → `accounts`, ficha → `fighters`, combates → `bouts`, aura → `aura`, veladas → `events`, moderación → `moderation`, avisos y seguir → `community`) y `shared.ts` para los ayudantes |
| `src/app/{DisciplineFields,Filtros,FlashNotice,Paginacion,RecordCards,RecordarCampos,VerificationTag}.tsx` | `src/app/components/` |
| `src/lib/{db,env,text,safe,dates,paths,url,pagination,names,labels,messages,mail,audit,search,disciplines}.ts` | `src/lib/common/` |
| `src/lib/{auth,password,ratelimit,retention}.ts` | `src/lib/accounts/` |
| `src/lib/{fighters,record,prior,coherence,anonymize}.ts` | `src/lib/fighters/` |
| `src/lib/rules.ts` (resultados y clave del enfrentamiento) | `src/lib/bouts/rules.ts` |
| `src/lib/rules.ts` (reglas del aura) | `src/lib/aura/rules.ts` |
| `src/lib/aura.ts` (ránking) | `src/lib/aura/ranking.ts` |
| `src/lib/{reports,notify}.ts` | `src/lib/community/` |


## Añadir o actualizar un reglamento de categorías

Consultar la fuente primaria y su vigencia; documentar país/federación, modalidad, edición, edad, sexo, pesos y excepciones en `DISENO-PESOS.md`. Las divisiones se añaden en `lib/common/competition.ts` con identificadores nuevos por versión: nunca cambiar el significado de un id guardado. El texto puede mejorarse; el id se conserva aunque contenga el nombre original del grupo. No completar pesos ausentes por analogía con otra edad, sexo, federación o disciplina.

Ficha y combate guardan divisiones independientes; usar `parseCompetitionChoice` en cada entrada de servidor y las guardas de edad en la fecha pertinente. Un catálogo deportivo no acredita licencia ni autorización de menores. Probar límites normativos en `competition.test.ts` y recorridos en `categorias.mjs`, incluida manipulación del formulario, ambos participantes y permanencia histórica. Ejecutar migraciones/paridad, tipos, mapa, unitarias, compilación, navegador y accesibilidad.

## Cambiar trayectoria, respaldo o navegación

- Puntos y etiquetas: `src/lib/aura/trajectory.ts`; agregación por categoría histórica: `ranking.ts`. Mantener política central, mayor título por categoría, respaldo no acumulable y retirada de bonus al revocar acreditación.
- Permisos de quien respalda: `src/lib/accounts/backing.ts`, independientes del perfil visual y del rol del cartel. Acciones autenticadas: `src/app/actions/trajectory.ts`; no exportar ayudantes desde ese módulo.
- Gestión propia `/mi-ficha/trayectoria`, revisión `/respaldar`, acreditaciones `/moderacion/acreditaciones`. Propiedad, disciplina, identidad, versiones, fuente y auditoría se verifican en el servidor. Cada cambio de hechos/fuentes debe invalidar su respaldo.
- Navegación: `NavigationMenu.tsx` recibe sesión/permisos y el formulario de salir como propiedades; no importa acciones. `layout.tsx` obtiene permisos en el servidor. Usar diálogo nativo, foco/Escape y destinos existentes; mantener máximo cinco enlaces por grupo.
- Pruebas: `trayectoria.test.ts`, `ranking-trayectoria.test.ts`, permisos en `autorizacion.test.ts`; navegador `trayectoria.mjs` y `menu.mjs`; además la regresión y axe completos. Regenerar mapa tras nuevas rutas/acciones/modelos.

## Colas, decisiones y respuesta visible

Contar antes de consultar una ventana con `pageNumber/pageWindow`; ordenar con una clave estable de desempate. No sustituir paginación por un corte fijo. `Paginacion` admite parámetro y etiqueta propios por cola; conserva filtros y las otras páginas. Se usan 50 filas por página en moderación, respaldos, acreditaciones e historial.

Formularios pasan `back` con filtros, página y sección. `returnTo` solo admite la pantalla propia, además de `internalPath`; no ampliar los destinos arbitrariamente. `go` conserva consultas completas, sustituye el aviso anterior y guarda el fragmento como `seccion`: Next puede perder fragmentos en redirecciones de Server Actions. `FlashNotice` enfoca/desplaza al aviso y ofrece vuelta a secciones conocidas de la ruta; no se interpreta contenido arbitrario como un enlace.

Decisiones deben validar su opción y escribir con el estado y los hechos leídos. Avisos se reservan con `updateMany` antes de actuar sobre el dato, dentro de la transacción. Evidencias incluyen estado, resultado y fecha de respaldo en la condición. La última solicitud de un título se consulta por título (DISTINCT ON parametrizado), sin un límite global que permita desplazar a otros. Recorrido de volumen y pantallas antiguas: `tests/e2e/pulido.mjs`.

En una página que usa `requireVerifiedUser` o `requireSupportActor`, pasar su ruta como `next` para devolver a la persona después de iniciar sesión. Probar el enlace de acceso y el regreso completo con un rol autorizado; recordar el destino no concede permiso para entrar.
