# Pulido funcional antes del rediseño

Petición del fundador, 3 de octubre de 2026: «pulamos la aplicación hasta el más mínimo detalle, luego al final volveremos al diseño […] se ve muy desorganizado y saturado».

La composición actual es provisional. Este documento reúne los pendientes vigentes; las entradas antiguas del diario describen estados anteriores. No equivale a declarar la aplicación perfecta ni lista para abrir al público.

## Corregido en este bloque

| Problema comprobado | Corrección | Cómo se comprueba |
|---|---|---|
| Las colas dejaban registros fuera después de 100; el historial, después de 200 | Páginas de 50, total real, orden estable y páginas independientes por cola | Navegador con 105 avisos, reclamaciones, solicitudes, gimnasios, títulos y acreditaciones; tres grupos de 104 combates y 351 cambios |
| El acceso a respaldos perdía la ruta después de entrar | Destino explícito por las guardas de sesión y acreditación | Acceso sin sesión y regreso real con una cuenta autorizada |
| Resolver obligaba a empezar la lista de nuevo | Se conservan filtros y páginas; el aviso permite volver a la sección | Acciones reales desde la tercera página y con filtros |
| Una pantalla larga podía esconder la respuesta | Foco y desplazamiento al aviso; enlace de vuelta a la cola | Comprobación de foco, posición y accesibilidad |
| Moderación podía aprobar un resultado corregido mientras leía | Huella del resultado en formulario y escritura condicionada a los datos leídos | Pantalla antigua, cambio del resultado y rechazo de la decisión |
| Dos decisiones podían pisar el mismo aviso | Reserva de estado pendiente dentro de la transacción antes de actuar sobre el dato | Prueba de concurrencia y pantalla antigua sin segunda resolución |
| Editar la evidencia podía pisar un respaldo concedido entretanto | Escritura condicionada a fuente, resultado, estado y fecha de respaldo | Prueba negativa: no auditoría ni modificación tras el cambio concurrente |
| Decisiones desconocidas se interpretaban como rechazos o retiradas | Rechazo explícito de opciones ajenas al formulario | Pruebas por acción, sin escrituras |
| «Restaurar» también estaba disponible para títulos activos y podía retirar su respaldo | Solo se restaura una exclusión; botones según el estado y guarda en servidor | Intento sobre un título activo sin escrituras; opciones comprobadas en navegador |
| La revisión mostraba una acreditación retirada como vigente y omitía la categoría | Etiqueta efectiva, nivel, división y peso del hecho | Cola protegida y acreditación retirada |
| Muchas solicitudes de un título podían ocultar la fuente de otros | Última solicitud por título, sin un límite global que mezcle sus historiales | 351 solicitudes de un título y una anterior de otro |
| El relevo enumeraba problemas ya corregidos como pendientes | Estado actual con referencias a código y pruebas | Auditoría y traslado enlazan este documento |

Integrado en [PR #15](https://github.com/romppao/MiClaude/pull/15) y [#16](https://github.com/romppao/MiClaude/pull/16): [CI final #142](https://github.com/romppao/MiClaude/actions/runs/37159831793) aprueba 406 unitarias, 395 comprobaciones de navegador y axe en 37 pantallas sin incumplimientos, además de migraciones/paridad, tipos, mapa y build. Demo final comprobada en Render: portada, ayuda y salud 200; el acceso a respaldos conserva la ruta. Evidencias y límites de la comprobación pública en APORTACIONES-CODEX y DIARIO. No hay migración ni cambios de escala de aura, categorías o diseño.

## Siguiente trabajo funcional, por impacto

1. **Carreras y datos deportivos:** evitar solapamientos entre récord de partida y combates históricos importados; completar pesos IMMAF e IBJJF con cinturón y kimono/sin kimono; documentar modalidades, torneos y excepciones. Un catálogo no certifica licencias ni aptitud médica. Referencia: DISENO-PESOS.
2. **Herramientas de entidades:** alta y mantenimiento de entrenadores, disciplinas/horarios/contacto de gimnasios y búsqueda de peleadores en carteles sin depender del selector de 500. Los perfiles visuales y la acreditación siguen separados. No anunciar reservas o sparring hasta ofrecer el servicio completo.
3. **Recorridos de error y funcionamiento real:** revisar caducidad de sesión, recuperación, correos que no llegan, conexiones lentas, reintentos, teléfono pequeño, teclado y lector de pantalla. Las pruebas actuales son una base; no sustituyen a personas reales.
4. **Preparación del servicio real:** proveedor y dominio de correo, responsable/contacto, copias de seguridad y prueba de restauración, observación de errores y recuperación del servicio. La demo conserva datos ficticios y correo en registros.
5. **Integridad a escala:** revisar consultas y límites, retención de fuentes de solicitudes, índices y pool de conexiones según alojamiento; calibrar aura con datos reales sin vender verificación ni posición. Los límites protegidos de navegación están en common/pagination.

## Decisiones que aún necesitan información del fundador

- Política de menores y tutor: edad de acceso, consentimiento y datos públicos, con revisión jurídica. Las categorías schoolboys/juveniles no conceden por sí mismas autorización para publicar datos de menores.
- Responsable del tratamiento y contacto real; revisión de privacidad.
- Criterio para solapamientos del récord inicial, publicación de fichas de terceros y moderación previa de veladas.
- Personas de diferentes edades y familiaridad digital para probar los guiones.
- Escala definitiva de aura: la vigente es inicial y configurable; no hay datos para certificar su calibración ni una puntuación deportiva estadística.

## Diseño, al final

Después del cierre funcional y las pruebas con personas, hacer un briefing con el fundador: jerarquía de información, qué acciones ve cada rol y qué necesita cada pantalla. Trabajar propuestas de composición claramente distintas antes de implementar una; no dar por definitiva la maqueta actual ni añadir más paneles para solucionar la saturación. La propuesta móvil #13 sigue abierta; sus cambios de layout deben conciliarse con NavigationMenu antes de integrarla.

Premium y nuevas funciones se mantienen en IDEAS, posteriores a la estructura básica.
