# Cobertura de Lona frente a la lista de conceptos de ingeniería de software (16-10-2026)

> **Petición del fundador:** «Asegúrate de que la aplicación tiene cubierto esto, cuáles nos afectan y cuáles no» (imagen con unos 120 conceptos de ingeniería de backend y de operación).
> **Cómo se ha hecho:** cada concepto se ha contrastado con el código y los documentos del repositorio (rama de la 0.20.0). Lo que depende de servicios externos que aún no están montados figura como **pendiente de producción**, no como cubierto. Lo que no he podido comprobar figura como **no verificado**.
> Lona es hoy **una sola aplicación (Next.js) con una sola base PostgreSQL**, sin usuarios reales todavía. Muchos conceptos de la lista son de sistemas distribuidos de gran escala y **no nos afectan** a esta escala; lo que sí nos afecta es seguridad, datos, coste y operación.

**Leyenda:** ✔ cubierto · ◐ cubierto en parte · ⏳ pendiente de producción (planificado, aún sin montar) · ✖ no aplica (con el motivo) · ❓ no verificado

## 1. Resumen

- **Cubiertos (✔) o en parte (◐): 47.** Casi todo lo que decide la seguridad de los datos: límites de frecuencia, bloqueos contra carreras, inyección SQL, XSS, CSRF, sesiones, contraseñas, migraciones, copias, CI/CD, versionado, dependencias.
- **Pendientes de producción (⏳): 11.** Cloudflare (caché, WAF y protección DDoS), tope de gasto, alertas y vigilancia, dominio propio, copias con restauración probada.
- **No aplican (✖): 43.** Son de microservicios, mensajería distribuida, multi-región o tiempo real; con una sola aplicación y una sola base serían complejidad sin beneficio.
- **Lo accionable de verdad (cuatro cosas):** (1) caché de las imágenes públicas, (2) tope duro de instancias y de gasto antes de abrir al público, (3) probar la restauración de una copia, (4) procedimiento escrito para volver atrás una migración.

## 2. Detalle

### Tráfico, red y entrega
| Concepto | Estado | En Lona |
|---|---|---|
| Rate Limiting | ✔ | Tabla `RateHit` para registro, recuperación, reenvío, Google, entradas, propuestas, inscripciones, solicitudes y fallos; tope diario de correos. |
| Caching, Cache Invalidation | ◐ | El cartel se sirve con caché pública de un año y versión en la dirección. Las fotos de peleadores, banners y vídeos van con `private, no-cache`: se vuelven a descargar en cada vista. **Mejora pendiente.** |
| CDN, Edge Caching | ⏳ | Cloudflare delante de la app, previsto para producción (R2 ya guarda fotos y copias). |
| Load Balancing, Autoscaling, Horizontal/Vertical Scaling | ◐ | La app no guarda estado en memoria (sesiones y límites van a la base), así que puede repartirse en varias instancias. El reparto y el escalado los pone la plataforma (Render, Cloud Run); falta **fijar el tope máximo de instancias**. |
| Reverse Proxies | ✔ | `TRUSTED_PROXY_HOPS` lee la dirección que añade el proxy de confianza, no la que escribe el cliente (prueba `tests/unit/ratelimit.test.ts`). |
| HTTP/2 y HTTP/3, TLS, Encryption in Transit | ✔ | Los pone la plataforma; la app añade HSTS de dos años y `X-Frame-Options: DENY`. |
| DNS | ⏳ | `lonaclub.es` está comprado (Infomaniak); falta apuntarlo a la producción (F4). |
| WAF, DDoS Protection | ⏳ | Cloudflare. Hoy la demo en Render no tiene protección propia. |
| CORS | ✔ | La app no abre ningún origen ajeno (no hay cabeceras CORS): es lo correcto por defecto. |
| API Gateways, Service Discovery, gRPC, API Versioning | ✖ | No hay API pública ni servicios separados. |
| TCP vs UDP, Network Partitions | ✖ | Los resuelve la plataforma; una región, una base. |
| WebSockets, Long Polling, Server-Sent Events | ✖ | Los avisos se leen al cargar la pantalla; nada necesita tiempo real. |
| Webhooks | ✖ | Ninguno, ni de entrada ni de salida (el Bizum es manual y Lona no toca el dinero). |

