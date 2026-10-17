# Entrega a Claude para la presentación del prototipo

## Objetivo del fundador

Completar las tareas pendientes y entregarlas a Claude para desplegar la demo que mostrará hoy a un cliente. El objetivo sigue abierto hasta verificar la combinación publicada y resolver o identificar con evidencia cada pendiente; no equivale a lanzar producción ni autoriza tocar lonaclub.es.

## Preparado en esta entrega

- Base real integrada: 0.24.0, incluye arranque de Render #105 y moderación #104. Candidata 0.24.1 con T-009, banners y recuperación de foco. Se conserva el trabajo de Claude mediante objetos e índice aislados.
- Gimnasios: sin banner propio, la cabecera muestra entera la imagen de perfil propia o el logo hallado. Banner subido por el titular prioritario. Sin ninguna imagen se mantienen nombre e iniciales, sin inventar una marca. Los 37 logos del registro son la cobertura hallada, no la totalidad de gimnasios.
- Nuevas comprobaciones de banner cargado, sin recorte, sin solape, prioridad de imagen propia y ausencia de imagen rota. La comprobación de tarjeta sin foto entra en la zona de carga diferida antes de exigir que desaparezca la imagen; conserva sus aserciones.
- Recuperación de foco con las protecciones existentes. Recorrido de datos vivos añadido al manifiesto: nueva velada desde otra conexión, foco/visibilidad y filtro sin enviar.
- Auditoría solicitada de datos al día y coste: `docs/pruebas/auditoria-actualizacion-datos-2026-10-17.md`. Distingue solicitudes de render, consultas y huecos pendientes.

## Comprobaciones ejecutadas y límites

- Recorrido local de logos y banners completo correcto; accesibilidad de lista y ficha sin infracciones.
- 18 vistas de cabeceras: 375,768,1280 px, claro/oscuro, logo hallado, imagen propia y sin imagen. Sin desbordes, solapes, imágenes fallidas ni pageerror. Revisión visual directa de dos capturas representativas. Evidencia en `docs/logs/lona-entrega-demo-20261017/diagnostico/capturas-banners/` fuera de Git; son datos ficticios.
- Datos vivos: cuatro comprobaciones locales correctas. La base ficticia tiene campos aditivos para usar el cliente Prisma que Claude ya había generado; no se regeneró ni modificó el cliente compartido. El CI debe acreditar el esquema exacto de esta cabeza.
- Diagnóstico de desarrollo de React en peleador, rival, mayor y sin-verificar: no reprodujo React#418. Recuperar contraseña superó el límite del guion al compilar la portada por primera vez (POST303 y correo de cambio sí confirmados). No se modifica la acción de contraseña ni se declara resuelto React.
- Detector mecánico de Impeccable: sin hallazgos en cabecera/CSS. Skills consultadas: impeccable, animate, animate-expo (no corresponde a esta web), motion-design y vercel-react-best-practices. Cabecera estática, sin dependencias nuevas.
- Tipos, unitarias, catálogo, mapa y CI de esta combinación: completar antes de la entrega final. El CI39014987991 verde de0dddcff es evidencia anterior, no acredita esta cabeza.

Actualización local final: tipos correctos,1047 unitarias/67 archivos, catálogo501 y mapa92 pantallas/110 acciones/39 tablas correctos. Documentación33/34 por único EPERM Windows de enlace simbólico; prueba intacta, pendiente Linux. Tras calentar la portada, mayor completa5 pasos sin fallos; el informe selectivo conserva las otras3 personas previas (23 pasos en total sin fallos), sin React#418. No se atribuye resolución de los avisos intermitentes a este resultado.

Incidencia de preparación aislada: una normalización de finales de línea afectó a20 recursos binarios de la copia temporal; se restauraron de los blobs originales de la principal y se verificó la lectura de las imágenes. Los originales del repositorio nunca se modificaron. La publicación verifica que los binarios coinciden exactamente con principal y limita cualquier normalización a texto.

## Inventario que no se debe dar por terminado

| Pendiente del encargo o requisito | Evidencia y siguiente paso |
|---|---|
| Publicar combinación final y verla en demo | Claude revisa, decide y fusiona según autorización; comprobar salud, versión y recorrido público después del despliegue real. No basta un CI verde. |
| Avisos React#418 intermitentes | Artefacto anterior con6 avisos en5 personas; sin reproducción en desarrollo. Mantener rutas y diagnóstico, no ocultarlos. |
| Control de abuso de invitaciones #106 | Astra revisó bfe907c tras CI verde y encontró tres P2: vía UI para levantar suspensión, concurrencia del umbral y envío concurrente con pausa. Entregados a Claude en comentario6233688389 para contraste y corrección; revisión solo lectura. |
| Moderación #104 | Integrada en principal. CI39017018520 verde y Astra sin hallazgos concretos; comentario6233688542. La división completa de la bandeja por tipos sigue pendiente según el diario de Claude. |
| Datos al día en propuestas/invitaciones | No están en el refresco automático. La auditoría propone cubrirlos sin perder borradores y medir consultas; no se declara sincronización instantánea general. |
| Pantallas guiadas del encargo del16-10 | Compartir tiene pasos; ficha tiene pestañas y completar ficha; clases tiene elecciones visuales; trayectoria conserva formulario y accesos. Esto no prueba que las cuatro cumplan aún «un paso por pantalla», vista previa y confirmación con siguiente acción. Revisar cada requisito y completar lo que falte. |
| Menos scroll | Hay pestañas y accesos implementados. La medición pública anterior cubre cinco listados, no todas las fichas, panel y acciones exigidas por el encargo. Completar la medición de las rutas exactas y actuar sobre las más largas. |
| Todos los logos auténticos |37 hallados y prioridad de imágenes de titulares. No afirmar que todos los gimnasios tienen logo; registrar los que carecen de fuente válida y conseguir los recursos que falten. |

No se modifican dominios, claves, planes, datos reales ni carpeta de trabajo de Claude. Esta ficha preserva los pendientes del objetivo completo; no declara terminada la preparación de la presentación mientras falte evidencia de ellos.
