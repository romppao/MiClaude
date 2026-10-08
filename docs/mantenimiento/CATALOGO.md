# Catálogo del código

> Generado con `node scripts/generar-catalogo.mjs`. Editar responsabilidades en `docs/catalogo-codigo.json`; no editar esta salida.

Cobertura estructural: **226 archivos mantenidos**, cada uno con responsabilidad y guía. La comprobación no certifica que la explicación sea suficiente; requiere revisión humana.

La huella SHA-256 abreviada permite detectar cambios del archivo; `--comprobar` compara toda la salida. Las declaraciones exportadas se extraen por patrón léxico, son orientativas y no incluyen todas las reexportaciones: consultar el código y el [mapa funcional](../MAPA-FUNCIONAL.md) para acciones, tablas y guardas.

Alcance y exclusiones: [manual](README.md) y [operación](OPERACION.md).

## Acciones del servidor

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [src/app/actions/accounts.ts](../../src/app/actions/accounts.ts) | Registro por tipo, borradores, acceso, recuperación, cuenta, correo y baja; orquesta guardas, transacciones y datos personales. | [Contexto](FLUJOS.md) | `register`, `saveInterests`, `saveFighterIntent`, `saveTrainerIntent`, `saveTrainerClassIntent`, `login`, `logout`, `requestPasswordReset`, `resetPassword`, `updateAccount`, `changePassword`, `unsubscribeEmails`, `deleteAccount`, `verifyEmail`, `resendVerification` | `768270e11943823c` |
| [src/app/actions/aura.ts](../../src/app/actions/aura.ts) | Concede o retira el aura del usuario tras validar correo, regla deportiva, límite diario y unicidad de destinatario/combate. | [Contexto](FLUJOS.md) | `giveAura`, `removeAura` | `2e79e6b4508d44f0` |
| [src/app/actions/bouts.ts](../../src/app/actions/bouts.ts) | Registra combates y resultados propios, respuesta del rival, evidencia y retirada; condiciona escrituras a hechos/estado leídos. | [Contexto](FLUJOS.md) | `addBout`, `setMyBoutResult`, `respondBout`, `setBoutEvidence`, `removeMyBout` | `f9d75da3e61ce153` |
| [src/app/actions/community.ts](../../src/app/actions/community.ts) | Guarda avisos de revisión y cambios de seguimiento; un aviso no suspende automáticamente un resultado. | [Contexto](FLUJOS.md) | `createReport`, `toggleFollow` | `be397b109c19e0b7` |
| [src/app/actions/demo.ts](../../src/app/actions/demo.ts) | Confirma correo y cambia papel solo en copia de demostración habilitada; no debe habilitarse para personas/datos reales. | [Contexto](FLUJOS.md) | `demoConfirmarCorreo`, `demoCambiarPapel` | `eb4eed0726c08721` |
| [src/app/actions/events.ts](../../src/app/actions/events.ts) | Solicitud de organizador, veladas, cartel, resultados y cancelación; autoriza la velada y programa avisos a seguidores al añadir combate. | [Contexto](FLUJOS.md) | `requestOrganizer`, `createEvent`, `addCartelBout`, `setBoutResult`, `updateEvent`, `setEventStatus`, `removeCartelBout` | `d8f2680d7e959caa` |
| [src/app/actions/fighters.ts](../../src/app/actions/fighters.ts) | Crea/corrige ficha propia y disciplinas, solicita reclamación, regula récord público y gestiona highlights; exige publicación autorizada. | [Contexto](FLUJOS.md) | `createMyFighter`, `updateMyFighter`, `saveDiscipline`, `requestClaim`, `setRecordPublic`, `publishHighlight`, `manageHighlight` | `1d42b5a4e3e9de70` |
| [src/app/actions/moderation.ts](../../src/app/actions/moderation.ts) | Resuelve solicitudes y avisos, verifica/suspende combates y gestiona entidades; registra motivo e historial de decisiones. | [Contexto](FLUJOS.md) | `adminDecide`, `decideClaim`, `decideOrganizer`, `setGymVerified`, `resolveReport` | `a63682e5c9f345e5` |
| [src/app/actions/profiles.ts](../../src/app/actions/profiles.ts) | Guarda personalización e imágenes tras comprobar propiedad y crea perfiles de federación por moderación; normaliza archivos antes de escribir. | [Contexto](FLUJOS.md) | `saveProfile`, `createFederation` | `b60de7bd0e59d98c` |
| [src/app/actions/shared.ts](../../src/app/actions/shared.ts) | Ayudantes sin directiva use server: lectura, mensajes, errores previstos, bloqueo, propiedad de velada y publicación/slug de fichas. | [Contexto](FLUJOS.md) | `str`, `intOrNull`, `go`, `returnTo`, `Rechazo`, `guard`, `withLock`, `checkLengths`, `readProvince`, `Client`, `coherenceFlagsFor`, `ensureDiscipline`, `uniqueSlug`, `ownEvent`, `fullNameSlug`, `listFighters` | `843f3bc04e26fc5d` |
| [src/app/actions/trainers.ts](../../src/app/actions/trainers.ts) | Publica perfil propio y clases o cambia su estado; exige rol/correo y propiedad, y consume intención inicial en transacción. | [Contexto](FLUJOS.md) | `createMyTrainer`, `createClass`, `toggleClass` | `9815da9d6a877a04` |
| [src/app/actions/trajectory.ts](../../src/app/actions/trajectory.ts) | Gestiona títulos, retirada/restauración/revisión, respaldo de combate y acreditaciones; separa derecho a declarar de permiso para avalar. | [Contexto](FLUJOS.md) | `saveAchievement`, `withdrawAchievement`, `restoreOwnAchievement`, `requestAchievementReview`, `reviewAchievement`, `endorseBout`, `setSupportAccreditation` | `7befe0a6ab477fc5` |

## Base de datos y migraciones

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [prisma/migrations/20260930000000_inicial/migration.sql](../../prisma/migrations/20260930000000_inicial/migration.sql) | Crea esquema inicial, enums, tablas, restricciones e índices base; no editar después de integrado. | [Contexto](DATOS.md) | — | `b8847af0a9b00dc7` |
| [prisma/migrations/20261002000000_muay_thai/migration.sql](../../prisma/migrations/20261002000000_muay_thai/migration.sql) | Añade Muay Thai al enum de disciplinas sin reclasificar hechos existentes. | [Contexto](DATOS.md) | — | `5d92fa29ef73d009` |
| [prisma/migrations/20261003090000_divisiones_deportivas/migration.sql](../../prisma/migrations/20261003090000_divisiones_deportivas/migration.sql) | Añade división deportiva a disciplina del peleador y combate e índice de categoría; conserva datos previos sin reclasificar. | [Contexto](DATOS.md) | — | `58d54bdb16204f9a` |
| [prisma/migrations/20261003140000_identidad_perfiles/migration.sql](../../prisma/migrations/20261003140000_identidad_perfiles/migration.sql) | Añade perfiles visuales e información de cinturón/grados, con relaciones y unicidad de perfil por entidad. | [Contexto](DATOS.md) | — | `c7c383b32776eb9d` |
| [prisma/migrations/20261003160000_trayectoria_respaldo_aura/migration.sql](../../prisma/migrations/20261003160000_trayectoria_respaldo_aura/migration.sql) | Añade títulos, acreditaciones y campos de respaldo que permiten separar trayectoria, aval y comunidad. | [Contexto](DATOS.md) | — | `4f313895ae740472` |
| [prisma/migrations/20261006120000_solicitud_entidad_tipo/migration.sql](../../prisma/migrations/20261006120000_solicitud_entidad_tipo/migration.sql) | Añade tipo y web a solicitud de organizador; solicitudes anteriores conservan PROMOTORA por defecto. | [Contexto](DATOS.md) | — | `19e845ca1764855c` |
| [prisma/migrations/20261008090000_diseno_movil_v3/migration.sql](../../prisma/migrations/20261008090000_diseno_movil_v3/migration.sql) | Añade rol/perfil de entrenador y clases, highlights, intereses, intención de registro y privacidad amateur por defecto. | [Contexto](DATOS.md) | — | `18ade99569a4859d` |
| [prisma/migrations/migration_lock.toml](../../prisma/migrations/migration_lock.toml) | Fija proveedor PostgreSQL del historial de Prisma para reproducir migraciones. | [Contexto](DATOS.md) | — | `99836963713b4f5b` |
| [prisma/schema.prisma](../../prisma/schema.prisma) | Fuente declarativa de modelos, relaciones, enums, restricciones e índices; evoluciona junto a migraciones y flujos de baja/exportación. | [Contexto](DATOS.md) | — | `8f14525ccb84cb22` |
| [prisma/seed.ts](../../prisma/seed.ts) | Carga datos ficticios de demo y comprueba protección frente a base con datos; no usar para migrar producción. | [Contexto](DATOS.md) | — | `0c0442db93874314` |

