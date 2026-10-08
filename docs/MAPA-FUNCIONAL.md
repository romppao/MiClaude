# Mapa funcional

> **Generado automáticamente por `npm run mapa` a partir del código. No se edita a mano:** el CI falla si no está al día.
> Sirve para responder a «¿dónde se hace X?»: qué pantalla lanza qué acción, quién puede ejecutarla y en qué tablas escribe.
> Para las recetas («cómo añado una acción nueva…») y las reglas de organización, ver [`DESARROLLO.md`](DESARROLLO.md).

## Pantallas y direcciones

| Dirección | Qué es | Quién puede entrar | Acciones que lanza | Lee de |
|---|---|---|---|---|
| `/` | (respuesta técnica, sin pantalla) | Pública (cambia lo que ve según la cuenta) | — | — |
| `/ayuda` | ¿Cómo funciona Ring España? | Pública | — | — |
| `/baja` | Avisos por correo electrónico | Pública | `accounts.unsubscribeEmails` | — |
| `/bienvenida` | Tu deporte. | Pública (cambia lo que ve según la cuenta) | — | — |
| `/buscar` | Buscar | Pública | — | Event, Fighter, Gym, Trainer |
| `/entrar` | Entrar en tu cuenta | Pública | `accounts.login` | — |
| `/entrenadores` | Entrenadores | Pública | — | Trainer |
| `/entrenadores/:slug` | (ficha individual: el título depende del elemento) | Pública | — | Trainer |
| `/federaciones` | Federaciones | Pública (cambia lo que ve según la cuenta) | `profiles.createFederation` | Profile |
| `/federaciones/:id` | (ficha individual: el título depende del elemento) | Pública | — | Profile |
| `/gimnasios` | Gimnasios | Pública | — | Gym |
| `/gimnasios/:slug` | (ficha individual: el título depende del elemento) | Pública | — | Gym |
| `/highlights/:id/imagen` | Foto de un highlight. Solo si la ficha es pública (o es la propia) y el highlight no se ha retirado. Revalida con ETag, como las fotos de perfil. | Pública (cambia lo que ve según la cuenta) | — | Highlight |
| `/imagenes/:kind/:id/:slot` | Siempre se revalida (`no-cache`, `private`): quien ya tiene la imagen recibe un 304 sin bytes, y una ficha ocultada deja de verse al instante. | Pública (cambia lo que ve según la cuenta) | — | Profile |
| `/mi-cuenta` | Mi cuenta | Cuenta con sesión iniciada | `accounts.changePassword`, `accounts.updateAccount`, `demo.demoCambiarPapel` | Profile, Report, SupportAccreditation |
| `/mi-cuenta/datos` | Descarga de todos los datos que Ring España guarda de la persona que ha iniciado sesión (derecho de acceso y portabilidad). | Cuenta con sesión iniciada | — | AuditLog, Aura, Bout, ClaimRequest, Event, FighterAchievement, Follow, Highlight, OrganizerRequest, Profile, Report, SupportAccreditation, Trainer |
| `/mi-cuenta/eliminar` | Eliminar mi cuenta | Cuenta con sesión iniciada | `accounts.deleteAccount` | Bout |
| `/mi-ficha` | ¿Ya apareces en Ring España? | Cuenta con correo verificado | `bouts.addBout`, `bouts.removeMyBout`, `bouts.respondBout`, `bouts.setBoutEvidence`, `bouts.setMyBoutResult`, `fighters.createMyFighter`, `fighters.manageHighlight`, `fighters.publishHighlight`, `fighters.requestClaim`, `fighters.saveDiscipline`, `fighters.setRecordPublic`, `fighters.updateMyFighter` | Bout, ClaimRequest, Fighter, Gym, Highlight |
| `/mi-ficha/rival` | ¿Quién es tu rival? | Cuenta con correo verificado | `bouts.addBout` | Bout |
| `/mi-ficha/trayectoria` | Mi trayectoria y aura | Cuenta con correo verificado | `trajectory.requestAchievementReview`, `trajectory.restoreOwnAchievement`, `trajectory.saveAchievement`, `trajectory.withdrawAchievement` | FighterAchievement |
| `/mis-clases` | Tus clases | Cuenta con sesión iniciada | `trainers.createClass`, `trainers.toggleClass` | Trainer |
| `/moderacion` | Moderación | Moderación | `moderation.adminDecide`, `moderation.decideClaim`, `moderation.decideOrganizer`, `moderation.resolveReport`, `moderation.setGymVerified` | AuditLog, Aura, Bout, ClaimRequest, Fighter, Gym, OrganizerRequest, Report |
| `/moderacion/acreditaciones` | Acreditaciones para respaldar | Moderación | `trajectory.setSupportAccreditation` | SupportAccreditation |
| `/moderacion/historial` | Historial de cambios | Moderación | — | AuditLog |
| `/organizador` | Organizadores de veladas | Pública (cambia lo que ve según la cuenta) | `events.createEvent`, `events.requestOrganizer` | Event, OrganizerRequest |
| `/organizador/:slug` | (ficha individual: el título depende del elemento) | Moderación | `bouts.setBoutEvidence`, `events.addCartelBout`, `events.removeCartelBout`, `events.setBoutResult`, `events.setEventStatus`, `events.updateEvent` | Event, Fighter |
| `/peleadores` | Peleadores | Pública | — | Fighter |
| `/peleadores/:slug` | (ficha individual: el título depende del elemento) | Pública (cambia lo que ve según la cuenta) | `aura.giveAura`, `aura.removeAura`, `community.createReport`, `community.toggleFollow` | Aura, Bout, Fighter, FighterAchievement, Follow, Highlight, Profile |
| `/perfiles/:kind/:id/editar` | Personalizar | Cuenta con correo verificado | `profiles.saveProfile` | User |
| `/privacidad` | Privacidad y tus datos | Pública | — | — |
| `/promotores` | Promotores | Pública | — | User |
| `/promotores/:id` | (ficha individual: el título depende del elemento) | Pública | — | Event, User |
| `/ranking` | Ránking de aura | Pública | — | — |
| `/recuperar` | ¿Has olvidado tu contraseña? | Pública | `accounts.requestPasswordReset` | — |
| `/recuperar/nueva` | El enlace ya no sirve | Pública | `accounts.resetPassword` | — |
| `/registro` | Crear cuenta | Pública | `accounts.register` | — |
| `/registro/clase` | Tu primera clase | Cuenta con sesión iniciada | `accounts.saveTrainerClassIntent` | — |
| `/registro/ficha` | Crea tu ficha | Cuenta con sesión iniciada | `accounts.saveFighterIntent` | — |
| `/registro/intereses` | ¿Qué te gusta ver? | Cuenta con sesión iniciada | `accounts.saveInterests` | Fighter, Follow |
| `/registro/perfil` | Tu perfil de entrenador | Cuenta con sesión iniciada | `accounts.saveTrainerIntent` | Gym |
| `/respaldar` | Respaldar resultados y títulos | Moderación o cuenta acreditada para la disciplina (correo verificado) | `trajectory.endorseBout`, `trajectory.reviewAchievement` | Bout, FighterAchievement |
| `/salud` | Comprobación de salud para el alojamiento: responde 200 si la aplicación y la base de datos funcionan, y 503 si no. | Pública | — | — |
| `/siguiendo` | Peleadores que sigo | Cuenta con sesión iniciada | `community.toggleFollow` | Bout, Follow |
| `/veladas` | Calendario de veladas | Pública | — | Event |
| `/veladas/:slug` | (ficha individual: el título depende del elemento) | Pública | — | Event |
| `/verificar` | Confirmar tu correo electrónico | Pública (cambia lo que ve según la cuenta) | `accounts.resendVerification`, `accounts.verifyEmail`, `demo.demoConfirmarCorreo` | OrganizerRequest |

