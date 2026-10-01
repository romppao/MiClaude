# Auditoría del código (septiembre de 2026)

Auditoría exhaustiva de solo lectura hecha con 9 revisores independientes (seguridad y autorización, privacidad, lógica de acciones, lógica de páginas, usabilidad, accesibilidad, despliegue, pruebas, y documentación e idioma): 175 hallazgos brutos que se consolidaron en **99 hallazgos únicos**.

**Qué está verificado y qué no (honestidad sobre el proceso).**
- **96 de los 99 hallazgos** pasaron una verificación adversarial: tres comprobadores independientes intentaron refutar cada uno con el código delante. **5 se refutaron por mayoría** (n.º 81, n.º 83, n.º 90, n.º 91, n.º 92); el resto sobrevivió, algunos con la gravedad rebajada.
- Los hallazgos **97, 98, 99** **no se pudieron verificar** (el proceso agotó el límite de uso de la sesión). Son «hallazgos de un revisor»: comprueba que el problema existe antes de corregirlos.
- La pasada de «huecos» (qué áreas no ha mirado nadie) **no llegó a ejecutarse**.

**Estado a fecha del traslado (commit de este bloque 6).** Corregido: 71, Parcial: 16, Pendiente: 7, Decisión del fundador: 2, Descartado: 3.

Leyenda: **Corregido** (hecho y con prueba), **Parcial** (hecho en parte; la nota dice qué falta), **Pendiente** (sin hacer), **Decisión del fundador** (no se puede resolver sin su criterio), **Descartado** (con motivo: refutado por los comprobadores o rechazado a propósito).

## Resumen por hallazgo

