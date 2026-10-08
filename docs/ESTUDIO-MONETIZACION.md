# Estudio preliminar de monetización de Ring España

**Fecha:** 8 de octubre de 2026. **Autor:** Codex. **Estado:** propuesta para el fundador; no son precios aprobados ni funciones implementadas. Alcance exclusivamente documental mientras Claude desarrolla otra tarea.

## Criterio y límites

La oportunidad principal es conectar la información deportiva con una acción económica: contratar una clase o comprar una entrada. Mi recomendación es mantener gratuito el descubrimiento de veladas y peleadores y cobrar por herramientas que ayuden a entrenadores, clubes y promotoras a obtener clientes, ahorrar tiempo o vender.

Los niveles clasifican cuánto paga cada cliente, no el beneficio total del proyecto: muchas cuotas pequeñas pueden facturar más que unas pocas grandes. Hay que distinguir suscripciones recurrentes, comisiones por operaciones y campañas puntuales.

No se han aportado usuarios activos, ventas, tasas de conversión, gastos ni entrevistas con compradores. Los precios y cantidades siguientes son hipótesis para probar, no una previsión de ingresos ni una estimación del tamaño del mercado español. No se ha comprobado disposición real a pagar.

La base técnica revisada es `a34deabb856ff027d74bc15cce8b1abdd943611f` de `claude/ring-espana-mvp`. Hay calendario, fichas, perfiles de entrenadores y ofertas de clases con precio. Publicar una clase no equivale a reservarla o cobrarla: reservas, pagos, entradas propias y todos los paquetes comerciales de este estudio requieren trabajo adicional. No se atribuye este estado a las modificaciones que Claude está realizando ahora.

## Tres niveles

| Nivel | Quién paga | Función monetizable propuesta | Precio para probar | Potencial y condición |
|---|---|---|---|---|
| Bajo | Aficionado | Membresía de apoyo: experiencia sin anuncios, preferencias avanzadas de agenda, resumen personalizado y ventajas acordadas con colaboradores | 2–4 €/mes; alternativa 24 €/año para el plan de 2 € | Ingreso recurrente de bajo importe. Necesita una comunidad que vuelva con frecuencia y ventajas útiles |
| Bajo | Comprador de entradas | Comisión pactada por venta atribuida a Ring España, con la compra en una ticketera externa | Objetivo de negociación: 1–2 € por entrada efectivamente vendida | Buen encaje con el calendario y menor carga que operar una ticketera. Depende de acuerdos y atribución; no hay programa contratado |
| Medio | Entrenador o peleador que ofrezca clases | Plan profesional: agenda, solicitudes de alumnos, bonos, recordatorios y métricas de contactos/reservas | 15–20 €/mes; precio de prueba 19 € | Mejor candidato inicial a suscripción: beneficio económico y ahorro de tiempo identificables |
| Medio | Peleador | Dossier para patrocinadores con trayectoria, calendario, material deportivo y métricas de su público | 5–10 €/mes; probar 9 € | Menor prioridad: un amateur puede tener poco presupuesto y alternativas gratuitas |
| Alto | Club | Herramientas para varios entrenadores, clases colectivas, plazas, bonos y gestión básica de alumnos | 39–79 €/club/mes; probar 49 € | Más ingreso por cliente, pero exige utilidad recurrente y una gestión fiable |
| Alto | Promotora | Campaña de velada: espacio patrocinado identificado, difusión a público interesado y reporte de resultados | 49–199 €/velada; probar 99 € | Se justifica con audiencia y ventas atribuibles. No es ingreso mensual recurrente |
| Alto | Promotora con actividad frecuente | Panel de varias veladas, equipo de trabajo y métricas de consultas y ventas | 49–99 €/organización/mes | Solo tiene sentido si organiza con frecuencia y usa el servicio entre veladas |

