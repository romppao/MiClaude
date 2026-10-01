# Mapa funcional

> **Generado automáticamente por `npm run mapa` a partir del código. No se edita a mano:** el CI falla si no está al día.
> Sirve para responder a «¿dónde se hace X?»: qué pantalla lanza qué acción, quién puede ejecutarla y en qué tablas escribe.
> Para las recetas («cómo añado una acción nueva…») y las reglas de organización, ver [`DESARROLLO.md`](DESARROLLO.md).

## Pantallas y direcciones

| Dirección | Qué es | Quién puede entrar | Acciones que lanza | Lee de |
|---|---|---|---|---|
| `/` | Descubre los deportes de contacto amateur de | Pública (cambia lo que ve según la cuenta) | — | Aura, Event, Fighter, Gym |
| `/ayuda` | ¿Cómo funciona Ring España? | Pública | — | — |
| `/baja` | Avisos por correo electrónico | Pública | `accounts.unsubscribeEmails` | — |
| `/buscar` | Buscar | Pública | — | Event, Fighter, Gym, Trainer |
| `/entrar` | Entrar en tu cuenta | Pública | `accounts.login` | — |
| `/entrenadores` | Entrenadores | Pública | — | Trainer |
| `/entrenadores/:slug` | (ficha individual: el título depende del elemento) | Pública | — | Trainer |
| `/gimnasios` | Gimnasios | Pública | — | Gym |
| `/gimnasios/:slug` | (ficha individual: el título depende del elemento) | Pública | — | Gym |
| `/mi-cuenta` | Mi cuenta | Cuenta con sesión iniciada | `accounts.changePassword`, `accounts.updateAccount` | Report |
| `/mi-cuenta/datos` | Descarga de todos los datos que Ring España guarda de la persona que ha iniciado sesión (derecho de acceso y portabilidad). | Cuenta con sesión iniciada | — | AuditLog, Aura, Bout, ClaimRequest, Event, Follow, OrganizerRequest, Report |
| `/mi-cuenta/eliminar` | Eliminar mi cuenta | Cuenta con sesión iniciada | `accounts.deleteAccount` | Bout |
| `/mi-ficha` | ¿Ya apareces en Ring España? | Cuenta con correo verificado | `bouts.addBout`, `bouts.respondBout`, `bouts.setBoutEvidence`, `bouts.setMyBoutResult`, `fighters.createMyFighter`, `fighters.requestClaim`, `fighters.saveDiscipline`, `fighters.updateMyFighter` | Bout, ClaimRequest, Fighter, Gym |
| `/mi-ficha/rival` | ¿Quién es tu rival? | Cuenta con correo verificado | `bouts.addBout` | — |
| `/moderacion` | Moderación | Moderación | `moderation.adminDecide`, `moderation.decideClaim`, `moderation.decideOrganizer`, `moderation.resolveReport`, `moderation.setGymVerified` | Aura, Bout, ClaimRequest, Fighter, Gym, OrganizerRequest, Report |
| `/moderacion/historial` | Historial de cambios | Moderación | — | AuditLog |
| `/organizador` | Organizadores de veladas | Pública (cambia lo que ve según la cuenta) | `events.createEvent`, `events.requestOrganizer` | Event, OrganizerRequest |
| `/organizador/:slug` | (ficha individual: el título depende del elemento) | Organizador de esa velada o moderación | `bouts.setBoutEvidence`, `events.addCartelBout`, `events.setBoutResult` | Event, Fighter |
| `/peleadores` | Peleadores | Pública | — | Fighter |
| `/peleadores/:slug` | (ficha individual: el título depende del elemento) | Pública (cambia lo que ve según la cuenta) | `aura.giveAura`, `aura.removeAura`, `community.createReport`, `community.toggleFollow` | Aura, Bout, Fighter, Follow |
| `/privacidad` | Privacidad y tus datos | Pública | — | — |
| `/ranking` | Ránking de aura | Pública | — | — |
| `/recuperar` | ¿Has olvidado tu contraseña? | Pública | `accounts.requestPasswordReset` | — |
| `/recuperar/nueva` | El enlace ya no sirve | Pública | `accounts.resetPassword` | — |
| `/registro` | Crear cuenta | Pública | `accounts.register` | — |
| `/salud` | Comprobación de salud para el alojamiento: responde 200 si la aplicación y la base de datos funcionan, y 503 si no. | Pública | — | — |
| `/siguiendo` | Mis peleadores | Cuenta con sesión iniciada | `community.toggleFollow` | Bout, Follow |
| `/veladas` | Calendario de veladas | Pública | — | Event |
| `/veladas/:slug` | (ficha individual: el título depende del elemento) | Pública | — | Event |
| `/verificar` | Confirmar tu correo electrónico | Pública (cambia lo que ve según la cuenta) | `accounts.resendVerification`, `accounts.verifyEmail` | — |

