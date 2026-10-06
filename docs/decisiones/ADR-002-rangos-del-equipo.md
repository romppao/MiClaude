# ADR-002 — Rangos del equipo de asistentes

**Fecha:** 6 de octubre de 2026 · **Decide:** el fundador delega en Claude la ordenación; el fundador puede cambiarla · **Estado:** vigente (puestos 3–5 pendientes de evidencia)

**Decisión:** rango 1 Claude · rango 2 Codex (con evidencia). Antigravity, GitHub Copilot y Open Code (modelos locales) quedan **sin ordenar y en periodo de prueba**: Claude fijará sus puestos (3, 4 y 5) cuando tenga una primera toma de contacto con el trabajo de cada uno (indicación expresa del fundador). Las tareas se reparten por **nivel** (N1–N4) según el rango y los resultados medidos. El detalle y el registro viven en [`../RANGOS.md`](../RANGOS.md).

**Por qué este orden (honestidad sobre la evidencia):**
- El puesto 2 se basa en **evidencia**: Codex es el único asistente con trabajo en el repositorio (9 PR integrados, CI en verde, informes veraces); hay descuentos documentados (no detectó enlaces muertos ni la cabecera apilada; no ejecuta el navegador en local).
- Los puestos 3–5 **no se ordenan** hasta tener resultados: periodo de prueba, tareas N1/N2 y prueba de ingreso objetiva. (Una primera versión de este ADR proponía un orden a priori; el fundador pidió esperar a las pruebas y se retiró.)
- El rango es **de cada herramienta con el modelo que use**, no de la marca: si el fundador cambia el modelo, se reevalúa.

**Alternativas consideradas:** (a) ordenar por reputación general de las herramientas: rechazada, no hay datos propios; (b) poner a todos al mismo nivel hasta tener datos: rechazada, retrasa el reparto y desaprovecha a Codex, que ya ha demostrado fiabilidad; (c) un orden fijo para siempre: rechazada, debe moverse con los resultados.

**Revisión:** tras cada PR de cada asistente (Claude actualiza `RANGOS.md`) y cuando el fundador lo pida. Cualquier asistente puede abrir una propuesta (RFC) con evidencia si cree que su rango o nivel es injusto.
