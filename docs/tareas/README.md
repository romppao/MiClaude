# Fichas de tarea

Cada ficha es una **orden de trabajo completa** para un asistente ejecutor: objetivo, contexto, archivos, pasos exactos, criterios de aceptación, qué no hacer y qué documentar. El líder técnico (Claude) las escribe y las revisa; los ejecutores las siguen **al pie de la letra** (ver [`../EQUIPO.md`](../EQUIPO.md)).

**Estados:** `lista` (se puede tomar) · `bloqueada` (falta una decisión o un dato; se dice cuál) · `en curso` (quién y rama) · `en revisión` (PR) · `hecha` (PR integrado).
**Rama y PR:** `<asistente>/T-NNN-nombre`. Un PR por ficha. El PR cita la ficha y marca cada criterio de aceptación.
**Si algo no cuadra:** se para y se avisa en el PR (o con una RFC): ni se improvisa ni se amplía el alcance.
**Al terminar:** se actualiza el estado en la ficha y en el índice de [`../PLAN.md`](../PLAN.md), y se escribe la entrada en el registro propio.

## Plantilla

```markdown
# T-NNN — título
**Fase:** … · **Estado:** lista · **Sugerida a:** … · **Depende de:** …
## Objetivo (una frase)
## Contexto (por qué, y qué ya existe: archivos y funciones)
## Pasos (numerados, exactos)
## Criterios de aceptación (comprobables)
## Pruebas obligatorias
## No hacer
## Documentar
```