## Componentes compartidos

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [src/app/components/AuraBreakdown.tsx](../../src/app/components/AuraBreakdown.tsx) | Presenta desglose de trayectoria, respaldo y comunidad por categoría histórica con los datos calculados del ránking. | [Contexto](MODULOS.md) | `AuraBreakdown` | `aa2afe46e9b03bc8` |
| [src/app/components/CamposClase.tsx](../../src/app/components/CamposClase.tsx) | Campos reutilizables de una clase; muestra horario/plazas solo en colectiva y conserva reglas del validador. | [Contexto](MODULOS.md) | `CamposClase` | `aa4cb76946e754ec` |
| [src/app/components/CuentaAtras.tsx](../../src/app/components/CuentaAtras.tsx) | Cuenta atrás de combate en cliente con actualización temporal; conserva representación inicial sin JavaScript. | [Contexto](MODULOS.md) | `CuentaAtras` | `eccccab7e29b1264` |
| [src/app/components/DisciplineFields.tsx](../../src/app/components/DisciplineFields.tsx) | Formulario de disciplina, nivel, categoría y antecedentes declarados; comparte catálogo con validación del servidor. | [Contexto](MODULOS.md) | `DisciplineFields` | `b266928feffc1e13` |
| [src/app/components/EvitarDobleEnvio.tsx](../../src/app/components/EvitarDobleEnvio.tsx) | Evita envíos repetidos del formulario desde la interfaz; no sustituye unicidad ni control de concurrencia en servidor. | [Contexto](MODULOS.md) | `EvitarDobleEnvio` | `f9f3781789a9fde2` |
| [src/app/components/Filtros.tsx](../../src/app/components/Filtros.tsx) | Campos etiquetados, botones aplicar/quitar y resumen de filtros activos para listados comprensibles. | [Contexto](MODULOS.md) | `CampoFiltro`, `BotonesFiltro`, `FiltrosActivos` | `782fe0b4ad6df366` |
| [src/app/components/FlashNotice.tsx](../../src/app/components/FlashNotice.tsx) | Traduce mensajes de URL, anuncia resultado accesible y ofrece retorno a sección/cola tras acción. | [Contexto](MODULOS.md) | `FlashNotice` | `7d107fbb9daafdfa` |
| [src/app/components/Foto.tsx](../../src/app/components/Foto.tsx) | Muestra foto opcional y retira imagen si falla para conservar iniciales/fondo; permite alt decorativo. | [Contexto](MODULOS.md) | `Foto` | `65fcc0e7e9d02465` |
| [src/app/components/Icono.tsx](../../src/app/components/Icono.tsx) | Iconos decorativos de trazo y marca del diseño v3; la acción se identifica por el texto accesible del control. | [Contexto](MODULOS.md) | `NombreIcono`, `Icono`, `Marca` | `2577040fb0f4dbea` |
| [src/app/components/MetodoSegunDisciplina.tsx](../../src/app/components/MetodoSegunDisciplina.tsx) | Filtra métodos del combate según disciplina elegida en cliente; el servidor vuelve a validar resultado/método. | [Contexto](MODULOS.md) | `MetodoSegunDisciplina` | `051bbaadb4fc14a8` |
| [src/app/components/MobileNav.tsx](../../src/app/components/MobileNav.tsx) | Elige destinos de barra móvil según papel y destaca ruta activa; los destinos mantienen sus guardas propias. | [Contexto](MODULOS.md) | `PapelBarra`, `MobileNav` | `ff2a6e29da2307e9` |
| [src/app/components/NavigationMenu.tsx](../../src/app/components/NavigationMenu.tsx) | Menú por actividades en diálogo nativo, con foco/Escape y cierre al navegar; recibe el formulario de salida desde layout. | [Contexto](MODULOS.md) | `NavigationMenu` | `abba1099e7c4c24b` |
| [src/app/components/Paginacion.tsx](../../src/app/components/Paginacion.tsx) | Enlaces de página anterior/siguiente conservando filtros; zonas táctiles y texto para un listado acotado. | [Contexto](MODULOS.md) | `Paginacion` | `02aea02c9dd5eb8b` |
| [src/app/components/PasosRegistro.tsx](../../src/app/components/PasosRegistro.tsx) | Cabecera de alta con progreso y retorno según los pasos del tipo de cuenta; no publica datos por sí misma. | [Contexto](MODULOS.md) | `PasosRegistro` | `488e1e455f80ebfb` |
| [src/app/components/ProfileDetails.tsx](../../src/app/components/ProfileDetails.tsx) | Carga y presenta datos públicos de personalización del perfil sin exponer almacenamiento de imágenes. | [Contexto](MODULOS.md) | `ProfileDetails` | `b6f928badc8d05cf` |
| [src/app/components/ProfileEditor.tsx](../../src/app/components/ProfileEditor.tsx) | Editor de metadatos, fotos y encuadre con acción recibida desde pantalla; no autoriza una edición por sí solo. | [Contexto](MODULOS.md) | `ProfileEditor` | `09d75a4af5fe14bf` |
| [src/app/components/ProfileHeader.tsx](../../src/app/components/ProfileHeader.tsx) | Cabecera de entidad con nombre, foto/banner y acceso de edición si está autorizado. | [Contexto](MODULOS.md) | `ProfileHeader` | `5c0f014cc222ec5e` |
| [src/app/components/ProfileThumbnail.tsx](../../src/app/components/ProfileThumbnail.tsx) | Miniatura de perfil en listados con alternativa visual cuando falta foto; evita llevar bytes de imagen a la consulta del listado. | [Contexto](MODULOS.md) | `ProfileThumbnail` | `ccb1254b8b38ac2c` |
| [src/app/components/RecordCards.tsx](../../src/app/components/RecordCards.tsx) | Presenta récord por disciplina/nivel y antecedentes separados; respeta ocultación amateur sin inventar detalle previo. | [Contexto](MODULOS.md) | `RecordCards` | `b85dfbf3df85c3fc` |
| [src/app/components/RecordarCampos.tsx](../../src/app/components/RecordarCampos.tsx) | Recuerda campos de formularios admitidos y restaura borrador tras volver; excluye secretos y distingue formularios por firma/orden. | [Contexto](MODULOS.md) | `RecordarCampos` | `5f8882fbc73e67be` |
| [src/app/components/SelectorCategoria.tsx](../../src/app/components/SelectorCategoria.tsx) | Selector de categoría para ficha o filtros con obligatoriedad diferente; comparte catálogo deportivo versionado. | [Contexto](MODULOS.md) | `SelectorCategoria` | `c8253b987f9fbb92` |
| [src/app/components/Tarjetas.tsx](../../src/app/components/Tarjetas.tsx) | Tarjetas v3 de veladas, disciplinas, peleadores y gráfico de aura; reciben datos y no consultan la base. | [Contexto](MODULOS.md) | `TarjetaCartel`, `TarjetaDisciplina`, `MiniPeleador`, `GraficoAura` | `21cea0f5eb73d6d5` |
| [src/app/components/TrajectoryList.tsx](../../src/app/components/TrajectoryList.tsx) | Presenta títulos y respaldo de trayectoria con datos de revisión/retirada; no recalcula el récord. | [Contexto](MODULOS.md) | `TrajectoryList` | `88788320fdf03460` |
| [src/app/components/VerificationTag.tsx](../../src/app/components/VerificationTag.tsx) | Etiqueta declaración, confirmación o verificación y respaldo efectivo del hecho; no avala toda una carrera. | [Contexto](MODULOS.md) | `VerificationTag` | `66eafda8a8dbaf8e` |

## Configuración y automatización

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [.env.example](../../.env.example) | Plantilla de nombres y significado de variables, sin credenciales reales; punto de partida para configuración local/producción. | [Contexto](OPERACION.md) | — | `66f29ca9ac2d4210` |
| [.github/copilot-instructions.md](../../.github/copilot-instructions.md) | Entrada de instrucciones del asistente Copilot hacia reglas compartidas; no debe divergir del protocolo del proyecto. | [Contexto](OPERACION.md) | — | `a96a101f9495f4ee` |
| [.github/dependabot.yml](../../.github/dependabot.yml) | Configura actualización de dependencias y evita saltos mayores automáticos no planificados. | [Contexto](OPERACION.md) | — | `d3d8f5a4368d2cb4` |
| [.github/workflows/ci.yml](../../.github/workflows/ci.yml) | Receta reproducible con PostgreSQL vacío, paridad, tipos, documentación, unitarias, build, navegador y accesibilidad. | [Contexto](OPERACION.md) | — | `f03aa028c9a66c64` |
| [.gitignore](../../.gitignore) | Excluye secretos, dependencias y resultados locales del control de versiones; revisar al añadir nuevas herramientas. | [Contexto](OPERACION.md) | — | `d73a3814d7575175` |
| [next.config.mjs](../../next.config.mjs) | Configura Next.js, tamaño máximo de Server Actions y cabeceras de seguridad/CSP; distingue desarrollo de producción. | [Contexto](OPERACION.md) | — | `d1181479e813851e` |
| [package-lock.json](../../package-lock.json) | Fija árbol exacto de dependencias para npm ci; archivo generado por npm, sin edición manual de cada resolución. | [Contexto](OPERACION.md) | — | `0dd08838689cae75` |
| [package.json](../../package.json) | Define comandos, versiones admitidas y dependencias de ejecución/desarrollo; no añadir proveedores o saltos mayores sin decisión. | [Contexto](OPERACION.md) | — | `8b2ae52cb14a9934` |
| [render.yaml](../../render.yaml) | Blueprint de despliegue de la demo y base asociada; configuración de demo no acredita preparación de producción. | [Contexto](OPERACION.md) | — | `93e4bfd6c85e98cf` |
| [tsconfig.json](../../tsconfig.json) | Opciones de TypeScript y archivos incluidos; coherente con Next.js y convención de importaciones relativas. | [Contexto](OPERACION.md) | — | `d30d8e58ab1c24b1` |
| [vitest.config.mts](../../vitest.config.mts) | Configura batería unitaria del producto; las herramientas documentales usan Node test y las entregas de ingreso otro config. | [Contexto](OPERACION.md) | — | `1014c0b47c12c5ff` |

