# Codex — corrección del recorrido de altas de gimnasios

- Fecha: 2026-10-16.
- Objetivo: resolver el fallo comunicado en el PR #90.
- Base: ff97c172a1c469dfbee6e981c859e29e31d37be7, rama original de #90. Rama local: codex/corregir-pr90-20261016.
- Causa: el formulario se buscaba por su botón dentro de un desplegable cerrado; el campo gym existe. La prueba abre «Mis datos» y el resumen de corrección antes de localizar el formulario en las tres visitas de edición.
- Archivos: tests/e2e/gimnasios-altas.mjs, APORTACIONES-CODEX, DIARIO, LECCIONES, guía de operación y catálogo generado.
- Comprobaciones: sintaxis correcta, TypeScript sin errores, catálogo de 445 archivos correcto, mapa correcto tras regenerar. Pruebas del catálogo: 10 correctas y 1 bloqueada por EPERM al crear un enlace simbólico en Windows. No se ha ejecutado el recorrido real local.
- GitHub: consulta mediante conector; #93 seguía abierto y sin fusionar. Fetch Git no conecta desde el entorno. No se han fusionado PR ni cargado datos.
- Siguiente: CI del nuevo commit de #90; esperar #93 → #88 → #89 para actualizar la base y renumerar #90. Agenda del entrenador aplazada hasta integrar #93.