### Fiabilidad y datos
| Concepto | Estado | En Lona |
|---|---|---|
| Timeouts | ✔ | Las llamadas externas (R2, Google, noticias, geocodificación) llevan tiempo máximo. |
| Retries, Exponential Backoff | ✔ | La cola de correo reintenta a 1 min, 5 min, 30 min, 2 h y 12 h, con un máximo de 6 intentos. |
| Message Queues | ✔ | `EmailOutbox` en la propia base de datos; no hace falta un servidor de mensajes. |
| Dead Letter Queues | ◐ | Un correo que agota sus intentos queda como `FAILED`, se cuenta en `/salud` y se anota en «Fallos». No hay botón para reprocesarlo. |
| Idempotency | ◐ | Las notificaciones llevan clave única (por ejemplo `ticket:<id>`), las decisiones de moderación comprueban el estado anterior (`solicitud_cambiada`) y solo se admite una reserva activa por persona y velada. Los envíos de correo no tienen clave de idempotencia: ❓. |
| Race Conditions, Pessimistic Locking | ✔ | `SELECT … FOR UPDATE` en combates y trayectoria; `withLock("entradas:<velada>")` en las reservas, con la comprobación de aforo y de reserva única dentro del bloqueo. |
| Optimistic Locking | ◐ | `updateMany` condicionado al estado anterior en cancelaciones y gestión de reservas. |
| Deadlocks | ❓ | Los bloqueos son por un único recurso cada vez; sin prueba específica. |
| Cron Jobs | ✔ | Flujos programados de GitHub: copia diaria (02:30), noticias cada 6 h y mantener despierta la demo cada 10 min. |
| Database Migrations, Schema Versioning | ✔ | Prisma Migrate con fecha; el CI aplica las migraciones a una base vacía y comprueba que reproducen exactamente el esquema. |
| Rollbacks | ◐ | Volver al código anterior es fácil (git y redespliegue). **No hay procedimiento escrito para revertir una migración.** |
| Backups, Disaster Recovery | ⏳ | `copia-diaria.yml` vuelca la base con `pg_dump` a un cubo R2 de la UE con 30 días de retención, pero depende de los secretos de la producción real y **la restauración no está probada** (condición de lanzamiento nº 2). |
| Replication, Read Replicas, Sharding, Partitioning, Leader Election, CAP, Eventual Consistency | ✖ | Una sola base PostgreSQL gestionada; a esta escala no hace falta. |
| Distributed Locks, Distributed Transactions, Saga, Pub/Sub, Event-Driven | ✖ | No hay varios servicios que coordinar: bastan el bloqueo y la transacción de la propia base. |
| Failover, Multi-Region, Chaos Engineering | ✖ | Una región; un fallo se resuelve restaurando la copia. Se revisará si Lona crece. |
| Connection Pooling | ✔ | Conexión «pooled» de Neon (`DATABASE_URL` agrupada) en demo y producción. |
| Database Indexing | ✔ | 87 índices y claves únicas en `prisma/schema.prisma`; las reservas llevan índices por velada/estado y por persona/fecha. |
| Query Optimization, N+1 Queries | ◐ | Las consultas usan `select`/`include` acotados y paginación; no hay medición automática de consultas lentas ❓. |
| Clock Skew | ✔ | Los plazos (señal de 24 h, cierre 3 h antes) se calculan con la hora del servidor en zona Europe/Madrid, no con la del navegador. |
| Memory Leaks, Garbage Collection, Thread Safety | ✖ | Node gestiona la memoria y ejecuta el código de la app en un solo hilo; las instancias son reiniciables. Sin medición de memoria ❓. |
| Backpressure | ◐ | Límites de frecuencia, tope de correos y límite de 9 MB en las acciones de servidor; no hay cola de peticiones. |