| N.º | Gravedad | Estado | Dónde | Título |
|---|---|---|---|---|
| 1 | alta | Corregido | `src/app/actions.ts:484` | El operador `in` y las búsquedas por clave en objetos literales aceptan claves heredadas («__proto__», «constructor», «toString»): un aviso puede dejar inservible /moderacion y una URL puede romper páginas enteras |
| 2 | alta | Corregido | `src/app/actions.ts:82` | Inicio de sesión, registro y reenvío de verificación sin límite de intentos, con scryptSync que bloquea el proceso (fuerza bruta y denegación de servicio sin cuenta) |
| 3 | media | Corregido | `src/app/actions.ts:291` | Correos de verificación y avisos hacia terceros con texto elegido por el atacante (nombre sin límite, validación de correo débil) y sin caducidad de cuentas sin verificar |
| 4 | alta | Corregido | `src/app/actions.ts:65` | No existe recuperación de contraseña, y quien registre primero un correo ajeno lo bloquea sin que el titular pueda recuperar nada |
| 5 | media | Parcial | `src/app/actions.ts:82` | Enumeración de usuarios: el registro confirma qué correos existen y el inicio de sesión responde más rápido cuando el correo no existe |
| 6 | media | Corregido | `src/app/actions.ts:31` | Redirección abierta: internalPath deja pasar «/\dominio» (barra invertida, tabuladores y saltos de línea) tras iniciar sesión y en las acciones con `back` |
| 7 | media | Corregido | `src/app/actions.ts:358` | Un usuario registrado como peleador (FIGHTER) puede solicitar ser organizador, se le «aprueba» y no obtiene ningún permiso; la pantalla vuelve a mostrar el formulario sin explicar nada |
| 8 | media | Corregido | `src/app/actions.ts:182` | addBout engancha combates autodeclarados a la velada oficial de otro organizador (o de otro nivel o ciudad) sin ningún permiso, y createEvent no detecta veladas duplicadas |
| 9 | alta | Corregido | `src/app/veladas/[slug]/page.tsx:23` | La página pública de la velada (y la ficha, /siguiendo y el calendario) muestran resultados autodeclarados, en revisión o rechazados como si fueran hechos |
| 10 | alta | Corregido | `src/lib/aura.ts:40` | El ránking, el total de la ficha y los comentarios siguen contando el aura de combates rechazados (DISPUTED) o de eventos cancelados |
| 11 | alta | Corregido | `src/app/moderacion/page.tsx:17` | Los combates rechazados (DISPUTED) no aparecen en ninguna cola de moderación y no hay forma de reabrirlos |
| 12 | media | Parcial | `src/app/actions.ts:236` | Acciones sin respuesta visible: moderación sin mensaje ni confirmación, fallos y denegaciones con redirección muda, dos sistemas de avisos y códigos sin usar |
| 13 | media | Corregido | `src/app/actions.ts:261` | Los límites diarios de aura (20) y de avisos (10) y la deduplicación de avisos se saltan con peticiones concurrentes |
| 14 | media | Corregido | `src/app/actions.ts:197` | Combates duplicados por doble envío: no hay restricción única, la comprobación es previa al alta y un combate rechazado puede volver a registrarse |
| 15 | media | Corregido | `src/app/actions.ts:114` | Ninguna acción captura violaciones de unicidad (P2002/P2025): el doble envío acaba en error 500 aunque lo pedido ya se haya guardado |
| 16 | baja | Corregido | `src/app/actions.ts:318` | decideClaim: dos moderadores pueden aprobar reclamaciones distintas de la misma ficha y la segunda pisa a la primera |
| 17 | alta | Corregido | `src/app/actions.ts:190` | Cualquier usuario verificado publica al instante la ficha de un tercero (su rival) sin consentimiento, con ciudad y provincia inventadas y en la portada |
| 18 | media | Corregido | `src/app/actions.ts:190` | Un peleador puede colgar un combate con resultado en la ficha de otro peleador con cuenta sin su consentimiento y repetirlo tras ser rechazado |
| 19 | alta | Corregido | `src/app/actions.ts:495` | No existe ninguna vía de supresión, rectificación ni acceso a los datos, y el modelo impide borrar sin dañar a otros |
| 20 | media | Corregido | `src/app/peleadores/[slug]/page.tsx:133` | El nombre completo de quien da aura, junto a su comentario y su asistencia al evento, es público sin aviso ni opción de ocultarlo |
| 21 | alta | Corregido | `src/app/actions.ts:264` | Los comentarios de aura se publican al instante sin moderación y no se pueden denunciar ni retirar (solo los borra su autor) |
| 22 | media | Parcial | `src/app/actions.ts:160` | Veladas, fichas, gimnasios y enlaces creados por cualquier usuario verificado se publican al instante (calendario y portada), sin moderación ni tope diario |
| 23 | media | Corregido | `src/app/actions.ts:104` | Sin límites de longitud en textos ni de rango en fechas, y provincia sin validar contra PROVINCES en el servidor |
| 24 | media | Corregido | `src/lib/mail.ts:9` | Correos de usuarios y tokens de verificación salen en claro en el log, y el correo nunca falla ni avisa aunque falte proveedor o APP_URL |
| 25 | baja | Corregido | `src/app/actions.ts:299` | Los datos aportados para verificar identidad (licencia, entrenador...) se conservan indefinidamente, contra el principio documentado de «borrado tras la comprobación» |
| 26 | media | Corregido | `next.config.mjs:2` | No se envían cabeceras de seguridad HTTP (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) y se expone X-Powered-By |
| 27 | media | Corregido | `src/app/actions.ts:161` | La fecha de velada se guarda a las 12:00Z y se compara con Date.now(): «hoy» y «ya celebrada» significan cosas distintas en cada pantalla |
| 28 | alta | Corregido | `src/app/actions.ts:169` | Un combate con fecha de hoy (antes de las 12:00Z) o futura pierde el resultado en silencio, luego no se puede completar ni volver a registrar |
| 29 | media | Corregido | `src/app/actions.ts:190` | El rival se identifica solo por el slug de su nombre: homónimos fusionados, nombres no latinos con slug vacío y uniqueSlug que genera «-2» |
| 30 | media | Corregido | `src/app/actions.ts:179` | La provincia de las veladas y de los rivales creados en addBout es siempre Madrid, porque el formulario «Registrar un combate» no pide provincia |
| 31 | media | Corregido | `src/app/actions.ts:433` | setBoutResult fija VERIFIED incondicionalmente: el organizador (o quien controle su cuenta) puede revertir un combate rechazado (DISPUTED) sin ningún moderador |
| 32 | baja | Parcial | `src/app/actions.ts:355` | La auditoría no es atómica con el cambio, y en algunos casos se escribe antes de que la operación pueda fallar |
| 33 | baja | Corregido | `src/app/actions.ts:184` | addBout crea velada y rival antes de validar y sin transacción: quedan registros huérfanos |
| 34 | baja | Corregido | `src/app/actions.ts:259` | La regla «los participantes no pueden dar aura» se elude reclamando después la ficha |
| 35 | media | Parcial | `src/app/actions.ts:46` | La señal MISMO_DIA no se activa si el peleador tiene dos combates en la misma velada, y la consulta de coherencia no tiene pruebas |
| 36 | baja | Decisión del fundador | `src/lib/record.ts:59` | El récord de partida declarado puede duplicarse con los combates registrados en la app |
| 37 | media | Corregido | `src/app/actions.ts:254` | giveAura valida en el servidor menos reglas que la interfaz (sin resultado, evento cancelado) y ninguna regla de aura tiene pruebas |
| 38 | media | Corregido | `src/app/actions.ts:172` | Resultado y método de un combate sin validar entre sí ni contra la disciplina; los formularios proponen valores por defecto que inducen al error |
| 39 | baja | Corregido | `src/app/actions.ts:152` | «Sin decisión» (NO_CONTEST) no se puede registrar en ningún flujo |
| 40 | media | Corregido | `src/lib/notify.ts:23` | Los correos se envían de forma síncrona y en serie, sin manejo de errores ni pruebas: un fallo del proveedor tumba una acción ya guardada o deja cuentas a medias |
| 41 | media | Decisión del fundador | `prisma/schema.prisma:239` | La regla del aura es ambigua: CLAUDE.md y la interfaz dicen «un clic por usuario y combate», pero el código permite una por peleador (los documentos también se contradicen) |
| 42 | media | Corregido | `src/app/buscar/page.tsx:12` | La búsqueda no encuentra nombre y apellidos escritos juntos ni ignora las tildes («Perez» no encuentra a «Pérez») |
| 43 | media | Corregido | `src/app/buscar/page.tsx:21` | Buscar no dice nada cuando no hay resultados, no tiene etiqueta ni instrucciones y corta a 20 sin avisar |
| 44 | baja | Corregido | `src/app/buscar/page.tsx:8` | Parámetros repetidos en la URL (?q=a&q=b) provocan error 500 en varias páginas |
| 45 | media | Corregido | `src/app/veladas/[slug]/page.tsx:17` | La insignia «organizador verificado» aparece junto a un texto libre («Organiza: …») que no está verificado |
| 46 | media | Corregido | `src/app/peleadores/[slug]/page.tsx:92` | La ficha muestra el resultado con letras inglesas W / L / D / NC, la «D» se lee como «Derrota» siendo «Draw» y la columna no tiene título |
| 47 | baja | Parcial | `src/app/layout.tsx:33` | Lenguaje: quedan textos con «email» en la interfaz y plurales sin resolver («1 combates», «1 peleadores», «1 auras dadas») y concordancias erróneas en la ayuda |
| 48 | media | Descartado | `src/app/layout.tsx:15` | El layout raíz lee cookies: ninguna página pública se cachea, force-dynamic y revalidatePath no tienen efecto y getUser se ejecuta dos veces por petición |
| 49 | media | Corregido | `src/lib/aura.ts:39` | auraRanking trae todas las auras a memoria y agrega en JavaScript en cada visita a la portada y al ránking |
| 50 | media | Parcial | `src/app/peleadores/page.tsx:24` | Listados públicos y colas de moderación cortados a 100 (o 20) sin paginación ni aviso; la cola de combates se trunca antes de ordenar por señales y los gimnasios pendientes quedan al final |
| 51 | media | Parcial | `src/app/peleadores/[slug]/page.tsx:14` | Las fichas de detalle no tienen título propio y faltan favicon, robots, sitemap, imagen para compartir y health check |
| 52 | media | Corregido | `src/app/actions.ts:318` | Al pedir «Aprobar» una reclamación, decideClaim puede rechazarla en silencio |
| 53 | media | Corregido | `src/app/organizador/page.tsx:28` | Los rechazos y resoluciones no dicen el motivo y se promete un «te avisaremos» que no existe |
| 54 | media | Corregido | `src/app/layout.tsx:31` | Un organizador aprobado no tiene ningún enlace visible a su panel |
| 55 | media | Corregido | `src/app/layout.tsx:23` | Cabecera con hasta 13 controles y «Mis peleadores» confundible con «Mi ficha» |
| 56 | alta | Corregido | `src/app/peleadores/page.tsx:30` | Filtros, desplegables y formularios sin etiqueta visible ni nombre accesible (8 select y 2 input sin nombre), incluidos los de organizador |
| 57 | media | Parcial | `src/app/organizador/[slug]/page.tsx:57` | El selector de peleadores del cartel usa el slug como valor, no distingue homónimos, se corta en 500 y la instrucción dice «Escribe el nombre» |
| 58 | media | Corregido | `src/app/actions.ts:387` | Un enlace de entradas o de evidencia no válido se descarta en silencio y se muestra el mensaje de éxito |
| 59 | media | Corregido | `src/app/moderacion/page.tsx:108` | «Combates por verificar» no muestra el resultado declarado ni quién lo registró, e imprime estados internos en bruto («SELF_REPORTED», «CONFIRMED») |
| 60 | media | Corregido | `src/app/moderacion/page.tsx:59` | Los avisos de error de usuarios no dan al moderador una acción sobre el dato avisado ni informan a quien avisó |
| 61 | media | Corregido | `src/app/moderacion/historial/page.tsx:19` | Historial de cambios: filtros por código interno sensibles a mayúsculas, JSON en crudo que ensancha la página y sin enlaces desde el dato |
| 62 | media | Corregido | `src/app/moderacion/page.tsx:29` | Tablas con formularios en línea sin adaptación a móvil (moderación, cartel, ficha, historial): la página se ensancha y hay que desplazarse en horizontal |
| 63 | media | Corregido | `src/app/page.tsx:24` | La portada anima a registrarse pero no ofrece ningún botón para hacerlo, tiene un campo sin etiqueta y una sección sin estado vacío |
| 64 | media | Parcial | `src/app/gimnasios/[slug]/page.tsx:17` | Fichas de gimnasio y entrenador con secciones vacías sin mensaje, /entrenadores sin forma de crear datos y sello de gimnasio verificado como un «✓» sin texto |
| 65 | baja | Corregido | `src/app/verificar/page.tsx:24` | Verificar el correo termina sin siguiente paso y el mensaje de error puede quedar sin salida |
| 66 | baja | Corregido | `src/app/veladas/[slug]/page.tsx:28` | Ficha pública de la velada: «Pluma · 3x», «Gana rojo» sin nombre y botón «Entradas» pequeño y sin aviso de salida |
| 67 | baja | Corregido | `src/lib/notify.ts:27` | El correo de aviso a seguidores dice que se puede dejar de seguir en /siguiendo, pero esa página no lo permite, y tiene errores de concordancia |
| 68 | media | Corregido | `src/app/not-found.tsx:11` | Botones dentro de enlaces en las pantallas de «no encontrada» y de error (HTML inválido, dos paradas de tabulación) |
| 69 | media | Corregido | `src/app/FlashNotice.tsx:14` | Los avisos y errores de los formularios no se anuncian a los lectores de pantalla y algunos son demasiado escuetos |
| 70 | alta | Corregido | `src/app/globals.css:14` | Los campos de formulario y los botones secundarios no se distinguen del fondo (contraste de componentes 1,35:1) |
| 71 | alta | Corregido | `src/app/globals.css:4` | Los enlaces dentro de un texto se ven exactamente igual que el texto (sin subrayado ni diferencia de color) |
| 72 | media | Corregido | `src/app/globals.css:20` | La etiqueta .tag.AMATEUR no llega a 4,5:1 y en hover de tarjeta baja a 2,96:1 |
| 73 | media | Corregido | `src/app/globals.css:19` | Texto por debajo de los 16 px del proyecto, incluidas las etiquetas de todos los formularios y los estados de los combates |
| 74 | media | Corregido | `src/app/globals.css:33` | Zonas táctiles pequeñas: enlaces de navegación de 24 px, casilla de 20x20, «Entradas» y «evidencia ↗» en píldoras de 12 px |
| 75 | baja | Corregido | `src/app/siguiendo/page.tsx:36` | Tablas de datos sin cabeceras o con cabeceras sin scope ni texto |
| 76 | baja | Corregido | `src/app/mi-ficha/page.tsx:38` | Nombres de enlaces y botones repetidos o ambiguos («Reclamar», «Guardar enlace», «Sí, es correcto», «web»; el nombre del usuario como enlace) |
| 77 | baja | Corregido | `src/app/registro/page.tsx:12` | Los formularios largos pierden lo escrito tras un error |
| 78 | baja | Corregido | `src/app/globals.css:1` | Sin `color-scheme: dark`: los controles nativos salen claros y el icono del selector de fecha se pierde |
| 79 | alta | Corregido | `prisma/seed.ts:9` | El seed borra fichas, combates y aura reales sin protección y se ejecuta también con `prisma migrate reset` |
| 80 | media | Parcial | `prisma/schema.prisma:5` | Prisma sin `directUrl` ni configuración de pooler para PostgreSQL gestionado en entorno serverless |
| 81 | baja | Descartado | `prisma/schema.prisma:127` | Faltan índices en claves foráneas que las páginas consultan (Fighter.gymId y trainerId, Event.organizerId, Bout.createdById, Report.userId, ClaimRequest.fighterId) |
| 82 | baja | Parcial | `.gitignore:1` | Higiene del repositorio y del CI: .gitignore solo ignora `.env`, sin engines, @types/node desalineado, workflow sin permisos, concurrencia ni lint, y sin dependabot |
| 83 | baja | Corregido | `src/lib/password.ts:5` | Hash de contraseña con parámetros por defecto de scrypt y formato sin versión ni parámetros: no se puede reforzar sin invalidar todas las cuentas |
| 84 | alta | Pendiente | `src/app/actions.ts:1` | Ninguna de las 24 Server Actions tiene pruebas de autorización ni de rama negativa; tres no se ejecutan nunca |
| 85 | media | Parcial | `tests/e2e/flujo.mjs:83` | El e2e es un único guion secuencial con estado compartido, clics no estrictos y sin diagnóstico al fallar |
| 86 | media | Parcial | `tests/e2e/flujo.mjs:220` | Aserciones del e2e no acotadas a la ejecución (falsos verdes) y límites take:100 que las rompen con una base reutilizada |
| 87 | media | Parcial | `src/lib/auth.ts:28` | auth.ts sin ninguna prueba: caducidad de sesión y tokens de verificación |
| 88 | baja | Pendiente | `src/lib/prior.ts:30` | parsePrior: casos límite sin fijar y tope aplicado por campo, no a la suma |
| 89 | media | Corregido | `tests/e2e/accesibilidad.mjs:36` | La medición de accesibilidad (test:a11y) no se ejecuta en el CI, no está documentada, da «OK» a pantallas a las que no llegó y no cubre los mensajes de error y confirmación |
| 90 | baja | Descartado | `tests/e2e/flujo.mjs:197` | Datos de prueba que caducan o apuntan a terceros: velada «futura» fija en 2030 y dominio @test.es |
| 91 | media | Corregido | `README.md:44` | README y ARQUITECTURA describen el proyecto anterior (Boxer, Rating, rateBoxer, ratings.ts, ránking bayesiano, solo boxeo) y una hoja de ruta desfasada, sin sección de variables ni despliegue |
| 92 | media | Corregido | `src/app/actions.ts:132` | Ficha «gestionada por el peleador» en los documentos, pero solo se pueden editar disciplina, categoría y récord de partida |
| 93 | media | Pendiente | `src/app/actions.ts:355` | El sello de organizador verificado no exige nota de evidencia, aunque IDEAS y ARQUITECTURA dicen que es obligatoria |
| 94 | baja | Pendiente | `src/lib/aura.ts:40` | El documento dice que el ránking distingue siempre lo respaldado de lo autodeclarado, pero auraRanking no filtra ni etiqueta por verificación |
| 95 | baja | Pendiente | `docs/COMPETENCIA.md:31` | COMPETENCIA.md da por hecho un enlace estable por combate que no existe y lista como pendiente lo que el ránking ya hace |
| 96 | baja | Pendiente | `src/app/layout.tsx:11` | Textos públicos que no reflejan el alcance actual: descripción del sitio solo de boxeo y gimnasio de ejemplo con palabra inglesa |
| 97 | baja | Pendiente | `CLAUDE.md:23` | Vocabulario residual en CLAUDE.md, IDEAS y ARQUITECTURA («boxeador», «valoración», «email») y fila mal formada en IDEAS |
| 98 | baja | Corregido | `src/app/actions.ts:449` | El enlace de evidencia de un combate ya verificado o confirmado puede cambiarlo o quitarlo el creador o el rival sin volver a revisarse |
| 99 | baja | Parcial | `src/app/actions.ts:304` | Las solicitudes de reclamación y de organizador no tienen límite ni espera y pueden inundar la cola de moderación |