## Lógica: accounts

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [src/lib/accounts/auth.ts](../../src/lib/accounts/auth.ts) | Crea y consulta sesiones, emite enlaces de correo y consume verificación/recuperación; protege el secreto con hash y mantiene redirecciones de acceso. | [Contexto](MODULOS.md) | `createSession`, `destroySession`, `getUser`, `requireUser`, `rememberReturnPath`, `readReturnPath`, `VERIFY_HOURS`, `RESET_HOURS`, `unsubscribeLink`, `unsubscribeWithToken`, `destroyOtherSessions`, `sendVerificationEmail`, `consumeVerificationToken`, `sendPasswordResetEmail`, `isResetTokenUsable`, `resetPasswordWithToken`, `requireVerifiedUser` | `d7368b5d85306698` |
| [src/lib/accounts/backing.ts](../../src/lib/accounts/backing.ts) | Exige una acreditación vigente para respaldar hechos de las disciplinas autorizadas; un perfil visual o rol de organizador no basta. | [Contexto](MODULOS.md) | `requireSupportActor`, `canEndorse` | `a923559c8932f3a9` |
| [src/lib/accounts/landing.ts](../../src/lib/accounts/landing.ts) | Define tipos de cuenta, rol inicial, pasos del registro y destino al entrar; separa solicitud de entidad de permiso concedido. | [Contexto](MODULOS.md) | `landingFor`, `TIPOS_DE_CUENTA`, `TipoDeCuenta`, `parseTipoDeCuenta`, `ROL_INICIAL`, `PASOS_REGISTRO`, `TIPOS_DE_ENTIDAD`, `TipoDeEntidad`, `TIPO_DE_ENTIDAD_ETIQUETA`, `parseTipoDeEntidad` | `17cf63137d8e5b8d` |
| [src/lib/accounts/onboarding.ts](../../src/lib/accounts/onboarding.ts) | Interpreta de forma defensiva el JSON de elecciones del registro antes de publicar ficha o perfil tras confirmar el correo. | [Contexto](MODULOS.md) | `FighterIntent`, `ClassDraft`, `TrainerIntent`, `Onboarding`, `readOnboarding` | `e451a2e2e6ca2fb9` |
| [src/lib/accounts/password.ts](../../src/lib/accounts/password.ts) | Calcula y verifica scrypt, conserva parámetros en el hash, admite formatos previos y señala cuándo recalcular al entrar. | [Contexto](MODULOS.md) | `hashPassword`, `verifyPassword`, `needsRehash`, `dummyHash` | `e3094f3bab6c2b91` |
| [src/lib/accounts/permissions.ts](../../src/lib/accounts/permissions.ts) | Guardas compartidas de moderación y organización; una denegación devuelve a una pantalla con explicación. | [Contexto](MODULOS.md) | `requireAdmin`, `requireOrganizer` | `d3471d01454cc146` |
| [src/lib/accounts/ratelimit.ts](../../src/lib/accounts/ratelimit.ts) | Cuenta y reserva intentos en PostgreSQL con claves por acción/correo/IP y proxy de confianza; evita carreras al iniciar sesión. | [Contexto](MODULOS.md) | `MINUTO`, `HORA`, `normalizeIp`, `clientIp`, `countHits`, `addHit`, `isBlocked`, `allow`, `reservar`, `clearHits` | `828d56adc4b32a5b` |
| [src/lib/accounts/retention.ts](../../src/lib/accounts/retention.ts) | Limpia sesiones, enlaces, intentos y solicitudes caducadas; limita limpieza por proceso sin hacer fallar la petición que la dispara. | [Contexto](MODULOS.md) | `DIAS_CUENTA_SIN_VERIFICAR`, `purgeStale`, `maybePurge` | `633335ac3875084e` |

## Lógica: aura

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [src/lib/aura/ranking.ts](../../src/lib/aura/ranking.ts) | Calcula y ordena aura por categoría histórica combinando trayectoria, respaldo y comunidad; separa niveles y mantiene posiciones empatadas. | [Contexto](MODULOS.md) | `AuraEntry`, `RankedEntry`, `CategoryRanking`, `NO_CATEGORY`, `rankByCategory`, `auraRanking` | `7432afbe01b1eb46` |
| [src/lib/aura/rules.ts](../../src/lib/aura/rules.ts) | Regla compartida de elegibilidad para dar aura según participante, fecha, resultado y estados; límites comunes de comentario/votos. | [Contexto](MODULOS.md) | `AuraProblema`, `BoutForAura`, `canGiveAura`, `AURA_COMMENT_MAX`, `AURA_PER_DAY` | `c939d981800747d5` |
| [src/lib/aura/trajectory.ts](../../src/lib/aura/trajectory.ts) | Escala v1 de títulos y respaldo, clave histórica de categoría, acreditación efectiva y limpieza de respaldo al cambiar hechos. | [Contexto](MODULOS.md) | `AURA_POLICY`, `SCOPE_LABEL`, `SUPPORT_LABEL`, `SUPPORT_ORDER`, `SUPPORT_OPTIONS`, `SupportedAchievement`, `CategoryChoice`, `auraCategoryKey`, `supportRank`, `effectiveSupport`, `achievementPoints`, `trajectoryByCategory`, `boutBackingPoints`, `WITHOUT_BOUT_BACKING` | `7aebde85d2d01590` |

## Lógica: bouts

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [src/lib/bouts/form.ts](../../src/lib/bouts/form.ts) | Enumera campos admitidos al transportar un borrador de combate entre registro y elección del rival; no concede validez al borrador. | [Contexto](MODULOS.md) | `BOUT_FIELDS`, `boutQuery` | `4a2e116dd684accc` |
| [src/lib/bouts/rules.ts](../../src/lib/bouts/rules.ts) | Valida resultado/método por disciplina, forma la clave de pareja y versiona hechos para detectar cambios antes de confirmar. | [Contexto](MODULOS.md) | `OUTCOME_TO_RESULT`, `OutcomeKey`, `OutcomeProblema`, `validateOutcome`, `pairKey`, `boutVersion` | `c1811a7b9326c9e3` |