### Despliegue y operación
| Concepto | Estado | En Lona |
|---|---|---|
| CI/CD | ✔ | GitHub Actions: tipos, pruebas, catálogo, mapa, recorridos de navegador, accesibilidad; etiqueta de versión al fusionar; flujo de despliegue a Cloud Run. |
| Docker | ✔ | `Dockerfile` en varias etapas, con usuario sin privilegios (`lona`). |
| Kubernetes, Helm Charts, Terraform | ✖ | Cloud Run/Render, sin clústeres. |
| Infrastructure as Code | ◐ | `render.yaml`, `Dockerfile` y los flujos de GitHub; sin Terraform. |
| Build Caching | ✔ | El CI cachea npm; el Dockerfile separa dependencias y compilación. |
| Blue-Green, Canary | ✖ | Con pocas personas usuarias no compensa; se despliega en caliente. |
| Rolling Deployments | ✔ | Los hace la plataforma. |
| Feature Flags | ◐ | Variables de entorno (`DEMO_MODE`, `NEWS_FETCH`, `EXPERIENCE_LAB`) y banderas por velada (venta de entradas abierta/cerrada). No hay un sistema general y hoy no hace falta. |
| Health Checks, Liveness y Readiness Probes | ✔ | `/salud` responde 200 o 503 según la base de datos e informa de la cola de correo; la plataforma lo consulta. |
| Monitoring, Logging, Metrics, Observability | ◐ | Registro por salida estándar, tabla de «Fallos», módulo propio de Sentry y `/salud` con el tiempo de la base. **Falta** Sentry real y UptimeRobot (F6). |
| Alerting | ⏳ | F6 (Sentry y vigilancia de disponibilidad). |
| Distributed Tracing, SLOs, SLIs, Error Budgets | ✖ | Sin servicios distribuidos ni usuarios reales aún; se definirán al lanzar. |
| Latency, Throughput, P99 Latency, Tail Latency | ✖ | Sin carga real que medir todavía. |
| Cold Starts, Serverless Limits | ⏳ | La demo gratuita de Render se duerme (mitigado con un aviso cada 10 min); en Cloud Run hay que decidir instancias mínimas, tiempo máximo y concurrencia. |
| Cost Optimization | ◐ | Todo en planes gratuitos, tope diario de correos, R2 sin coste de salida. **Falta el tope duro de gasto** (una alerta no frena nada). |
| Production Incidents, Postmortems | ✔ | `docs/LECCIONES.md` recoge cada incidente con su causa y su arreglo. |
| On-call | ✖ | Equipo de una persona; sustituido por alertas (F6). |
| Semantic Versioning | ✔ | `VERSIONES.md` y `CHANGELOG.md`; el CI exige subir la versión en cada PR. |
| Dependency Hell | ✔ | `package-lock.json`, `npm ci` y Dependabot. |

### Seguridad
| Concepto | Estado | En Lona |
|---|---|---|
| SQL Injection | ✔ | Prisma con parámetros; las únicas consultas crudas son plantillas etiquetadas (`$queryRaw` con `${}`), que también se parametrizan. |
| XSS | ✔ | React escapa el texto; el único `dangerouslySetInnerHTML` inyecta una constante propia (el tema inicial); hay política de contenido (CSP) en producción. |
| CSRF | ✔ | Las acciones de servidor de Next.js comprueban el origen; la cookie de sesión es `SameSite=Lax`. |
| SSRF | ✔ | El servidor solo llama a direcciones fijas (Google, Resend, R2, geocodificación, Gemini) y la lista de fuentes de noticias está en el código, con tamaño máximo; ninguna dirección viene de lo que escribe una persona. |
| Secrets Management | ✔ | Variables de entorno (`sync: false` en Render, Secret Manager previsto en Cloud Run); nada en el repositorio. |
| IAM | ◐ | Roles de la app (persona, organizadora, moderación, creador). Los permisos mínimos de las cuentas de nube se fijarán al montar la producción. |
| OAuth | ✔ | Acceso con Google pidiendo solo nombre y correo (pendiente: publicar la app de Google). |
| JWT Rotation | ✖ | No se usan JWT: la sesión es un token aleatorio de 30 días, guardado en la base como SHA-256, en cookie `httpOnly` y `secure`. |
| Encryption at Rest | ◐ | La cifran Neon y R2; las contraseñas se guardan con scrypt y sal propia. |

## 3. Lo que hay que hacer (por orden)
1. **Antes de abrir al público:** tope duro de instancias y de gasto en Cloud Run, Cloudflare delante (caché, WAF, DDoS) y alertas (F4 y F6).
2. **Antes del 1 de noviembre:** probar la restauración de una copia de la base (condición de lanzamiento nº 2).
3. **Mejora de código, pequeña:** caché con validación (`ETag`) para las imágenes públicas que hoy van con `no-cache`.
4. **Documentar:** cómo se revierte una migración (regla propuesta: migraciones solo aditivas y, si hay que quitar algo, en dos pasos).
5. **Medir cuando haya usuarios:** tiempos por pantalla, consultas lentas y memoria (hoy no se miden).
