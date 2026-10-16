# T-XXX · Título corto de la tarea

> Plantilla de ficha para la flota (`node scripts/flota.mjs todo docs/tareas/T-XXX-….md`). La escribe Claude; Codex la ejecuta. Copia este archivo, rellénalo y bórrame esta línea.

- **Complejidad:** normal  <!-- «simple» (mecánica o de texto, Luna·bajo), «normal» (Sol·medio) o «compleja» (Sol·alto): ver docs/MODELOS-Y-ESFUERZO.md -->
- **Riesgo:** normal  <!-- «crítico» si toca dinero, permisos, datos personales, secretos o envíos: la revisión la hace Astra en vez de Luna -->
- **Petición del fundador:** (sus palabras, o el documento donde consta la aprobación)

## Objetivo
Qué debe poder hacer la aplicación al terminar, en dos o tres frases, sin tecnicismos.

## Reglas aprobadas que se cumplen y no se discuten
- (Reglas de negocio ya decididas. Si hay filas en `docs/APROBADO.md` relacionadas, cítalas por su número.)

## Qué hay que cambiar
1. Archivo o zona, y qué cambio concreto.
2. …

## Fuera de alcance (no tocar)
- (Archivos o comportamientos que deben quedar igual.)

## Pruebas exigidas
- Unitarias: …
- De navegador (`tests/e2e/…`): … (si es un recorrido nuevo, añádelo a `tests/e2e/orden.json`)
- Si el cambio es una función que el fundador ha aprobado, añade su fila a `docs/APROBADO.md` con su prueba.

## Criterios de aceptación
- [ ] `npm run verificar` pasa (tipos, pruebas, catálogo, mapa, documentación, aprobado).
- [ ] Los recorridos afectados pasan en local (`npm run verificar -- --e2e --solo nombre1,nombre2`).
- [ ] La revisión no deja hallazgos altos sin resolver.