«Quién puede entrar» se deduce del código de cada pantalla; las acciones comprueban sus permisos por su cuenta (siguiente tabla), nunca se fían de que la pantalla los haya comprobado.

## Acciones del servidor

Cada acción es un punto de entrada público del servidor (`src/app/actions/<módulo>.ts`). Lo que sigue sale de seguir las llamadas del código.

### `accounts`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `changePassword` | Cuenta con sesión iniciada | RateHit, Session, User | — | Sí | contrasena_guardada |
| `deleteAccount` | Cuenta con sesión iniciada | AuditLog, Bout, Fighter, FighterAchievement, FighterDiscipline, Highlight, Profile, RateHit, Session, SupportAccreditation, Trainer, User | USER: ACCOUNT_DELETED | — | cuenta_eliminada |
| `login` | Cualquiera | RateHit, Session, User | — | — | — |
| `logout` | Cualquiera | Session | — | — | sesion_cerrada |
| `register` | Cualquiera | EmailToken, OrganizerRequest, RateHit, Session, User | — | Sí | cuenta_creada, registro_entidad |
| `requestPasswordReset` | Cualquiera | EmailToken, RateHit | — | Sí | recuperar_enviado |
| `resendVerification` | Cuenta con sesión iniciada | EmailToken, RateHit | — | Sí | correo_reenviado |
| `resetPassword` | Cualquiera | EmailToken, RateHit, Session, User | — | Sí | contrasena_cambiada |
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
| `giveAura` | Cualquiera | Aura | — | — | aura_dada |
| `removeAura` | Cualquiera | Aura | — | — | aura_quitada |