## Detalle de lo que queda por hacer

Solo se detallan los hallazgos **Pendiente**, **Parcial** y **Decisión del fundador**. Los corregidos tienen su nota en el diario y en las pruebas.

### 5. Enumeración de usuarios: el registro confirma qué correos existen y el inicio de sesión responde más rápido cuando el correo no existe

- **Gravedad:** media · **Estado:** Parcial — Login sin diferencia de tiempo. El registro sigue diciendo «ya hay una cuenta con ese correo» (decisión de usabilidad: se limita por IP). Riesgo aceptado, documentado; pendiente de confirmar por el fundador.
- **Dónde:** `src/app/actions.ts:82` · **Categoría:** autenticacion / enumeracion
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

register responde `/registro?error=email` con «Ya existe una cuenta con ese correo electrónico» (línea 72; registro/page.tsx), sin límite de intentos. En login, `!user || !verifyPassword(...)` hace cortocircuito: con correo inexistente no se ejecuta scrypt (unos 40 ms), y con correo existente sí, por lo que la diferencia de tiempo es medible aunque el mensaje sea genérico. La pertenencia a una comunidad de deportes de contacto es un dato personal.

**Escenario:** Un atacante prueba una lista de correos contra /registro (el mensaje lo dice) o contra /entrar (los que tardan ~40 ms más existen), identifica peleadores, moderadores o entrenadores y lo combina con fuerza bruta o con phishing dirigido.

**Arreglo propuesto:** En login ejecutar siempre verifyPassword contra un hash ficticio precalculado cuando el usuario no existe. En register responder igual haya o no cuenta («Si el correo es correcto, te hemos enviado un enlace para continuar») y enviar al titular existente un aviso de «ya tienes cuenta» con enlace a recuperar la contraseña; limitar la frecuencia por IP. Redactar sin culpar a nadie, conforme al principio de usabilidad.

**Lo que dijo un comprobador:** El hallazgo se sostiene en el código real, pero el impacto está algo inflado.

Confirmado:
- En `src/app/actions.ts:72`, `register` hace `if (await db.user.findUnique({ where: { email } })) redirect("/registro?error=email")`. `src/app/registro/page.tsx:5` muestra «Ya existe una cuenta con ese correo electrónico.». Es un oráculo directo de existencia de cuenta.
- No hay límite de intentos en login ni en registro. No existe `src/middleware.ts` (solo hay artefactos en `.next/`). Los únicos límites del proyecto son el de auras (`actions.ts:262`) y el de avisos (`actions.ts:489`). Los documentos no

### 12. Acciones sin respuesta visible: moderación sin mensaje ni confirmación, fallos y denegaciones con redirección muda, dos sistemas de avisos y códigos sin usar

- **Gravedad:** media · **Estado:** Parcial — Las acciones devuelven mensajes por código (`go()`); revisar una a una las pantallas de moderación y organizador.
- **Dónde:** `src/app/actions.ts:236` · **Categoría:** respuesta de la acción / errores y mensajes
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: media, baja, baja

adminDecide (236), decideClaim (332), decideOrganizer (360), setGymVerified (472) y resolveReport (504) terminan con redirect('/moderacion') sin aviso, y no piden confirmación ni ofrecen deshacer (botones «Aprobar», «Rechazar», «Verificar», «Retirar sello» contiguos, separados 6 px; aprobar una reclamación entrega la ficha a otra cuenta). Además unas 20 ramas de fallo o denegación redirigen sin mensaje: respondBout (215-216), saveDiscipline (135), addBout (158), requestClaim (301), setBoutResult (423, 427), setBoutEvidence (447), ownEvent (371), requireOrganizer (365), redirect('/') de moderación (229, 231, 314, 316, 351, 353, 463, 465, 497, 499). requireUser (auth.ts:38) manda a /entrar sin next ni mensaje, igual que organizador/[slug]/page.tsx:13 y /moderacion y /historial hacia «/». Conviven ?aviso/?problema (messages.ts) y ?error/?ok con textos sueltos por página, y cinco códigos de messages.ts (cartel_peleadores, velada_datos, nombre_organizacion, resultado_futuro, solicitud_enviada) no los emite nadie. LECCIONES.md dice «ningún fallo silencioso». Incumple los puntos 6, 7 y 9 de la lista de usabilidad.

**Escenario:** La moderadora, en el móvil, quiere pulsar «Verificar» y toca «Rechazar»: la fila desaparece sin mensaje, no sabe qué pasó ni puede deshacerlo. Otro caso: el rival abre «Mi ficha» en dos pestañas, un moderador verifica el combate y al pulsar «Sí, es correcto» en la pestaña antigua respondBout redirige sin decir nada. Una moderadora con sesión caducada abre /moderacion y acaba en la portada sin explicación, y tras entrar llega a «/» en vez de a lo que pedía.

**Arreglo propuesto:** Unificar en go(path, { aviso | problema }) con textos en messages.ts («Combate verificado», «Ficha entregada a X»...), añadir avisos de éxito a las cinco acciones de moderación, confirmación en las que afectan a otras personas y una sección «Decididos recientemente» con «Deshacer». requireUser(next) que redirija a /entrar?next=<ruta> con «Entra para ver esta página»; mensajes «Esta sección es solo para moderadores». Borrar códigos muertos. Prueba estática que exija que cada código emitido exista en messages.ts y una de integración que verifique que cada rama de fallo redirige con aviso o problema.

**Lo que dijo un comprobador:** El hallazgo se sostiene al leer el código real. (1) Las cinco acciones de moderación terminan en redirect("/moderacion") sin aviso: adminDecide (actions.ts:236), decideClaim (332), decideOrganizer (360), setGymVerified (472) y resolveReport (504). En moderacion/page.tsx los formularios no piden confirmación y no hay «Deshacer». «Verificar» y «Rechazar» van contiguos con gap de 6 px (líneas 118-121). La lista de combates solo trae SELF_REPORTED y CONFIRMED, así que un combate rechazado (DISPUTED) desaparece y no se puede recuperar desde la interfaz; el historial es de solo lectura. decideClaim

### 22. Veladas, fichas, gimnasios y enlaces creados por cualquier usuario verificado se publican al instante (calendario y portada), sin moderación ni tope diario

- **Gravedad:** media · **Estado:** Parcial — Hay distintivo de organizador oficial, pero cualquier usuario verificado sigue publicando veladas sin moderación previa. Decidir política.
- **Dónde:** `src/app/actions.ts:160` · **Categoría:** contenido-sin-moderacion / spam
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: media, media, baja

addBout (160-193) crea un Event público (AMATEUR, SCHEDULED si la fecha es futura, organizerId null) con texto libre eventName, venue y city; createMyFighter (110-118) crea Gym públicos con texto libre; evidenceUrl acepta cualquier sitio http(s). La portada lista los 6 primeros eventos por fecha ascendente (page.tsx:14), el calendario (veladas/page.tsx:13) y /buscar los muestran sin exigir organizerId ni combate verificado ni marcar que son «declaradas por un peleador»; /siguiendo muestra sus combates futuros SELF_REPORTED como «Próximos combates». Los únicos topes diarios son aura (20) y avisos (10). La cola de moderación solo trata la verificación del combate, no el texto de la velada. Contradice «solo organizadores publican veladas».

**Escenario:** Un usuario verificado registra un combate con eventName «GANA DINERO YA en sitio.example» (o texto ofensivo), fecha de mañana y rival inventado: el evento aparece el primero en «Próximas veladas amateur» y en /veladas sin etiqueta. Repite mil veces, llenando portada y buscador y poniendo enlaces de «evidencia» a sitios maliciosos; nadie lo revisa.

**Arreglo propuesto:** Rechazar fechas futuras en addBout o crear el evento en estado no listado; mostrar en portada y calendario solo eventos de organizadores aprobados y distinguir «velada declarada por un peleador» (visible solo en su ficha hasta confirmarse). Excluir o etiquetar los combates futuros no verificados en /siguiendo. Límite diario en addBout y createMyFighter, y filtro básico de enlaces y palabras.

**Lo que dijo un comprobador:** El hallazgo se sostiene en lo esencial tras leer el código real. Seguí el escenario paso a paso.

1. Creación pública sin filtro. En addBout (src/app/actions.ts:155-208), tras requireVerifiedUser, eventName y venue son texto libre y la fecha solo se comprueba con Number.isNaN. Si la fecha es futura, el evento se crea con level AMATEUR y status SCHEDULED (líneas 184-188). No lleva organizerId, así que queda null. El formulario de addBout no tiene campo de provincia, y `str(f,"province") || "Madrid"` da siempre Madrid, que es HOME_PROVINCE. El slug se calcula con nombre y fecha, así que cada nom

### 32. La auditoría no es atómica con el cambio, y en algunos casos se escribe antes de que la operación pueda fallar

- **Gravedad:** baja · **Estado:** Parcial — `audit(entry, tx)` dentro de transacciones en las acciones nuevas; repasar las antiguas.
- **Dónde:** `src/app/actions.ts:355` · **Categoría:** transacciones / historial
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

