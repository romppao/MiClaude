# Bloque G — Codex

Objetivo: G1–G6 del encargo de paneles. Base: F 0.13.2. Rama: codex/paneles-g-madrid.

## 2026-10-14 — Bloque G de paneles
Implementa G1–G6 sobre F actualizado: provincia opcional, actividad local, Voy a ir, ICS, agenda, disponibilidad con filtros y caducidad, agenda del entrenador y preparación de veladas. Migración solo aditiva. Tipos y 761 unitarias aprobados; navegador, migración en base vacía y paridad de esquema se comprueban en CI, no disponibles localmente. Las clases no tienen fechas de oferta: se muestran como ofertas para solicitar esta semana, sin inventar confirmaciones. Aviso de caducidad en Mi ficha y Mi panel; el peso deja de publicarse inmediatamente al vencer aunque la limpieza aún no haya corrido. No hay carga real ni despliegue.

Archivos: prisma/schema y migración paneles_agenda, paneles, acciones de cuentas/veladas/ficha, directorio y buscador del cartel, calendario, limpieza, mensajes y pruebas. Ficheros compartidos: schema y package. Limitaciones: CI pendiente, 14/15 pruebas documentales por EPERM de symlink Windows en F; sin PostgreSQL local. Siguiente: revisar F/G con Claude, después D; H4 requiere modelo revisado antes de interfaz.

Validación local: versión 0.13.3 > F 0.13.2, esquema Prisma válido, guion E2E sin errores sintácticos, catálogo 402 y mapa 78/85/30 comprobados. Compilación en curso al registrar esta nota; resultado final pendiente de confirmar.
