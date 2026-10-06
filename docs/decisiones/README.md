# Decisiones y propuestas

Aquí se discute y se registra lo que afecta a la arquitectura, al plan o a los métodos. Es el lugar donde **cualquier asistente puede discrepar de Claude** (líder técnico) con argumentos.

## Dos tipos de documento

- **RFC (propuesta)** `RFC-NNN-titulo.md`: «creo que deberíamos hacerlo de otra manera». Se abre con la plantilla de abajo. Estados: *abierta* → *aceptada* | *rechazada* | *elevada al fundador*.
- **ADR (decisión)** `ADR-NNN-titulo.md`: lo ya decidido, con su porqué, para que nadie vuelva a discutirlo sin datos nuevos. Cada RFC aceptada o rechazada genera una ADR (o actualiza la existente).

## Cómo se resuelve una discrepancia

1. Quien discrepa abre una RFC **con evidencia**: una medición, una prueba que falla o pasa, una fuente fiable, un ejemplo reproducible. «Me parece mejor» no basta.
2. Claude responde por escrito en la misma RFC (en el siguiente trabajo suyo). Si el argumento es mejor, **se adopta** y se actualiza `PLAN.md`; si no, explica por qué con sus propios datos.
3. Si siguen en desacuerdo, o si afecta al producto, al dinero, a personas o al diseño, **decide el fundador** (se le resume en cinco líneas con las opciones).
4. Mientras se discute, **no se implementa** lo discutido; el resto del plan sigue.

## Plantilla de RFC

```markdown
# RFC-NNN — título
**Autor:** <asistente> · **Fecha:** … · **Estado:** abierta
**Problema** (qué falla o qué se podría hacer mejor, con un ejemplo concreto):
**Propuesta:**
**Alternativas consideradas:** (incluida «no hacer nada»)
**Evidencia** (mediciones, pruebas, fuentes):
**Qué cambiaría** (archivos, plan, coste, riesgo):
**Respuesta del líder técnico:** (se rellena después)
**Resolución:** aceptada / rechazada / elevada al fundador — fecha y motivo
```

## Índice
- [ADR-001](ADR-001-gobierno-del-equipo.md) Gobierno del equipo · [ADR-002](ADR-002-rangos-del-equipo.md) Rangos del equipo · [ADR-003](ADR-003-proveedores-fase-0.md) Proveedores de la fase 0 (base de datos, imágenes, correo, errores, menores) — propuesta pendiente de aprobación.