## Lógica: common

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [src/lib/common/apariencia.ts](../../src/lib/common/apariencia.ts) | Deriva tinte por disciplina, alfa e iniciales del diseño v3 desde datos; evita repetir estas reglas visuales en pantallas. | [Contexto](MODULOS.md) | `COLOR_DISCIPLINA`, `conAlfa`, `tinteDe`, `iniciales`, `nombreDePila` | `5f8a984947bc338c` |
| [src/lib/common/audit.ts](../../src/lib/common/audit.ts) | Crea historial del cambio relevante y admite cliente transaccional para guardar auditoría junto al hecho. | [Contexto](MODULOS.md) | `audit` | `b7fcce9b1952e5b7` |
| [src/lib/common/competition.ts](../../src/lib/common/competition.ts) | Catálogo de divisiones versionadas y reglas de edad/sexo; preserva el significado de categorías deportivas históricas. | [Contexto](MODULOS.md) | `CompetitionDivision`, `COMPETITION_DIVISIONS`, `divisionById`, `divisionsFor`, `divisionLabel`, `divisionAgeEligible`, `divisionEligible`, `knownBoxingAgeEligible` | `9e733c6d65f582f8` |
| [src/lib/common/dates.ts](../../src/lib/common/dates.ts) | Valida días reales y nacimiento, compara días en Madrid y genera cuenta atrás y series mensuales; no confunde fecha con hora anunciada. | [Contexto](MODULOS.md) | `todayMadrid`, `dayKey`, `calendarDayStart`, `eventDayReached`, `MIN_EVENT_DAY`, `parseDay`, `MIN_BIRTH_DAY`, `parseBirthDate`, `daysUntil`, `whenLabel`, `dayAndMonth`, `monthlySeries`, `madridDayStart` | `93d26238a3321cce` |
| [src/lib/common/db.ts](../../src/lib/common/db.ts) | Comparte el cliente Prisma y lo conserva en global durante recargas de desarrollo para evitar múltiples instancias. | [Contexto](MODULOS.md) | `db` | `ebfb485565c8f753` |
| [src/lib/common/demo.ts](../../src/lib/common/demo.ts) | Activa excepciones y papeles de demostración solo mediante DEMO_MODE; exige una copia ficticia separada del servicio real. | [Contexto](MODULOS.md) | `demoActiva`, `DEMO_PAPELES` | `63fd9b2b288f0880` |
| [src/lib/common/disciplines.ts](../../src/lib/common/disciplines.ts) | Catálogos de disciplinas, niveles, pesos y métodos; valida elecciones y conserva orden sin prioridad editorial de ciudad/disciplina. | [Contexto](MODULOS.md) | `DISCIPLINE_ORDER`, `DISCIPLINE_LABEL`, `isDiscipline`, `LEVEL_ORDER`, `isLevel`, `CategoriaPeso`, `PesosDe`, `PESOS`, `weightClassesFor`, `weightNote`, `isWeightClass`, `weightClassLabel`, `levelName`, `METHODS_BY_DISCIPLINE`, `isTournamentStyle`, `parseDisciplineChoice`, `parseCompetitionChoice` | `8d81101ca4744f57` |
| [src/lib/common/env.ts](../../src/lib/common/env.ts) | Valida variables imprescindibles al arrancar en producción y explica configuración incompleta de correo/contacto. | [Contexto](MODULOS.md) | `validateEnv` | `c5ea58c8b3d59973` |
| [src/lib/common/labels.ts](../../src/lib/common/labels.ts) | Traduce enums y resultados, lista provincias y genera slugs/huellas para nombres; mantiene texto público en español. | [Contexto](MODULOS.md) | `LEVEL_LABEL`, `STANCE_LABEL`, `METHOD_LABEL`, `PROVINCES`, `fmtDate`, `slugify`, `shortHash`, `slugName`, `VERIFICATION_LABEL`, `resultWord`, `AUDIT_ENTITY_LABEL`, `AUDIT_ACTION_LABEL` | `f0352319a87517e1` |
| [src/lib/common/mail.ts](../../src/lib/common/mail.ts) | Envía correo mediante Resend o transporte de log y declara resultado del envío; separa simulación local de entrega real. | [Contexto](MODULOS.md) | `APP_URL`, `sendMail` | `a920f079cbda6b16` |
| [src/lib/common/messages.ts](../../src/lib/common/messages.ts) | Única traducción de códigos de éxito/problema de las acciones a mensajes públicos claros y accionables. | [Contexto](MODULOS.md) | `AVISOS`, `PROBLEMAS` | `08d35b066c2c5ea6` |
| [src/lib/common/names.ts](../../src/lib/common/names.ts) | Normaliza nombres para comparación y abrevia nombre público cuando la privacidad de la ficha lo exige. | [Contexto](MODULOS.md) | `normalizeName`, `publicFighterName`, `publicUserName` | `9c5c868a9951d4cb` |
| [src/lib/common/pagination.ts](../../src/lib/common/pagination.ts) | Valida número de página y calcula ventana acotada para consultas/listados; evita parámetros de paginación ilimitados. | [Contexto](MODULOS.md) | `PAGE_SIZE`, `pageNumber`, `pageWindow` | `2dcfba74ceed2e9a` |
| [src/lib/common/paths.ts](../../src/lib/common/paths.ts) | Acepta destinos internos normalizados y construye retorno a acceso; evita redirecciones a dominios externos manipulados. | [Contexto](MODULOS.md) | `internalPath`, `loginPath` | `3935e9b42d8df714` |
| [src/lib/common/safe.ts](../../src/lib/common/safe.ts) | Consulta solo claves propias y normaliza parámetros de URL; evita aceptar propiedades heredadas o parámetros repetidos. | [Contexto](MODULOS.md) | `hasOwn`, `lookup`, `oneParam`, `flatParams` | `0a88d11b09a30a60` |
| [src/lib/common/search.ts](../../src/lib/common/search.ts) | Busca palabras sin distinguir tildes/mayúsculas mediante SQL parametrizado y limita IDs de resultados; depende de PostgreSQL. | [Contexto](MODULOS.md) | `ACCENT_FROM`, `ACCENT_TO`, `SearchKind`, `MAX_SEARCH_IDS`, `searchWords`, `searchIds` | `69bf49e6bc139bd1` |
| [src/lib/common/text.ts](../../src/lib/common/text.ts) | Centraliza tamaños máximos, validación básica de correo, texto de una línea y plurales de interfaz/correos. | [Contexto](MODULOS.md) | `LIMITS`, `firstTooLong`, `isEmail`, `oneLine`, `plural` | `91c218e730c70637` |
| [src/lib/common/url.ts](../../src/lib/common/url.ts) | Normaliza enlaces HTTP(S) admitidos y rechaza esquemas peligrosos; admitir un enlace no verifica la evidencia que contiene. | [Contexto](MODULOS.md) | `safeHttpUrl` | `ed7ed68e2c5faa10` |

## Lógica: community

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [src/lib/community/notify.ts](../../src/lib/community/notify.ts) | Avisa a seguidores/rival/autor y responde a solicitudes; agrupa destinatarios, respeta preferencias y tolera fallos de envío individuales. | [Contexto](MODULOS.md) | `notifyFollowersOfBout`, `notifyDecision`, `notifyRivalOfBout`, `notifyAuthorOfAnswer` | `b5a78d97f6c986e7` |
| [src/lib/community/reports.ts](../../src/lib/community/reports.ts) | Catálogo de motivos de aviso por entidad y límite diario; separa solicitud de revisión de decisión moderadora. | [Contexto](MODULOS.md) | `REPORT_REASONS`, `REPORT_ENTITIES`, `ReportEntity`, `REASONS_BY_ENTITY`, `MAX_REPORTS_PER_DAY` | `28e79d9bd4ccabf3` |

## Lógica: fighters

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [src/lib/fighters/anonymize.ts](../../src/lib/fighters/anonymize.ts) | Anonimiza fichas conservando combates compartidos y limpia datos personales copiados en el historial. | [Contexto](MODULOS.md) | `scrubFighterHistory`, `anonymizeFighter` | `93ff9b0fd264318c` |
| [src/lib/fighters/coherence.ts](../../src/lib/fighters/coherence.ts) | Señala combates demasiado próximos para revisión humana y contempla torneos; una señal no rechaza automáticamente. | [Contexto](MODULOS.md) | `Flag`, `FLAG_LABEL`, `MIN_DAYS_BETWEEN_BOUTS`, `proximityFlags`, `proximityAppliesTo` | `eef580aa353f2602` |
| [src/lib/fighters/fighters.ts](../../src/lib/fighters/fighters.ts) | Busca candidatos por nombre normalizado para que la persona identifique al rival; evita fusionar homónimos automáticamente. | [Contexto](MODULOS.md) | `findNameCandidates` | `4d64993551e82386` |
| [src/lib/fighters/graduation.ts](../../src/lib/fighters/graduation.ts) | Valida cinturón y grados de jiu-jitsu y construye etiqueta declarada; no otorga acreditación deportiva. | [Contexto](MODULOS.md) | `BELTS`, `parseGraduation`, `graduationLabel` | `6148b64cdab6631c` |
| [src/lib/fighters/highlights.ts](../../src/lib/fighters/highlights.ts) | Valida foto/vídeo destacado, título, enlace y orden de publicaciones del titular; define límites del escaparate. | [Contexto](MODULOS.md) | `HIGHLIGHT_TITLE_MAX`, `MAX_HIGHLIGHTS`, `HIGHLIGHT_KIND_LABEL`, `HighlightInput`, `HighlightParsed`, `parseHighlight`, `orderHighlights` | `912f763925bb72d4` |
| [src/lib/fighters/prior.ts](../../src/lib/fighters/prior.ts) | Valida total y detalle del récord previo declarado; un total sin victorias/derrotas no permite inferirlas. | [Contexto](MODULOS.md) | `PriorError`, `PriorParse`, `parsePrior` | `4fa0479dab65b5a1` |
| [src/lib/fighters/privacy.ts](../../src/lib/fighters/privacy.ts) | Decide visibilidad del récord amateur según preferencia y titular, conservando número de combates para presentación pública. | [Contexto](MODULOS.md) | `recordHidden`, `shownRecord` | `066b9da2e64706b7` |
| [src/lib/fighters/record.ts](../../src/lib/fighters/record.ts) | Calcula récord por disciplina/nivel y suma antecedentes detallados; excluye revisión/cancelación y mantiene total no detallado separado. | [Contexto](MODULOS.md) | `Tally`, `BoutForRecord`, `Records`, `computeRecords`, `emptyTally`, `formatRecord`, `Prior`, `priorIsDetailed`, `combinedRecord` | `c84eafd008219905` |

## Lógica: profiles

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [src/lib/profiles/images.ts](../../src/lib/profiles/images.ts) | Decodifica imágenes estáticas admitidas con límites, orienta y reduce a WebP; valida porcentajes de encuadre. | [Contexto](MODULOS.md) | `MAX_IMAGE_BYTES`, `normalizeImage`, `imagePosition` | `60e2e594f07440cb` |
| [src/lib/profiles/profiles.ts](../../src/lib/profiles/profiles.ts) | Resuelve entidad visual, visibilidad y titular natural/asignado; devuelve selección pública y permiso de edición sin bytes de foto. | [Contexto](MODULOS.md) | `PROFILE_KINDS`, `ProfileKind`, `profileKind`, `profileSelect`, `profileSource`, `canEditProfile`, `profileAccess` | `0fc46797f6e4558a` |

