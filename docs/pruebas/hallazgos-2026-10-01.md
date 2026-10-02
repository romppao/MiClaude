# Hallazgos del 1 de octubre de 2026: pruebas por personas y revisión de código

Registro de lo que salió de dos flujos de agentes lanzados sobre la aplicación y de qué se hizo con cada cosa. Es el modelo para los siguientes: **cada hallazgo se reproduce (o se razona sobre el código) antes de corregirlo, se corrige con su prueba y se anota aquí.**

**Honestidad sobre el alcance.** Los dos flujos se cortaron por el límite de uso de la sesión. Del flujo de **personas de prueba** terminó solo 1 de 10 (el visitante sin cuenta, 19 hallazgos); del de **revisión de código** terminaron 3 de 6 revisores (acciones, cuentas y correo, interfaz: 44 hallazgos) y **ninguna de las verificaciones adversariales** (94 agentes). Por eso los hallazgos de la revisión no están verificados por terceros: los reproduje o razoné sobre el código antes de tocarlos. Los revisores «pruebas», «documentos» y «datos y privacidad» no llegaron a ejecutarse. Una segunda tanda de personas (aficionado, peleador, rival, organizador y moderadora) se lanzó después sobre la versión corregida; su registro está al final.

Tipos de hallazgo: ver [`personas.md`](personas.md). Estados: **corregido** (con prueba), **parcial**, **decisión del fundador**, **pendiente**.

## Persona «visitante sin cuenta» (19)

| ID | Hallazgo | Gravedad | Estado | Cómo se resolvió |
|---|---|---|---|---|
| V1 | La ficha de una velada se desborda a 360 px (584 px) | alta | corregido | Tabla apilada en pantallas estrechas; la prueba de móvil crea su propia velada y mide |
| V2 | En móvil, «Dar aura» queda fuera de la pantalla | media | corregido | Tabla de combates apilada (`table.apilada`); la prueba comprueba que el enlace está a la vista |
| V3 | Sin cuenta no se ve cómo avisar de un error | media | corregido | Enlace «Entra en tu cuenta para avisarnos» en la ficha (y «Confirma tu correo…» si falta confirmar) |
| V4 | Quien se registra desde «Entra para dar aura» pierde el sitio | media | corregido | `next` viaja por «Entrar» → «Registro»; cookie de 2 h con la ruta; «Volver a lo que estabas haciendo» al confirmar. Prueba de navegador |
| V5 | Las pantallas privadas redirigen a «Entrar» sin mensaje | media | corregido | `requireUser(ruta)` / `requireAdmin(ruta)` / `loginPath()`; prueba de las seis pantallas privadas |
| V6 | Un resultado pendiente se oculta en la ficha del rival pero se ve en la velada | media | corregido | Misma regla en ambos sitios: «pendiente de confirmar por el rival» |
| V7 | `?constructor=y` da error 500 en siete pantallas | media | corregido | `src/middleware.ts` + prueba unitaria y de navegador (11 pantallas × 4 direcciones hostiles) |
| V8 | La privacidad dice «escríbenos» y no hay contacto | media | **decisión del fundador** | El texto ya no promete contacto si no lo hay y el pie enseña «Contacto» cuando existe `CONTACT_EMAIL`. **Falta definir el correo real de contacto** |
| V9 | Combates futuros: «Sin resultado», aura vacía y «verificado» sin resultado | baja | corregido | «Próximo combate» / «Resultado por anotar»; el aura explica por qué no se puede dar |
| V10 | El récord «1-0-0» no se explica | baja | corregido | Leyenda «victorias – derrotas – empates» |
| V11 | «no oficial» solo se explica con un aviso emergente | baja | corregido | Texto visible bajo el título |
| V12 | «1 auras dadas» | baja | corregido | `plural()` en los cuatro contadores |
| V13 | «Entrar» sin contexto cuando se llega desde «Entra para…» | baja | corregido | Con V4 |
| V14 | «Escribe algo arriba» con dos buscadores | baja | corregido | Texto cambiado |
| V15 | El texto de ejemplo del buscador no llega a contraste AA | baja | corregido | `::placeholder` más claro |
| V16 | Con 320 px el buscador de la cabecera ensancha la pantalla | baja | corregido | `min-width:0` y flexible |
| V17 | No hay favicon (404 en consola) | baja | **pendiente (diseño)** | Se resolverá con la identidad visual: un icono provisional sería diseño |
| V18 | Las provincias no están en orden alfabético por lo que se muestra | baja | corregido | Lista ordenada por nombre |
| V19 | El título de `/recuperar` es el de otra pantalla; `/baja` con enlace inválido promete «pedir uno nuevo» | baja | corregido | Título propio y mensaje `baja_invalida` con qué hacer |

## Revisión de código: acciones del servidor (15)