«Quién puede entrar» se deduce del código de cada pantalla; las acciones comprueban sus permisos por su cuenta (siguiente tabla), nunca se fían de que la pantalla los haya comprobado.

## Acciones del servidor

Cada acción es un punto de entrada público del servidor (`src/app/actions/<módulo>.ts`). Lo que sigue sale de seguir las llamadas del código.

### `accounts`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `changePassword` | Cuenta con sesión iniciada | RateHit, Session, User | — | Sí | contrasena_guardada |
| `deleteAccount` | Cuenta con sesión iniciada | AuditLog, Fighter, RateHit, Session, User | USER: ACCOUNT_DELETED | — | cuenta_eliminada |
| `login` | Cualquiera | RateHit, Session, User | — | — | — |
| `logout` | Cualquiera | Session | — | — | sesion_cerrada |
| `register` | Cualquiera | EmailToken, RateHit, Session, User | — | Sí | — |
| `requestPasswordReset` | Cualquiera | EmailToken, RateHit | — | Sí | recuperar_enviado |
| `resendVerification` | Cuenta con sesión iniciada | EmailToken, RateHit | — | Sí | correo_reenviado |
| `resetPassword` | Cualquiera | EmailToken, Session, User | — | Sí | contrasena_cambiada |
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
| `addBout` | Cuenta con correo verificado | AuditLog, Bout, Event, Fighter, FighterDiscipline | BOUT: CREATED | — | — |
| `respondBout` | Cuenta con correo verificado | AuditLog, Bout, Fighter | BOUT: (varias) | — | — |
| `setBoutEvidence` | Cuenta con correo verificado | AuditLog, Bout | BOUT: EVIDENCE_SET | — | — |
| `setMyBoutResult` | Cuenta con correo verificado | AuditLog, Bout | BOUT: RESULT_SET_BY_AUTHOR | — | resultado_guardado |

### `community`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `createReport` | Cuenta con correo verificado | AuditLog, Report | REPORT: CREATED | — | reporte_enviado |
| `toggleFollow` | Cualquiera | Follow | — | — | — |

### `events`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `addCartelBout` | Organizador (o moderación) con correo verificado | AuditLog, Bout, Fighter, FighterDiscipline | BOUT: CREATED_BY_ORGANIZER | Sí | cartel_anadido |
| `createEvent` | Organizador (o moderación) con correo verificado | AuditLog, Event | EVENT: CREATED | — | velada_creada |
| `requestOrganizer` | Cuenta con correo verificado | OrganizerRequest | — | — | solicitud_enviada |
| `setBoutResult` | Organizador (o moderación) con correo verificado | AuditLog, Bout, Event, Fighter | BOUT: RESULT_SET | — | resultado_guardado |

### `fighters`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `createMyFighter` | Cuenta con correo verificado | AuditLog, Fighter, Gym | FIGHTER: CREATED | — | ficha_creada |
| `requestClaim` | Cuenta con correo verificado | ClaimRequest | — | — | solicitud_enviada |
| `saveDiscipline` | Cuenta con correo verificado | AuditLog, FighterDiscipline | FIGHTER: (varias) | — | disciplina_guardada |
| `updateMyFighter` | Cuenta con correo verificado | AuditLog, Fighter, Gym | FIGHTER: PROFILE_UPDATED | — | ficha_actualizada |

### `moderation`