Las alertas básicas de próximos combates y cambios relevantes deberían contribuir al servicio gratuito; las preferencias avanzadas pueden diferenciar una membresía. Las ventajas de colaboradores no se prometen antes de acordarlas.

Los precios son importes de prueba para comunicar al cliente, pendientes de definir su tratamiento de IVA antes de comercializar. Los ejemplos de abajo muestran importes cobrados antes de separar impuestos; no son ingresos netos contables.

## Comisión de clases: otro camino hacia un importe mensual alto

Alternativa al plan de 19 €: permitir empezar sin cuota y cobrar un **8–10 % de las clases pagadas y realizadas por la plataforma**. Un entrenador que venda diez clases de 35 € genera 350 € de ventas y, al 10 %, 35 € de comisión para Ring España.

La comisión se justifica si Ring España aporta alumnos o gestiona reservas, pagos, bonos y recordatorios. Si solo muestra un teléfono, el alumno y el entrenador pueden continuar fuera de la aplicación.

Probar primero cuota o comisión como alternativas. No sumar por defecto 19 € más 10 % sin ofrecer un beneficio adicional claro. La comisión de entradas externas y la venta propia también son alternativas para cada venta, no dos ingresos que deban sumarse.

## Qué tiene más potencial, a mi criterio

1. **Clases de entrenadores y peleadores:** mejor combinación de recurrencia, valor económico y encaje con la misión. El catálogo ya existe como oferta; falta validar demanda y resolver la operación comercial.
2. **Venta atribuida de entradas y herramientas para promotoras:** responde directamente al problema de enterarse tarde de una velada. Empezaría con compra externa mediante acuerdos; operar entradas propias añade incidencias, cancelaciones y control de acceso.
3. **Plan de club:** potencial recurrente alto por cliente, pero lo introduciría después de comprobar qué herramientas usan realmente los entrenadores.
4. **Membresía del aficionado:** complemento para una comunidad activa. No la pondría como base de sostenibilidad al empezar.
5. **Dossier del peleador:** probar con pocos deportistas antes de convertirlo en un producto de suscripción.

Patrocinios de marcas pueden generar contratos mayores más adelante, pero no fijaría tarifas sin audiencia medida, inventario publicitario y resultados. Los anuncios genéricos y enlaces de material deportivo tampoco serían mi primera fuente: dependen del tráfico y pueden distraer del seguimiento deportivo.

## Números que ayudan a decidir

### Cuotas pequeñas y costes de cobro