### `bouts`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `addBout` | Cuenta con correo verificado | AuditLog, Bout, Event, Fighter, FighterDiscipline | BOUT: CREATED | Sí | — |
| `removeMyBout` | Cuenta con correo verificado | AuditLog, Bout, Event, Fighter | BOUT: REMOVED_BY_AUTHOR | — | combate_quitado |
| `respondBout` | Cuenta con correo verificado | AuditLog, Bout, Fighter, Report | BOUT: (varias), BOUT: RIVAL_REVIEW_REQUESTED | Sí | — |
| `setBoutEvidence` | Cuenta con correo verificado | AuditLog, Bout | BOUT: EVIDENCE_SET | — | — |
| `setMyBoutResult` | Cuenta con correo verificado | AuditLog, Bout | BOUT: RESULT_SET_BY_AUTHOR | — | — |

### `community`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `createReport` | Cuenta con correo verificado | AuditLog, Report | REPORT: CREATED | — | reporte_enviado |
| `toggleFollow` | Cualquiera | Follow | — | — | — |

### `demo`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `demoCambiarPapel` | Cuenta con sesión iniciada | AuditLog, OrganizerRequest, User | USER: DEMO_ROLE_CHANGED | — | demo_papel_cambiado |
| `demoConfirmarCorreo` | Cuenta con sesión iniciada | AuditLog, User | USER: DEMO_EMAIL_VERIFIED | — | correo_verificado |

### `events`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `addCartelBout` | Organizador (o moderación) con correo verificado | AuditLog, Bout, Fighter, FighterDiscipline | BOUT: CREATED_BY_ORGANIZER | Sí | cartel_anadido |
| `createEvent` | Organizador (o moderación) con correo verificado | AuditLog, Event | EVENT: CREATED | — | velada_creada |
| `removeCartelBout` | Organizador (o moderación) con correo verificado | AuditLog, Bout | BOUT: REMOVED_FROM_CARTEL | — | cartel_quitado |
| `requestOrganizer` | Cuenta con correo verificado | OrganizerRequest | — | — | solicitud_enviada |
| `setBoutResult` | Organizador (o moderación) con correo verificado | AuditLog, Bout, Event, Fighter | BOUT: RESULT_SET | — | resultado_guardado |
| `setEventStatus` | Organizador (o moderación) con correo verificado | AuditLog, Event | EVENT: (varias) | — | — |
| `updateEvent` | Organizador (o moderación) con correo verificado | AuditLog, Bout, Event | EVENT: UPDATED | — | velada_actualizada |

### `fighters`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `createMyFighter` | Cuenta con correo verificado | AuditLog, Fighter, Gym, User | FIGHTER: CREATED | — | ficha_creada |
| `manageHighlight` | Cuenta con correo verificado | AuditLog, Highlight | HIGHLIGHT: (varias) | — | — |
| `publishHighlight` | Cuenta con correo verificado | AuditLog, Highlight | HIGHLIGHT: CREATED | — | highlight_publicado |
| `requestClaim` | Cuenta con correo verificado | ClaimRequest | — | — | solicitud_enviada |
| `saveDiscipline` | Cuenta con correo verificado | AuditLog, FighterDiscipline | FIGHTER: (varias) | — | disciplina_guardada |
| `setRecordPublic` | Cuenta con correo verificado | AuditLog, Fighter | FIGHTER: (varias) | — | — |
| `updateMyFighter` | Cuenta con correo verificado | AuditLog, Fighter, Gym | FIGHTER: PROFILE_UPDATED | — | ficha_actualizada |

