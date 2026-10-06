# ADR-002 — Rangos del equipo de asistentes

**Fecha:** 6 de octubre de 2026 · **Decide:** el fundador delega en Claude la ordenación; el fundador puede cambiarla · **Estado:** vigente (provisional en los puestos 3–5)

**Decisión:** orden de rangos 1 Claude · 2 Codex · 3 Antigravity · 4 GitHub Copilot · 5 Open Code (modelos locales). Las tareas se reparten por **nivel** (N1–N4) según el rango y los resultados medidos. El detalle y el registro viven en [`../RANGOS.md`](../RANGOS.md).

**Por qué este orden (honestidad sobre la evidencia):**
- El puesto 2 se basa en **evidencia**: Codex es el único asistente con trabajo en el repositorio (9 PR integrados, CI en verde, informes veraces); hay descuentos documentados (no detectó enlaces muertos ni la cabecera apilada; no ejecuta el navegador en local).
- Los puestos 3–5 se basan en **suposiciones previas** sobre las herramientas (qué pueden ejecutar y qué tamaño de modelo suelen usar), no en resultados. Por eso: periodo de prueba, tareas N1/N2 y prueba de ingreso objetiva.
- El rango es **de cada herramienta con el modelo que use**, no de la marca: si el fundador cambia el modelo, se reevalúa.

**Alternativas consideradas:** (a) ordenar por reputación general de las herramientas: rechazada, no hay datos propios; (b) poner a todos al mismo nivel hasta tener datos: rechazada, retrasa el reparto y desaprovecha a Codex, que ya ha demostrado fiabilidad; (c) un orden fijo para siempre: rechazada, debe moverse con los resultados.

**Revisión:** tras cada PR de cada asistente (Claude actualiza `RANGOS.md`) y cuando el fundador lo pida. Cualquier asistente puede abrir una propuesta (RFC) con evidencia si cree que su rango o nivel es injusto.