## Lógica: trainers

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [src/lib/trainers/classes.ts](../../src/lib/trainers/classes.ts) | Valida duración, precio por sesión/persona, horario y plazas de clases; interpreta experiencia y disciplinas del entrenador. | [Contexto](MODULOS.md) | `CLASS_KIND_LABEL`, `CLASS_MINUTES`, `CLASS_TITLE_MAX`, `CLASS_SCHEDULE_MAX`, `CLASS_PRICE_MAX`, `GROUP_CAPACITY`, `TRAINER_YEARS_MAX`, `ClassInput`, `ClassParsed`, `parseClass`, `classMeta`, `parseYears`, `pickDisciplines` | `460b48d1d65bca1e` |

## Pantallas, rutas e integración

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [src/app/_inicio/Aficionado.tsx](../../src/app/_inicio/Aficionado.tsx) | Inicio del aficionado con combates de seguidos, aura y resultados; prioriza información de su comunidad. | [Contexto](MODULOS.md) | `InicioAficionado` | `af3c9e7bf194253e` |
| [src/app/_inicio/Entidad.tsx](../../src/app/_inicio/Entidad.tsx) | Inicio de entidad aprobada con sus veladas, cifras y resultados pendientes del cartel. | [Contexto](MODULOS.md) | `InicioEntidad` | `4d4cb21729479b46` |
| [src/app/_inicio/Entrenador.tsx](../../src/app/_inicio/Entrenador.tsx) | Inicio del entrenador para crear perfil o gestionar clases propias usando intención guardada. | [Contexto](MODULOS.md) | `InicioEntrenador` | `498e95708292e17c` |
| [src/app/_inicio/Peleador.tsx](../../src/app/_inicio/Peleador.tsx) | Inicio del peleador con ficha, próximo combate, declaraciones por responder, récord y aura del público. | [Contexto](MODULOS.md) | `InicioPeleador` | `62ab08a820a1e50e` |
| [src/app/_inicio/Visitante.tsx](../../src/app/_inicio/Visitante.tsx) | Portada pública con disciplinas, veladas e invitación por tipo de cuenta; no exige acceso para descubrir. | [Contexto](MODULOS.md) | `InicioVisitante` | `d4a1a36e4ed39a91` |
| [src/app/_inicio/comun.tsx](../../src/app/_inicio/comun.tsx) | Piezas reutilizables de los inicios: saludo, combate VS y presentación de resultados/privacidad. | [Contexto](MODULOS.md) | `Saludo`, `recordPublico`, `CombateVS`, `textoResultado` | `823b0acc2fc6304e` |
| [src/app/_inicio/datos.ts](../../src/app/_inicio/datos.ts) | Consultas compartidas de veladas futuras y peleadores con aura del público; acota resultados y excluye revisión/cancelación. | [Contexto](MODULOS.md) | `CUENTA`, `proximasVeladas`, `peleadoresConAura` | `69809c3ecb0e7518` |
| [src/app/ayuda/page.tsx](../../src/app/ayuda/page.tsx) | Explica cuenta, declaración, trayectoria, respaldo y aura en lenguaje público con enlaces a los flujos disponibles. | [Contexto](FLUJOS.md) | `metadata`, `Help` | `8b7f3ce8e18dd0d9` |
| [src/app/baja/page.tsx](../../src/app/baja/page.tsx) | Presenta confirmación de baja desde enlace; la modificación ocurre con POST para evitar consumirlo al abrir un GET. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Unsubscribe` | `0c9bf90eebf38dac` |
| [src/app/bienvenida/page.tsx](../../src/app/bienvenida/page.tsx) | Entrada v3 con empezar, acceso y exploración pública; muestra invitación sin exigir cuenta para consultar. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Bienvenida` | `e96d4a289b011f69` |
| [src/app/buscar/page.tsx](../../src/app/buscar/page.tsx) | Busca por grupos de entidades y limita muestras, enlazando listado completo con la misma consulta. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Search` | `c1dbcf8e18f2daf4` |
| [src/app/entrar/page.tsx](../../src/app/entrar/page.tsx) | Formulario de acceso que conserva destino interno y explica por qué se necesita sesión. | [Contexto](FLUJOS.md) | `metadata`, `Login` | `d39dac2bbbf0dfa7` |
| [src/app/entrenadores/[slug]/page.tsx](../../src/app/entrenadores/%5Bslug%5D/page.tsx) | Ficha del entrenador, experiencia, gimnasio, clases activas y peleadores; indica que aún no hay reservas/pagos. | [Contexto](FLUJOS.md) | `dynamic`, `generateMetadata`, `TrainerPage` | `6bf88ce098b493c7` |
| [src/app/entrenadores/page.tsx](../../src/app/entrenadores/page.tsx) | Listado filtrado y paginado de entrenadores con perfiles y enlaces individuales. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Trainers` | `1adedbf401bcb2b3` |
| [src/app/error.tsx](../../src/app/error.tsx) | Frontera de error de la aplicación con mensaje y reintento accesible; no expone detalles internos de excepción. | [Contexto](MODULOS.md) | `ErrorPage` | `f92158217fa394fd` |
| [src/app/federaciones/[id]/page.tsx](../../src/app/federaciones/%5Bid%5D/page.tsx) | Perfil público visual de federación identificada por ID; no concede por sí solo permisos de respaldo. | [Contexto](FLUJOS.md) | `dynamic`, `metadata`, `Federation` | `f8bdaff808c39fe3` |
| [src/app/federaciones/page.tsx](../../src/app/federaciones/page.tsx) | Directorio público de perfiles de federación y acceso moderador de creación. | [Contexto](FLUJOS.md) | `dynamic`, `metadata`, `Federations` | `b1e6f9f31b12a6d7` |
| [src/app/gimnasios/[slug]/page.tsx](../../src/app/gimnasios/%5Bslug%5D/page.tsx) | Ficha del gimnasio con personalización, entrenador y peleadores vinculados, diferenciando su sello. | [Contexto](FLUJOS.md) | `dynamic`, `generateMetadata`, `GymPage` | `f863bc668ecd55af` |
| [src/app/gimnasios/page.tsx](../../src/app/gimnasios/page.tsx) | Listado filtrado/paginado de gimnasios con ubicación y acceso a fichas. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Gyms` | `1080637e2d21810c` |
| [src/app/global-error.tsx](../../src/app/global-error.tsx) | Frontera global que aporta documento HTML propio si falla layout; mantiene mensaje público y opción de recuperación. | [Contexto](MODULOS.md) | `GlobalError` | `41d284ac5543e147` |
| [src/app/globals.css](../../src/app/globals.css) | Tokens, componentes y adaptación móvil del diseño v3 junto a clases heredadas; preservar accesibilidad y revisar todos los papeles al cambiarlo. | [Contexto](MODULOS.md) | — | `827a2d58f27c9a7c` |
| [src/app/highlights/[id]/imagen/route.ts](../../src/app/highlights/%5Bid%5D/imagen/route.ts) | Sirve foto WebP de highlight tras comprobar existencia/visibilidad, con cabeceras de respuesta y caché propias. | [Contexto](MODULOS.md) | `dynamic`, `GET` | `b23daa172b68533b` |
| [src/app/imagenes/[kind]/[id]/[slot]/route.ts](../../src/app/imagenes/%5Bkind%5D/%5Bid%5D/%5Bslot%5D/route.ts) | Sirve avatar/banner autorizado; revisa visibilidad antes de ETag y lee bytes solo si necesita devolver WebP. | [Contexto](MODULOS.md) | `dynamic`, `GET` | `8fb038309e706716` |
| [src/app/layout.tsx](../../src/app/layout.tsx) | Composición global de documento, fuente, navegación por cuenta, avisos y formularios compartidos; pasa acciones a componentes sin importarlas allí. | [Contexto](MODULOS.md) | `metadata`, `viewport`, `RootLayout` | `0f15d627cc5b1401` |
| [src/app/mi-cuenta/datos/route.ts](../../src/app/mi-cuenta/datos/route.ts) | Exporta JSON de datos propios con sesión y no-store; incluye nuevas entidades personales y evita compartir secretos de acceso. | [Contexto](MODULOS.md) | `dynamic`, `GET` | `b4e6a60ced744237` |
| [src/app/mi-cuenta/eliminar/page.tsx](../../src/app/mi-cuenta/eliminar/page.tsx) | Explica consecuencias y pide contraseña/confirmación para eliminar cuenta; la acción comprueba restricciones reales. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `DeleteAccount` | `906d3b2e1f517fc0` |
| [src/app/mi-cuenta/page.tsx](../../src/app/mi-cuenta/page.tsx) | Datos de cuenta, contraseña, preferencias de avisos, exportación y eliminación con sesión requerida. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Account` | `2e2bcf6ba2169ad2` |
| [src/app/mi-ficha/page.tsx](../../src/app/mi-ficha/page.tsx) | Creación/reclamación y mantenimiento de ficha propia, disciplinas, combates, resultados y highlights con correo requerido para publicar. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `MyProfile` | `e22cd4ec92743aef` |
| [src/app/mi-ficha/rival/page.tsx](../../src/app/mi-ficha/rival/page.tsx) | Paso de elección entre fichas con nombre coincidente; conserva borrador y permite indicar otra persona sin fusionar homónimos. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `ChooseRival` | `09f5154a2bfdaa78` |
| [src/app/mi-ficha/trayectoria/page.tsx](../../src/app/mi-ficha/trayectoria/page.tsx) | Panel del deportista para declarar y gestionar títulos y ver aura por categoría, revisión y respaldo. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Trajectory` | `fbb52882c0acb448` |
| [src/app/mis-clases/page.tsx](../../src/app/mis-clases/page.tsx) | Panel privado de clases del entrenador, publicación y pausa/activación de ofertas propias. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `MisClases` | `971e219d67a701b7` |
| [src/app/moderacion/acreditaciones/page.tsx](../../src/app/moderacion/acreditaciones/page.tsx) | Cola/gestión moderadora de cuentas autorizadas para respaldar hechos por disciplina. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Accreditations` | `5f00860917fdf65c` |
| [src/app/moderacion/historial/page.tsx](../../src/app/moderacion/historial/page.tsx) | Historial paginado de cambios con acceso restringido a moderación y textos de auditoría. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `History` | `20716c3d16bf232c` |
| [src/app/moderacion/page.tsx](../../src/app/moderacion/page.tsx) | Colas moderadoras de combates, avisos, reclamaciones, organizadores y gimnasios; conserva filtros y contexto después de decidir. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Moderation` | `6ed707e14753f090` |
| [src/app/not-found.tsx](../../src/app/not-found.tsx) | Pantalla en español para recurso no encontrado con destinos válidos de regreso. | [Contexto](MODULOS.md) | `metadata`, `NotFound` | `75e8cb831d346f08` |
| [src/app/organizador/[slug]/page.tsx](../../src/app/organizador/%5Bslug%5D/page.tsx) | Panel de una velada autorizada: cartel, resultados, datos y estado con permisos sobre ese objeto. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `ManageEvent` | `76a7a11be6b3af7d` |
| [src/app/organizador/page.tsx](../../src/app/organizador/page.tsx) | Solicitud o panel de organización según rol/estado; lista veladas propias y ofrece creación autorizada. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Organizer` | `e26349b5b2323b33` |
| [src/app/page.tsx](../../src/app/page.tsx) | Selecciona inicio según sesión, rol y ficha vinculada; no confunde entidad pendiente con organizador aprobado. | [Contexto](FLUJOS.md) | `dynamic`, `Home` | `bc482aeac917b611` |
| [src/app/peleadores/[slug]/page.tsx](../../src/app/peleadores/%5Bslug%5D/page.tsx) | Ficha pública con privacidad, récord, combates, títulos, highlights, seguimiento y aura; diferencia totales de comunidad y categoría. | [Contexto](FLUJOS.md) | `dynamic`, `generateMetadata`, `FighterPage` | `614ae523f1baa45d` |
| [src/app/peleadores/page.tsx](../../src/app/peleadores/page.tsx) | Listado de fichas públicas con filtros, búsqueda y paginación; excluye provisionales/ocultadas. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Fighters` | `aa0c0f8d2697a42a` |
| [src/app/perfiles/[kind]/[id]/editar/page.tsx](../../src/app/perfiles/%5Bkind%5D/%5Bid%5D/editar/page.tsx) | Resuelve tipo/entidad y permiso de edición antes de presentar editor de metadatos, imagen y encuadre. | [Contexto](FLUJOS.md) | `metadata`, `Edit` | `2e0b0f899b8a1fe7` |
| [src/app/privacidad/page.tsx](../../src/app/privacidad/page.tsx) | Explica datos, derechos, contacto y plazos a partir del comportamiento implementado; requiere revisión jurídica antes del servicio real. | [Contexto](FLUJOS.md) | `metadata`, `Privacy` | `20d17c7ac3b72ac9` |
| [src/app/promotores/[id]/page.tsx](../../src/app/promotores/%5Bid%5D/page.tsx) | Perfil público de organizador/promotor, personalización y sus veladas; el perfil no sustituye acreditación de respaldo. | [Contexto](FLUJOS.md) | `dynamic`, `Promoter` | `2b8358d3bd0449b7` |
| [src/app/promotores/page.tsx](../../src/app/promotores/page.tsx) | Directorio público de promotores/organizadores con enlaces a perfiles y veladas. | [Contexto](FLUJOS.md) | `dynamic`, `metadata`, `Promoters` | `73f474b384592f7a` |
| [src/app/ranking/page.tsx](../../src/app/ranking/page.tsx) | Filtros y presentación del ránking de aura por disciplina/nivel/categoría histórica; incluye explicación del reconocimiento. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Ranking` | `7b124180cdc89b2f` |
| [src/app/recuperar/nueva/page.tsx](../../src/app/recuperar/nueva/page.tsx) | Comprueba si enlace de recuperación es usable antes de pedir nueva contraseña; consumirlo se hace en acción POST. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `NewPassword` | `e6f6026e2fad07a3` |
| [src/app/recuperar/page.tsx](../../src/app/recuperar/page.tsx) | Solicita correo para recuperación sin revelar si la cuenta existe; el servidor limita solicitudes. | [Contexto](FLUJOS.md) | `metadata`, `Recover` | `875fd1b9ad7c1f13` |
| [src/app/registro/clase/page.tsx](../../src/app/registro/clase/page.tsx) | Último paso opcional del entrenador: borrador de primera clase que se publica al crear perfil verificado. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `ClaseRegistro` | `933a5ba9e7106f4a` |
| [src/app/registro/ficha/page.tsx](../../src/app/registro/ficha/page.tsx) | Último paso del peleador: disciplina, nivel, categoría y provincia como intención previa a ficha verificada. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `FichaRegistro` | `0c68568c94cf98fb` |
| [src/app/registro/intereses/page.tsx](../../src/app/registro/intereses/page.tsx) | Disciplinas de interés y seguimiento inicial del aficionado; las preferencias ordenan su experiencia. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Intereses` | `1f3afd721d15f96a` |
| [src/app/registro/page.tsx](../../src/app/registro/page.tsx) | Elección de cuatro tipos y alta de datos; cuenta de entidad comienza sin permiso de organización hasta aprobación. | [Contexto](FLUJOS.md) | `metadata`, `Register` | `89cafb585cbf6f45` |
| [src/app/registro/perfil/page.tsx](../../src/app/registro/perfil/page.tsx) | Borrador de perfil de entrenador con disciplinas, gimnasio, experiencia y provincia previo a confirmación de correo. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `PerfilEntrenadorRegistro` | `efb69b5fbefeb058` |
| [src/app/respaldar/page.tsx](../../src/app/respaldar/page.tsx) | Panel de cuenta acreditada/moderación para revisar y respaldar títulos/combates en disciplinas autorizadas. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Backing` | `5c5ac74b978e4e5c` |
| [src/app/robots.ts](../../src/app/robots.ts) | Indica rutas indexables y privadas a buscadores; robots no reemplaza protección de acceso. | [Contexto](MODULOS.md) | `dynamic`, `robots` | `0114034553816bdf` |
| [src/app/salud/route.ts](../../src/app/salud/route.ts) | Responde 200/503 según conexión de base mediante SELECT 1; no es prueba de todas las funciones del producto. | [Contexto](MODULOS.md) | `dynamic`, `GET` | `408edecf494a4fa4` |
| [src/app/siguiendo/page.tsx](../../src/app/siguiendo/page.tsx) | Listado de peleadores seguidos por la cuenta y retirada de seguimiento; explica preferencia de avisos. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Following` | `66dec3ee9c4888d3` |
| [src/app/sitemap.ts](../../src/app/sitemap.ts) | Genera direcciones públicas para buscadores excluyendo fichas no publicables; debe seguir privacidad del directorio. | [Contexto](MODULOS.md) | `dynamic`, `sitemap` | `fa6e2e2d4719c2aa` |
| [src/app/veladas/[slug]/page.tsx](../../src/app/veladas/%5Bslug%5D/page.tsx) | Detalle de velada, fecha/lugar, promotor, entradas y cartel/resultados con estado y respaldo; avisa si datos son no oficiales. | [Contexto](FLUJOS.md) | `dynamic`, `generateMetadata`, `EventPage` | `8ac79eaffa25b6a3` |
| [src/app/veladas/page.tsx](../../src/app/veladas/page.tsx) | Calendario/listado paginado con filtros de fecha, disciplina, provincia y nivel para descubrir veladas. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Events` | `dc12f6777d25d9b5` |
| [src/app/verificar/page.tsx](../../src/app/verificar/page.tsx) | Presenta estado y acciones de confirmación/reenvío de correo; GET no consume el token de verificación. | [Contexto](FLUJOS.md) | `metadata`, `dynamic`, `Verify` | `455f15e796521eeb` |
| [src/instrumentation.ts](../../src/instrumentation.ts) | Ejecuta validación de entorno al iniciar runtime de servidor en producción para detectar configuración imprescindible ausente. | [Contexto](MODULOS.md) | `register` | `a27b7a3d79cd4aee` |
| [src/middleware.ts](../../src/middleware.ts) | Normaliza parámetros repetidos/peligrosos y entradas de URL antes de páginas; las acciones conservan validación y autorización propias. | [Contexto](MODULOS.md) | `limpiarParametros`, `middleware`, `config` | `df84cb4b9f482e02` |
| [src/pages/_error.tsx](../../src/pages/_error.tsx) | Respuesta de error del Pages Router usada por Next.js, manteniendo mensaje y navegación en español aunque el producto use App Router. | [Contexto](MODULOS.md) | — | `2f088d5c9ec6deaa` |

