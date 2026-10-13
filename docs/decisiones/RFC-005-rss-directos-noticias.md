# RFC-005 — Sustituir las búsquedas de Google Noticias por RSS directos
**Autor:** Codex · **Fecha:** 13 de octubre de 2026 · **Estado:** elevada al fundador

**Problema:** En la revisión de la demo del 13-10-2026 se observaron respuestas HTTP 503 persistentes en las fuentes de Google Noticias. El código no permite atribuirlas a un bloqueo de IP. También se retiraron FEKM (403) y MMA España (respuesta HTML, no RSS válido). La portada debe conservar noticias españolas clasificadas por disciplina.

**Propuesta:** Evaluar RSS publicados directamente por medios y federaciones, con una lectura de disponibilidad, idioma, cobertura y permisos antes de activar cada fuente. Mantener una lista corta por disciplina; conservar las fuentes actuales que sí se lean correctamente. Esta RFC no añade, activa ni sustituye fuentes: requiere aprobación del fundador.

**Candidatos para comprobar (sin validar):**

| Ámbito | Candidatos | Comprobación pendiente |
|---|---|---|
| Boxeo | Espabox, AEBOX, Real Federación Española de Boxeo | Disponibilidad y frecuencia del RSS; evitar duplicados entre publicaciones |
| Kickboxing, K-1 y Muay Thai | FEKM y federaciones autonómicas | Canal RSS vigente, respuesta accesible y categorías por disciplina |
| Jiu-jitsu y grappling | Fighter Corner y federaciones españolas de la disciplina | RSS vigente, idioma y cobertura nacional |
| MMA | Jaula Magazine, Deporte de Contacto y medios españoles especializados | RSS válido, cobertura de España y permisos de reutilización |

**Alternativas consideradas:** conservar temporalmente Google Noticias y mostrar su diagnóstico; buscar fuentes directas antes de cambiar; retirar solo las fuentes que fallen de forma sostenida tras revisión. No se propone evadir restricciones de acceso.

**Evidencia:** Informe de Claude sobre la demo, versión 0.9.0, commit 46c1725, 13-10-2026: Google Noticias respondió 503 durante más de 22 horas; FEKM respondió 403; MMA España entregó HTML en vez de RSS/Atom. Son observaciones de esa revisión, no una comprobación nueva desde este entorno.

**Qué cambiaría:** Si se aprueba, se revisarían `src/lib/news/sources.ts`, la clasificación por disciplina y las pruebas de fuentes. Coste bajo por fuente; riesgo de cobertura incompleta, duplicados y condiciones de reutilización.

**Respuesta del líder técnico:** pendiente.
**Resolución:** pendiente de decisión del fundador. No se activan nuevas fuentes en este cambio.
