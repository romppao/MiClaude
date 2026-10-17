# Auditoría de actualización de datos — 17 de octubre de 2026

Codex. Requisito del encargo de listados y pantallas de acción del 16 de octubre: comprobar qué se queda anticuado, proponer con coste y conservar las garantías del servidor. Estado inspeccionado: principal 0.23.2 más T-009 y banner de gimnasio en preparación. No implica que esta entrega esté ya desplegada.

## Lo que existe

`src/app/components/RefrescoVivo.tsx` y `src/lib/common/refresco.ts` actualizan con `router.refresh()` al volver a una pestaña visible, recuperar el foco de ventana, recuperar conexión y por temporizador. No hay conexión persistente ni actualización de segundo a segundo. Se exige un mínimo de 20 s desde la última actualización y se evita refrescar con pestaña oculta, un campo enfocado o un diálogo abierto. Esta entrega añade el evento de foco con las mismas protecciones.

| Pantalla y dato | Cómo se puede quedar anticuado | Mecanismo actual | Intervalo nominal con la pestaña visible |
|---|---|---|---|
| `/veladas/[slug]`: fecha, resultados, entradas y plazas | Otra cuenta publica o reserva mientras sigue abierta | Refresco del servidor y validación de cada operación en el servidor | 30–40 s |
| `/mis-inscripciones`: aceptación y estado | El organizador responde desde otra sesión | Refresco del servidor | 30–40 s |
| `/avisos`: respuestas y decisiones | Llega una respuesta con la pantalla abierta | Refresco del servidor | 30–40 s |
| `/mis-reservas`: estado de la reserva | Otra acción cambia su estado | Refresco del servidor | 90–100 s |
| `/clases`: oferta de entrenadores | Se edita o retira una clase | Refresco del servidor | 90–100 s |
| `/peleadores`, `/entrenadores`, `/gimnasios` y sus fichas | Cambian disponibilidad, afiliación o perfil | Refresco del servidor | 90–100 s |
| `/`, `/veladas`, `/ranking`, `/disciplinas/[slug]`, `/mi-panel`, `/siguiendo` | Nuevas publicaciones, aura o relaciones | Refresco del servidor | 90–100 s |
| `/propuestas`, `/invitaciones`: solicitudes y contacto | La otra persona responde sin que se navegue o recargue | No están en la lista automática actual | Sin intervalo automático |
| Formularios de ficha, organizador y moderación | Cambios de otra sesión mientras se está editando | Se excluyen del refresco general para evitar perder trabajo | Actualización por acción o navegación |

Son intervalos nominales del código, no garantías de latencia: la red, la suspensión del navegador, el servidor dormido y las protecciones al escribir pueden demorarlos. Volver a la pestaña tampoco fuerza una petición si no se cumplen las protecciones anteriores. `force-dynamic` evita reutilizar el render del servidor en las rutas que lo declaran; por sí solo no actualiza el documento ya abierto.

## Coste técnico comprobable

Una pestaña visible genera normalmente una solicitud de refresco cada 30–40 s o 90–100 s. Cien pestañas producen aproximadamente 2,5–3,33 o 1–1,11 renderizaciones por segundo, respectivamente, más los eventos de retorno que permitan las protecciones. Cada render puede ejecutar varias consultas: no se debe equiparar una renderización a una consulta de Neon.

No se añade un proveedor ni una suscripción, pero sí se consumen CPU, consultas y transferencia de los proveedores actuales. No se ha medido aquí el número de consultas por render ni se garantiza gasto cero. Para medirlo hay que observar tráfico y consumo de la demo antes de reducir intervalos. No se ha cambiado ningún plan, clave ni configuración.

## Garantías y comprobaciones

La interfaz puede mostrar disponibilidad antigua. La reserva o inscripción debe volver a comprobar cupo y permisos dentro de la operación del servidor. Los recorridos de plazas y reservas y las pruebas aprobadas siguen siendo obligatorios; el sondeo no los sustituye. Los cambios de esta entrega no modifican esas operaciones.

Fuentes de cobertura: `tests/unit/refresco.test.ts`, `tests/e2e/datos-vivos.mjs`, la batería de plazas/reservas y `docs/APROBADO.md`. El nuevo recorrido comprueba una velada añadida desde otra conexión al servidor, el refresco al recuperar foco y visibilidad, y la conservación de un filtro sin enviar. Pasó en el entorno ficticio local. El CI 39014987991 de 0dddcff pasó 43 recorridos, pero solo acredita aquella cabeza; la combinación final debe tener su propio CI.

## Pendientes y propuesta para Claude

1. Dar actualización a propuestas e invitaciones sin sustituir formularios con datos sin enviar. Primero distinguir lectura de edición y comprobar con dos sesiones que no se pierde un borrador.
2. Verificar en el CI final la nueva actualización al recuperar foco, con las mismas protecciones y el mínimo de 20 s.
3. Medir consultas por render y consumo de la demo. Solo después decidir si reservas, clases o paneles necesitan intervalos más cortos.
4. SSE queda como propuesta para una pantalla cuyo requisito de latencia no cubra el sondeo y después de medir conexiones y coste en Render. No se ha contratado ni activado.

Esta auditoría completa el documento solicitado; no declara resueltos los huecos de actualización ni los convierte en decisiones aprobadas.