Solo respondBout escribe cambio y audit en la misma transacción (218-221). En decideOrganizer (355-359) y setBoutResult (431-435) el audit se guarda antes de la transacción, de modo que un fallo deja registrado un cambio que no ocurrió. En adminDecide (233-234), addBout (199-205), createMyFighter (121-127), saveDiscipline, createEvent, addCartelBout, setBoutEvidence, setGymVerified y decideClaim se escribe después y por separado, así que un fallo entre ambas escrituras deja un cambio sin rastro, contra el principio «nada se edita en silencio».

**Escenario:** decideOrganizer escribe «APPROVED» en el historial y la $transaction falla por timeout: el historial afirma que se aprobó y el usuario sigue siendo FAN. En sentido contrario, si falla el audit de adminDecide, un combate se verifica sin dejar registro de quién lo hizo.

**Arreglo propuesto:** Pasar el cliente de transacción a audit(…, tx) y agrupar cambio y audit en una $transaction en todas las acciones que modifican datos relevantes.

**Lo que dijo un comprobador:** Confirmado leyendo el código real de /home/user/MiClaude/src/app/actions.ts y src/lib/audit.ts. Cada punto del hallazgo se sostiene.

1. Solo respondBout es atómico. Las líneas 218-221 hacen `db.$transaction([db.bout.update(...), audit({...}, db)])`. `audit()` devuelve la promesa perezosa de Prisma (`client.auditLog.create`), así que entra en el lote. La documentación de audit.ts (línea 6) ya prevé pasarle el cliente de una transacción, pero ninguna otra acción lo hace.

2. decideOrganizer escribe el registro antes del cambio. La línea 355 hace `await audit({... action: approve ? "APPROVED" :

### 35. La señal MISMO_DIA no se activa si el peleador tiene dos combates en la misma velada, y la consulta de coherencia no tiene pruebas

- **Gravedad:** media · **Estado:** Parcial — Se cuentan los combates de la misma velada; falta una prueba específica de `coherenceFlagsFor`.
- **Dónde:** `src/app/actions.ts:46` · **Categoría:** señales de coherencia
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

coherenceFlagsFor consulta solo `eventId: { not: eventId }`, así que no considera otros combates del mismo evento. Para disciplinas que no son de torneo (boxeo, MMA, kickboxing, K-1) el mismo peleador puede aparecer con varios rivales el mismo día sin señal; boutExists solo bloquea la misma pareja exacta. La documentación dice que un peleador no puede tener dos combates el mismo día. Los combates de organizador nacen VERIFIED y no pasan por la cola de moderación. coherence.test.ts solo prueba proximityFlags con fechas ya calculadas; la consulta (qué combates entran) no tiene pruebas y el único caso e2e son dos veladas a 2 días.

**Escenario:** Un organizador añade «A vs B» y «A vs C» a la misma velada de boxeo, o un peleador registra tres combates seguidos contra rivales distintos el mismo día: no se genera ninguna señal y nada llega a moderación.

**Arreglo propuesto:** Para disciplinas que no son de torneo incluir los combates de la misma velada (excluyendo el nuevo) y emitir MISMO_DIA, recalculando o marcando también el combate anterior. Prueba de integración: misma velada, combate disputado, torneo (JIUJITSU) y otra disciplina.

**Lo que dijo un comprobador:** El defecto central es real, pero la descripción exagera su alcance, y por eso bajo la severidad de media a baja.

Lo que se sostiene, leyendo el código:
- src/app/actions.ts:46 filtra con `eventId: { not: eventId }`. La consulta nunca ve otros combates de la misma velada.
- coherence.ts:20-28 marca MISMO_DIA con `gap === 0`, pero solo sobre las fechas que recibe. Un combate de la misma velada no llega a compararse.
- `boutExists` (actions.ts:36-40) solo bloquea la misma pareja exacta en la misma velada.
- Escenario del organizador: en `addCartelBout` (actions.ts:396-418) se añaden «A vs B» y «

### 36. El récord de partida declarado puede duplicarse con los combates registrados en la app

- **Gravedad:** baja · **Estado:** Decisión del fundador — ¿Se puede editar el récord de partida? ¿Se descuenta lo registrado en la app? Pendiente de decidir.
- **Dónde:** `src/lib/record.ts:59` · **Categoría:** cálculo del récord
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

combinedRecord suma el récord de partida con lo registrado en la app (RecordCards.tsx:30-35). No hay fecha de corte: FighterDiscipline (schema.prisma:331-346) no guarda «hasta cuándo» y addBout acepta cualquier fecha pasada. Nada impide registrar combates ya incluidos en el total declarado.

**Escenario:** Un peleador declara «8 combates, 6-2-0» y días después registra dos de esos combates de 2025: la ficha pasa a mostrar 10 combates cuando son 8.

**Arreglo propuesto:** Guardar la fecha de corte (priorAsOf) y avisar o marcar los combates con fecha anterior; como mínimo aclarar en el formulario que solo se registran combates posteriores al alta.

**Lo que dijo un comprobador:** El hallazgo se sostiene leyendo el código real. 1) src/lib/record.ts:59-61: combinedRecord suma sin condiciones t.w + prior.wins, t.l + prior.losses y t.d + prior.draws cuando el récord de partida es detallado. 2) prisma/schema.prisma:331-346: FighterDiscipline solo guarda priorTotal/priorWins/priorLosses/priorDraws y createdAt; no hay fecha de corte (priorAsOf) ni nada equivalente. 3) src/app/actions.ts:155-208: addBout solo valida que la fecha sea válida (Number.isNaN). Acepta cualquier fecha pasada, sin compararla con el alta ni con FighterDiscipline.createdAt. Solo comprueba duplicados de

### 41. La regla del aura es ambigua: CLAUDE.md y la interfaz dicen «un clic por usuario y combate», pero el código permite una por peleador (los documentos también se contradicen)

- **Gravedad:** media · **Estado:** Decisión del fundador — ¿Una aura por persona y combate, o por persona, combate y peleador? Hoy: la segunda.
- **Dónde:** `prisma/schema.prisma:239` · **Categoría:** documentacion-vs-codigo / reglas del fundador
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: media, media, baja

La restricción única es (userId, boutId, fighterId) y giveAura hace el upsert por esa clave, por lo que un usuario puede dar aura a los dos peleadores de un mismo combate. CLAUDE.md:55, ARQUITECTURA.md:70, IDEAS.md:30 y el texto de peleadores/[slug]/page.tsx:71 dicen «una por combate», y el DIARIO afirma que «ya es lo que está implementado»; README.md:29, ayuda/page.tsx:19, ranking/page.tsx:18 y ARQUITECTURA.md:64 dicen «por combate y peleador». La decisión literal del fundador no se cumple y ninguna prueba fija la regla.

**Escenario:** Un aficionado da aura a Ana en el combate Ana vs Pedro; abre la ficha de Pedro, la fila del mismo combate vuelve a mostrar «Dar aura» (myAuras se filtra por fighterId) y la da: dos auras suyas en un combate.

**Arreglo propuesto:** Confirmar con el fundador la regla. Si es «una por combate»: @@unique([userId, boutId]) y comprobar en giveAura que no exista aura en ese combate para el otro peleador. Si es «por combate y peleador»: corregir CLAUDE.md:55, ARQUITECTURA.md:70, IDEAS.md:30, el texto de la ficha y la entrada del DIARIO. Fijarlo con una prueba.

**Lo que dijo un comprobador:** El hallazgo se sostiene al leer el código real. (1) prisma/schema.prisma:239 declara `@@unique([userId, boutId, fighterId])`. El comentario de la línea 225 dice «Una por persona, combate y peleador». (2) src/app/actions.ts:266-270: `giveAura` hace `upsert` con `userId_boutId_fighterId`. Solo comprueba que `fighterId` sea A o B del combate (línea 256). No hay ninguna comprobación de que el usuario ya haya dado aura al otro peleador de ese combate. Tampoco hay migraciones que cambien la clave, porque el proyecto usa `db push`. (3) src/app/peleadores/[slug]/page.tsx:32 carga `myAuras` con `where:

### 47. Lenguaje: quedan textos con «email» en la interfaz y plurales sin resolver («1 combates», «1 peleadores», «1 auras dadas») y concordancias erróneas en la ayuda

- **Gravedad:** baja · **Estado:** Parcial — Corregido «email» en la cabecera y los plurales con `plural()`; repasar el resto de textos.
- **Dónde:** `src/app/layout.tsx:33` · **Categoría:** idioma / lenguaje
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

El commit 56a7a8e sustituyó «email» por «correo electrónico», pero quedan layout.tsx:33 («Verifica tu email», visible en cada página para cuentas sin verificar), organizador/page.tsx:25 y verificar/page.tsx:28 («Tu email (…) está verificado»), incumpliendo la regla de idioma y con inconsistencia dentro de la misma pantalla; IDEAS F12 lo marca hecho. Plurales fijos: «{n} peleadores» en gimnasios/page.tsx:24 y entrenadores/page.tsx:18, «{n} combates» en veladas/page.tsx:38 y organizador/page.tsx:44, «{n} auras dadas» en page.tsx:29; RecordCards.tsx:6 ya tiene una función `plural` que no se reutiliza. ayuda/page.tsx:47 mezcla singular y plural («El aura está ligada… se limitan… solo pueden hacerlas») en lugar de «Las auras están ligadas… solo pueden darlas».

**Escenario:** Un gimnasio con un solo peleador muestra «1 peleadores»; una cuenta nueva ve «Verifica tu email» en la cabecera mientras el resto de la aplicación dice «correo electrónico».

**Arreglo propuesto:** Sustituir por «Confirma tu correo electrónico» (cabecera y organizador) y «Tu correo electrónico (…) ya está confirmado» (verificar); extraer plural() a lib/labels.ts y usarlo en todos los contadores; reescribir la frase de la ayuda; añadir una comprobación de `\bemail\b` en JSX.