## Pruebas de herramientas

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [tests/documentacion/catalogo.test.mjs](../../tests/documentacion/catalogo.test.mjs) | Prueba el control de cobertura en repositorios temporales: altas/bajas, duplicados, guías, rutas, cambios, estabilidad y escritura solo al generar. | [Contexto](README.md) | — | `fc34ccfb1c94e584` |

## Pruebas de navegador

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [tests/e2e/accesibilidad.mjs](../../tests/e2e/accesibilidad.mjs) | Recorre pantallas por rol con axe y detecta incumplimientos de accesibilidad; no sustituye pruebas con lectores/personas reales. | [Contexto](OPERACION.md) | — | `c6d3475e9ea45a0e` |
| [tests/e2e/acceso.mjs](../../tests/e2e/acceso.mjs) | Recorre guardas y rechazos por sesión/rol y destinos de retorno tras entrar. | [Contexto](OPERACION.md) | — | `3c65e4efa3654f67` |
| [tests/e2e/ayudas.mjs](../../tests/e2e/ayudas.mjs) | Ayudantes del navegador para cuentas, fichas y estado visible; utiliza datos únicos para aislar cada ejecución. | [Contexto](OPERACION.md) | `B`, `rnd`, `MAIL_LOG`, `browser`, `seen`, `check`, `terminarDiagnosticos`, `btn`, `datosDeAlta`, `hoyMadrid`, `enDias`, `registrar`, `link`, `esperarEnlace`, `esperarCorreo`, `hayCorreoPara`, `newUser`, `slugDe`, `sql`, `hacerAdmin`, `solicitarOrganizador`, `anadirAlCartel`, `aprobarOrganizador` | `ab7c1a21dd68d091` |
| [tests/e2e/busqueda.mjs](../../tests/e2e/busqueda.mjs) | Recorre búsqueda global y por entidades, normalización y destinos de resultados. | [Contexto](OPERACION.md) | — | `c1fcc95340ffc87f` |
| [tests/e2e/calendario.mjs](../../tests/e2e/calendario.mjs) | Comprueba filtros/fechas y presentación de veladas según día y estado. | [Contexto](OPERACION.md) | — | `0e7629cd9f2fb3e8` |
| [tests/e2e/categorias.mjs](../../tests/e2e/categorias.mjs) | Recorre divisiones por edad/sexo/nivel y pesos al publicar ficha/combate, preservando categorías históricas. | [Contexto](OPERACION.md) | — | `f99c50991b69297c` |
| [tests/e2e/cuenta.mjs](../../tests/e2e/cuenta.mjs) | Recorre registro, acceso, correo, preferencias, cambio/recuperación, exportación y eliminación de cuenta. | [Contexto](OPERACION.md) | — | `ae762102adcadc1c` |
| [tests/e2e/demo.mjs](../../tests/e2e/demo.mjs) | Comprueba excepciones del modo demo y límites de su activación con datos ficticios. | [Contexto](OPERACION.md) | — | `432721e9d83c085e` |
| [tests/e2e/diseno.mjs](../../tests/e2e/diseno.mjs) | Recorre funciones v3 por tipos de cuenta, perfil de entrenador, clases, privacidad y highlights con acciones reales. | [Contexto](OPERACION.md) | — | `2a59088e80c2cc1e` |
| [tests/e2e/enlaces.mjs](../../tests/e2e/enlaces.mjs) | Audita enlaces/botones por papel y detecta destinos inservibles; considera controles de diálogo. | [Contexto](OPERACION.md) | — | `284955421cbe0994` |
| [tests/e2e/escenarios.mjs](../../tests/e2e/escenarios.mjs) | Recorre guiones completos como distintas personas en móvil emulado, registra capturas y fricciones para revisión visual. | [Contexto](OPERACION.md) | — | `0201c4d2abb1abb5` |
| [tests/e2e/filtros.mjs](../../tests/e2e/filtros.mjs) | Comprueba aplicar/quitar filtros, mantener consulta y paginación en listados. | [Contexto](OPERACION.md) | — | `cbd1314a257cf54d` |
| [tests/e2e/flujo.mjs](../../tests/e2e/flujo.mjs) | Recorre cuentas y combate de extremo a extremo, respuesta del rival, aura y resultados con estados visibles. | [Contexto](OPERACION.md) | — | `fa50e5a28984340f` |
| [tests/e2e/inclusiva.mjs](../../tests/e2e/inclusiva.mjs) | Comprueba cobertura y vocabulario públicos sin priorizar una ciudad o disciplina. | [Contexto](OPERACION.md) | — | `9af8f787ecb24895` |
| [tests/e2e/integridad.mjs](../../tests/e2e/integridad.mjs) | Comprueba coherencia de datos y protección de acciones ante duplicados/operaciones indebidas en flujos reales. | [Contexto](OPERACION.md) | — | `0480ccf3d2c44a09` |
| [tests/e2e/menu.mjs](../../tests/e2e/menu.mjs) | Recorre menú por actividades, destinos y navegación accesible según sesión/rol. | [Contexto](OPERACION.md) | — | `c9a8886ba1239f9d` |
| [tests/e2e/movil.mjs](../../tests/e2e/movil.mjs) | Mide desbordes, tamaño de texto, zonas táctiles y navegación en emulaciones móviles; no acredita iOS/Android físicos. | [Contexto](OPERACION.md) | — | `35b1bdead4dee2f3` |
| [tests/e2e/paneles.mjs](../../tests/e2e/paneles.mjs) | Recorre paneles de organización/moderación, solicitudes y permisos al decidir/publicar. | [Contexto](OPERACION.md) | — | `86a9a7ec91cf477f` |
| [tests/e2e/perfiles.mjs](../../tests/e2e/perfiles.mjs) | Recorre edición de foto/banner, propietarios y visibilidad de perfiles e imágenes. | [Contexto](OPERACION.md) | — | `7d8f5bc067d23e92` |
| [tests/e2e/pulido.mjs](../../tests/e2e/pulido.mjs) | Recorre volumen/paginación de colas y escrituras condicionadas, contexto y opciones desconocidas para reproducir fallos de integridad. | [Contexto](OPERACION.md) | — | `990fa3cefe72ede5` |
| [tests/e2e/respaldo.mjs](../../tests/e2e/respaldo.mjs) | Recorre resultado/evidencia/confirmación y presentación del respaldo de combates. | [Contexto](OPERACION.md) | — | `f19a4893e5d964d5` |
| [tests/e2e/trayectoria.mjs](../../tests/e2e/trayectoria.mjs) | Recorre títulos, revisión, respaldo acreditado y ránking histórico, incluyendo baja/privacidad. | [Contexto](OPERACION.md) | — | `5e871c3c8ee0986c` |
| [tests/e2e/usabilidad.mjs](../../tests/e2e/usabilidad.mjs) | Comprueba mensajes, estados vacíos, retorno y respuestas visibles de acciones; complementa revisión humana de comprensión. | [Contexto](OPERACION.md) | — | `d9e6dc766d658dd9` |

