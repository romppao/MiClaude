# Instrucciones para asistentes de código (Codex, Copilot, Open Code, Antigravity y otros)

**Mantenibilidad y transferencia a programadores humanos (petición expresa del fundador, 8 oct 2026):** todo archivo mantenido debe tener responsabilidad explicada y contexto, y cada cambio debe conservar contratos, flujos y motivos de decisión. Lee [docs/mantenimiento/README.md](docs/mantenimiento/README.md). Actualiza `docs/catalogo-codigo.json`, las guías y comentarios necesarios; ejecuta `node scripts/generar-catalogo.mjs` y su comprobación antes del PR. La cobertura automática no sustituye revisión humana. No dar por documentado o escalable un comportamiento que no se ha comprobado.

Este repositorio lo desarrolla un equipo de varios asistentes coordinados por el fundador. **Las reglas del proyecto y del fundador están en [`CLAUDE.md`](CLAUDE.md) y valen para todos**, aunque el fichero lleve ese nombre.

Antes de cambiar nada, lee **[`docs/EQUIPO.md`](docs/EQUIPO.md)** (protocolo de colaboración, ramas, documentación obligatoria y plantilla de relevo) y los registros de los demás asistentes (`docs/APORTACIONES-*.md`). Registra tu trabajo en tu propio `docs/APORTACIONES-<NOMBRE>.md`.

**Reparto (decisión del fundador, 6 de octubre de 2026):** Claude es el líder técnico: define el plan ([`docs/PLAN.md`](docs/PLAN.md)) y escribe las fichas de tarea ([`docs/tareas/`](docs/tareas/)). **Tú ejecutas la ficha que te den, al pie de la letra**, en tu rama y con tu PR (Claude lo revisa con [`docs/REVISION.md`](docs/REVISION.md)). Si crees que hay una forma mejor, **no la improvises**: abre una propuesta con evidencia en [`docs/decisiones/`](docs/decisiones/README.md). Si la ficha no se puede cumplir, para y avisa en el PR.

**Si es tu primera vez en este proyecto, haz primero la prueba de ingreso: [`docs/PRUEBA-DE-INGRESO.md`](docs/PRUEBA-DE-INGRESO.md)** (es la primera toma de contacto con el líder técnico) y después [`docs/PRUEBA-ESCALERA.md`](docs/PRUEBA-ESCALERA.md) (retos con corrección automática; no leas la rama `claude/clave-escalera`).

Prioridad vigente: **móvil primero** (iOS y Android; objetivo: App Store y Google Play) — ver [`docs/MOVIL.md`](docs/MOVIL.md). Todo en español. Nada de enlaces o botones muertos.

**Proveedores y costes:** no contrates ni cambies proveedores (base de datos, almacenamiento, correo, errores, alojamiento) sin una propuesta aprobada por el fundador; las vigentes están en [`docs/decisiones/ADR-003-proveedores-fase-0.md`](docs/decisiones/ADR-003-proveedores-fase-0.md). Principio del fundador: mínimo coste al empezar, escalable y fácil de cambiar. No escribas precios sin haberlos leído en la página oficial.