### `moderation`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `adminDecide` | Moderación | AuditLog, Bout, Fighter | BOUT: (varias) | — | moderacion_rechazado, moderacion_restaurado, moderacion_verificado |
| `decideClaim` | Moderación | AuditLog, Aura, ClaimRequest, Fighter, Follow | CLAIM: (varias) | Sí | — |
| `decideOrganizer` | Moderación | AuditLog, OrganizerRequest, Profile, User | ORGANIZER: (varias), PROFILE: FEDERATION_CREATED | Sí | — |
| `resolveReport` | Moderación | AuditLog, Aura, Bout, Fighter, FighterAchievement, FighterDiscipline, Highlight, Profile, Report | REPORT: (varias) | — | — |
| `setGymVerified` | Moderación | AuditLog, Gym | GYM: (varias) | — | — |

### `profiles`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `createFederation` | Cuenta con correo verificado | AuditLog, Profile | PROFILE: FEDERATION_CREATED | — | — |
| `saveProfile` | Cuenta con correo verificado | AuditLog, Profile | PROFILE: PROFILE_UPDATED | — | perfil_guardado |

### `trainers`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `createClass` | Cuenta con correo verificado | AuditLog, TrainingClass | CLASS: CREATED | — | clase_publicada |
| `createMyTrainer` | Cuenta con correo verificado | AuditLog, Gym, Trainer, TrainingClass, User | TRAINER: CREATED | — | — |
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
| Gym | `fighters.createMyFighter`, `fighters.updateMyFighter`, `moderation.setGymVerified`, `trainers.createMyTrainer` |
| Trainer | `accounts.deleteAccount`, `trainers.createMyTrainer` |
| TrainingClass | `trainers.createMyTrainer`, `trainers.createClass`, `trainers.toggleClass` |
| Highlight | `accounts.deleteAccount`, `fighters.publishHighlight`, `fighters.manageHighlight`, `moderation.resolveReport` |
| Fighter | `accounts.deleteAccount`, `bouts.addBout`, `bouts.respondBout`, `bouts.removeMyBout`, `events.addCartelBout`, `events.setBoutResult`, `fighters.createMyFighter`, `fighters.updateMyFighter`, `fighters.setRecordPublic`, `moderation.adminDecide`, `moderation.decideClaim`, `moderation.resolveReport` |
| Event | `bouts.addBout`, `bouts.removeMyBout`, `events.createEvent`, `events.setBoutResult`, `events.updateEvent`, `events.setEventStatus` |
| Bout | `accounts.deleteAccount`, `bouts.addBout`, `bouts.setMyBoutResult`, `bouts.respondBout`, `bouts.setBoutEvidence`, `bouts.removeMyBout`, `events.addCartelBout`, `events.setBoutResult`, `events.updateEvent`, `events.removeCartelBout`, `moderation.adminDecide`, `moderation.resolveReport`, `trajectory.endorseBout` |
| User | `accounts.register`, `accounts.saveInterests`, `accounts.saveFighterIntent`, `accounts.saveTrainerIntent`, `accounts.saveTrainerClassIntent`, `accounts.login`, `accounts.resetPassword`, `accounts.updateAccount`, `accounts.changePassword`, `accounts.unsubscribeEmails`, `accounts.deleteAccount`, `accounts.verifyEmail`, `demo.demoConfirmarCorreo`, `demo.demoCambiarPapel`, `fighters.createMyFighter`, `moderation.decideOrganizer`, `trainers.createMyTrainer` |
| Session | `accounts.register`, `accounts.login`, `accounts.logout`, `accounts.resetPassword`, `accounts.changePassword`, `accounts.deleteAccount` |
| Aura | `aura.giveAura`, `aura.removeAura`, `moderation.decideClaim`, `moderation.resolveReport` |
| EmailToken | `accounts.register`, `accounts.requestPasswordReset`, `accounts.resetPassword`, `accounts.verifyEmail`, `accounts.resendVerification` |
| ClaimRequest | `fighters.requestClaim`, `moderation.decideClaim` |
| OrganizerRequest | `accounts.register`, `demo.demoCambiarPapel`, `events.requestOrganizer`, `moderation.decideOrganizer` |
| AuditLog | `accounts.updateAccount`, `accounts.deleteAccount`, `bouts.addBout`, `bouts.setMyBoutResult`, `bouts.respondBout`, `bouts.setBoutEvidence`, `bouts.removeMyBout`, `community.createReport`, `demo.demoConfirmarCorreo`, `demo.demoCambiarPapel`, `events.createEvent`, `events.addCartelBout`, `events.setBoutResult`, `events.updateEvent`, `events.setEventStatus`, `events.removeCartelBout`, `fighters.createMyFighter`, `fighters.updateMyFighter`, `fighters.saveDiscipline`, `fighters.setRecordPublic`, `fighters.publishHighlight`, `fighters.manageHighlight`, `moderation.adminDecide`, `moderation.decideClaim`, `moderation.decideOrganizer`, `moderation.setGymVerified`, `moderation.resolveReport`, `profiles.saveProfile`, `profiles.createFederation`, `trainers.createMyTrainer`, `trainers.createClass`, `trajectory.saveAchievement`, `trajectory.withdrawAchievement`, `trajectory.restoreOwnAchievement`, `trajectory.requestAchievementReview`, `trajectory.reviewAchievement`, `trajectory.endorseBout`, `trajectory.setSupportAccreditation` |
| Report | `bouts.respondBout`, `community.createReport`, `moderation.resolveReport` |
| Follow | `accounts.saveInterests`, `community.toggleFollow`, `moderation.decideClaim` |
| FighterDiscipline | `accounts.deleteAccount`, `bouts.addBout`, `events.addCartelBout`, `fighters.saveDiscipline`, `moderation.resolveReport` |
| RateHit | `accounts.register`, `accounts.login`, `accounts.requestPasswordReset`, `accounts.resetPassword`, `accounts.changePassword`, `accounts.deleteAccount`, `accounts.resendVerification` |
| Profile | `accounts.deleteAccount`, `moderation.decideOrganizer`, `moderation.resolveReport`, `profiles.saveProfile`, `profiles.createFederation` |
| SupportAccreditation | `accounts.deleteAccount`, `trajectory.setSupportAccreditation` |
| FighterAchievement | `accounts.deleteAccount`, `moderation.resolveReport`, `trajectory.saveAchievement`, `trajectory.withdrawAchievement`, `trajectory.restoreOwnAchievement`, `trajectory.requestAchievementReview`, `trajectory.reviewAchievement` |