## Pruebas unitarias

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [tests/unit/acciones-ayudantes.test.ts](../../tests/unit/acciones-ayudantes.test.ts) | Comprueba lectura y restricciones de ayudantes de acciones para no publicar utilidades como endpoints. | [Contexto](OPERACION.md) | — | `8cc173dc46d39e24` |
| [tests/unit/arquitectura.test.ts](../../tests/unit/arquitectura.test.ts) | Vigila dominios/importaciones, separación lib/app, directivas y exportaciones de acciones y ausencia de rutas antiguas. | [Contexto](OPERACION.md) | — | `e833d7d7fd1377be` |
| [tests/unit/aura.test.ts](../../tests/unit/aura.test.ts) | Prueba elegibilidad de aura, fechas, resultado, cancelación/revisión y rechazo del voto propio. | [Contexto](OPERACION.md) | — | `70ae15fa58a62678` |
| [tests/unit/autorizacion.test.ts](../../tests/unit/autorizacion.test.ts) | Clasifica cada acción pública según guarda requerida y detecta exportaciones sin clasificación; complementa permisos reales en E2E. | [Contexto](OPERACION.md) | — | `22e955e767a565da` |
| [tests/unit/coherence.test.ts](../../tests/unit/coherence.test.ts) | Prueba señales de proximidad deportiva y excepciones de torneos sin transformarlas en prohibición automática. | [Contexto](OPERACION.md) | — | `dd933f879ffc7dee` |
| [tests/unit/competition.test.ts](../../tests/unit/competition.test.ts) | Prueba divisiones deportivas versionadas y elegibilidad por edad/sexo/nivel. | [Contexto](OPERACION.md) | — | `e1d2f01ec1f811cd` |
| [tests/unit/dates.test.ts](../../tests/unit/dates.test.ts) | Prueba días reales, nacimiento y límites/formatos en zona de Madrid, incluidos casos de calendario. | [Contexto](OPERACION.md) | — | `29571b77ac965826` |
| [tests/unit/disciplines.test.ts](../../tests/unit/disciplines.test.ts) | Prueba catálogos de disciplina/nivel/peso/método y rechazo de elecciones no admitidas. | [Contexto](OPERACION.md) | — | `7a38fb4f2c129b8c` |
| [tests/unit/diseno-v3.test.ts](../../tests/unit/diseno-v3.test.ts) | Prueba reglas incorporadas por v3: tipos/pasos de cuenta, clases, privacidad, highlights y presentación derivada. | [Contexto](OPERACION.md) | — | `b57ea41fc3c9140d` |
| [tests/unit/enlaces-correo.test.ts](../../tests/unit/enlaces-correo.test.ts) | Comprueba rutas y configuración de enlaces generados para correos de acceso/avisos. | [Contexto](OPERACION.md) | — | `436b83b9f91e61db` |
| [tests/unit/env.test.ts](../../tests/unit/env.test.ts) | Prueba validación de entorno y requisitos al arrancar producción sin depender de secretos reales. | [Contexto](OPERACION.md) | — | `d9f1c38d3e8cf086` |
| [tests/unit/labels.test.ts](../../tests/unit/labels.test.ts) | Prueba texto público de enums/resultados y generación de identificadores de nombres. | [Contexto](OPERACION.md) | — | `e6e53128b53d422b` |
| [tests/unit/landing.test.ts](../../tests/unit/landing.test.ts) | Prueba destino tras acceso por papel y mantenimiento de la regla centralizada. | [Contexto](OPERACION.md) | — | `2e7427cd5a5f5d37` |
| [tests/unit/mail.test.ts](../../tests/unit/mail.test.ts) | Prueba modos/resultado del transporte de correo y tratamiento de configuración/errores con simulación. | [Contexto](OPERACION.md) | — | `a4cdeef674c61f25` |
| [tests/unit/messages.test.ts](../../tests/unit/messages.test.ts) | Detecta códigos usados sin traducción pública y mensajes vacíos en acciones/páginas. | [Contexto](OPERACION.md) | — | `9c76888b6e0a13b5` |
| [tests/unit/middleware.test.ts](../../tests/unit/middleware.test.ts) | Prueba limpieza de parámetros duplicados, claves peligrosas y caracteres no admitidos de URL. | [Contexto](OPERACION.md) | — | `d236f1d29fad14c1` |
| [tests/unit/notify.test.ts](../../tests/unit/notify.test.ts) | Prueba selección/agrupación de destinatarios, preferencias y tolerancia a errores de avisos mediante dobles de dependencias. | [Contexto](OPERACION.md) | — | `1e3043f730954aa1` |
| [tests/unit/pagination.test.ts](../../tests/unit/pagination.test.ts) | Prueba número de página y ventanas acotadas ante valores vacíos, enormes o inválidos. | [Contexto](OPERACION.md) | — | `9ba298ae5266b031` |
| [tests/unit/password.test.ts](../../tests/unit/password.test.ts) | Prueba scrypt, hashes antiguos, comprobación y refuerzo de parámetros sin convertirlos en texto público. | [Contexto](OPERACION.md) | — | `62c924cb40f6b0a2` |
| [tests/unit/paths.test.ts](../../tests/unit/paths.test.ts) | Prueba retorno interno y rechaza URLs/variantes que redirigirían fuera de la aplicación. | [Contexto](OPERACION.md) | — | `68a087a0f00b8da8` |
| [tests/unit/prior.test.ts](../../tests/unit/prior.test.ts) | Prueba total/detalle del récord anterior, campos vacíos, sumas incoherentes y límites. | [Contexto](OPERACION.md) | — | `f002f60d028aa4e2` |
| [tests/unit/profiles.test.ts](../../tests/unit/profiles.test.ts) | Prueba tipos de perfil, permiso de edición y validación de posiciones/imágenes. | [Contexto](OPERACION.md) | — | `9f2a94ca96039e01` |
| [tests/unit/ranking-trayectoria.test.ts](../../tests/unit/ranking-trayectoria.test.ts) | Prueba combinación histórica de trayectoria/respaldo/comunidad, categorías, filtros y empates del ránking. | [Contexto](OPERACION.md) | — | `356863f2aac087da` |
| [tests/unit/ratelimit.test.ts](../../tests/unit/ratelimit.test.ts) | Prueba límites, reserva concurrente y selección de IP de proxy de confianza mediante dependencias simuladas. | [Contexto](OPERACION.md) | — | `5191cd9e463123a9` |
| [tests/unit/record.test.ts](../../tests/unit/record.test.ts) | Prueba cálculo de récord por disciplina/nivel, perspectiva de esquinas, exclusiones y antecedentes detallados. | [Contexto](OPERACION.md) | — | `af0613051e0029b7` |
| [tests/unit/recuperar.test.ts](../../tests/unit/recuperar.test.ts) | Prueba lógica de enlaces de recuperación, consumo y comportamiento de acceso asociado mediante simulación. | [Contexto](OPERACION.md) | — | `e1c507f7028d84a3` |
| [tests/unit/rules.test.ts](../../tests/unit/rules.test.ts) | Prueba resultado/método válido por disciplina y claves/versiones de enfrentamiento. | [Contexto](OPERACION.md) | — | `7c31b910d3149e6e` |
| [tests/unit/safe.test.ts](../../tests/unit/safe.test.ts) | Prueba claves propias y parámetros únicos frente a propiedades heredadas y opciones desconocidas. | [Contexto](OPERACION.md) | — | `798c0a561ac3ff9e` |
| [tests/unit/search.test.ts](../../tests/unit/search.test.ts) | Prueba interpretación de palabras y construcción parametrizada de búsqueda sin tildes/mayúsculas. | [Contexto](OPERACION.md) | — | `5f40a0d0ef9c1386` |
| [tests/unit/trayectoria.test.ts](../../tests/unit/trayectoria.test.ts) | Prueba escala de títulos/respaldo, acreditación efectiva, retirada/exclusión y mayor aporte por categoría. | [Contexto](OPERACION.md) | — | `e8a6ce794027fc85` |
| [tests/unit/url.test.ts](../../tests/unit/url.test.ts) | Prueba normalización de evidencia HTTP(S) y rechazo de esquemas peligrosos o enlaces malformados. | [Contexto](OPERACION.md) | — | `b9e1712127dc7fa7` |