| Acción | Quién puede | Escribe en | Registro de cambios | Correo | Avisos de éxito |
|---|---|---|---|---|---|
| `adminDecide` | Moderación | AuditLog, Bout, Fighter | BOUT: (varias) | — | moderacion_rechazado, moderacion_restaurado, moderacion_verificado |
| `decideClaim` | Moderación | AuditLog, Aura, ClaimRequest, Fighter, Follow | CLAIM: (varias) | Sí | — |
| `decideOrganizer` | Moderación | AuditLog, OrganizerRequest, User | ORGANIZER: (varias) | Sí | — |
| `resolveReport` | Moderación | AuditLog, Aura, Bout, Fighter, Report | REPORT: (varias) | — | — |
| `setGymVerified` | Moderación | AuditLog, Gym | GYM: (varias) | — | — |

## Tablas y quién escribe en ellas

| Tabla | Acciones que escriben |
|---|---|
| Gym | `fighters.createMyFighter`, `fighters.updateMyFighter`, `moderation.setGymVerified` |
| Trainer | ninguna acción (solo la retención, la semilla o la baja de cuenta) |
| Fighter | `accounts.deleteAccount`, `bouts.addBout`, `bouts.respondBout`, `events.addCartelBout`, `events.setBoutResult`, `fighters.createMyFighter`, `fighters.updateMyFighter`, `moderation.adminDecide`, `moderation.decideClaim`, `moderation.resolveReport` |
| Event | `bouts.addBout`, `events.createEvent`, `events.setBoutResult` |
| Bout | `bouts.addBout`, `bouts.setMyBoutResult`, `bouts.respondBout`, `bouts.setBoutEvidence`, `events.addCartelBout`, `events.setBoutResult`, `moderation.adminDecide`, `moderation.resolveReport` |
| User | `accounts.register`, `accounts.login`, `accounts.resetPassword`, `accounts.updateAccount`, `accounts.changePassword`, `accounts.unsubscribeEmails`, `accounts.deleteAccount`, `accounts.verifyEmail`, `moderation.decideOrganizer` |
| Session | `accounts.register`, `accounts.login`, `accounts.logout`, `accounts.resetPassword`, `accounts.changePassword`, `accounts.deleteAccount` |
| Aura | `aura.giveAura`, `aura.removeAura`, `moderation.decideClaim`, `moderation.resolveReport` |
| EmailToken | `accounts.register`, `accounts.requestPasswordReset`, `accounts.resetPassword`, `accounts.verifyEmail`, `accounts.resendVerification` |
| ClaimRequest | `fighters.requestClaim`, `moderation.decideClaim` |
| OrganizerRequest | `events.requestOrganizer`, `moderation.decideOrganizer` |
| AuditLog | `accounts.updateAccount`, `accounts.deleteAccount`, `bouts.addBout`, `bouts.setMyBoutResult`, `bouts.respondBout`, `bouts.setBoutEvidence`, `community.createReport`, `events.createEvent`, `events.addCartelBout`, `events.setBoutResult`, `fighters.createMyFighter`, `fighters.updateMyFighter`, `fighters.saveDiscipline`, `moderation.adminDecide`, `moderation.decideClaim`, `moderation.decideOrganizer`, `moderation.setGymVerified`, `moderation.resolveReport` |
| Report | `community.createReport`, `moderation.resolveReport` |
| Follow | `community.toggleFollow`, `moderation.decideClaim` |
| FighterDiscipline | `bouts.addBout`, `events.addCartelBout`, `fighters.saveDiscipline` |
| RateHit | `accounts.register`, `accounts.login`, `accounts.requestPasswordReset`, `accounts.changePassword`, `accounts.deleteAccount`, `accounts.resendVerification` |

## Lógica compartida (`src/lib`)

Sin interfaz y sin saber nada de las pantallas. Las dependencias permitidas entre dominios las vigila `tests/unit/arquitectura.test.ts`.

### `lib/accounts`

