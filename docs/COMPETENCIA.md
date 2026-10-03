# Análisis de la competencia

Actualizado por Codex el **3 de octubre de 2026**, por petición del fundador. Sustituye el análisis anterior, que contenía hipótesis y fuentes secundarias poco sólidas. La comparación se limita a páginas públicas y a lo que se pudo observar; no es una auditoría de los sistemas de los competidores.

## Método y límites

- Raunder: portada en navegador real, pregunta frecuente sobre el récord y páginas públicas de gimnasios, peleadores y clasificación mediante búsqueda web.
- BoxRec: portada, ficha pública y ayuda oficial mediante búsqueda web. En el navegador la verificación de Cloudflare persistió tras una recarga: no se pudo recorrer la interfaz normal ni iniciar sesión. Esto limita este entorno; **no demuestra un fallo para sus usuarios**.
- Ring España: documentación y código de la rama `claude/ring-espana-mvp`, portada y calendario de la demo en navegador real. No se crearon cuentas ni se modificaron datos en los competidores.
- Los textos recuperados por búsqueda pueden diferir de la interfaz dinámica. Los recuentos de Raunder cambiaron entre recuperaciones: no se usan como medida estable ni se infiere por ello un fallo.
- Las valoraciones de claridad de abajo son **juicio de producto de Codex**, no hechos estadísticos ni resultados de pruebas con usuarios reales.

## Raunder: fortalezas comprobadas

Fuentes: [portada](https://raunder.es/), [gimnasios](https://raunder.es/gimnasios), [clasificación](https://raunder.es/clasificacion).

1. **Entrada por necesidades:** encontrar dónde entrenar, sparring y llevar la trayectoria; también diferencia las propuestas para gimnasios y promotoras. En la portada del navegador se comprobaron enlaces por objetivo.
2. **Utilidad recurrente de los gimnasios:** la página pública anuncia horarios por clases; la portada presenta pases de día y gestión para gimnasios. Son ofertas visibles: no se probaron reservas ni pagos.
3. **Métrica explícita:** la clasificación pública dice que ordena actividad y medallas de actas, en lugar de victorias y derrotas. Explicar qué mide evita confundir actividad con calidad deportiva.

### Fricciones y oportunidades observadas

- La respuesta desplegada a «¿Cómo funciona el récord de deportista?» explica crear ficha, declarar combates y compartirla, pero **esa respuesta concreta** no aclara quién valida cada resultado. No se afirma que Raunder carezca de verificación: su página de peleadores menciona actas. Nuestra oportunidad es explicarlo junto al récord y al resultado, además de en la ayuda.
- La clasificación mezcla varias métricas en una página extensa. Puede exigir más lectura para interpretar cada lista: es una hipótesis de usabilidad a probar, no un fallo demostrado.
- Nuestra ficha de gimnasio hoy no tiene horarios, disciplinas ofrecidas ni pases. Esta es una carencia nuestra frente a la propuesta visible de Raunder; requiere datos mantenidos por cada gimnasio, no copiar cifras ajenas ni añadir botones de reserva sin servicio real.

## BoxRec: fortalezas y fricciones comprobadas

Fuentes: [portada](https://boxrec.com/), [ayuda oficial](https://boxrec.com/en/support), [ficha pública consultada](https://boxrec.com/en/box-pro/851665).

- La ayuda documenta búsqueda con sugerencias e identificador, historial, últimos seis resultados y registros por deporte; son referencias útiles para buscar y leer una carrera.
- Publica explicaciones de su clasificación y de las puntuaciones del público. Su ayuda separa estas últimas de las oficiales.
- El glosario y la portada usan abreviaturas como `Box-am`, `W-UD` y `TBA`: para público nuevo pueden exigir consultar ayuda. Nuestra interpretación: mostrar palabras completas y kilos desde el principio.
- La ayuda indica que algunas páginas y los pesos requieren cuenta. La decisión de Ring España sigue siendo consulta pública y cuenta para participar.
- BoxRec reconoce cobertura amateur incompleta y explica cómo enviar resultados por correo. Nuestra oportunidad es un recorrido guiado de alta, confirmación del rival y corrección, con estado visible.

**Correcciones al análisis antiguo:** no es correcto presentar hoy BoxRec como exclusivamente boxeo, exclusivamente inglés o sin participación del público. Su ayuda describe varios deportes, selección de idioma y puntuaciones de aficionados. Tampoco se puede afirmar que Raunder no esté en Madrid: su directorio incluye gimnasios madrileños. Las acusaciones antiguas sobre manipulación no se mantienen como hechos.

## Aplicación a Ring España

| Aprendizaje | Aportación de este bloque | Estado |
|---|---|---|
| Entrada por objetivo | Enlaces para descubrir peleadores, entrenar, consultar veladas, gestionar ficha y organizar | Publicado en #11; menú por actividades en #14 |
| Una clasificación debe explicar qué mide | Fórmula, periodo, provincia, empates y límites del aura | Publicado; trayectoria y respaldo ampliados en #14 |
| Respaldo entendible junto al dato | Enlace desde cada récord a ayuda precisa; evidencia no equivale a verificación | Publicado, con respaldo opcional y etiquetas en #14 |
| Calendario útil y coherente | Hoy permanece durante todo el día peninsular; filtros individuales y salida de resultados vacíos | Publicado en #11, con regresiones |
| Gimnasios con información práctica | Horarios, disciplinas, contacto y fecha de actualización | Propuesta pendiente, necesita modelo y responsable |
| Trayectoria fácil de leer | Récord por disciplina/nivel y títulos con desglose; las estadísticas adicionales necesitan datos suficientes | Récord y títulos publicados; racha/actividad y métricas nuevas, pendientes |
| Herramientas profesionales | Gestión de una velada antes de ampliar a CRM | Gestión de veladas implementada; CRM pendiente |

## Prioridad siguiente

1. Ejecutar las pruebas de navegador y accesibilidad del cambio en un entorno con PostgreSQL; completar después moderación, seguridad, móvil/teclado y exploración destructiva de `pruebas/personas.md`.
2. Resolver con el fundador la unidad de aura, menores, privacidad y publicación de fichas de terceros. Este bloque **no decide** esos asuntos.
3. Diseñar funcionalmente los datos de gimnasios y el flujo organizador. No añadir reservas, sparrings, pagos o estadísticas sin reglas, datos y validación.
4. Probar con personas reales de distintas edades antes de dar por buena la claridad.

El diseño gráfico queda para el final. Detalle de cambios y relevo: [APORTACIONES-CODEX.md](APORTACIONES-CODEX.md).
