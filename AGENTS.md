# Instrucciones para asistentes de código (Codex, Copilot, Open Code, Antigravity y otros)

**Mantenibilidad y transferencia a programadores humanos (petición expresa del fundador, 8 oct 2026):** todo archivo mantenido debe tener responsabilidad explicada y contexto, y cada cambio debe conservar contratos, flujos y motivos de decisión. Lee [docs/mantenimiento/README.md](docs/mantenimiento/README.md). Actualiza `docs/catalogo-codigo.json`, las guías y comentarios necesarios; ejecuta `node scripts/generar-catalogo.mjs` y su comprobación antes del PR. La cobertura automática no sustituye revisión humana. No dar por documentado o escalable un comportamiento que no se ha comprobado.

Este repositorio lo desarrolla un equipo de varios asistentes coordinados por el fundador. **Las reglas del proyecto y del fundador están en [`CLAUDE.md`](CLAUDE.md) y valen para todos**, aunque el fichero lleve ese nombre.

**Lo primero, siempre (14 oct 2026):** `git fetch`, `node scripts/estado.mjs` y leer **[`docs/ESTADO.md`](docs/ESTADO.md)** (cómo está todo ahora, qué está reservado, qué ha dicho ya el fundador). Los asistentes no se pueden hablar entre sí: el repositorio es el único canal. Para un trabajo grande, reserva antes con `node scripts/estado.mjs reservar <asistente> "<tema>"`; al terminar, actualiza tu fila de `ESTADO.md` en tu PR.

Antes de cambiar nada, lee **[`docs/EQUIPO.md`](docs/EQUIPO.md)** (protocolo de colaboración, ramas, documentación obligatoria y plantilla de relevo) y los registros de los demás asistentes (`docs/APORTACIONES-*.md`). Registra tu trabajo en tu propio `docs/APORTACIONES-<NOMBRE>.md`.

**Reparto (decisión del fundador, 6 de octubre de 2026):** Claude es el líder técnico: define el plan ([`docs/PLAN.md`](docs/PLAN.md)) y escribe las fichas de tarea ([`docs/tareas/`](docs/tareas/)). **Tú ejecutas la ficha que te den, al pie de la letra**, en tu rama y con tu PR (Claude lo revisa con [`docs/REVISION.md`](docs/REVISION.md)). Si crees que hay una forma mejor, **no la improvises**: abre una propuesta con evidencia en [`docs/decisiones/`](docs/decisiones/README.md). Si la ficha no se puede cumplir, para y avisa en el PR.

**Si es tu primera vez en este proyecto, haz primero la prueba de ingreso: [`docs/PRUEBA-DE-INGRESO.md`](docs/PRUEBA-DE-INGRESO.md)** (es la primera toma de contacto con el líder técnico) y después [`docs/PRUEBA-ESCALERA.md`](docs/PRUEBA-ESCALERA.md) (retos con corrección automática; no leas la rama `claude/clave-escalera`).

Prioridad vigente: **móvil primero** (iOS y Android; objetivo: App Store y Google Play) — ver [`docs/MOVIL.md`](docs/MOVIL.md). Todo en español. Nada de enlaces o botones muertos.

**Proveedores y costes:** no contrates ni cambies proveedores (base de datos, almacenamiento, correo, errores, alojamiento) sin una propuesta aprobada por el fundador; las vigentes están en [`docs/decisiones/ADR-003-proveedores-fase-0.md`](docs/decisiones/ADR-003-proveedores-fase-0.md). Principio del fundador: mínimo coste al empezar, escalable y fácil de cambiar. No escribas precios sin haberlos leído en la página oficial.

**Uso proporcional de modelos (petición del fundador, 14 oct 2026):** el razonamiento alto gasta muchos créditos y tiempo.
- **Por defecto:** esfuerzo medio.
- **Alto, solo para:** seguridad y permisos, fallos difíciles, migraciones y arquitectura.
- **Modelo económico o esfuerzo bajo para lo sencillo:** documentación, CHANGELOG, DIARIO, catálogo, textos y arreglos de una línea. Si estás en alto, dilo y sugiere al fundador bajarlo en el selector.
- **Pruebas:** la batería completa (e2e, catálogo, mapa) una vez antes del PR, no en cada paso.
- **Lectura:** no releas documentos largos ya leídos en la misma tarea.