| Fichero | Exporta |
|---|---|
| `auth.ts` | `RESET_HOURS`, `VERIFY_HOURS`, `consumeVerificationToken`, `createSession`, `destroyOtherSessions`, `destroySession`, `getUser`, `isResetTokenUsable`, `requireUser`, `requireVerifiedUser`, `resetPasswordWithToken`, `sendPasswordResetEmail`, `sendVerificationEmail`, `unsubscribeLink`, `unsubscribeWithToken` |
| `password.ts` | `dummyHash`, `hashPassword`, `needsRehash`, `verifyPassword` |
| `ratelimit.ts` | `HORA`, `MINUTO`, `addHit`, `allow`, `clearHits`, `clientIp`, `countHits`, `isBlocked`, `normalizeIp` |
| `retention.ts` | `DIAS_CUENTA_SIN_VERIFICAR`, `maybePurge`, `purgeStale` |

### `lib/aura`

| Fichero | Exporta |
|---|---|
| `ranking.ts` | `AuraEntry`, `CategoryRanking`, `NO_CATEGORY`, `RankedEntry`, `auraRanking`, `rankByCategory` |
| `rules.ts` | `AURA_COMMENT_MAX`, `AURA_PER_DAY`, `AuraProblema`, `BoutForAura`, `canGiveAura` |

### `lib/bouts`

| Fichero | Exporta |
|---|---|
| `rules.ts` | `OUTCOME_TO_RESULT`, `OutcomeKey`, `OutcomeProblema`, `pairKey`, `validateOutcome` |

### `lib/common`

| Fichero | Exporta |
|---|---|
| `audit.ts` | `audit` |
| `dates.ts` | `MIN_BIRTH_DAY`, `MIN_EVENT_DAY`, `dayKey`, `eventDayReached`, `parseBirthDate`, `parseDay`, `todayMadrid` |
| `db.ts` | `db` |
| `disciplines.ts` | `DISCIPLINE_LABEL`, `DISCIPLINE_ORDER`, `METHODS_BY_DISCIPLINE`, `WEIGHT_CLASSES`, `isDiscipline`, `isTournamentStyle`, `parseDisciplineChoice` |
| `env.ts` | `validateEnv` |
| `labels.ts` | `AUDIT_ACTION_LABEL`, `AUDIT_ENTITY_LABEL`, `LEVEL_LABEL`, `METHOD_LABEL`, `PROVINCES`, `STANCE_LABEL`, `VERIFICATION_LABEL`, `fmtDate`, `resultWord`, `slugify` |
| `mail.ts` | `APP_URL`, `sendMail` |
| `messages.ts` | `AVISOS`, `PROBLEMAS` |
| `names.ts` | `normalizeName`, `publicFighterName`, `publicUserName` |
| `pagination.ts` | `PAGE_SIZE`, `pageNumber`, `pageWindow` |
| `paths.ts` | `internalPath` |
| `safe.ts` | `flatParams`, `hasOwn`, `lookup`, `oneParam` |
| `search.ts` | `ACCENT_FROM`, `ACCENT_TO`, `MAX_SEARCH_IDS`, `SearchKind`, `searchIds`, `searchWords` |
| `text.ts` | `LIMITS`, `firstTooLong`, `isEmail`, `oneLine`, `plural` |
| `url.ts` | `safeHttpUrl` |

### `lib/community`

| Fichero | Exporta |
|---|---|
| `notify.ts` | `notifyDecision`, `notifyFollowersOfBout` |
| `reports.ts` | `MAX_REPORTS_PER_DAY`, `REASONS_BY_ENTITY`, `REPORT_ENTITIES`, `REPORT_REASONS`, `ReportEntity` |

### `lib/fighters`

| Fichero | Exporta |
|---|---|
| `anonymize.ts` | `anonymizeFighter` |
| `coherence.ts` | `FLAG_LABEL`, `Flag`, `MIN_DAYS_BETWEEN_BOUTS`, `proximityAppliesTo`, `proximityFlags` |
| `fighters.ts` | `findNameCandidates` |
| `prior.ts` | `PriorError`, `PriorParse`, `parsePrior` |
| `record.ts` | `BoutForRecord`, `Prior`, `Records`, `Tally`, `combinedRecord`, `computeRecords`, `emptyTally`, `formatRecord`, `priorIsDetailed` |