## Lógica compartida (`src/lib`)

Sin interfaz y sin saber nada de las pantallas. Las dependencias permitidas entre dominios las vigila `tests/unit/arquitectura.test.ts`.

### `lib/accounts`

| Fichero | Exporta |
|---|---|
| `auth.ts` | `RESET_HOURS`, `VERIFY_HOURS`, `consumeVerificationToken`, `createSession`, `destroyOtherSessions`, `destroySession`, `getUser`, `isResetTokenUsable`, `readReturnPath`, `rememberReturnPath`, `requireUser`, `requireVerifiedUser`, `resetPasswordWithToken`, `sendPasswordResetEmail`, `sendVerificationEmail`, `unsubscribeLink`, `unsubscribeWithToken` |
| `backing.ts` | `canEndorse`, `requireSupportActor` |
| `landing.ts` | `PASOS_REGISTRO`, `ROL_INICIAL`, `TIPOS_DE_CUENTA`, `TIPOS_DE_ENTIDAD`, `TIPO_DE_ENTIDAD_ETIQUETA`, `TipoDeCuenta`, `TipoDeEntidad`, `landingFor`, `parseTipoDeCuenta`, `parseTipoDeEntidad` |
| `onboarding.ts` | `ClassDraft`, `FighterIntent`, `Onboarding`, `TrainerIntent`, `readOnboarding` |
| `password.ts` | `dummyHash`, `hashPassword`, `needsRehash`, `verifyPassword` |
| `permissions.ts` | `requireAdmin`, `requireOrganizer` |
| `ratelimit.ts` | `HORA`, `MINUTO`, `addHit`, `allow`, `clearHits`, `clientIp`, `countHits`, `isBlocked`, `normalizeIp`, `reservar` |
| `retention.ts` | `DIAS_CUENTA_SIN_VERIFICAR`, `maybePurge`, `purgeStale` |

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

### `lib/common`