| ID | Hallazgo | Gravedad | Estado | Cómo se resolvió |
|---|---|---|---|---|
| A1 | El bloqueo del acceso se salta con peticiones en paralelo | media | corregido | `reservar()` antes del hash; prueba con 200 peticiones simultáneas |
| A2 | `resetPassword` calcula un hash de 64 MiB antes de validar el enlace y sin límite | media | corregido | Límite + comprobación del enlace primero; prueba de que el hash no se calcula |
| A3 | Un combate confirmado sin resultado queda atascado | media | corregido | El autor puede añadir el resultado y el combate vuelve a «pendiente de confirmar» |
| A4 | La confirmación del rival no queda ligada al resultado que vio | media | corregido | Huella `boutVersion` + escritura condicionada |
| A5 | Eliminar la cuenta deja nombres en el historial | media | corregido | Se vacían `before`/`after` de las filas de la cuenta y de la ficha |
| A6 | Ocultar una ficha es irreversible y deja a su titular atado | media | **parcial** | Nota obligatoria y solo fichas sin titular. No hay «restaurar»: el borrado de datos es deliberado (derecho de supresión) |
| A7 | Las decisiones de moderación no se condicionan al estado | baja | corregido | `updateMany` con el estado esperado + aviso `solicitud_cambiada` / `combate_cambiado` |
| A8 | El tope de 10 combates al día no resiste peticiones simultáneas | baja | corregido | Bloqueo y recuento dentro de la transacción |
| A9 | Ocultar un aviso sobre una ficha inexistente da error 500 | baja | corregido | `no_existe` |
| A10 | Recuperar la contraseña invalida los enlaces de baja de avisos | baja | corregido | Solo se anulan los de verificación y recuperación |
| A11 | `findNameCandidates` ignora «ç», «ã», «õ» | baja | corregido | Misma tabla de letras que la búsqueda |
| A12 | Si el único homónimo eres tú, el combate se pierde en silencio | baja | corregido | Tu propia ficha no cuenta como candidata |
| A13 | Nombres no latinos se funden en una misma velada o gimnasio | baja | corregido | `slugName()` añade una huella del nombre; prueba unitaria |
| A14 | La limpieza de cuentas sin verificar puede borrar a un moderador | baja | corregido | Solo cuentas FAN y FIGHTER |
| A15 | Un cartel oficial publica la ficha provisional con nombre completo | baja | **decisión del fundador** | Es la decisión actual («aparecer en un cartel oficial hace pública la ficha»), pero afecta a datos de terceros: ver `TRASLADO.md` §7 |

## Revisión de código: cuentas y correo (10)

| ID | Hallazgo | Estado |
|---|---|---|
| C1 | = A1 | corregido |
| C2 | Los límites por IP se saltan con una cabecera `X-Forwarded-For` inventada | corregido: se lee la IP que añade el proxy de confianza (`TRUSTED_PROXY_HOPS`, por defecto 1). **Hay que configurarlo según el alojamiento** |
| C3 | La limpieza de datos solo corre al registrarse | corregido: también al iniciar sesión (como mucho cada 30 minutos por proceso) |
| C4 | = A14 | corregido |
| C5 | `robots.txt` se genera al compilar con la `APP_URL` de ese momento | corregido: dinámico |
| C6 | = A2 | corregido |
| C7 | = A10 | corregido |
| C8 | La limpieza de solicitudes de ficha cuenta desde la creación, no desde la decisión | corregido |
| C9 | La comprobación del entorno no detiene el proceso | corregido: `process.exit(1)` con mensaje claro |
| C10 | `validateEnv` acepta una `APP_URL` con espacios o ruta | corregido, con prueba |

## Revisión de código: interfaz (19)

| ID | Hallazgo | Estado |
|---|---|---|
| I1 | `RecordarCampos` no restaura si el mismo error se repite | corregido (escucha `reset`); prueba de navegador |
| I2 | Localiza el formulario por posición | corregido (firma por nombres de campos) |
| I3 | = V5 | corregido |
| I4 | Tras un error los `<details>` vuelven cerrados | corregido: se abre el que contiene el formulario; la prueba lo comprueba |
| I5 | Elegir entre homónimos pierde lo escrito si hay un error después | corregido: el enlace de evidencia y las comprobaciones que no dependen del rival se hacen antes; un error posterior devuelve a la pantalla de elegir rival con los datos, y «Corregir los datos del combate» devuelve el formulario relleno. Prueba de navegador |
| I6 | Regresión de CSS: formularios en columna torcidos | corregido (comprobado con captura) |
| I7 | Tablas sin `table-wrap` | corregido (`/siguiendo`, `/ranking`, `/ayuda`, velada) |
| I8 | Confirmar el correo sin sesión se contradice | corregido (= V4) |
| I9 | `/recuperar/nueva` falla con `?token=a&token=b` | corregido (middleware; reproducido antes) |
| I10 | `/ranking` falla con `?provincia=a&provincia=b` | corregido (middleware; reproducido antes) |
| I11 | `?q=%00` da error 500 | corregido (middleware y `str()`; reproducido antes) |
| I12 | El buscador de «Mi ficha» no tiene etiqueta visible | corregido |
| I13 | Botones cuyo nombre accesible no contiene el texto visible | corregido |
| I14 | Botones repetidos sin contexto (elección de rival, moderación) | corregido: nombres accesibles con contexto y la primera celda de cada fila de moderación es `<th scope="row">` |
| I15 | «Mis peleadores» ya no se llama así en ningún enlace | corregido: «Peleadores que sigo» en todas partes |
| I16 | «Ver los N resultados de veladas» solo enseña las próximas | corregido: `/veladas?past=todas` |
| I17 | El panel del organizador usa otra definición de «ya celebrada» | corregido: `eventDayReached` |
| I18 | `/moderacion/historial` redirige en silencio | corregido (`requireAdmin`) |
| I19 | Varias regiones `search` sin nombre | corregido |

