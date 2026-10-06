# Plan maestro del proyecto

**Autor:** Claude (líder técnico, por decisión del fundador el 6 de octubre de 2026 — ver [`decisiones/ADR-001-gobierno-del-equipo.md`](decisiones/ADR-001-gobierno-del-equipo.md)). **Se discute con propuestas** ([`decisiones/README.md`](decisiones/README.md)); **lo decide el fundador** en lo que le corresponde. Reparto del equipo y flujo de trabajo: [`EQUIPO.md`](EQUIPO.md). Fichas de tarea: [`tareas/`](tareas/).

## Qué estamos construyendo

La comunidad española de deportes de contacto (boxeo, MMA, Muay Thai, kickboxing, K-1 y jiu-jitsu; amateur y profesional; toda España): fichas y récords de peleadores, veladas, gimnasios, entrenadores, promotoras y federaciones, y el **aura** como reconocimiento de la comunidad. **Uso principal: móvil (iOS y Android)** y, después, App Store y Google Play. Reglas del fundador en `CLAUDE.md` (intuitiva para todos, español sin jerga, cero enlaces muertos, honestidad con los datos, diseño visual al final).

## Principios de arquitectura (y por qué)

1. **Monolito modular**: Next.js 15 + TypeScript + PostgreSQL + Prisma, tal como está (`src/app` pantallas y acciones, `src/lib/<dominio>` lógica, reglas de dependencia comprobadas por `tests/unit/arquitectura.test.ts`). Con el volumen esperable (miles a decenas de miles de usuarios) no hacen falta microservicios: serían complejidad sin beneficio. Se escala por capas (caché, CDN, base gestionada, réplicas de lectura), no reescribiendo.
2. **La base de datos guarda datos, no archivos**: las fotos y banners salen de PostgreSQL a un almacenamiento de objetos con CDN (T-004). Migraciones **aditivas** siempre; nunca se edita una migración integrada.
3. **Lectura pública barata**: casi todo lo que se ve sin cuenta (fichas, ránking, calendario, gimnasios) cambia poco: las consultas pesadas se cachean por etiquetas (`unstable_cache` + `revalidateTag` al escribir) y las imágenes llevan caché larga (T-005). Las partes por usuario siguen dinámicas.
4. **Escritura segura**: acciones de servidor con guardas de permisos clasificadas y probadas (`autorizacion.test.ts`), idempotentes, condicionadas al estado leído. Tareas lentas (correos) salen de la petición por una cola (T-008).
5. **Medir antes de optimizar**: prueba de carga (k6) con presupuesto de rendimiento (T-007), `EXPLAIN` de las consultas de listados (T-006) y observabilidad real (T-010).
6. **Móvil primero**: web adaptable → PWA instalable (T-003) → envoltorio nativo (Capacitor) para las tiendas. Se mide en CI con `movil.mjs` y se revisa con `escenarios.mjs`.
7. **Pruebas por capas**: unitarias (reglas), escenarios por persona (recorridos reales, con capturas), auditorías automáticas (`enlaces`, `movil`, axe), carga. Nada «hecho» sin que funcione de punta a punta como cada papel.
8. **Producción distinta de demo**: la demo (`render.yaml`, `DEMO_MODE=si`) es un andamio. La producción exige decisiones del fundador (alojamiento, correo, dominio, privacidad, menores).

## Fases (orden de ejecución)

| Fase | Objetivo | Tareas | Estado |
|---|---|---|---|
| **F0** | Base funcional, categorías de peso, perfiles, trayectoria y aura | (hecho; ver `DIARIO.md`) | ✔ |
| **F1** | **Móvil y pulido funcional** | T-001 ✔, T-002 ✔, T-011 ✔ (hechas por Claude el 6 oct), T-009, T-013 | casi completa: queda T-009 y las dos pruebas de ingreso ([1](PRUEBA-DE-INGRESO.md) y [2, «la escalera»](PRUEBA-ESCALERA.md)) |
| **F2** | **Escalabilidad** (un paso antes del diseño) | T-004, T-005, T-006, T-007, T-008, T-010, T-012 | planificada |
| **F3** | PWA y camino a las tiendas | T-003 (y envoltorio, ver `MOVIL.md`) | planificada |
| **F4** | Diseño visual «D» (maqueta de Antigravity elegida por el fundador, 6 oct) | T-015 a T-017 y T-019 a T-022 | sistema de diseño y fichas listas ([`diseno/SISTEMA-D.md`](diseno/SISTEMA-D.md)); falta aprobar el [ADR-004](decisiones/ADR-004-animacion-gsap-lenis.md) |
| **F5** | Preparación del lanzamiento | decisiones del fundador (menores, privacidad, correo, dominio); pruebas con personas reales; dispositivos reales | pendiente de decisiones |

Dependencias: T-004, T-005 y T-006 pueden hacerse en paralelo; T-007 (carga) se ejecuta **antes y después** para demostrar la mejora; T-012 depende de elegir proveedor (decisión del fundador); T-003 no depende de F2.

## Índice de tareas

