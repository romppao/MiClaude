# Bloque D — Codex

Objetivo: encargo D1–D5, modificado el 14-10: sin Cataluña y sin carga real antes de recuento presentado. Base: G 0.13.3; rama codex/gimnasios-reales-20261014.

## 2026-10-14 — Gimnasios reales, bloque D
Modelo aditivo de procedencia, contacto profesional, disciplinas, propiedad revisada, publicación y ficción. Directorio/mapa/fichas/búsqueda excluyen Cataluña con una sola constante; las altas excluidas permanecen por revisar. Reclamación, conflicto, edición, cesión, miembros y aviso de corrección quedan auditados. El titular natural del gimnasio es la fuente de permisos; se preservan los titulares anteriores del perfil visual mediante migración. El importador reutilizable hace recuento por defecto, consulta áreas OSM para provincia ausente, conserva caché y protege gimnasios corregidos/reclamados. Una carga real requiere plan comparado con esa base, hash presentado e IMPORTAR_EN_REAL=si. Nunca usa seed o crea campañas.
Validación local: 785 unitarias y tipos; esquema y migración generada con diff sobre G. Fixture sintético del importador: Madrid 1, Valencia 1, cuatro provincias excluidas descartadas; NO es un inventario real. Consulta real de Overpass falla por EACCES de red: no hay recuento real ni carga en demo/producción. Navegador, migración vacía/paridad y revisión pendientes de CI/Claude.

Archivos: schema/migración, acciones/área privada/moderación, filtros de directorio/perfiles, importador, privacidad/exportación y pruebas. Limitaciones: sin inventario OSM comprobado, sin carga real ni demo, sin fusión o despliegue. Siguiente: CI y revisión de Claude; obtener recuento comparado con la base real y presentarlo al fundador antes de ejecutar.

Compilación final local aprobada, tipos y 785 unitarias aprobados, catálogo 413 y mapa 80/90/31 regenerados. La guarda real se ejecutó sin activar confirmaciones y rechazó la carga antes de conectar/escribir. Navegador y paridad real de migración todavía pendientes de CI.