## Scripts de mantenimiento

| Archivo | Responsabilidad | Guía | Declaraciones directas | SHA-256 |
|---|---|---|---|---|
| [scripts/arranque-demo.sh](../../scripts/arranque-demo.sh) | Arranca el despliegue de demostración aplicando su preparación de base y servidor; leer alcance antes de usar fuera de demo. | [Contexto](OPERACION.md) | — | `d04ddc73375eeef3` |
| [scripts/corregir-escalera.sh](../../scripts/corregir-escalera.sh) | Herramienta del líder para corregir entregas de examen; usa instrucciones/clave aisladas y no verifica el runtime del producto. | [Contexto](OPERACION.md) | — | `f39d6ef23d821f8a` |
| [scripts/demo.sh](../../scripts/demo.sh) | Prepara/prueba una demostración local con base ficticia y comprobaciones de entorno. | [Contexto](OPERACION.md) | — | `3b95280daab25f98` |
| [scripts/entorno-aislado.sh](../../scripts/entorno-aislado.sh) | Gestiona base y servidor propios por nombre/puerto para que asistentes no compartan datos de pruebas. | [Contexto](OPERACION.md) | — | `c756a17c44986e70` |
| [scripts/generar-catalogo.mjs](../../scripts/generar-catalogo.mjs) | Contrasta cada archivo mantenido con explicación individual y guía, genera índice determinista con huellas y rechaza cobertura/salida desactualizada. | [Contexto](README.md) | `MANIFEST`, `OUTPUT`, `maintainedFiles`, `validateCatalog`, `renderCatalog`, `run` | `a683bdcb2c928fd6` |
| [scripts/generar-mapa.mjs](../../scripts/generar-mapa.mjs) | Analiza TypeScript y schema para generar mapa de pantallas, acciones, guardas y tablas; comprueba que salida esté actualizada. | [Contexto](OPERACION.md) | — | `c9fceeae2a0cd69d` |
| [scripts/vitest.escalera.config.mts](../../scripts/vitest.escalera.config.mts) | Configuración unitaria separada para retos de ingreso; no forma parte de la batería funcional de la aplicación. | [Contexto](OPERACION.md) | — | `8befcd84acf5599a` |