| Ficha | Título | Fase | Nivel | Sugerida a | Bloqueo |
|---|---|---|---|---|---|
| [T-001](tareas/T-001-conciliar-movil-pr13.md) | Conciliar la PR #13 (móvil) con el menú actual | F1 | N3 | ✔ hecha (Claude, 6 oct) | — |
| [T-002](tareas/T-002-dependabot-y-prs.md) | Dependabot sin saltos mayores y limpieza de PRs | F1 | N1 | ✔ hecha (Claude, 6 oct) | — |
| [T-003](tareas/T-003-pwa.md) | Web instalable (PWA) | F3 | N2 | Antigravity (prueba de ingreso 2) o Codex | — |
| [T-004](tareas/T-004-imagenes-fuera-de-la-base.md) | Imágenes fuera de PostgreSQL | F2 | N3 | Codex | proveedor y credenciales (fundador) para la parte S3 |
| [T-005](tareas/T-005-cache-de-lecturas-publicas.md) | Caché de lecturas públicas | F2 | N3 | Codex | — |
| [T-006](tareas/T-006-indices-y-consultas.md) | Índices y consultas de listados | F2 | N3 | Codex si dispone de PostgreSQL local; si no, Claude | necesita PostgreSQL local |
| [T-007](tareas/T-007-prueba-de-carga.md) | Prueba de carga (k6) y presupuesto | F2 | N2 | Antigravity (puede ejecutar el servidor) o Copilot | necesita ejecutar el servidor |
| [T-008](tareas/T-008-cola-de-correos.md) | Cola de correos | F2 | N3 | Codex | proveedor de correo (fundador) para el envío real |
| [T-009](tareas/T-009-ampliar-escenarios.md) | Ampliar los escenarios por persona | F1 | N2 | Antigravity o Copilot (prueba de ingreso 2) | — |
| [T-010](tareas/T-010-observabilidad.md) | Observabilidad: registros, errores y salud | F2 | N2 | Copilot o Antigravity | herramienta de errores (fundador) |
| [T-011](tareas/T-011-registro-por-paneles.md) | Registro y acceso por tres paneles (A/B/C) | F1 | N3 | ✔ hecha (Claude, 6 oct) | — |
| [T-014](tareas/T-014-politica-de-menores.md) | Política de menores en la aplicación | F2 | N3 | Codex | respuestas del fundador (ADR-003) |
| [T-013](tareas/T-013-enlaces-externos-avisan.md) | Todo enlace que abre otra pestaña lo avisa | F1 | N1 | Antigravity, Copilot y Open Code, cada uno en su rama (prueba de ingreso 1, ver `RANGOS.md`) | — |
| [T-012](tareas/T-012-base-de-datos-gestionada.md) | Base de datos gestionada, copias y restauración | F2 | N2 | fundador + Claude | proveedor (fundador) |
| [T-015](tareas/T-015-motor-de-temas-por-deporte.md) | Motor de deporte activo (cookie, selector, textos por deporte) | F4 | N3 | Codex | — (lista) |
| [T-016](tareas/T-016-kit-de-interfaz-d.md) | Kit de interfaz «D» (variables y componentes accesibles) | F4 | N3 | Codex | T-015; movimiento: ADR-004 |
| [T-017](tareas/T-017-ficha-de-peleador-d.md) | Ficha de peleador con el diseño «D» | F4 | N3 | Codex | T-015, T-016 |
| [T-019](tareas/T-019-portada-d.md) | Portada con el diseño «D» | F4 | N3 | Codex | T-015, T-016 |
| [T-020](tareas/T-020-listados-d.md) | Listados con el diseño «D» | F4 | N3 | Codex | T-015, T-016 |
| [T-021](tareas/T-021-formularios-y-cuenta-d.md) | Formularios y cuenta con el diseño «D» | F4 | N3 | Codex | T-015, T-016 |
| [T-022](tareas/T-022-velada-y-estados-d.md) | Ficha de velada y estados con el diseño «D» | F4 | N3 | Codex | T-015, T-016 |

«Sugerida a» sigue el orden de rangos de [`RANGOS.md`](RANGOS.md) (Codex rango 2 con evidencia; Antigravity, Copilot y Open Code en periodo de prueba y sin ordenar). **Se ajusta cuando cada asistente declare qué puede ejecutar** (ver `EQUIPO.md`). El fundador puede dar cualquier ficha a cualquiera.

## Definición de «hecho» (para cualquier tarea)

Ficha cumplida punto por punto + criterios de aceptación verificados + CI en verde + registro del asistente actualizado + revisión de Claude aprobada (`REVISION.md`). Si algo de la ficha no se puede cumplir, se **para y se pregunta** (RFC o comentario en el PR); no se improvisa.

## Decisiones del fundador que bloquean fases

**Proveedores y menores (6 oct 2026): hay una propuesta completa y de coste casi cero en [ADR-003](decisiones/ADR-003-proveedores-fase-0.md); falta que el fundador la apruebe y que se verifiquen los precios.** Lo que sigue es la lista general:

Alojamiento y proveedor de base de datos, almacenamiento de imágenes, proveedor de correo, herramienta de errores, dominio, política de menores, responsable del tratamiento de datos y correo de contacto, sexo/edad en la ficha, calibración del aura, camino hacia las tiendas. Lista viva en `TRASLADO.md` §7 y `PULIDO-FUNCIONAL.md`.