[Stripe publica](https://stripe.com/es/pricing) 1,5 % + 0,25 € por pago con tarjetas estándar del Espacio Económico Europeo, consultado el 8 de octubre de 2026. Se usa como referencia de cálculo, no como decisión de proveedor. Otros tipos de tarjeta y productos adicionales tienen otras tarifas.

| Cobro | Procesamiento de tarjeta de referencia | Importe tras ese único coste |
|---|---:|---:|
| 2 € mensual | 0,28 € (14 %) | 1,72 € |
| 24 € anual | 0,61 € (aprox. 2,54 %) | 23,39 € |
| 20 € mensual | 0,55 € (2,75 %) | 19,45 € |

La cuota anual de 24 € conserva el equivalente de 2 €/mes y reduce el peso del coste fijo por operación. Los importes restantes todavía soportan impuestos, software de suscripción si se usa, alojamiento, correo, atención al cliente y otros gastos.

En una clase de 35 €, una comisión del 10 % aporta 3,50 €. Si Ring España soportara el procesamiento del importe completo, la referencia anterior sería 0,775 €; quedarían aproximadamente 2,73 € antes de impuestos, costes de reparto de pagos, devoluciones y soporte. No confundir los 35 € del entrenador con facturación propia de la aplicación.

### Ejemplo hipotético de suscripciones combinadas

| Clientes de pago | Precio | Cobros mensuales |
|---|---:|---:|
| 300 aficionados | 2 € | 600 € |
| 40 entrenadores | 19 € | 760 € |
| 10 clubes | 49 € | 490 € |
| **Total** | | **1.850 €** |

Son clientes distintos y pagadores, no registros totales. No se ha demostrado que Ring España pueda captarlos o retenerlos. Las campañas por velada y las comisiones variables se analizan aparte.

Con 300 aficionados, si la conversión a pago fuese del 3 %, harían falta 10.000 aficionados activos en la población sobre la que se mide esa conversión. Ese 3 % es un supuesto aritmético, no una tasa observada.

El beneficio se calcula separando IVA cuando corresponda y restando pasarela, herramientas de pagos/suscripciones, infraestructura, devoluciones, soporte, moderación y adquisición de clientes. Ninguna cifra de esta sección representa beneficio.

## Referencias externas y qué permiten concluir

[Eventbrite publica para España](https://www.eventbrite.es/organizer/pricing/) tarifas de servicio de 6 % en Essentials y 9 % + 0,19 € en Professional. Su [ayuda oficial](https://www.eventbrite.es/help/es/articles/755615/cuanto-les-cuesta-a-los-organizadores-usar-eventbrite/) indica que varían según país/moneda y que deben confirmarse en la cuenta. Esto acredita que las comisiones por entrada son un modelo comercial existente; no acredita que una promotora vaya a pagar lo mismo a Ring España ni una comparación completa de costes.

La [ayuda oficial internacional de Superprof](https://www.superprof.com/help/tutors/tutor-payment/how-to-get-paid/68/) describe una comisión del 10 % para profesores sin Premium que usan el pago online. Es una referencia de modelo, no una tarifa española verificada ni una prueba de demanda para deportes de contacto.

## Qué conservar gratuito

Calendario y datos básicos de las veladas, lugar, fecha y dónde verlas cuando conste; consulta de peleadores y su trayectoria pública; perfil básico amateur/profesional; publicación básica de ofertas y forma de contacto.

No vender verificación, aura ni puestos deportivos del ránking. Si una entidad paga publicidad, mostrarla como patrocinada en un espacio comercial identificable. La exportación y los controles de privacidad de la cuenta no se convierten en ventajas de pago.

## Orden de validación recomendado

Primero, con la estructura básica terminada y una vez recibida la señal del fundador sobre la tarea de Claude, contrastar diez entrenadores y tres promotoras. Estas son cantidades propuestas para un piloto cualitativo, no una muestra representativa de España. No se ha contactado a nadie.

Para entrenadores, comprobar interés en 19 €/mes frente a comisión; medir solicitudes cualificadas, clases realizadas, importe vendido, repetición y tiempo de gestión. El beneficio para el entrenador se mide después de sus propios costes, no solo por el precio de una clase.

Para promotoras, acordar enlaces identificables y medir entradas realmente vendidas, no únicamente impresiones o clics. No vender campañas garantizando una audiencia inexistente.

Después, cobrar en un piloto autorizado y observar renovación, cancelaciones y margen tras costes durante dos o tres meses. Expresar interés no equivale a pagar ni a renovar. Definir antes del piloto qué resultados justifican continuar; si no hay uso o renovación, ajustar el servicio antes de desarrollar más paquetes.

Las suscripciones pueden automatizar el cobro, pero no son totalmente pasivas: requieren mantener datos actualizados, atender incidencias y conservar usuarios. Las reservas y campañas añaden más operación.

## Relevo y decisiones abiertas

El fundador decide precios, IVA comunicado, contenido gratuito/premium, quién soporta gastos de pagos y devoluciones, y si se aceptan cobros dentro de la aplicación. Este estudio no contrata proveedores, no implementa nada, no altera la tarea de Claude y no autoriza integración o despliegue.

Cuando Claude termine y el fundador dé la señal, actualizar únicamente los hechos técnicos que hayan cambiado. Las hipótesis comerciales necesitan pruebas con clientes, aunque el código pase CI.