**Lo que dijo un comprobador:** El hallazgo se sostiene: leí el código real y todas las líneas citadas existen tal como se describen. (1) «email» visible en la interfaz: layout.tsx:33 muestra «Verifica tu email» en la cabecera a toda cuenta con sesión sin verificar (`!user.emailVerifiedAt`); organizador/page.tsx:25 dice «verifica tu email»; verificar/page.tsx:28 dice «Tu email (…) está verificado». En la misma pantalla verificar/page.tsx:24 ya usa «Correo electrónico verificado», así que hay inconsistencia interna. CLAUDE.md exige «correo electrónico» y no «email» en los textos. El commit 56a7a8e («email» pasa a «correo elec

### 50. Listados públicos y colas de moderación cortados a 100 (o 20) sin paginación ni aviso; la cola de combates se trunca antes de ordenar por señales y los gimnasios pendientes quedan al final

- **Gravedad:** media · **Estado:** Parcial — Listados públicos paginados. Las colas de moderación siguen limitadas a 100 con aviso.
- **Dónde:** `src/app/peleadores/page.tsx:24` · **Categoría:** listados / limites
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: media, baja, baja

/peleadores (take 100, orderBy solo lastName), /gimnasios (12), /entrenadores (11) y /veladas (20) cortan a 100 sin skip, cursor, contador ni «mostrando 100 de N»; los empates de apellido se ordenan de forma no determinista. En moderacion/page.tsx los combates (16-19, take 100 por fecha desc), avisos (20) y gimnasios (24, orderBy verifiedAt asc, take 100) también se cortan sin indicarlo: la ordenación por número de señales se hace en JavaScript después de truncar (línea 28), y en PostgreSQL ASC pone los NULL al final, así que salen antes los gimnasios ya verificados que los pendientes. El recuento del título llega como máximo a 100.

**Escenario:** Con 300 peleadores, quien navega /peleadores sin filtros solo ve de la A a la M. Con 150 combates SELF_REPORTED sin revisar, uno antiguo con la señal MISMO_DIA queda fuera de los 100 más recientes, justo lo que el orden por señales pretendía destacar; con más de 100 gimnasios, los últimos pendientes no se pueden verificar y no se puede retirar el sello a los ya verificados.

**Arreglo propuesto:** Paginación (?pagina= o cursor) con «Mostrando 1-100 de N», anterior y siguiente; ordenar por [lastName, firstName, id]; en moderación consultar aparte los combates con flags no vacíos (flags: { isEmpty: false }) y luego el resto, con paginación; gimnasios con verifiedAt asc nulls first y filtro «pendientes»; mostrar totales en los títulos de la cola.

**Lo que dijo un comprobador:** El hallazgo se sostiene en lo esencial al leer el código real. (1) src/app/peleadores/page.tsx:24 hace findMany con orderBy [{lastName:"asc"}] y take:100, sin skip/cursor, sin contador y sin aviso. Los empates de apellido quedan sin orden determinista, aunque eso solo importa en el corte de 100. Lo mismo ocurre en gimnasios/page.tsx:12 (take 100, orderBy name), entrenadores/page.tsx:11 (take 100) y veladas/page.tsx:20 (take 100). No hay ningún «Mostrando N de M» ni paginación en todo src (el grep de take/skip/cursor/pagina lo confirma). Los documentos no recogen este límite como decisión conoc

### 51. Las fichas de detalle no tienen título propio y faltan favicon, robots, sitemap, imagen para compartir y health check

- **Gravedad:** media · **Estado:** Parcial — Títulos, robots, mapa del sitio y `/salud` hechos. Faltan favicon e imagen para compartir (diseño, al final).
- **Dónde:** `src/app/peleadores/[slug]/page.tsx:14` · **Categoría:** titulo-de-pagina / seo-y-operacion
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: media, media, baja

Ni /peleadores/[slug], /veladas/[slug], /gimnasios/[slug], /entrenadores/[slug], /organizador/[slug] exportan metadata ni generateMetadata: todas heredan «Ring España» (WCAG 2.4.2, nivel A) y el anunciador de rutas de Next lee document.title. global-error.tsx no tiene <title>. En src/app no hay icon, robots, sitemap, opengraph-image ni rutas route.ts, y no existe public/; el metadata del layout (9-12) no define metadataBase ni openGraph. Cada petición a /favicon.ico, /robots.txt o /sitemap.xml da un 404 renderizado con el layout completo y una consulta de sesión, y los rastreadores recorren combinaciones infinitas de filtros, todas dinámicas. No hay /api/health.

**Escenario:** Con varias pestañas abiertas o en el historial todas las fichas se llaman «Ring España»; un lector de pantalla no distingue una página de otra; al compartir una ficha en WhatsApp o X se ve solo el título genérico sin imagen y Google indexa cientos de fichas con el mismo título.

**Arreglo propuesto:** generateMetadata en las cinco rutas con el nombre ya consultado («Sergio Molina · Ring España», plantilla «%s · Ring España»), metadataBase, openGraph, icons, robots.ts (bloquear filtros, /buscar, /verificar y zonas privadas), sitemap.ts con fichas, veladas, gimnasios y entrenadores, y src/app/api/health/route.ts con SELECT 1; añadir <title> a global-error.

**Lo que dijo un comprobador:** El núcleo del hallazgo se sostiene al leer el código real, con algunos matices que exageran parte de la descripción.

Confirmado:
- Ninguna de las cinco rutas de detalle exporta `metadata` ni `generateMetadata`. Las listas y el resto de páginas sí tienen título propio.
- `src/app/layout.tsx` (líneas 9-12) define `title: { default: "Ring España", template: "%s · Ring España" }` y `description`. No define `metadataBase` ni `openGraph`.
- Por tanto, `/peleadores/[slug]`, `/veladas/[slug]`, `/gimnasios/[slug]` y `/entrenadores/[slug]` heredan el título «Ring España». Cada una ya consulta el nombre

### 57. El selector de peleadores del cartel usa el slug como valor, no distingue homónimos, se corta en 500 y la instrucción dice «Escribe el nombre»

- **Gravedad:** media · **Estado:** Parcial — Cada esquina se elige de una lista con alias, ciudad y gimnasio (valor: identificador). Falta poder quitar un combate del cartel.
- **Dónde:** `src/app/organizador/[slug]/page.tsx:57` · **Categoría:** campos y flujo
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: media, media, baja

Los campos de esquina roja y azul son `<input list>` con `<option value={b.slug}>{nombre}</option>` (59): al elegir una sugerencia el campo se rellena con el slug interno («juan-garcia-2»). El texto bajo el formulario dice «Escribe el nombre para elegir de la lista» (línea 65), pero addCartelBout busca por slug exacto (actions.ts:399-402): si se escribe el nombre completo falla con «Elige dos peleadores distintos de la lista» sin explicar que el problema es el nombre, y se pierde lo escrito. La lista trae `take: 500` ordenados por apellido (17), así que con más de 500 peleadores en esa disciplina los últimos no se pueden elegir. Dos homónimos solo se distinguen por el slug, sin gimnasio, ciudad ni alias. El combate se crea ya VERIFIED y no hay forma de quitarlo del cartel desde la app.

**Escenario:** El organizador escribe «Juan García» y «Pedro Ruiz» sin pulsar la sugerencia y recibe «Elige dos peleadores distintos de la lista» con el formulario vacío. Si elige el «Juan García» equivocado (hay dos), el combate queda verificado con la persona equivocada.

**Arreglo propuesto:** Mostrar en cada sugerencia nombre, alias, ciudad y gimnasio y guardar el id en un campo oculto (o selector con búsqueda en servidor), buscar por nombre en la acción, conservar lo escrito al fallar, distinguir «no está en la lista» de «son la misma persona», cambiar la instrucción a «Elige a cada peleador de la lista desplegable» y permitir quitar un combate del cartel.

**Lo que dijo un comprobador:** El hallazgo se sostiene leyendo el código real. Una matiz menor: el mensaje de error sí dice «de la lista», así que no es del todo mudo. En src/app/organizador/[slug]/page.tsx, las líneas 57-59 son dos `<input list="bx">` y un `<datalist>` con `<option value={b.slug}>{nombre}</option>`, así que al elegir una sugerencia el campo se rellena con el slug. La línea 65 dice «Escribe el nombre para elegir de la lista». En src/app/actions.ts:399-403 `addCartelBout` busca con `db.fighter.findUnique({ where: { slug: str(f,"fighterA") } })`, sin ninguna búsqueda por nombre. Si se escribe «Juan García» si

### 64. Fichas de gimnasio y entrenador con secciones vacías sin mensaje, /entrenadores sin forma de crear datos y sello de gimnasio verificado como un «✓» sin texto

- **Gravedad:** media · **Estado:** Parcial — Mensajes de sección vacía y sello «✓ Verificado» con texto hechos. Queda decidir cómo se crean los entrenadores (hoy solo con datos de demostración).
- **Dónde:** `src/app/gimnasios/[slug]/page.tsx:17` · **Categoría:** estados vacíos / alternativa-textual
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: media, media, baja

La ficha de gimnasio pinta «Entrenadores» y «Peleadores» aunque estén vacíos (17-22), y los gimnasios creados solos cuando un peleador teclea el suyo (actions.ts:115-118) nunca tienen entrenadores; entrenadores/[slug]/page.tsx:17-20 igual con «Peleadores». Ninguna acción crea entrenadores, así que /entrenadores (opción de la navegación principal) solo puede tener datos de demostración y en producción muestra «Sin resultados.» (línea 20) sin que nadie haya buscado. En gimnasios/page.tsx:24 el sello de verificado es `<span class="tag PRO">✓</span>` sin texto ni aria-label (WCAG 1.1.1): el lector dice «marca de verificación» sin contexto y a quien ve no se le explica (la ficha, gimnasios/[slug] L14, sí pone «✓ verificado»). El sello es el activo de confianza del producto.

**Escenario:** Una madre abre el gimnasio de su hijo (creado automáticamente) y ve el título «Entrenadores» sin nada debajo y piensa que la página está rota; en /entrenadores lee «Sin resultados.» sin haber buscado; en /gimnasios ve un ✓ dorado y no sabe si es «favorito», «abierto» o «verificado».

**Arreglo propuesto:** Mostrar «Este gimnasio todavía no tiene entrenadores registrados» y «Todavía no hay peleadores» (u ocultar la sección); explicar en /entrenadores por qué no hay datos o quitarlo de la navegación hasta que se puedan crear; mostrar «✓ Verificado» como texto visible o añadir una clase .sr-only con «Verificado por un moderador» (hay que crearla).

**Lo que dijo un comprobador:** El hallazgo se sostiene: el comportamiento es real, aunque hay dos imprecisiones menores en las referencias.

Confirmado en el código:
- src/app/gimnasios/[slug]/page.tsx:17-22 pinta siempre los títulos «Entrenadores» y «Peleadores». Con la lista vacía queda un `<ul>` o un `<div class="grid">` sin nada y sin mensaje.
- src/app/entrenadores/[slug]/page.tsx:17-20 hace lo mismo con «Peleadores».
- Ninguna acción crea entrenadores. En src solo hay lecturas de `db.trainer` (findMany y findUnique) en entrenadores, buscar, gimnasios y peleadores. El único `db.trainer.create` está en prisma/seed.ts:25

### 80. Prisma sin `directUrl` ni configuración de pooler para PostgreSQL gestionado en entorno serverless

- **Gravedad:** media · **Estado:** Parcial — Documentado en el README; falta comprobarlo en un alojamiento real.
- **Dónde:** `prisma/schema.prisma:5` · **Categoría:** base-de-datos
- **Verificación:** 3 comprobadores, 1 refutaciones; gravedad según ellos: baja, baja, baja

El datasource solo tiene url = env('DATABASE_URL') y db.ts:5 crea un PrismaClient sin límite de conexiones; en Vercel cada instancia abre su propio pool. Con Neon o Supabase la aplicación debe pasar por el pooler y las migraciones por una URL directa, y el esquema no prevé la segunda.

**Escenario:** Con la URL directa, un pico de visitas o un rastreador abre decenas de instancias y agota max_connections; con la URL del pooler, `prisma migrate deploy` falla o se cuelga por los bloqueos consultivos en modo transacción.

**Arreglo propuesto:** Añadir directUrl = env('DIRECT_URL'), usar en DATABASE_URL la URL del pooler (con ?pgbouncer=true&connection_limit=1 si el proveedor lo pide), migrar con DIRECT_URL y documentarlo en .env.example y README.

**Lo que dijo un comprobador:** El hallazgo es técnicamente correcto en abstracto, pero hoy no tiene efecto y depende de una infraestructura que el proyecto no ha elegido. Lo bajo de media a baja, sin refutarlo del todo: es una tarea de preparación del despliegue, no un fallo del código.

Mitigaciones y contexto que el autor del hallazgo no consideró:
1. No hay destino de despliegue definido. Ningún fichero del repositorio menciona Vercel, Neon, Supabase, pgbouncer ni pooler. No hay vercel.json ni Dockerfile. Solo existe .github/workflows/ci.yml, que usa un PostgreSQL 16 local en el servicio de GitHub Actions. La premisa «Ve

### 82. Higiene del repositorio y del CI: .gitignore solo ignora `.env`, sin engines, @types/node desalineado, workflow sin permisos, concurrencia ni lint, y sin dependabot

- **Gravedad:** baja · **Estado:** Parcial — `.gitignore`, `engines`, permisos y concurrencia del CI, dependabot. Falta alinear `@types/node` y añadir lint.
- **Dónde:** `.gitignore:1` · **Categoría:** higiene-del-repositorio
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

.gitignore tiene únicamente `.env` (línea 3): `vercel env pull` escribe .env.local con credenciales de producción y no está ignorado. package.json no define engines y declara @types/node ^26.6.3 (línea 27) mientras el CI usa Node 22, así que el compilador acepta APIs que en ejecución podrían no existir. El workflow se lanza con push y pull_request a la vez (dobles ejecuciones), no tiene permissions ni concurrency, no ejecuta ESLint (no está instalado ni hay script lint) y no hay .github/dependabot.yml.

**Escenario:** Alguien ejecuta `vercel env pull` y luego `git add .`: sube la URL de la base de datos de producción con su contraseña al repositorio.

**Arreglo propuesto:** Sustituir por `.env*` con excepción de .env.example, añadir .vercel, fijar engines.node y alinear @types/node, añadir permissions: contents: read y concurrency al workflow, un paso de lint y dependabot.yml.

**Lo que dijo un comprobador:** No se sostiene la refutación: el fondo del hallazgo es real, aunque con dos matices.

Lo que comprobé en el código:
- /home/user/MiClaude/.gitignore tiene 5 entradas (node_modules, .next, .env en la línea 3, *.tsbuildinfo, next-env.d.ts). La descripción dice «únicamente `.env`», y eso es inexacto. Aun así, `.env` solo cubre ese nombre exacto. `.env.local`, `.env.production` y `.vercel/` no están ignorados, y `git ls-files` no muestra ninguno de ellos.
- package.json no define `engines`. Declara `@types/node ^26.6.3` (línea 27) y package-lock.json fija 26.6.3. El CI usa `node-version: 22` en .g

### 84. Ninguna de las 24 Server Actions tiene pruebas de autorización ni de rama negativa; tres no se ejecutan nunca

- **Gravedad:** alta · **Estado:** Pendiente — Pruebas de autorización por acción (los e2e cubren parte).
- **Dónde:** `src/app/actions.ts:1` · **Categoría:** pruebas
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: media, media, media

Lo único que llama a las acciones es tests/e2e/flujo.mjs, siempre desde la interfaz y por el camino feliz. No se ejecutan jamás adminDecide, logout ni resendVerification; tampoco ninguna rama negativa: respondBout con «No es correcto» o con quien no es el rival, decideClaim/decideOrganizer con «Rechazar» o con las condiciones que impiden aprobar (318), resolveReport «Descartar», setGymVerified «Retirar sello», dejar de seguir, setBoutEvidence sin permiso (449-450), createReport sobre FIGHTER y su límite de 10, los 5 rechazos de giveAura, login con contraseña errónea, register con datos o correo repetido, addCartelBout/setBoutResult con datos inválidos o de una velada ajena. La autorización solo se prueba con GET a dos páginas (flujo.mjs:29 y :155), nunca llamando a la acción, aunque una Server Action es un POST que acepta cualquier FormData. La lógica auxiliar (internalPath, go, uniqueSlug, OUTCOMES, reglas de aura) vive en un fichero 'use server' que solo puede exportar funciones asíncronas, así que no se puede probar de forma unitaria. Tres acciones interpretan una decisión ausente o desconocida como la opción destructiva: respondBout (217) y adminDecide (232) dejan DISPUTED y resolveReport (500) descarta el aviso.

**Escenario:** Alguien borra por error `if (admin.role !== "ADMIN") redirect("/")` de adminDecide (229) o de setGymVerified (463): typecheck, las 41 pruebas unitarias y el e2e siguen en verde. Un aficionado con sesión toma el identificador de la acción del HTML de cualquier formulario y envía un POST: verifica un combate inventado o concede el sello a un gimnasio, sin que nada avise.

**Arreglo propuesto:** Capa de integración con vitest (tests/integration) sobre el Postgres del CI: vi.mock('next/headers') para la cookie, una función que capture NEXT_REDIRECT y devuelva su destino, y una matriz rol x acción (sin sesión, FAN sin verificar, FAN verificado, FIGHTER con ficha, FIGHTER que no es el rival, ORGANIZER dueño, ORGANIZER ajeno, ADMIN) que compruebe destino, que el recuento de filas no cambia y que existe mensaje. Sacar a src/lib las funciones puras para probarlas sin mocks. Hacer que una decisión desconocida sea un error y no la opción destructiva.

**Lo que dijo un comprobador:** El fondo se sostiene (ninguna prueba invoca una acción como usuario sin permiso ni comprueba que se rechace), pero el hallazgo describe una versión antigua del código y buena parte de sus detalles son falsos hoy. Lo que sigue siendo cierto: (1) Ninguna prueba envía un POST de una acción con un rol sin permiso. La autorización solo se toca con GET (flujo.mjs:9 y :137), y no hay pruebas de integración ni unitarias sobre las acciones (`grep actions tests` no da nada). Si alguien quita la línea 93 de `requireAdmin()` (`if (u.role !== "ADMIN") go("/", ...)`), typecheck, vitest y e2e seguirían en ve

### 85. El e2e es un único guion secuencial con estado compartido, clics no estrictos y sin diagnóstico al fallar

- **Gravedad:** media · **Estado:** Parcial — El e2e se ha dividido en cinco ficheros con ayudas comunes; falta diagnóstico al fallar (capturas).
- **Dónde:** `tests/e2e/flujo.mjs:83` · **Categoría:** pruebas
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

Las 39 comprobaciones dependen del orden (admin se crea en la línea 63 y se usa en 112, 141, 208, 218 y 228; fan llega hasta 205). Mezclan check (no fatal) con waitFor/waitForSelector (fatales), así que el primer fallo de sincronización tumba el resto. Los clics son no estrictos (page.click devuelve el primer elemento si hay varios): flujo.mjs:83 y :91 usan fan.click("button:has-text('Dar aura')") y :100 `main table details` .first(), correctos solo mientras Pepe tenga un único combate. No hay try/finally para cerrar el navegador ni capturas, trazas o reintentos; la historia del proyecto (runs 4, 5 y 17 del CI fallando sin verlo) muestra que el diagnóstico es la parte cara.

**Escenario:** En el CI falla la aprobación del moderador (línea 67, waitFor sin seen): el guion muere ahí, no se ejecutan unas 25 comprobaciones siguientes y solo queda una traza de timeout sin captura. Al reordenar pasos y darle a Pepe un segundo combate antes de la línea 83, el clic elige en silencio el botón de la primera fila y la prueba pasa o falla por razones equivocadas.

**Arreglo propuesto:** Migrar a @playwright/test (o al menos locators estrictos y getByRole) con escenarios independientes y datos creados por SQL/Prisma; un helper act(page, accion, { aviso, contenido }); trace y screenshot retain-on-failure subidos como artefacto del CI; un navegador por worker con finally.

**Lo que dijo un comprobador:** El fondo se sostiene, pero las citas de línea están desfasadas y la gravedad está inflada. Lo he comprobado leyendo el código real de tests/e2e/flujo.mjs (209 líneas, sin modificar respecto a HEAD), tests/e2e/ayudas.mjs, package.json, .github/workflows/ci.yml y src/app/peleadores/[slug]/page.tsx.

LO QUE SE CONFIRMA
- Es un único guion secuencial con estado compartido. El administrador se crea en la línea 45 y se reutiliza en 49, 94, 123, 186 y 205. El aficionado «fan» se reutiliza hasta la línea 183. Hay 41 llamadas a check() en el fichero.
- Se mezclan comprobaciones no fatales (check y seen

### 86. Aserciones del e2e no acotadas a la ejecución (falsos verdes) y límites take:100 que las rompen con una base reutilizada

- **Gravedad:** media · **Estado:** Parcial — Datos únicos por ejecución y búsquedas acotadas; no hay aún base de pruebas aislada por ejecución.
- **Dónde:** `tests/e2e/flujo.mjs:220` · **Categoría:** pruebas
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

Las líneas 220 (historial de BOUT con «CREATED» y «EVIDENCE_SET»), 222 (historial de GYM con «VERIFIED») y 230 («Menos de 7 días») no incluyen el identificador rnd, así que se cumplen con filas de ejecuciones anteriores aunque la acción actual no haya auditado nada (el diario habla de una BD local con 109 usuarios de pruebas). En sentido inverso, pantallas con límite fijo dejan la fila de esta ejecución al final: /peleadores?disciplina=MMA (take 100 por apellido; «Veterano<rnd>») rompe la línea 191 tras unas 50 ejecuciones, los gimnasios de /moderacion (take 100, verificados primero) rompen 209-214 y la cola de combates hace que 230 dependa del orden de empates. Las veladas «Velada Claim Test» y «Velada Cercana» (36, 225) no llevan rnd y se comparten entre ejecuciones.

**Escenario:** Un desarrollador ejecuta el e2e 30 veces contra la misma base y quita la llamada audit() de setGymVerified: la línea 222 sigue en OK por las entradas «VERIFIED» antiguas. Con unas 50 ejecuciones acumuladas, la línea 191 da FAIL sin ningún cambio de código.

**Arreglo propuesto:** Acotar todo por rnd (filtrar el historial con ?id=<id de la entidad> o comprobar la fila que contiene rnd), usar nombres con rnd en todas las veladas, crear una base limpia o un esquema por ejecución, y añadir búsqueda o paginación a las pantallas de moderación y listados en vez de un take fijo.

**Lo que dijo un comprobador:** El hallazgo se sostiene en lo esencial, pero con datos inexactos y una gravedad exagerada.

Lo que sí es cierto, leyendo el código real:
- Los números de línea son de una revisión antigua. El fichero actual tiene 209 líneas y no existen las líneas 220, 222 ni 230. Las comprobaciones sí están, en las líneas 198, 200 y 207 (coinciden con la línea 220, 222 y 230 del commit 518d3e6). El resto se mueve igual: MMA 191→169, Velada Cercana 225→203.
- Las tres aserciones sin rnd existen tal como se describen: BOUT con CREATED y EVIDENCE_SET, GYM con VERIFIED, y «Menos de 7 días». Se cumplen con filas d

### 87. auth.ts sin ninguna prueba: caducidad de sesión y tokens de verificación

- **Gravedad:** media · **Estado:** Parcial — Hay pruebas de contraseñas, correo, entorno y límites; faltan pruebas unitarias de caducidad de sesión y enlaces (los cubre el e2e).
- **Dónde:** `src/lib/auth.ts:28` · **Categoría:** pruebas
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: media, baja, baja

getUser (28-34), consumeVerificationToken (53-61) y sendVerificationEmail (45-50) solo se ejercitan por el camino feliz del e2e. No hay prueba de sesión con expiresAt pasado (32), cookie con token inexistente, token caducado (55), ya usado (el borrado de la 58), de otro usuario, ni de que reenviar invalida el anterior (deleteMany en la 47). Son las reglas que sostienen «correo verificado» y «sesión de 30 días».

**Escenario:** Alguien cambia `row.expiresAt < new Date()` por `>` o borra el deleteMany de la línea 58: los tokens caducados pasan a ser válidos o el mismo enlace sirve para siempre, y typecheck, unitarias y e2e siguen en verde porque el e2e solo verifica con un token recién emitido y lo usa una vez.

**Arreglo propuesto:** Pruebas unitarias con vi.mock('./db'), vi.mock('next/headers') y vi.useFakeTimers: sesión válida, caducada e inexistente; token válido, caducado, reutilizado y ajeno; el reenvío invalida el anterior; verifyEmail con token vacío redirige a error=token; e2e mínimo de «Salir» y de sesión caducada.

**Lo que dijo un comprobador:** El hueco central es real, pero el hallazgo lo exagera y lo cita mal. (1) Lo cierto: ninguna prueba unitaria importa src/lib/auth.ts; tests/unit/notify.test.ts solo lo sustituye con vi.mock. Ningún test, ni unitario ni e2e, comprueba la caducidad: no hay vi.useFakeTimers y los e2e nunca modifican expiresAt (solo hacen un update de rol por psql). Quedan sin guardia la sesión caducada (auth.ts:33), el token de verificación o recuperación caducado (88, 115, 105) y el de baja (67). Tampoco se prueba que un enlace de VERIFY ya usado no sirva, ni que reenviar invalide el anterior: issueToken:53 borra

### 88. parsePrior: casos límite sin fijar y tope aplicado por campo, no a la suma

- **Gravedad:** baja · **Estado:** Pendiente
- **Dónde:** `src/lib/prior.ts:30` · **Categoría:** pruebas
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

MAX = 1000 se aplica por campo: parsePrior({ wins:'1000', losses:'1000', draws:'1000' }) devuelve ok con total 3000. prior.test.ts:22-24 solo prueba inválidos en total, no en victorias, derrotas o empates. Sin fijar: { total:'12', wins:'8' } da prior_suma; { total:'0' } da total 0 sin detalle; 0-0-0 da detalle con total 0 (RecordCards mostraría «Incluye 0 combates anteriores»); '007' da 7; ' 12 ' da 12; '１２' da prior_numero. Tampoco hay regla ni prueba de qué ocurre al editar el récord de partida cuando ya hay combates registrados.

**Escenario:** Una persona declara 1000 victorias, 1000 derrotas y 1000 empates y la ficha lo muestra como récord declarado 3000 combates sin que nada lo impida.

**Arreglo propuesto:** Tabla de casos con lo anterior, decidir si el tope se aplica a la suma (p. ej. 500 por campo o 1500 total), probar inválidos en los cuatro campos y, si se decide bloquear la edición tras el primer combate, cubrirlo con una prueba de saveDiscipline.

**Lo que dijo un comprobador:** El hallazgo se sostiene leyendo el código real; solo falla la cita de línea (la línea 30 es el reparto de partes; el tope está en las líneas 6 y 13). Sigo cada afirmación contra el código. (1) MAX=1000 se aplica por campo dentro de toInt (línea 13), y la suma no se limita: parsePrior({wins:'1000',losses:'1000',draws:'1000'}) sale ok con total 3000. El formulario (DisciplineFields.tsx:33-36) también pone max={1000} por campo. (2) tests/unit/prior.test.ts:22-24 prueba los inválidos ("-1","2.5","abc","5000") solo con el campo total, no con victorias, derrotas ni empates. (3) Casos sin fijar, todo

### 93. El sello de organizador verificado no exige nota de evidencia, aunque IDEAS y ARQUITECTURA dicen que es obligatoria

- **Gravedad:** media · **Estado:** Pendiente — La aprobación de organizador no exige nota de evidencia (solo el sello de gimnasio).
- **Dónde:** `src/app/actions.ts:355` · **Categoría:** documentacion-vs-codigo
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

IDEAS.md:51 («nota de evidencia obligatoria, interna») y ARQUITECTURA.md:136 valen solo para gimnasios: setGymVerified (468) redirige con error si falta la nota, pero en decideOrganizer la nota es opcional (`note: str(f, "note") || null`, `reviewNote … || null`) y el input de moderacion/page.tsx:32 no lleva required. Al aprobar, la velada muestra «✓ organizador verificado» (veladas/[slug]/page.tsx:17) con el título «Organizador verificado por un moderador», sin evidencia registrada.

**Escenario:** El moderador pulsa «Aprobar» en una solicitud de organizador con el campo de evidencia vacío: se aprueba, el usuario pasa a ORGANIZER y sus veladas muestran el sello sin ninguna evidencia en reviewNote ni en el AuditLog.

**Arreglo propuesto:** Exigir la nota al aprobar (`if (approve && !note) redirect('/moderacion?error=nota')` y required en el input), o corregir IDEAS.md:51 y ARQUITECTURA.md:136 para decir que solo aplica a gimnasios.

**Lo que dijo un comprobador:** El comportamiento existe, pero las referencias de línea están desfasadas y el impacto es menor que «media». Confirmado en el código real: (1) decideOrganizer (src/app/actions.ts:680-695, no la línea 355, que es `reachCm`) toma `const note = str(f,"note").slice(0, LIMITS.note) || null` y no comprueba `approve && !note`. Guarda `reviewNote: note` (null si está vacía) y registra `after: {..., note}` en el AuditLog. Al aprobar pone el rol ORGANIZER. (2) setGymVerified (actions.ts:834-848, no la 468) sí hace `if (verify && !note) go(back, {problema:"sello_sin_nota"})` en la línea 841, así que la as

### 94. El documento dice que el ránking distingue siempre lo respaldado de lo autodeclarado, pero auraRanking no filtra ni etiqueta por verificación

- **Gravedad:** baja · **Estado:** Pendiente — Documentación: el ránking no distingue lo respaldado de lo autodeclarado.
- **Dónde:** `src/lib/aura.ts:40` · **Categoría:** documentacion-vs-codigo
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

ARQUITECTURA.md:98 fija como regla que «la ficha y el ránking distinguen siempre lo respaldado de lo autodeclarado», pero auraRanking solo filtra por disciplina, fecha y provincia: un aura sobre un combate SELF_REPORTED cuenta igual que sobre uno VERIFIED y /ranking no muestra señal de respaldo (la misma tabla, L95, admite que falta ponderar el nivel). Tampoco existe la cifra «12-2, 9 verificados»: la ficha muestra cuántos están pendientes de confirmar, no cuántos están verificados.

**Escenario:** Un peleador registra un combate inventado contra un rival sin cuenta (SELF_REPORTED) y, con otras cuentas verificadas, recibe aura: sube en /ranking sin ninguna marca de que el combate no está respaldado.

**Arreglo propuesto:** Reformular la regla como objetivo pendiente o implementar un filtro o marca de respaldo (contar solo auras de combates ≥ CONFIRMED o mostrar el nivel en el ránking) y actualizar el documento.

**Lo que dijo un comprobador:** El hallazgo se sostiene al leer el código real. (1) `auraRanking` en src/lib/aura.ts (L41-49) solo excluye combates `DISPUTED` y eventos cancelados, y filtra por disciplina, fecha y provincia. Un aura sobre un combate `SELF_REPORTED` cuenta igual que sobre uno `VERIFIED`. (2) src/app/ranking/page.tsx solo pinta Puesto, Peleador y Aura, sin ninguna marca de respaldo. (3) `canGiveAura` (src/lib/rules.ts) solo rechaza `DISPUTED`, cancelado, futuro, sin resultado y participante, así que se puede dar aura a un combate sin confirmar. (4) El escenario se reproduce paso a paso. En actions.ts L468-479

### 95. COMPETENCIA.md da por hecho un enlace estable por combate que no existe y lista como pendiente lo que el ránking ya hace

- **Gravedad:** baja · **Estado:** Pendiente
- **Dónde:** `docs/COMPETENCIA.md:31` · **Categoría:** documentacion-vs-codigo
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

L31: «Identificador único y enlace estable por peleador y por combate — Ya lo tenemos». No hay ruta por combate en src/app (solo /peleadores/[slug], /veladas/[slug], /gimnasios/[slug], /entrenadores/[slug] y /organizador/[slug]); los combates se muestran dentro de la ficha o la velada. L34 propone mejorar el ránking «por disciplina y categoría, y explicando cómo se calcula», y ranking/page.tsx:18-33 ya lo hace.

**Escenario:** Se afirma ante el fundador que se iguala a BoxRec en enlaces por combate, cuando compartir un combate concreto no es posible, y se planifica «añadir» al ránking algo que ya está.

**Arreglo propuesto:** Corregir L31 a «enlace por peleador y velada; por combate, pendiente», ajustar la fila de ránkings y añadir la ruta por combate a IDEAS si se quiere.

**Lo que dijo un comprobador:** El hallazgo se sostiene leyendo el código real. 1) docs/COMPETENCIA.md L31 dice literalmente «Identificador único y enlace estable por peleador y por combate | Ya lo tenemos (enlaces con nombre)». En src/app solo hay páginas dinámicas para peleadores, veladas, gimnasios, entrenadores y organizador; no existe ninguna ruta de combate (ni /combates/[id] ni otra). Tampoco hay anclas por combate: la búsqueda de `id=` en las páginas de peleador y velada y en RecordCards.tsx no da resultados, y sitemap.ts solo lista peleadores, veladas, gimnasios y entrenadores, sin combates. Por eso no se puede comp

### 96. Textos públicos que no reflejan el alcance actual: descripción del sitio solo de boxeo y gimnasio de ejemplo con palabra inglesa

- **Gravedad:** baja · **Estado:** Pendiente — La descripción del sitio solo habla de boxeo.
- **Dónde:** `src/app/layout.tsx:11` · **Categoría:** idioma
- **Verificación:** 3 comprobadores, 0 refutaciones; gravedad según ellos: baja, baja, baja

La descripción que ven buscadores y vistas previas dice «La base de datos del boxeo español: peleadores profesionales y amateur, récords, veladas, gimnasios y entrenadores», lo que contradice portada y ayuda (boxeo, MMA, kickboxing, K-1 y jiu-jitsu, amateur primero, Madrid). El seed crea el gimnasio «Boxing Demo Sevilla» (prisma/seed.ts:20), que sale en /gimnasios, /buscar y las fichas con la palabra inglesa «Boxing», contra la regla de que todo lo visible vaya en español.

**Escenario:** Al compartir el enlace, la vista previa habla solo de boxeo profesional y amateur; quien abre /gimnasios en la demo ve «Boxing Demo Sevilla» entre nombres en español.

**Arreglo propuesto:** Ajustar la descripción («Comunidad de los deportes de contacto en España: boxeo, MMA, kickboxing, K-1 y jiu-jitsu…») y renombrar el gimnasio de ejemplo («Gimnasio Demo Sevilla»).

**Lo que dijo un comprobador:** El hallazgo se sostiene en lo esencial, pero las dos líneas citadas están mal. La descripción del sitio está en src/app/layout.tsx línea 13 (la línea 11 es `metadataBase`) y dice literalmente «La base de datos del boxeo español: peleadores profesionales y amateur, récords, veladas, gimnasios y entrenadores.». El gimnasio de ejemplo está en prisma/seed.ts línea 39 (la línea 20 es código de `comprobarQueEsSeguro`): `["Boxing Demo Sevilla", "Sevilla", "Sevilla"]`. Se crea con `db.gym.create` y el nombre es lo que se muestra en la interfaz, sin traducirlo.

Contradicción con el alcance actual, com

### 97. Vocabulario residual en CLAUDE.md, IDEAS y ARQUITECTURA («boxeador», «valoración», «email») y fila mal formada en IDEAS

- **Gravedad:** baja · **Estado:** Pendiente
- **Dónde:** `CLAUDE.md:23` · **Categoría:** idioma
- **Verificación:** sin verificar (no hubo comprobadores)

CLAUDE.md:7 fija «peleador» y CLAUDE.md:51 «correo electrónico» también en la documentación, pero los ejemplos de la lista de usabilidad usan «Valorar a este boxeador» (L23) y «Tu valoración se ha guardado» (L28) y las reglas dicen «votar… (y email verificado)» (L65); esas acciones ya no existen (los botones son «Dar aura» y «Seguir a este peleador»). IDEAS.md:59 habla de «Mis boxeadores» cuando la pantalla es «Mis peleadores» (layout.tsx:34). ARQUITECTURA.md:28-30, L55, L75 y README.md:26 dicen «email». IDEAS.md:54 tiene una fila con cinco celdas en una tabla de cuatro columnas, por lo que la frase «Sin cambiar el estilo visual sin consultar» se pierde al renderizar.

**Escenario:** Quien redacte un botón o mensaje copiando los ejemplos de CLAUDE.md escribirá «Valorar a este boxeador» y contradecirá el vocabulario que el mismo fichero manda; en IDEAS la nota de no tocar el estilo desaparece de la vista.

**Arreglo propuesto:** Cambiar los ejemplos a «Dar aura a este peleador» y «Tu aura se ha guardado»; unificar «peleador» y «correo electrónico» en los documentos; unir las dos últimas celdas de IDEAS.md:54.

### 99. Las solicitudes de reclamación y de organizador no tienen límite ni espera y pueden inundar la cola de moderación

- **Gravedad:** baja · **Estado:** Parcial — Las reclamaciones tienen tope de 3 abiertas; falta espera entre solicitudes de organizador.
- **Dónde:** `src/app/actions.ts:304` · **Categoría:** abuso-de-flujo / limites
- **Verificación:** sin verificar (no hubo comprobadores)

requestClaim (304-309) permite a un usuario verificado crear una solicitud por cada ficha sin dueño y, al ser rechazada, volver a ponerla en PENDING con el upsert (`update: { status: 'PENDING' }`), sin límite diario ni espera. requestOrganizer (341-345) hace lo mismo con la solicitud propia, incluso aprobada, porque el update la devuelve a PENDING. moderacion/page.tsx:25 carga todas las reclamaciones pendientes sin take.

**Escenario:** Un usuario verificado ejecuta requestClaim con el fighterId de cada ficha sin dueño (los ids salen en los formularios de /mi-ficha?q=…): cada moderador ve cientos de reclamaciones del mismo usuario y, si las rechaza una a una, las reenvía. Un organizador aprobado que reenvía su solicitud vuelve a PENDING y su etiqueta «✓ organizador verificado» desaparece de sus veladas hasta que se le apruebe de nuevo.

**Arreglo propuesto:** Máximo de solicitudes PENDING por usuario (p. ej. 3) y espera tras un rechazo (p. ej. 7 días); no reabrir una solicitud APPROVED; paginar la cola de moderación y agrupar las solicitudes por usuario.

## Hallazgos refutados

- **81. Faltan índices en claves foráneas que las páginas consultan (Fighter.gymId y trainerId, Event.organizerId, Bout.createdById, Report.userId, ClaimRequest.fighterId)** — Refutado por mayoría: casi todos esos índices ya existían. Se añadieron los que sí faltaban (`Report.userId`, `ClaimRequest.fighterId`, `AuditLog.userId`, `Trainer.gymId`).
- **83. Hash de contraseña con parámetros por defecto de scrypt y formato sin versión ni parámetros: no se puede reforzar sin invalidar todas las cuentas** — Los tres comprobadores lo refutaron (los parámetros por defecto eran aceptables), pero en el Bloque 3 se reforzó igualmente: parámetros de OWASP guardados en el hash y recalculado al entrar.
- **90. Datos de prueba que caducan o apuntan a terceros: velada «futura» fija en 2030 y dominio @test.es** — Refutado por mayoría (2 de 3). De todos modos, la velada «futura» de las pruebas ya es relativa a la fecha de hoy.
- **91. README y ARQUITECTURA describen el proyecto anterior (Boxer, Rating, rateBoxer, ratings.ts, ránking bayesiano, solo boxeo) y una hoja de ruta desfasada, sin sección de variables ni despliegue** — Refutado por los comprobadores porque, al verificarlo (después del traslado), ya estaba corregido: README y ARQUITECTURA se reescribieron.
- **92. Ficha «gestionada por el peleador» en los documentos, pero solo se pueden editar disciplina, categoría y récord de partida** — Bloque 4: «Corregir los datos de mi ficha». Refutado por los comprobadores porque, al verificarlo, ya estaba corregido.
