# Mapa funcional

> **Generado automáticamente por `npm run mapa` a partir del código. No se edita a mano:** el CI falla si no está al día.
> Sirve para responder a «¿dónde se hace X?»: qué pantalla lanza qué acción, quién puede ejecutarla y en qué tablas escribe.
> Para las recetas («cómo añado una acción nueva…») y las reglas de organización, ver [`DESARROLLO.md`](DESARROLLO.md).

## Pantallas y direcciones

| Dirección | Qué es | Quién puede entrar | Acciones que lanza | Lee de |
|---|---|---|---|---|
| `/` | (respuesta técnica, sin pantalla) | Pública (cambia lo que ve según la cuenta) | — | — |
| `/api/auth/google` | (respuesta técnica, sin pantalla) | Pública | — | — |
| `/api/auth/google/callback` | (respuesta técnica, sin pantalla) | Pública | — | User |
| `/api/cron/noticias` | (respuesta técnica, sin pantalla) | Pública | — | — |
| `/api/fallos` | (respuesta técnica, sin pantalla) | Pública (cambia lo que ve según la cuenta) | — | — |
| `/avisar` | Avisar de un contenido | Pública (cambia lo que ve según la cuenta) | `community.avisarSinCuenta` | — |
| `/aviso-legal` | Aviso legal | Pública | — | — |
| `/avisos` | Avisos | Cuenta con sesión iniciada | `notifications.readAllNotifications`, `notifications.readNotification` | Notification |
| `/ayuda` | ¿Cómo funciona Lona? | Pública | — | — |
| `/baja` | Avisos por correo electrónico | Pública | `accounts.unsubscribeEmails` | — |
| `/bienvenida` | Tu deporte. | Pública (cambia lo que ve según la cuenta) | — | — |
| `/buscar` | Buscar | Pública | — | Event, Fighter, Gym, Trainer |
| `/clases` | Buscar clases | Pública (cambia lo que ve según la cuenta) | — | TrainingClass |
| `/clases/:id/solicitar` | Solicitar esta clase | Pública (cambia lo que ve según la cuenta) | `trainers.requestClass` | ClassRequest, TrainingClass |
| `/compartir` | Subir vídeos o fotos de una velada | Cuenta con sesión iniciada | `media.shareMedia` | Event |
| `/condiciones` | Condiciones de uso | Pública | — | — |
| `/cookies` | Cookies | Pública | — | — |
| `/disciplinas/:slug` | (ficha individual: el título depende del elemento) | Pública | — | — |
| `/entrar` | Entrar en tu cuenta | Pública | `accounts.login` | — |
| `/entrar/segundo-paso` | Protege la cuenta del creador | Pública (cambia lo que ve según la cuenta) | `accounts.logout`, `creador.activarSegundoPaso`, `creador.comprobarSegundoPaso` | — |
| `/entrenadores` | Entrenadores | Pública | — | Trainer |
| `/entrenadores/:slug` | (ficha individual: el título depende del elemento) | Pública (cambia lo que ve según la cuenta) | — | Trainer |
| `/federaciones` | Federaciones | Pública (cambia lo que ve según la cuenta) | `profiles.createFederation` | Profile |
| `/federaciones/:id` | (ficha individual: el título depende del elemento) | Pública | — | Profile |
| `/gimnasios` | Gimnasios | Pública | — | Aura, Fighter, Gym |
| `/gimnasios/:slug` | (ficha individual: el título depende del elemento) | Pública | `community.createReport` | Gym |
| `/highlights/:id/imagen` | Foto de un highlight. Solo si la ficha es pública (o es la propia) y el highlight no se ha retirado. Revalida con ETag, como las fotos de perfil. | Pública (cambia lo que ve según la cuenta) | — | Highlight |
| `/highlights/:id/video` | Vídeo de un highlight subido a la aplicación. Solo si la ficha es pública (o es la propia) y el highlight no se ha retirado. | Pública (cambia lo que ve según la cuenta) | — | Highlight |
| `/imagenes/:kind/:id/:slot` | Siempre se revalida (`no-cache`, `private`): quien ya tiene la imagen recibe un 304 sin bytes, y una ficha ocultada deja de verse al instante. | Pública (cambia lo que ve según la cuenta) | — | Profile |
| `/laboratorio` | (respuesta técnica, sin pantalla) | Pública | — | — |
| `/medios/:id/imagen` | Foto que el público subió a una velada (guardada ya normalizada en WebP). ?descargar=1 la descarga. | Pública | — | MediaItem |
| `/medios/:id/video` | Vídeo que el público subió a una velada. ?descargar=1 lo descarga (para que el peleador lo guarde). | Pública | — | MediaItem |
| `/mi-cuenta` | Mi cuenta | Cuenta con sesión iniciada | `accounts.changePassword`, `accounts.updateAccount`, `community.desbloquearUsuario`, `demo.demoCambiarPapel` | Block, Profile, Report, SupportAccreditation |
| `/mi-cuenta/datos` | Una foto de la copia de datos, en base64 (del almacén de fotos o de la base). | Cuenta con sesión iniciada | — | AuditLog, Aura, Block, Bout, ClaimRequest, ClassRequest, Event, EventAttendance, EventRegistration, FightProposal, FighterAchievement, Follow, Gym, GymClaimRequest, GymMemberInvitation, GymTransferInvitation, Highlight, Notification, OrganizerRequest, Profile, Report, SupportAccreditation, TicketReservation, Trainer |
| `/mi-cuenta/eliminar` | Eliminar mi cuenta | Cuenta con sesión iniciada | `accounts.deleteAccount` | Bout |
| `/mi-ficha` | ¿Ya apareces en Lona? | Cuenta con correo verificado | `bouts.addBout`, `bouts.removeMyBout`, `bouts.respondBout`, `bouts.setBoutEvidence`, `bouts.setMyBoutResult`, `fighters.createMyFighter`, `fighters.manageHighlight`, `fighters.publishHighlight`, `fighters.removeDiscipline`, `fighters.requestClaim`, `fighters.saveDiscipline`, `fighters.setAvailability`, `fighters.setRecordPublic`, `fighters.updateMyFighter` | Bout, ClaimRequest, Fighter, FighterAchievement, Gym, Highlight, MediaItem, Profile |
| `/mi-ficha/rival` | ¿Quién es tu rival? | Cuenta con correo verificado | `bouts.addBout` | Bout |
| `/mi-ficha/trayectoria` | Mi trayectoria y aura | Cuenta con correo verificado | `trajectory.requestAchievementReview`, `trajectory.restoreOwnAchievement`, `trajectory.saveAchievement`, `trajectory.withdrawAchievement` | FighterAchievement |
| `/mi-panel` | (respuesta técnica, sin pantalla) | Cuenta con sesión iniciada | — | — |
| `/mis-clases` | Solicitudes | Cuenta con sesión iniciada | `community.bloquearUsuario`, `trainers.answerClassRequest`, `trainers.createClass`, `trainers.toggleClass` | ClassRequest, Trainer |
| `/mis-entradas` | Mis entradas | Cuenta con sesión iniciada | `entradas.cancelarMiReserva` | TicketReservation |
| `/mis-gimnasios` | Mis gimnasios | Cuenta con correo verificado | `gyms.answerGymMemberInvitation`, `gyms.answerGymTransfer`, `gyms.cancelGymMemberInvitation`, `gyms.cancelGymTransfer`, `gyms.inviteGymMember`, `gyms.inviteGymTransfer`, `gyms.requestGymClaim`, `gyms.saveGym`, `gyms.setGymMember`, `gyms.transferGym` | Fighter, Gym, GymClaimRequest, GymMemberInvitation, GymTransferInvitation, Profile, Trainer |
| `/mis-inscripciones` | Mis inscripciones | Cuenta con sesión iniciada | `registrations.withdrawRegistration` | EventRegistration, EventSlot |
| `/mis-reservas` | Mis reservas de clases | Cuenta con sesión iniciada | `trainers.cancelClassRequest` | ClassRequest |
| `/moderacion` | Moderación | Moderación | `gyms.decideGymClaim`, `moderation.actualizarFallo`, `moderation.adminDecide`, `moderation.decideClaim`, `moderation.decideOrganizer`, `moderation.decidirVeladaPasada`, `moderation.resolveReport`, `moderation.setGymVerified` | AppError, AuditLog, Aura, Bout, ClaimRequest, Event, Fighter, Gym, GymClaimRequest, MediaItem, NewsSource, OrganizerRequest, Report |
| `/moderacion/acreditaciones` | Acreditaciones para respaldar | Moderación | `trajectory.setSupportAccreditation` | SupportAccreditation |
| `/moderacion/fallos` | Fallos de la aplicación | Moderación | — | AppError |
| `/moderacion/fallos/:id` | Detalle de un fallo | Moderación | `moderation.actualizarFallo` | AppError, AuditLog, User |
| `/moderacion/gimnasios` | Revisar gimnasios | Moderación | `gyms.decideGymClaim`, `gyms.saveGym` | Gym, GymClaimRequest |
| `/moderacion/historial` | Historial de cambios | Moderación | — | AuditLog |
| `/moderacion/noticias` | Fuentes de noticias | Moderación | `news.addNewsSource`, `news.refreshNewsNow`, `news.toggleNewsItem`, `news.toggleNewsSource` | NewsItem, NewsSource |
| `/moderacion/usuarios` | Administración | Pública | `creador.cambiarTipoDeCuenta`, `creador.cerrarSesionesDe`, `creador.regenerarCodigos` | AuditLog, User |
| `/moderacion/veladas` | Veladas pasadas pendientes de autorización ( | Moderación | `moderation.decidirVeladaPasada` | Event |
| `/noticias` | Noticias | Pública | — | — |
| `/organizador` | Organizadores de veladas | Pública (cambia lo que ve según la cuenta) | `events.createEvent`, `events.requestOrganizer` | Event, OrganizerRequest |
| `/organizador/:slug` | (ficha individual: el título depende del elemento) | Moderación | `bouts.setBoutEvidence`, `entradas.guardarCartelYEntradas`, `events.addCartelBout`, `events.removeCartelBout`, `events.setBoutResult`, `events.setEventStatus`, `events.updateEvent`, `registrations.removeSlot`, `registrations.setRegistration`, `registrations.setSlot` | Event, EventRegistration, EventSlot, Fighter, TicketReservation |
| `/organizador/:slug/emparejar` | Ayuda para emparejar | Moderación | `events.addCartelBout` | Event |
| `/organizador/:slug/entradas` | Reservas de entradas | Moderación | `entradas.gestionarReserva` | Event, TicketReservation |
| `/organizador/:slug/entradas/csv` | Una celda de CSV: entre comillas, y sin que una hoja de cálculo la tome por una fórmula (como en la lista de solicitudes). | Cuenta con sesión iniciada | — | Event |
| `/organizador/:slug/inscripciones` | Solicitudes para participar | Moderación | `registrations.answerRegistrations` | Event, EventSlot |
| `/organizador/:slug/inscripciones/csv` | Una celda de CSV: entre comillas, y sin que una hoja de cálculo la tome por una fórmula (empieza por =, +, - o @). | Cuenta con sesión iniciada | — | Event |
| `/peleadores` | Peleadores | Pública | — | Fighter |
| `/peleadores/:slug` | (ficha individual: el título depende del elemento) | Pública (cambia lo que ve según la cuenta) | `aura.giveAura`, `aura.removeAura`, `community.bloquearUsuario`, `community.createReport`, `community.desbloquearUsuario`, `community.toggleFollow`, `fighters.removeDiscipline` | Aura, Bout, Fighter, FighterAchievement, Follow, Highlight, MediaItem, Profile |
| `/peleadores/:slug/proponer` | Retar o proponer sparring | Pública (cambia lo que ve según la cuenta) | `proposals.proposeFight` | Fighter, FighterDiscipline |
| `/perfiles/:kind/:id/editar` | Personalizar | Cuenta con correo verificado | `profiles.saveProfile` | Gym, Trainer, User |
| `/privacidad` | Privacidad y tus datos | Pública | — | — |
| `/promotores` | Promotores | Pública | — | User |
| `/promotores/:id` | (ficha individual: el título depende del elemento) | Pública | — | Event, User |
| `/propuestas` | Retos y sparrings | Cuenta con sesión iniciada | `community.bloquearUsuario`, `proposals.answerProposal`, `proposals.cancelProposal` | Aura, Bout, FightProposal, Fighter |
| `/ranking` | Ránking de aura | Pública | — | — |
| `/recuperar` | ¿Has olvidado tu contraseña? | Pública | `accounts.requestPasswordReset` | — |
| `/recuperar/nueva` | El enlace ya no sirve | Pública | `accounts.resetPassword` | — |
| `/registro` | Crear cuenta | Pública | `accounts.register` | — |
| `/registro/clase` | Tu primera clase | Cuenta con sesión iniciada | `accounts.saveTrainerClassIntent` | — |
| `/registro/ficha` | Crea tu ficha | Cuenta con sesión iniciada | `accounts.saveFighterIntent` | — |
| `/registro/intereses` | ¿Qué te gusta ver? | Cuenta con sesión iniciada | `accounts.saveInterests` | Fighter, Follow |
| `/registro/perfil` | Tu perfil de entrenador | Cuenta con sesión iniciada | `accounts.saveTrainerIntent` | Gym |
| `/respaldar` | Respaldar resultados y títulos | Moderación o cuenta acreditada para la disciplina (correo verificado) | `trajectory.endorseBout`, `trajectory.reviewAchievement` | Bout, FighterAchievement |
| `/revision-ui` | Actualidad de los deportes de contacto | Pública | — | — |
| `/salud` | Comprobación de salud para el alojamiento: responde 200 si la aplicación y la base de datos funcionan, y 503 si no. | Pública | — | — |
| `/siguiendo` | Peleadores que sigo | Cuenta con sesión iniciada | `community.toggleFollow` | Bout, Follow |
| `/subidas` | (respuesta técnica, sin pantalla) | Pública (cambia lo que ve según la cuenta) | — | — |
| `/subidas/:...clave` | Recibe un vídeo cuando el almacén es el disco del servidor (desarrollo, pruebas y demo). Con R2, el navegador sube directamente allí. | Pública (cambia lo que ve según la cuenta) | — | — |
| `/veladas` | Calendario de veladas | Pública | — | Event |
| `/veladas/:slug` | (ficha individual: el título depende del elemento) | Pública (cambia lo que ve según la cuenta) | `community.bloquearUsuario`, `community.createReport`, `entradas.reservarEntradas`, `events.setAttendance` | Event, EventAttendance, EventRegistration, EventSlot, MediaItem, TicketReservation |
| `/veladas/:slug/calendario` | Descarga pública de una velada publicada. Nunca exporta datos de asistencia. | Pública | — | Event |
| `/veladas/:slug/cartel` | Cartel de una velada (WebP ya normalizado). Solo el de las veladas visibles: las pendientes de autorizar o rechazadas no se sirven. | Pública | — | Event |
| `/veladas/:slug/inscribirme` | Solicitar participar | Pública (cambia lo que ve según la cuenta) | `registrations.requestRegistration`, `registrations.withdrawRegistration` | Bout, Event, EventRegistration, EventSlot, FighterDiscipline |
| `/verificar` | Confirmar tu correo electrónico | Pública (cambia lo que ve según la cuenta) | `accounts.resendVerification`, `accounts.verifyEmail`, `demo.demoConfirmarCorreo` | OrganizerRequest |

«Quién puede entrar» se deduce del código de cada pantalla; las acciones comprueban sus permisos por su cuenta (siguiente tabla), nunca se fían de que la pantalla los haya comprobado.

## Acciones del servidor

Cada acción es un punto de entrada público del servidor (`src/app/actions/<módulo>.ts`). Lo que sigue sale de seguir las llamadas del código.

### `accounts`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `changePassword` | Cuenta con sesión iniciada | AppError, AuditLog, EmailOutbox, RateHit, Session, User | — | Sí | contrasena_guardada |
| `deleteAccount` | Cuenta con sesión iniciada | AppError, AuditLog, Bout, Fighter, FighterAchievement, FighterDiscipline, GymTransferInvitation, Highlight, Profile, RateHit, Session, SupportAccreditation, Trainer, User | USER: ACCOUNT_DELETED | — | cuenta_eliminada |
| `login` | Cualquiera | AuditLog, RateHit, Session, User | USER: CREADOR_PERMISOS | — | — |
| `logout` | Cualquiera | Session | — | — | sesion_cerrada |
| `register` | Cualquiera | AppError, AuditLog, EmailOutbox, EmailToken, OrganizerRequest, RateHit, Session, User | — | Sí | cuenta_creada, registro_entidad |
| `requestPasswordReset` | Cualquiera | AppError, AuditLog, EmailOutbox, EmailToken, RateHit | — | Sí | recuperar_enviado |
| `resendVerification` | Cuenta con sesión iniciada | AppError, AuditLog, EmailOutbox, EmailToken, RateHit | — | Sí | correo_reenviado |
| `resetPassword` | Cualquiera | AppError, AuditLog, EmailOutbox, EmailToken, RateHit, Session, User | — | Sí | contrasena_cambiada |
| `saveFighterIntent` | Cuenta con sesión iniciada | User | — | — | registro_ficha_guardada |
| `saveInterests` | Cuenta con sesión iniciada | Follow, User | — | — | — |
| `saveTrainerClassIntent` | Cuenta con sesión iniciada | User | — | — | registro_clase_guardada |
| `saveTrainerIntent` | Cuenta con sesión iniciada | User | — | — | — |
| `unsubscribeEmails` | Cualquiera | User | — | — | avisos_desactivados |
| `updateAccount` | Cuenta con sesión iniciada | AuditLog, User | USER: ACCOUNT_UPDATED | — | cuenta_guardada |
| `verifyEmail` | Cualquiera | EmailToken, User | — | — | correo_verificado |

### `aura`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `giveAura` | Cualquiera | Aura, Notification | — | — | aura_dada |
| `removeAura` | Cualquiera | Aura | — | — | aura_quitada |

### `bouts`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `addBout` | Cuenta con correo verificado | AppError, AuditLog, Bout, Event, Fighter, FighterDiscipline, Notification | BOUT: CREATED | Sí | combate_registrado, combate_registrado_futuro |
| `removeMyBout` | Cuenta con correo verificado | AuditLog, Bout, Event, Fighter | BOUT: REMOVED_BY_AUTHOR | — | combate_quitado |
| `respondBout` | Cuenta con correo verificado | AppError, AuditLog, Bout, Fighter, Report | BOUT: (varias), BOUT: RIVAL_REVIEW_REQUESTED | Sí | — |
| `setBoutEvidence` | Cuenta con correo verificado | AuditLog, Bout | BOUT: EVIDENCE_SET | — | — |
| `setMyBoutResult` | Cuenta con correo verificado | AppError, AuditLog, Bout, Notification | BOUT: RESULT_SET_BY_AUTHOR | — | — |

### `community`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `avisarSinCuenta` | Cualquiera | AppError, AuditLog, EmailOutbox, RateHit, Report | REPORT: CREATED | Sí | aviso_pagina_recibido |
| `bloquearUsuario` | Cualquiera | AuditLog, Block, ClassRequest, FightProposal, Follow, GymMemberInvitation, GymTransferInvitation | USER: BLOCKED | — | bloqueado |
| `createReport` | Cuenta con correo verificado | AuditLog, Report | REPORT: CREATED | — | reporte_enviado |
| `desbloquearUsuario` | Cualquiera | AuditLog, Block | USER: UNBLOCKED | — | desbloqueado |
| `toggleFollow` | Cualquiera | Follow | — | — | — |

### `creador`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `activarSegundoPaso` | Cualquiera | AuditLog, RateHit, Session, User | USER: CREADOR_SEGUNDO_PASO_ACTIVADO | — | — |
| `cambiarTipoDeCuenta` | Cualquiera | AuditLog, User | — | — | tipo_cambiado |
| `cerrarSesionesDe` | Cualquiera | AuditLog, Session | USER: SESIONES_CERRADAS | — | sesiones_cerradas |
| `comprobarSegundoPaso` | Cualquiera | AuditLog, RateHit, Session, User | USER: CREADOR_ENTRA | — | — |
| `regenerarCodigos` | Cualquiera | AuditLog, RateHit, User | USER: CREADOR_CODIGOS_NUEVOS | — | — |

### `demo`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `demoCambiarPapel` | Cuenta con sesión iniciada | AuditLog, OrganizerRequest, User | USER: DEMO_ROLE_CHANGED | — | demo_papel_cambiado |
| `demoConfirmarCorreo` | Cuenta con sesión iniciada | AuditLog, User | USER: DEMO_EMAIL_VERIFIED | — | correo_verificado |

### `entradas`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `cancelarMiReserva` | Cuenta con correo verificado | AuditLog, Notification, TicketReservation | EVENT: TICKETS_CANCELLED | — | entradas_canceladas |
| `gestionarReserva` | Organizador (o moderación) con correo verificado | AppError, AuditLog, EmailOutbox, Notification, TicketReservation | EVENT: (varias) | Sí | — |
| `guardarCartelYEntradas` | Organizador (o moderación) con correo verificado | AppError, AuditLog, Event, EventPoster, TicketReservation | EVENT: TICKETS_UPDATED | — | entradas_guardadas |
| `reservarEntradas` | Cuenta con correo verificado | AppError, AuditLog, EmailOutbox, Notification, RateHit, TicketReservation | EVENT: TICKETS_RESERVED | Sí | entradas_reservadas |

### `events`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `addCartelBout` | Organizador (o moderación) con correo verificado | AppError, AuditLog, Bout, Fighter, FighterDiscipline | BOUT: CREATED_BY_ORGANIZER | Sí | cartel_anadido |
| `createEvent` | Organizador (o moderación) con correo verificado | AuditLog, Event | EVENT: CREATED, EVENT: PAST_EVENT_AUTHORIZATION_REQUESTED | — | — |
| `removeCartelBout` | Organizador (o moderación) con correo verificado | AuditLog, Bout | BOUT: REMOVED_FROM_CARTEL | — | cartel_quitado |
| `requestOrganizer` | Cuenta con correo verificado | OrganizerRequest | — | — | solicitud_enviada |
| `setAttendance` | Cuenta con sesión iniciada | EventAttendance | — | — | — |
| `setBoutResult` | Organizador (o moderación) con correo verificado | AppError, AuditLog, Bout, Event, Fighter, Notification | BOUT: RESULT_SET | — | resultado_guardado |
| `setEventStatus` | Organizador (o moderación) con correo verificado | AuditLog, Event | EVENT: (varias) | — | — |
| `updateEvent` | Organizador (o moderación) con correo verificado | AuditLog, Bout, Event, TicketReservation | EVENT: PAST_EVENT_AUTHORIZATION_REQUESTED, EVENT: UPDATED | — | velada_actualizada |

### `fighters`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `addPublicVideoHighlight` | Cuenta con correo verificado | AuditLog, Highlight, Notification | FIGHTER: PUBLIC_VIDEO_HIGHLIGHT | — | highlight_publico_anadido |
| `createMyFighter` | Cuenta con correo verificado | AuditLog, Fighter, Gym, User | FIGHTER: CREATED | — | ficha_creada |
| `manageHighlight` | Cuenta con correo verificado | AppError, AuditLog, Highlight | HIGHLIGHT: (varias) | — | — |
| `publishHighlight` | Cuenta con correo verificado | AppError, AuditLog, Highlight | HIGHLIGHT: CREATED | — | highlight_publicado |
| `removeDiscipline` | Cuenta con correo verificado | AuditLog, FighterAchievement, FighterDiscipline | FIGHTER: DISCIPLINE_REMOVED | — | disciplina_quitada |
| `requestClaim` | Cuenta con correo verificado | ClaimRequest | — | — | solicitud_enviada |
| `saveDiscipline` | Cuenta con correo verificado | AuditLog, FighterDiscipline | FIGHTER: (varias) | — | disciplina_guardada |
| `setAvailability` | Cuenta con correo verificado | AuditLog, Fighter | FIGHTER: AVAILABILITY_UPDATED | — | disponibilidad_guardada |
| `setRecordPublic` | Cuenta con correo verificado | AuditLog, Fighter | FIGHTER: (varias) | — | — |
| `updateMyFighter` | Cuenta con correo verificado | AuditLog, Fighter, Gym | FIGHTER: PROFILE_UPDATED | — | ficha_actualizada |

### `gyms`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `answerGymMemberInvitation` | Cuenta con correo verificado | AuditLog, Fighter, GymMemberInvitation, Notification, Trainer | GYM: (varias) | — | gimnasio_invitacion_respondida |
| `answerGymTransfer` | Cuenta con correo verificado | AppError, AuditLog, EmailOutbox, Gym, GymTransferInvitation, Profile | GYM: (varias) | Sí | — |
| `cancelGymMemberInvitation` | Cuenta con correo verificado | AuditLog, GymMemberInvitation | GYM: GYM_MEMBER_CANCELLED | — | gimnasio_invitacion_cancelada |
| `cancelGymTransfer` | Cuenta con correo verificado | AuditLog, GymTransferInvitation | GYM: GYM_TRANSFER_CANCELLED | — | gimnasio_cesion_cancelada |
| `decideGymClaim` | Moderación | AppError, AuditLog, EmailOutbox, Gym, GymClaimRequest, Profile | GYM: (varias), GYM: GYM_CLAIM_CONFLICT | Sí | — |
| `inviteGymMember` | Cuenta con correo verificado | AuditLog, GymMemberInvitation, Notification | GYM: GYM_MEMBER_INVITED | — | gimnasio_invitacion_enviada |
| `inviteGymTransfer` | Cuenta con correo verificado | AppError, AuditLog, EmailOutbox, GymTransferInvitation, RateHit | GYM: GYM_TRANSFER_INVITED | Sí | gimnasio_cesion_invitada |
| `requestGymClaim` | Cuenta con correo verificado | AuditLog, GymClaimRequest | GYM: GYM_CLAIM_REQUESTED | — | gimnasio_reclamado |
| `saveGym` | Cuenta con correo verificado | AppError, AuditLog, Gym, GymClaimRequest | GYM: (varias) | — | gimnasio_guardado |
| `setGymMember` | Cuenta con correo verificado | AuditLog, Fighter, Trainer | — | — | gimnasio_vinculo |
| `transferGym` | Cuenta con correo verificado | AppError, AuditLog, EmailOutbox, Gym, Profile | GYM: GYM_TRANSFERRED | Sí | gimnasio_cedido |

### `media`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `deleteMyMedia` | Cuenta con correo verificado | AppError, AuditLog, MediaItem | MEDIA: DELETED | — | medio_borrado |
| `shareMedia` | Cuenta con correo verificado | AppError, AuditLog, MediaItem, Notification | MEDIA: CREATED | — | medio_compartido |

### `moderation`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `actualizarFallo` | Moderación | AppError, AuditLog | APP_ERROR: FALLO_ESTADO | — | fallo_actualizado |
| `adminDecide` | Moderación | AuditLog, Bout, Fighter | BOUT: (varias) | — | moderacion_rechazado, moderacion_restaurado, moderacion_verificado |
| `decideClaim` | Moderación | AuditLog, Aura, ClaimRequest, Fighter, Follow | CLAIM: (varias) | Sí | — |
| `decideOrganizer` | Moderación | AuditLog, OrganizerRequest, Profile, User | ORGANIZER: (varias), PROFILE: FEDERATION_CREATED | Sí | — |
| `decidirVeladaPasada` | Moderación | AuditLog, Event, Fighter | EVENT: (varias) | Sí | — |
| `resolveReport` | Moderación | AppError, AuditLog, Aura, Bout, EmailOutbox, Fighter, FighterAchievement, FighterDiscipline, Gym, Highlight, MediaItem, Profile, Report | GYM: GYM_REMOVED_BY_REPORT, REPORT: (varias) | Sí | — |
| `setGymVerified` | Moderación | AuditLog, Gym | GYM: (varias) | — | — |

### `news`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `addNewsSource` | Moderación | AuditLog, NewsSource | NEWS_SOURCE: CREATED | — | fuente_anadida |
| `refreshNewsNow` | Moderación | AuditLog, NewsItem, NewsSource | NEWS: REFRESHED | — | — |
| `toggleNewsItem` | Moderación | AuditLog, NewsItem | NEWS_ITEM: (varias) | — | — |
| `toggleNewsSource` | Moderación | AuditLog, NewsSource | NEWS_SOURCE: (varias) | — | — |

### `notifications`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `readAllNotifications` | Cuenta con sesión iniciada | Notification | — | — | avisos_leidos |
| `readNotification` | Cuenta con sesión iniciada | Notification | — | — | aviso_leido |

### `profiles`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `createFederation` | Cuenta con correo verificado | AuditLog, Profile | PROFILE: FEDERATION_CREATED | — | — |
| `saveProfile` | Cuenta con correo verificado | AppError, AuditLog, Gym, Profile, Trainer | PROFILE: PROFILE_UPDATED, TRAINER: PROFILE_UPDATED | — | perfil_guardado |

### `proposals`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `answerProposal` | Cuenta con correo verificado | AppError, AuditLog, EmailOutbox, FightProposal | PROPOSAL: (varias) | Sí | — |
| `cancelProposal` | Cuenta con correo verificado | AppError, AuditLog, EmailOutbox, FightProposal | PROPOSAL: PROPOSAL_CANCELLED | Sí | propuesta_cancelada |
| `proposeFight` | Cuenta con correo verificado | AppError, AuditLog, EmailOutbox, FightProposal, Notification, RateHit | PROPOSAL: PROPOSED | Sí | propuesta_enviada |

### `registrations`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `answerRegistrations` | Organizador (o moderación) con correo verificado | AppError, AuditLog, EmailOutbox, EventRegistration | EVENT: (varias) | Sí | — |
| `removeSlot` | Organizador (o moderación) con correo verificado | AuditLog, EventSlot | EVENT: REGISTRATION_SLOT_REMOVED | — | plazas_quitadas |
| `requestRegistration` | Cuenta con correo verificado | AppError, AuditLog, EmailOutbox, EventRegistration, Notification, RateHit | EVENT: REGISTRATION_REQUESTED | Sí | — |
| `setRegistration` | Organizador (o moderación) con correo verificado | AuditLog, Event | EVENT: (varias) | — | — |
| `setSlot` | Organizador (o moderación) con correo verificado | AuditLog, EventSlot | EVENT: REGISTRATION_SLOT_SET | — | plazas_guardadas |
| `withdrawRegistration` | Cuenta con correo verificado | AppError, AuditLog, EmailOutbox, EventRegistration | EVENT: REGISTRATION_WITHDRAWN | Sí | inscripcion_retirada |

### `trainers`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `answerClassRequest` | Cuenta con correo verificado | AppError, AuditLog, ClassRequest, EmailOutbox, Notification | CLASS: (varias) | Sí | — |
| `cancelClassRequest` | Cuenta con correo verificado | AppError, AuditLog, ClassRequest, EmailOutbox | CLASS: REQUEST_CANCELLED | Sí | solicitud_cancelada |
| `createClass` | Cuenta con correo verificado | AuditLog, TrainingClass | CLASS: CREATED | — | clase_publicada |
| `createMyTrainer` | Cuenta con correo verificado | AuditLog, Gym, Trainer, TrainingClass, User | TRAINER: CREATED | — | — |
| `requestClass` | Cuenta con correo verificado | AppError, AuditLog, ClassRequest, EmailOutbox, Notification, RateHit | CLASS: REQUESTED | Sí | clase_solicitada |
| `toggleClass` | Cuenta con correo verificado | TrainingClass | — | — | — |

### `trajectory`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `endorseBout` | Moderación o cuenta acreditada para la disciplina (correo verificado) | AuditLog, Bout | BOUT: ENDORSED | — | respaldo_guardado |
| `requestAchievementReview` | Cuenta con correo verificado | AuditLog, FighterAchievement | ACHIEVEMENT: REVIEW_REQUESTED | — | respaldo_solicitado |
| `restoreOwnAchievement` | Cuenta con correo verificado | AuditLog, FighterAchievement | ACHIEVEMENT: WITHDRAWAL_UNDONE | — | logro_restaurado |
| `reviewAchievement` | Moderación o cuenta acreditada para la disciplina (correo verificado) | AuditLog, FighterAchievement | ACHIEVEMENT: (varias) | — | respaldo_guardado |
| `saveAchievement` | Cuenta con correo verificado | AuditLog, FighterAchievement | ACHIEVEMENT: (varias) | — | logro_guardado |
| `setSupportAccreditation` | Moderación | AuditLog, SupportAccreditation | ACCREDITATION: GRANTED, ACCREDITATION: REVOKED | — | acreditacion_guardada |
| `withdrawAchievement` | Cuenta con correo verificado | AuditLog, FighterAchievement | ACHIEVEMENT: WITHDRAWN | — | logro_retirado |

## Tablas y quién escribe en ellas

| Tabla | Acciones que escriben |
|---|---|
| Gym | `fighters.createMyFighter`, `fighters.updateMyFighter`, `gyms.saveGym`, `gyms.decideGymClaim`, `gyms.transferGym`, `gyms.answerGymTransfer`, `moderation.setGymVerified`, `moderation.resolveReport`, `profiles.saveProfile`, `trainers.createMyTrainer` |
| GymClaimRequest | `gyms.saveGym`, `gyms.requestGymClaim`, `gyms.decideGymClaim` |
| Trainer | `accounts.deleteAccount`, `gyms.setGymMember`, `gyms.answerGymMemberInvitation`, `profiles.saveProfile`, `trainers.createMyTrainer` |
| TrainingClass | `trainers.createMyTrainer`, `trainers.createClass`, `trainers.toggleClass` |
| ClassRequest | `community.bloquearUsuario`, `trainers.requestClass`, `trainers.answerClassRequest`, `trainers.cancelClassRequest` |
| EventSlot | `registrations.setSlot`, `registrations.removeSlot` |
| EventRegistration | `registrations.requestRegistration`, `registrations.withdrawRegistration`, `registrations.answerRegistrations` |
| FightProposal | `community.bloquearUsuario`, `proposals.proposeFight`, `proposals.answerProposal`, `proposals.cancelProposal` |
| Highlight | `accounts.deleteAccount`, `fighters.addPublicVideoHighlight`, `fighters.publishHighlight`, `fighters.manageHighlight`, `moderation.resolveReport` |
| Fighter | `accounts.deleteAccount`, `bouts.addBout`, `bouts.respondBout`, `bouts.removeMyBout`, `events.addCartelBout`, `events.setBoutResult`, `fighters.setAvailability`, `fighters.createMyFighter`, `fighters.updateMyFighter`, `fighters.setRecordPublic`, `gyms.setGymMember`, `gyms.answerGymMemberInvitation`, `moderation.adminDecide`, `moderation.decideClaim`, `moderation.resolveReport`, `moderation.decidirVeladaPasada` |
| Event | `bouts.addBout`, `bouts.removeMyBout`, `entradas.guardarCartelYEntradas`, `events.createEvent`, `events.setBoutResult`, `events.updateEvent`, `events.setEventStatus`, `moderation.decidirVeladaPasada`, `registrations.setRegistration` |
| Bout | `accounts.deleteAccount`, `bouts.addBout`, `bouts.setMyBoutResult`, `bouts.respondBout`, `bouts.setBoutEvidence`, `bouts.removeMyBout`, `events.addCartelBout`, `events.setBoutResult`, `events.updateEvent`, `events.removeCartelBout`, `moderation.adminDecide`, `moderation.resolveReport`, `trajectory.endorseBout` |
| Notification | `aura.giveAura`, `bouts.addBout`, `bouts.setMyBoutResult`, `entradas.reservarEntradas`, `entradas.cancelarMiReserva`, `entradas.gestionarReserva`, `events.setBoutResult`, `fighters.addPublicVideoHighlight`, `gyms.inviteGymMember`, `gyms.answerGymMemberInvitation`, `media.shareMedia`, `notifications.readNotification`, `notifications.readAllNotifications`, `proposals.proposeFight`, `registrations.requestRegistration`, `trainers.requestClass`, `trainers.answerClassRequest` |
| User | `accounts.register`, `accounts.saveInterests`, `accounts.saveFighterIntent`, `accounts.saveTrainerIntent`, `accounts.saveTrainerClassIntent`, `accounts.login`, `accounts.resetPassword`, `accounts.updateAccount`, `accounts.changePassword`, `accounts.unsubscribeEmails`, `accounts.deleteAccount`, `accounts.verifyEmail`, `creador.comprobarSegundoPaso`, `creador.activarSegundoPaso`, `creador.regenerarCodigos`, `creador.cambiarTipoDeCuenta`, `demo.demoConfirmarCorreo`, `demo.demoCambiarPapel`, `fighters.createMyFighter`, `moderation.decideOrganizer`, `trainers.createMyTrainer` |
| Session | `accounts.register`, `accounts.login`, `accounts.logout`, `accounts.resetPassword`, `accounts.changePassword`, `accounts.deleteAccount`, `creador.comprobarSegundoPaso`, `creador.activarSegundoPaso`, `creador.cerrarSesionesDe` |
| Aura | `aura.giveAura`, `aura.removeAura`, `moderation.decideClaim`, `moderation.resolveReport` |
| EmailToken | `accounts.register`, `accounts.requestPasswordReset`, `accounts.resetPassword`, `accounts.verifyEmail`, `accounts.resendVerification` |
| ClaimRequest | `fighters.requestClaim`, `moderation.decideClaim` |
| OrganizerRequest | `accounts.register`, `demo.demoCambiarPapel`, `events.requestOrganizer`, `moderation.decideOrganizer` |
| AuditLog | `accounts.register`, `accounts.login`, `accounts.requestPasswordReset`, `accounts.resetPassword`, `accounts.updateAccount`, `accounts.changePassword`, `accounts.deleteAccount`, `accounts.resendVerification`, `bouts.addBout`, `bouts.setMyBoutResult`, `bouts.respondBout`, `bouts.setBoutEvidence`, `bouts.removeMyBout`, `community.createReport`, `community.bloquearUsuario`, `community.desbloquearUsuario`, `community.avisarSinCuenta`, `creador.comprobarSegundoPaso`, `creador.activarSegundoPaso`, `creador.regenerarCodigos`, `creador.cambiarTipoDeCuenta`, `creador.cerrarSesionesDe`, `demo.demoConfirmarCorreo`, `demo.demoCambiarPapel`, `entradas.guardarCartelYEntradas`, `entradas.reservarEntradas`, `entradas.cancelarMiReserva`, `entradas.gestionarReserva`, `events.createEvent`, `events.addCartelBout`, `events.setBoutResult`, `events.updateEvent`, `events.setEventStatus`, `events.removeCartelBout`, `fighters.addPublicVideoHighlight`, `fighters.setAvailability`, `fighters.createMyFighter`, `fighters.updateMyFighter`, `fighters.saveDiscipline`, `fighters.removeDiscipline`, `fighters.setRecordPublic`, `fighters.publishHighlight`, `fighters.manageHighlight`, `gyms.saveGym`, `gyms.requestGymClaim`, `gyms.decideGymClaim`, `gyms.transferGym`, `gyms.setGymMember`, `gyms.inviteGymTransfer`, `gyms.answerGymTransfer`, `gyms.cancelGymTransfer`, `gyms.inviteGymMember`, `gyms.answerGymMemberInvitation`, `gyms.cancelGymMemberInvitation`, `media.shareMedia`, `media.deleteMyMedia`, `moderation.adminDecide`, `moderation.decideClaim`, `moderation.decideOrganizer`, `moderation.setGymVerified`, `moderation.resolveReport`, `moderation.actualizarFallo`, `moderation.decidirVeladaPasada`, `news.refreshNewsNow`, `news.addNewsSource`, `news.toggleNewsSource`, `news.toggleNewsItem`, `profiles.saveProfile`, `profiles.createFederation`, `proposals.proposeFight`, `proposals.answerProposal`, `proposals.cancelProposal`, `registrations.setRegistration`, `registrations.setSlot`, `registrations.removeSlot`, `registrations.requestRegistration`, `registrations.withdrawRegistration`, `registrations.answerRegistrations`, `trainers.createMyTrainer`, `trainers.createClass`, `trainers.requestClass`, `trainers.answerClassRequest`, `trainers.cancelClassRequest`, `trajectory.saveAchievement`, `trajectory.withdrawAchievement`, `trajectory.restoreOwnAchievement`, `trajectory.requestAchievementReview`, `trajectory.reviewAchievement`, `trajectory.endorseBout`, `trajectory.setSupportAccreditation` |
| AppError | `accounts.register`, `accounts.requestPasswordReset`, `accounts.resetPassword`, `accounts.changePassword`, `accounts.deleteAccount`, `accounts.resendVerification`, `bouts.addBout`, `bouts.setMyBoutResult`, `bouts.respondBout`, `community.avisarSinCuenta`, `entradas.guardarCartelYEntradas`, `entradas.reservarEntradas`, `entradas.gestionarReserva`, `events.addCartelBout`, `events.setBoutResult`, `fighters.publishHighlight`, `fighters.manageHighlight`, `gyms.saveGym`, `gyms.decideGymClaim`, `gyms.transferGym`, `gyms.inviteGymTransfer`, `gyms.answerGymTransfer`, `media.shareMedia`, `media.deleteMyMedia`, `moderation.resolveReport`, `moderation.actualizarFallo`, `profiles.saveProfile`, `proposals.proposeFight`, `proposals.answerProposal`, `proposals.cancelProposal`, `registrations.requestRegistration`, `registrations.withdrawRegistration`, `registrations.answerRegistrations`, `trainers.requestClass`, `trainers.answerClassRequest`, `trainers.cancelClassRequest` |
| Report | `bouts.respondBout`, `community.createReport`, `community.avisarSinCuenta`, `moderation.resolveReport` |
| Block | `community.bloquearUsuario`, `community.desbloquearUsuario` |
| Follow | `accounts.saveInterests`, `community.toggleFollow`, `community.bloquearUsuario`, `moderation.decideClaim` |
| FighterDiscipline | `accounts.deleteAccount`, `bouts.addBout`, `events.addCartelBout`, `fighters.saveDiscipline`, `fighters.removeDiscipline`, `moderation.resolveReport` |
| RateHit | `accounts.register`, `accounts.login`, `accounts.requestPasswordReset`, `accounts.resetPassword`, `accounts.changePassword`, `accounts.deleteAccount`, `accounts.resendVerification`, `community.avisarSinCuenta`, `creador.comprobarSegundoPaso`, `creador.activarSegundoPaso`, `creador.regenerarCodigos`, `entradas.reservarEntradas`, `gyms.inviteGymTransfer`, `proposals.proposeFight`, `registrations.requestRegistration`, `trainers.requestClass` |
| Profile | `accounts.deleteAccount`, `gyms.decideGymClaim`, `gyms.transferGym`, `gyms.answerGymTransfer`, `moderation.decideOrganizer`, `moderation.resolveReport`, `profiles.saveProfile`, `profiles.createFederation` |
| SupportAccreditation | `accounts.deleteAccount`, `trajectory.setSupportAccreditation` |
| FighterAchievement | `accounts.deleteAccount`, `fighters.removeDiscipline`, `moderation.resolveReport`, `trajectory.saveAchievement`, `trajectory.withdrawAchievement`, `trajectory.restoreOwnAchievement`, `trajectory.requestAchievementReview`, `trajectory.reviewAchievement` |
| MediaItem | `media.shareMedia`, `media.deleteMyMedia`, `moderation.resolveReport` |
| NewsSource | `news.refreshNewsNow`, `news.addNewsSource`, `news.toggleNewsSource` |
| NewsItem | `news.refreshNewsNow`, `news.toggleNewsItem` |
| EventAttendance | `events.setAttendance` |
| EmailOutbox | `accounts.register`, `accounts.requestPasswordReset`, `accounts.resetPassword`, `accounts.changePassword`, `accounts.resendVerification`, `community.avisarSinCuenta`, `entradas.reservarEntradas`, `entradas.gestionarReserva`, `gyms.decideGymClaim`, `gyms.transferGym`, `gyms.inviteGymTransfer`, `gyms.answerGymTransfer`, `moderation.resolveReport`, `proposals.proposeFight`, `proposals.answerProposal`, `proposals.cancelProposal`, `registrations.requestRegistration`, `registrations.withdrawRegistration`, `registrations.answerRegistrations`, `trainers.requestClass`, `trainers.answerClassRequest`, `trainers.cancelClassRequest` |
| GymMemberInvitation | `community.bloquearUsuario`, `gyms.inviteGymMember`, `gyms.answerGymMemberInvitation`, `gyms.cancelGymMemberInvitation` |
| TicketReservation | `entradas.guardarCartelYEntradas`, `entradas.reservarEntradas`, `entradas.cancelarMiReserva`, `entradas.gestionarReserva`, `events.updateEvent` |
| EventPoster | `entradas.guardarCartelYEntradas` |
| GymTransferInvitation | `accounts.deleteAccount`, `community.bloquearUsuario`, `gyms.inviteGymTransfer`, `gyms.answerGymTransfer`, `gyms.cancelGymTransfer` |

## Lógica compartida (`src/lib`)

Sin interfaz y sin saber nada de las pantallas. Las dependencias permitidas entre dominios las vigila `tests/unit/arquitectura.test.ts`.

### `lib/accounts`

| Fichero | Exporta |
|---|---|
| `auth.ts` | `RESET_HOURS`, `VERIFY_HOURS`, `completeSecondFactor`, `consumeVerificationToken`, `createSession`, `destroyOtherSessions`, `destroySession`, `getUser`, `getUserPendingSecondFactor`, `isResetTokenUsable`, `readReturnPath`, `rememberReturnPath`, `requireUser`, `requireVerifiedUser`, `resetPasswordWithToken`, `sendPasswordResetEmail`, `sendVerificationEmail`, `sesionReciente`, `unsubscribeLink`, `unsubscribeWithToken` |
| `backing.ts` | `canEndorse`, `requireSupportActor` |
| `creador.ts` | `EstadoCodigos`, `correoCreador`, `esCreador` |
| `google.ts` | `COOKIE_GOOGLE`, `DURACION_VIAJE_S`, `DecisionCuenta`, `GOOGLE_AUTORIZACION`, `GOOGLE_TOKENS`, `IdentidadGoogle`, `ViajeGoogle`, `canjearCodigo`, `configGoogle`, `decidirCuenta`, `escribirViaje`, `googleDisponible`, `leerViaje`, `nuevoViaje`, `urlDeAutorizacion`, `validarIdToken` |
| `landing.ts` | `PASOS_REGISTRO`, `PASO_TRAS_DATOS`, `Papel`, `ROL_INICIAL`, `TIPOS_DE_CUENTA`, `TIPOS_DE_ENTIDAD`, `TIPO_DE_ENTIDAD_ETIQUETA`, `TipoDeCuenta`, `TipoDeEntidad`, `landingFor`, `papelDe`, `parseTipoDeCuenta`, `parseTipoDeEntidad`, `puedeOrganizar` |
| `menu.ts` | `EXPLORAR`, `EnlaceMenu`, `ExtrasMenu`, `SeccionMenu`, `menuDe` |
| `onboarding.ts` | `ClassDraft`, `FighterIntent`, `Onboarding`, `TrainerIntent`, `readOnboarding` |
| `password.ts` | `dummyHash`, `hashPassword`, `needsRehash`, `verifyPassword` |
| `permissions.ts` | `requireAdmin`, `requireCreador`, `requireOrganizer` |
| `ratelimit.ts` | `HORA`, `MINUTO`, `addHit`, `allow`, `clearHits`, `clientIp`, `countHits`, `isBlocked`, `normalizeIp`, `reservar` |
| `retention.ts` | `DIAS_CUENTA_SIN_VERIFICAR`, `maybePurge`, `purgeStale` |
| `totp.ts` | `PERIODO_S`, `base32`, `claveLegible`, `codigo`, `comprobarCodigo`, `desdeBase32`, `enlaceApp`, `gastarCodigoEmergencia`, `huella`, `intervalo`, `nuevaClave`, `nuevosCodigosEmergencia` |

### `lib/aura`

| Fichero | Exporta |
|---|---|
| `ranking.ts` | `AuraEntry`, `CategoryRanking`, `NO_CATEGORY`, `RankedEntry`, `auraRanking`, `rankByCategory` |
| `rules.ts` | `AURA_COMMENT_MAX`, `AURA_PER_DAY`, `AuraProblema`, `BoutForAura`, `canGiveAura` |
| `trajectory.ts` | `AURA_POLICY`, `CategoryChoice`, `SCOPE_LABEL`, `SUPPORT_LABEL`, `SUPPORT_OPTIONS`, `SUPPORT_ORDER`, `SupportedAchievement`, `WITHOUT_BOUT_BACKING`, `achievementPoints`, `auraCategoryKey`, `boutBackingPoints`, `effectiveSupport`, `supportRank`, `trajectoryByCategory` |

### `lib/bouts`

| Fichero | Exporta |
|---|---|
| `form.ts` | `BOUT_FIELDS`, `boutQuery` |
| `rules.ts` | `OUTCOME_TO_RESULT`, `OutcomeKey`, `OutcomeProblema`, `boutVersion`, `pairKey`, `validateOutcome` |
| `status.ts` | `estadoSinResultado` |

### `lib/common`

| Fichero | Exporta |
|---|---|
| `apariencia.ts` | `COLOR_DISCIPLINA`, `conAlfa`, `iniciales`, `nombreDePila`, `tinteDe` |
| `audit.ts` | `audit` |
| `cola-correo.ts` | `CorreoNuevo`, `LIMITE_DIARIO_POR_DEFECTO`, `MAX_INTENTOS`, `Prioridad`, `RESERVA_CUENTA`, `cabeHoy`, `encolarYEnviar`, `enviarDeLaCola`, `esperaTras`, `estadoDeLaCola`, `limiteDiario`, `procesarCola` |
| `competition.ts` | `COMPETITION_DIVISIONS`, `CompetitionDivision`, `divisionAgeEligible`, `divisionById`, `divisionEligible`, `divisionLabel`, `divisionsFor`, `knownBoxingAgeEligible` |
| `dates.ts` | `MIN_BIRTH_DAY`, `MIN_EVENT_DAY`, `calendarDayStart`, `dayAndMonth`, `dayKey`, `daysUntil`, `esDiaReal`, `eventDayReached`, `haceTiempo`, `madridDayStart`, `monthlySeries`, `parseBirthDate`, `parseDay`, `todayMadrid`, `whenLabel` |
| `db.ts` | `db` |
| `demo.ts` | `DEMO_PAPELES`, `demoActiva` |
| `disciplines.ts` | `CategoriaPeso`, `DISCIPLINE_LABEL`, `DISCIPLINE_ORDER`, `DISCIPLINE_SLUG`, `LEVEL_ORDER`, `METHODS_BY_DISCIPLINE`, `PESOS`, `PesosDe`, `categoryLabel`, `disciplineFromSlug`, `isDiscipline`, `isLevel`, `isTournamentStyle`, `isWeightClass`, `levelName`, `parseCompetitionChoice`, `parseDisciplineChoice`, `weightClassLabel`, `weightClassesFor`, `weightNote` |
| `env.ts` | `validateEnv` |
| `fallos.ts` | `DatosFallo`, `ESTADOS_FALLO`, `EstadoFallo`, `ORIGENES_FALLO`, `OrigenFallo`, `huellaFallo`, `normalizarMensaje`, `normalizarRuta`, `registrarFallo`, `tacharDatos` |
| `geo.ts` | `buscarCoordenadas`, `ubicarGimnasio`, `ubicarPendientes`, `variantesDireccion` |
| `gym-directory.ts` | `publicGyms` |
| `gym-osm.ts` | `gymNameKey`, `osmAreaProvince`, `osmGymCandidate`, `osmProvince` |
| `gym-policy.ts` | `EXCLUDED_GYM_PROVINCES`, `excludedGymProvince`, `gymDistanceMetres`, `gymIsPublic`, `newGymStatus`, `osmMayUpdate` |
| `labels.ts` | `AUDIT_ACTION_LABEL`, `AUDIT_ENTITY_LABEL`, `EVENT_KIND_AYUDA`, `EVENT_KIND_LABEL`, `LEVEL_LABEL`, `METHOD_LABEL`, `PROVINCES`, `STANCE_LABEL`, `VERIFICATION_LABEL`, `fmtDate`, `fmtFechaHoraMadrid`, `parseEventKind`, `resultWord`, `shortHash`, `slugName`, `slugify` |
| `mail-transporte.ts` | `entregarCorreo`, `hayTransporte`, `logMode` |
| `mail.ts` | `APP_URL`, `sendMail` |
| `mapa.ts` | `CENTROS_PROVINCIA`, `CENTRO_ESPANA`, `OrigenUbicacion`, `PESOS_VALORACION`, `Punto`, `distanciaKm`, `enlaceComoLlegar`, `mejoresDeLaZona`, `puntoDeGimnasio`, `textoDistancia`, `valoracionGimnasio` |
| `messages.ts` | `AVISOS`, `PROBLEMAS` |
| `names.ts` | `normalizeName`, `publicFighterName`, `publicUserName` |
| `pagination.ts` | `PAGE_SIZE`, `pageNumber`, `pageWindow` |
| `paths.ts` | `internalPath`, `loginPath` |
| `periods.ts` | `FIGHTER_AVAILABILITY_DAYS`, `notificationCutoff` |
| `record-eligibility.ts` | `boutsQueCuentan` |
| `record-time.ts` | `HORAS_PARA_CONTAR_DECLARADO`, `fechaInicioEnRecord` |
| `refresco.ts` | `INTERVALO_REFRESCO_MS`, `MINIMO_ENTRE_REFRESCOS_MS`, `rutaConRefresco`, `tocaRefrescar` |
| `safe.ts` | `flatParams`, `hasOwn`, `lookup`, `oneParam` |
| `search.ts` | `ACCENT_FROM`, `ACCENT_TO`, `MAX_SEARCH_IDS`, `SearchKind`, `searchIds`, `searchWords` |
| `sentry.ts` | `Dsn`, `FalloParaSentry`, `avisarASentry`, `leerDsn`, `sobre` |
| `territorio.ts` | `PROVINCIAS_SIN_GIMNASIOS`, `gimnasiosVisibles`, `provinciaConGimnasios` |
| `text.ts` | `LIMITS`, `firstTooLong`, `isEmail`, `oneLine`, `plural` |
| `titular.ts` | `LEGAL_ACTUALIZADO`, `Titular`, `faltanDatosTitular`, `titular` |
| `url.ts` | `safeHttpUrl`, `safeHttpsUrl` |
| `version.ts` | `VERSION`, `commitDesplegado` |

### `lib/community`

| Fichero | Exporta |
|---|---|
| `bloqueos.ts` | `ORIGENES_DE_BLOQUEO`, `OrigenDeBloqueo`, `bloqueadosPor`, `bloquear`, `cuentaDe`, `esOrigenDeBloqueo`, `hayBloqueo` |
| `notifications.ts` | `NotificationKind`, `dailyAuraKey`, `notificationId`, `notifyBoutVideo`, `notifyFollowedBout`, `notifyInApp`, `putNotification` |
| `notify.ts` | `acusarReciboDeAviso`, `notificarResolucionDeAviso`, `notifyAuthorOfAnswer`, `notifyDecision`, `notifyFollowersOfBout`, `notifyRivalOfBout` |
| `reports.ts` | `AVISOS_SIN_CUENTA_POR_DIA`, `AVISO_EXPLICACION_MAX`, `AVISO_EXPLICACION_MIN`, `AvisoSinCuenta`, `MAX_REPORTS_PER_DAY`, `REASONS_BY_ENTITY`, `REPORT_ENTITIES`, `REPORT_REASONS`, `ReportEntity`, `parseAvisoSinCuenta`, `rutaDeLona` |
| `siguiendo.ts` | `VELADAS_NO_PUBLICAS`, `filtrosSiguiendo` |

### `lib/events`

| Fichero | Exporta |
|---|---|
| `calendar.ts` | `eventCalendar` |
| `cartel-search.ts` | `SUGERENCIAS_CARTEL`, `buscarParaCartel` |
| `entradas.ts` | `ESTADO_ENTRADA`, `FILTROS_RESERVAS`, `FiltroReservas`, `HORAS_CIERRE_ANTES`, `HORAS_PARA_SENAL`, `HORA_POR_DEFECTO`, `MAX_ENTRADAS`, `OCUPAN_PLAZA`, `caducarVencidas`, `cierreDeReservas`, `fmtBizum`, `fmtHora`, `inicioDeVelada`, `motivoSinConfirmacion`, `motivoSinReserva`, `nuevoCodigo`, `parseBizum`, `parseFiltroReservas`, `parseHora`, `plazasOcupadas`, `plazoDeSenal`, `reservaOcupaPlaza`, `reservasDeVelada`, `senal`, `urlCartel`, `ventaAbierta` |
| `pairing.ts` | `DatosPareja`, `OpcionesPareja`, `PARECIDO_LABEL`, `Parecido`, `Sugerencia`, `avisos`, `comparaEdad`, `distancia`, `parecido`, `porcentajeVictorias`, `sugerirRivales` |
| `preparation-data.ts` | `preparationAudience` |
| `preparation.ts` | `eventPreparation` |
| `registrations-data.ts` | `SolicitudConDatos`, `solicitudesDeEvento` |
| `registrations.ts` | `CATEGORIAS_MAX`, `ESTADOS_LISTA`, `EstadoLista`, `FilaInscripcion`, `FiltrosInscripcion`, `ORDENES`, `Ocupacion`, `Orden`, `PESO_MAX`, `PESO_MIN`, `PLAZAS_MAX`, `Plaza`, `REGISTRATIONS_PER_DAY`, `REG_MESSAGE_MAX`, `REG_NOTE_MAX`, `REG_REPLY_MAX`, `REG_STATUS_LABEL`, `RegistrationParsed`, `categoriaSinSitio`, `claveCategoria`, `enListaDeEspera`, `filtrarYOrdenar`, `inscripcionAbierta`, `numeroDeFiltro`, `ocupacion`, `parseEstadoLista`, `parseOrden`, `parsePlazas`, `parseRegistration`, `parseRegistrationSettings`, `puedeResponderInscripcion`, `puedeRetirarInscripcion` |
| `resultados-pendientes.ts` | `resumenResultadosPendientes`, `veladasConResultadosPendientes` |

### `lib/fighters`

| Fichero | Exporta |
|---|---|
| `anonymize.ts` | `ArchivosRetirados`, `anonymizeFighter`, `scrubFighterHistory` |
| `availability.ts` | `AVAILABILITY_DAYS`, `availabilityCutoff`, `availableFighters`, `isAvailable`, `parseCurrentWeight` |
| `coherence.ts` | `FLAG_LABEL`, `Flag`, `MIN_DAYS_BETWEEN_BOUTS`, `proximityAppliesTo`, `proximityFlags` |
| `fighters.ts` | `findNameCandidates` |
| `graduation.ts` | `BELTS`, `graduationLabel`, `parseGraduation` |
| `highlights.ts` | `HIGHLIGHT_KIND_LABEL`, `HIGHLIGHT_TITLE_MAX`, `HighlightInput`, `HighlightParsed`, `MAX_HIGHLIGHTS`, `miniaturaDeEnlace`, `orderHighlights`, `parseHighlight`, `visibleHighlightSources`, `webDeEnlace` |
| `prior.ts` | `PriorError`, `PriorParse`, `parsePrior` |
| `privacy.ts` | `recordHidden`, `shownRecord` |
| `proposals.ts` | `PROPOSALS_PER_DAY`, `PROPOSAL_DAYS_AHEAD`, `PROPOSAL_KIND_LABEL`, `PROPOSAL_MESSAGE_MAX`, `PROPOSAL_PLACE_MAX`, `PROPOSAL_REPLY_MAX`, `PROPOSAL_STATUS_LABEL`, `ProposalInput`, `ProposalParsed`, `parseProposal`, `parseProposalKind`, `puedeCancelarPropuesta`, `puedeResponderPropuesta` |
| `record.ts` | `BoutForRecord`, `Prior`, `Records`, `Tally`, `combinedRecord`, `computeRecords`, `cuentaEnRecord`, `emptyTally`, `formatRecord`, `priorIsDetailed` |
| `rivals.ts` | `Candidato`, `CandidatoLocal`, `FiltrosRival`, `ORDENES_RIVAL`, `OrdenRival`, `ciudadDelRival`, `coincideLocalRival`, `filtrarYOrdenarRivales`, `hayFiltrosRival`, `opcionesLocalesRival`, `parseFiltrosRival` |

### `lib/media`

| Fichero | Exporta |
|---|---|
| `fotos.ts` | `AlmacenDeFotos`, `CLAVE_DE_FOTO`, `CarpetaDeFotos`, `FotoGuardada`, `almacenDeFotos`, `borrarFotos`, `guardarFoto`, `leerFoto`, `nuevaClaveDeFoto` |
| `rules.ts` | `CONSENTIMIENTO`, `DIAS_PARA_COMPARTIR`, `MAX_FOTOS_POR_DIA`, `MAX_MEDIOS_POR_DIA`, `MedioInput`, `MedioParsed`, `PIE_MAX`, `nombreDeDescarga`, `parseMedio`, `veladaAbiertaAlPublico` |
| `s3.ts` | `Credenciales`, `codificar`, `presignar` |
| `storage.ts` | `Almacen`, `CLAVE_VALIDA`, `MAX_VIDEO_DISCO`, `MAX_VIDEO_R2`, `TIPOS_DE_VIDEO`, `almacenDeVideos`, `carpetaEnDisco`, `claveDe`, `configuracionR2`, `guardarEnDisco`, `lecturaR2`, `nuevaClave`, `responderVideo`, `rutaEnDisco`, `servirDesdeDisco`, `tipoDeClave` |

### `lib/news`

| Fichero | Exporta |
|---|---|
| `ai.ts` | `generarPromptImagenCombate`, `sintetizarTitularConIA` |
| `deduplicate.ts` | `enlaceNormalizado`, `fusionarNoticias`, `tituloNormalizado` |
| `diagnosis.ts` | `diagnosticoFuente` |
| `espana.ts` | `delPanoramaEspanol`, `nombraEspana` |
| `feed.ts` | `Noticia`, `ultimasNoticias` |
| `parse.ts` | `EntradaNoticia`, `MAX_ENTRADAS_POR_CANAL`, `RESUMEN_MAX`, `TITULAR_MAX`, `clasificar`, `decodificar`, `detectarDisciplinas`, `enEspanol`, `imagenPermitida`, `parseFeed`, `textoPlano`, `variar` |
| `refresh.ts` | `actualizarNoticias`, `actualizarSiToca`, `asegurarFuentesIniciales`, `noticiasActivas`, `noticiasPorActualizar` |
| `sources.ts` | `CONSERVAR_DIAS`, `FUENTES_INICIALES`, `FUENTES_RETIRADAS`, `FuenteInicial`, `REFRESCO_MS`, `TIPO_DE_FUENTE_ETIQUETA`, `googleNoticias` |

### `lib/profiles`

| Fichero | Exporta |
|---|---|
| `images.ts` | `MAX_IMAGE_BYTES`, `imagePosition`, `normalizeImage` |
| `profiles.ts` | `PROFILE_KINDS`, `ProfileKind`, `canEditProfile`, `profileAccess`, `profileKind`, `profileSelect`, `profileSource` |

### `lib/trainers`

| Fichero | Exporta |
|---|---|
| `agenda.ts` | `agendaTime`, `trainerWeek` |
| `classes.ts` | `CLASS_KIND_LABEL`, `CLASS_MINUTES`, `CLASS_PRICE_MAX`, `CLASS_SCHEDULE_MAX`, `CLASS_TITLE_MAX`, `ClassInput`, `ClassParsed`, `GROUP_CAPACITY`, `TRAINER_YEARS_MAX`, `classMeta`, `parseClass`, `parseYears`, `pickDisciplines` |
| `requests.ts` | `DIAS_POR_DELANTE`, `HORA_MAX`, `HORA_MIN`, `PASO_MINUTOS`, `REQUESTS_PER_DAY`, `REQUEST_MESSAGE_MAX`, `REQUEST_PHONE_MAX`, `REQUEST_REPLY_MAX`, `REQUEST_STATUS_LABEL`, `RequestInput`, `RequestParsed`, `diaLegible`, `hora`, `parseClassRequest`, `puedeCancelar`, `puedeResponder`, `textoDeHorario` |