## Segunda tanda de personas (sobre la versión corregida)

Se lanzaron sobre la versión corregida. Terminaron las personas «aficionado», «peleador», «rival» y «organizador» (con estados); la moderadora y las de seguridad, móvil, persona mayor y exploración destructiva **no se han ejecutado todavía**. Cada hallazgo se reprodujo a mano antes de corregirlo.

| Tema | Hallazgo | Estado | Cómo se resolvió |
|---|---|---|---|
| Doble clic | Un doble clic en cualquier botón de envío enviaba dos veces (dos combates, un aviso de «duplicado») | corregido | `EvitarDobleEnvio`: el segundo envío del mismo formulario se descarta en el acto y los botones quedan desactivados hasta que la acción termina (o 3,5 s). Prueba de navegador con doble clic real |
| Rival | El rival no sabía que alguien le había registrado un combate | corregido | Correo `notifyRivalOfBout` (después de responder, con `after()`) y correo de vuelta a quien lo registró con la respuesta |
| Rival | «No es correcto» no pedía motivo y quien registró no sabía por qué | corregido | Motivo obligatorio (`rival_motivo_falta`), guardado en la auditoría y enviado por correo |
| Peleador | Un combate registrado por error no se podía quitar | corregido | `removeMyBout` (solo el autor, mientras está sin confirmar), con confirmación y borrado de la velada y la ficha provisional que solo existían por él |
| Peleador | Un combate de hoy no se podía registrar sin resultado | corregido | Se permite (queda «Resultado por anotar») |
| Peleador | Crear una segunda ficha con el mismo nombre callejón sin salida (solicitud pendiente, ficha provisional existente) | corregido | Bloqueo claro con `ficha_reclamacion_pendiente`, aviso `ficha_con_tu_nombre` salvo `confirmarNueva=1`, y bloque «Tu solicitud está pendiente» |
| Peleador | Añadir una disciplina que ya se tenía daba un error técnico | corregido | `disciplina_ya_tienes` |
| Organizador | No se podía corregir, cancelar ni quitar combates del cartel | corregido | `updateEvent`, `setEventStatus`, `removeCartelBout` (solo el organizador de esa velada) |
| Privacidad | La ficha provisional del rival aparecía en la dirección con su apellido completo | corregido | Slug provisional sin apellido (`nombre-inicial`); al verificar o aprobar se pasa al nombre completo (`fullNameSlug`) |
| Calendario | Las veladas indicadas por un peleador no decían que no eran oficiales | corregido | Etiqueta «no oficial» en la tarjeta y una explicación bajo el listado. Prueba de navegador |
| Móvil | «Mis combates» se salía de la pantalla (columna de evidencia) | corregido | Tabla apilada con etiquetas por celda |
| Rival | Con homónimos no había forma de distinguirlos | corregido | Cada candidata dice cuántos combates tienes ya contra ella y cuándo se creó su ficha (sin descubrir datos de terceros) |
| Avisos | «Peleadores que sigo» prometía correos con los avisos desactivados | corregido | El texto depende de la preferencia real y enlaza a «Mi cuenta» |
| Dirección | Una dirección mal codificada (`%E0%A4%A`) daba «400: Bad Request» en inglés | corregido | `src/pages/_error.tsx`, pantalla en español independiente del resto. Efecto lateral: con ese fichero Next.js trata `useSearchParams` como anulable, y se ajustaron `FlashNotice` y `RecordarCampos` |
| Pendiente | Gimnasio duplicado por nombre en otra ciudad; nombre público con nombres compuestos; mensajes en la dirección; cabecera de cinco líneas; favicon (diseño) | pendiente | Siguiente bloque |
| Decisión del fundador | Aura a los dos peleadores de un combate frente a uno por combate (los textos se contradicen) | decisión | Ver `TRASLADO.md` §7 |