| Fichero | Exporta |
|---|---|
| `apariencia.ts` | `COLOR_DISCIPLINA`, `conAlfa`, `iniciales`, `nombreDePila`, `tinteDe` |
| `audit.ts` | `audit` |
| `competition.ts` | `COMPETITION_DIVISIONS`, `CompetitionDivision`, `divisionAgeEligible`, `divisionById`, `divisionEligible`, `divisionLabel`, `divisionsFor`, `knownBoxingAgeEligible` |
| `dates.ts` | `MIN_BIRTH_DAY`, `MIN_EVENT_DAY`, `calendarDayStart`, `dayAndMonth`, `dayKey`, `daysUntil`, `eventDayReached`, `madridDayStart`, `monthlySeries`, `parseBirthDate`, `parseDay`, `todayMadrid`, `whenLabel` |
| `db.ts` | `db` |
| `demo.ts` | `DEMO_PAPELES`, `demoActiva` |
| `disciplines.ts` | `CategoriaPeso`, `DISCIPLINE_LABEL`, `DISCIPLINE_ORDER`, `LEVEL_ORDER`, `METHODS_BY_DISCIPLINE`, `PESOS`, `PesosDe`, `isDiscipline`, `isLevel`, `isTournamentStyle`, `isWeightClass`, `levelName`, `parseCompetitionChoice`, `parseDisciplineChoice`, `weightClassLabel`, `weightClassesFor`, `weightNote` |
| `env.ts` | `validateEnv` |
| `labels.ts` | `AUDIT_ACTION_LABEL`, `AUDIT_ENTITY_LABEL`, `LEVEL_LABEL`, `METHOD_LABEL`, `PROVINCES`, `STANCE_LABEL`, `VERIFICATION_LABEL`, `fmtDate`, `resultWord`, `shortHash`, `slugName`, `slugify` |
| `mail.ts` | `APP_URL`, `sendMail` |
| `messages.ts` | `AVISOS`, `PROBLEMAS` |
| `names.ts` | `normalizeName`, `publicFighterName`, `publicUserName` |
| `pagination.ts` | `PAGE_SIZE`, `pageNumber`, `pageWindow` |
| `paths.ts` | `internalPath`, `loginPath` |
| `safe.ts` | `flatParams`, `hasOwn`, `lookup`, `oneParam` |
| `search.ts` | `ACCENT_FROM`, `ACCENT_TO`, `MAX_SEARCH_IDS`, `SearchKind`, `searchIds`, `searchWords` |
| `text.ts` | `LIMITS`, `firstTooLong`, `isEmail`, `oneLine`, `plural` |
| `url.ts` | `safeHttpUrl` |

### `lib/community`

| Fichero | Exporta |
|---|---|
| `notify.ts` | `notifyAuthorOfAnswer`, `notifyDecision`, `notifyFollowersOfBout`, `notifyRivalOfBout` |
| `reports.ts` | `MAX_REPORTS_PER_DAY`, `REASONS_BY_ENTITY`, `REPORT_ENTITIES`, `REPORT_REASONS`, `ReportEntity` |

### `lib/fighters`

| Fichero | Exporta |
|---|---|
| `anonymize.ts` | `anonymizeFighter`, `scrubFighterHistory` |
| `coherence.ts` | `FLAG_LABEL`, `Flag`, `MIN_DAYS_BETWEEN_BOUTS`, `proximityAppliesTo`, `proximityFlags` |
| `fighters.ts` | `findNameCandidates` |
| `graduation.ts` | `BELTS`, `graduationLabel`, `parseGraduation` |
| `highlights.ts` | `HIGHLIGHT_KIND_LABEL`, `HIGHLIGHT_TITLE_MAX`, `HighlightInput`, `HighlightParsed`, `MAX_HIGHLIGHTS`, `orderHighlights`, `parseHighlight` |
| `prior.ts` | `PriorError`, `PriorParse`, `parsePrior` |
| `privacy.ts` | `recordHidden`, `shownRecord` |
| `record.ts` | `BoutForRecord`, `Prior`, `Records`, `Tally`, `combinedRecord`, `computeRecords`, `emptyTally`, `formatRecord`, `priorIsDetailed` |

### `lib/profiles`

| Fichero | Exporta |
|---|---|
| `images.ts` | `MAX_IMAGE_BYTES`, `imagePosition`, `normalizeImage` |
| `profiles.ts` | `PROFILE_KINDS`, `ProfileKind`, `canEditProfile`, `profileAccess`, `profileKind`, `profileSelect`, `profileSource` |

### `lib/trainers`

| Fichero | Exporta |
|---|---|
| `classes.ts` | `CLASS_KIND_LABEL`, `CLASS_MINUTES`, `CLASS_PRICE_MAX`, `CLASS_SCHEDULE_MAX`, `CLASS_TITLE_MAX`, `ClassInput`, `ClassParsed`, `GROUP_CAPACITY`, `TRAINER_YEARS_MAX`, `classMeta`, `parseClass`, `parseYears`, `pickDisciplines` |
