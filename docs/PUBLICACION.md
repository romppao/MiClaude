# Publicar Ring España en App Store y Google Play: proceso, web frente a app y costes

**Petición del fundador (8 de octubre de 2026):** «Me gustaría que me indicases el proceso para publicar la aplicación oficialmente al mercado […] cómo subirlo tanto a Apple Store como a Google Store para que los aficionados la puedan descargar. También limitar un poco el uso de la aplicación en web para incitar a que la gente descargue la aplicación. […] Partimos de una base de 500 clientes como máximo en esta primera etapa. ¿Es sostenible? ¿Voy a necesitar pagar algo?»

Este documento es una **propuesta para estudiar** (el fundador la compartirá con el resto de asistentes). No se ha contratado ni pagado nada. Las cifras de precios proceden de **búsquedas web del 8 de octubre de 2026**: desde el entorno de desarrollo no se pueden abrir las páginas oficiales, así que **cada precio se comprueba en la página oficial al crear la cuenta** (lista al final). Complementa [MOVIL.md](MOVIL.md) (por qué móvil primero) y el [ADR-003](decisiones/ADR-003-proveedores-fase-0.md) (proveedores aprobados).

---

## 1. Respuestas cortas

| Pregunta | Respuesta |
|---|---|
| **¿Se puede subir a las dos tiendas?** | Sí. El camino recomendado es **un solo código**: la web actual dentro de una aplicación nativa hecha con **Capacitor** (gratuito, de código abierto), con funciones del teléfono que Apple exige ver (avisos, cámara, compartir, pantalla sin conexión). No hace falta reescribir la aplicación. |
| **¿Cuánto cuesta estar en las tiendas?** | **Apple:** cuota anual del Apple Developer Program (en Europa ha sido **99 € al año**; confirmar el precio actual al darse de alta). **Google Play:** **25 $ una sola vez**. |
| **¿Necesito un Mac?** | No es obligatorio: la versión de iPhone se puede compilar en la nube con **Codemagic** (500 minutos de Mac gratis al mes para cuentas individuales, según su documentación). Sí hace falta **un iPhone y un Android reales** para probar (pueden ser prestados). |
| **¿Es sostenible con 500 usuarios?** | **Sí.** Con los proveedores ya aprobados, el gasto mensual estimado es de **unos 10 a 30 € al mes**, más **unos 125 € el primer año** en cuotas de tiendas y dominio. Detalle en el apartado 6. |
| **¿Puedo limitar la web para que descarguen la app?** | Sí, pero **con cuidado**: la consulta pública (fichas, veladas, ránking) debe seguir abierta en la web porque es lo que se comparte en WhatsApp e Instagram y lo que encuentra Google. Lo que se puede reservar a la app es lo que **gana** con el teléfono: avisos, subir vídeos desde la cámara y, si se decide, dar aura. Propuesta en el apartado 5. |
| **¿Cuánto se tarda?** | Unas **6 a 10 semanas** desde que se empiece, de las que **al menos 2** son de espera obligatoria en Google (prueba cerrada) y de revisión. Calendario en el apartado 7. |

---

## 2. Cómo se convierte la web en una app de tienda

| Camino | Qué es | Coste | Veredicto |
|---|---|---|---|
| PWA (web instalable) | La web se «instala» desde el navegador con icono propio | 0 € | **Se hace de todas formas** (ficha T-003): mejora la web y sirve de base. Pero **no aparece en App Store** y en iPhone la instalación es poco conocida. |
| **Capacitor** (recomendado) | Una aplicación nativa para iOS y Android que abre nuestra web y añade funciones del teléfono mediante complementos | 0 € (código abierto) | **Un solo código** para web, iPhone y Android. Cada mejora de la web llega a la app **sin pasar por revisión** (salvo cambios en la parte nativa). |
| App nativa (React Native, Swift/Kotlin) | Reescribir la interfaz | Meses de trabajo | Descartado en esta etapa. Se puede reconsiderar si la app crece mucho. |

**El riesgo principal es la norma 4.2 de Apple («funcionalidad mínima»):** Apple rechaza las apps que son «una web metida en una caja». Para superarla, la app de Ring España debe aportar cosas que la web no puede:

1. **Avisos en el teléfono** (notificaciones): «Tu peleador combate el sábado», «Han subido un vídeo de tu combate», «Te han dado aura». Se envían con **Firebase Cloud Messaging**, gratuito, que también sirve para iPhone.
2. **Subir vídeos y fotos desde la cámara y la galería** del teléfono, con la hoja nativa de compartir.
3. **Compartir** fichas y veladas con la hoja nativa del sistema.
4. **Enlaces que abren la app**: si alguien pulsa en WhatsApp un enlace a una ficha y tiene la app, se abre en la app (Universal Links en iPhone, App Links en Android).
5. **Pantalla sin conexión** propia, en lugar del error del navegador (es lo primero que prueban los revisores con el modo avión).
6. Barra inferior, gestos y botón «atrás» que se comporten como en una app (ya existe la barra inferior por papel).

No hay garantía de aprobación a la primera: se responde a Apple por el Centro de Resolución con la lista de funciones nativas.

---

## 3. Lo que falta en la aplicación antes de enviarla

Requisitos de las tiendas y de la ley que hoy **no** están hechos (los ya hechos se marcan con ✅):

| Requisito | Por qué | Estado |
|---|---|---|
| **Bloquear a otro usuario** (no ver su contenido ni recibir sus comentarios) | Apple, norma 1.2: obligatorio en apps con contenido de usuarios | ❌ **No existe**. Es nuevo trabajo. |
| Avisar de contenido ofensivo y retirarlo con rapidez | Norma 1.2 | ✅ Avisos y cola de moderación (también para vídeos y fotos). Hay que **atender la cola a diario**: algunos revisores piden actuar en 24 horas. |
| Filtro de contenido inapropiado al publicar | Norma 1.2 | 🟡 Hay moderación posterior; falta un filtro de palabras en comentarios y pies de foto. |
| **Condiciones de uso** que el usuario acepta al registrarse («tolerancia cero» con el contenido ofensivo) | Norma 1.2 y Reglamento de Servicios Digitales | ❌ Hay página de privacidad (`/privacidad`), pero **no de condiciones de uso**. Debe revisarlas un profesional. |
| Borrar la cuenta desde la propia app | Apple 5.1.1(v); Google lo pide también con un enlace web | ✅ En «Mi cuenta». |
| Política de privacidad pública y contacto de soporte | Las dos tiendas | 🟡 Existe `/privacidad`; faltan configurar en producción `RESPONSABLE_NOMBRE` y `CONTACT_EMAIL`, y una página de soporte. |
| **Menores** (T-014) | Ley española y las dos tiendas (clasificación por edades) | ❌ Decisión del fundador: es la última tarea. **Mientras no esté hecha, no se debe abrir a menores reales.** |
| Correo electrónico real (confirmar cuentas) | Sin confirmar el correo no se puede votar ni publicar | ❌ Necesita **dominio propio** y Resend (ADR-003, T-008). |
| Imágenes fuera de la base de datos (T-004) | La base gratuita es de 0,5 GB y se llenaría con fotos | ❌ Pendiente. Los vídeos ya van a R2. |
| Producción separada de la demo | La demo se duerme y su base caduca | ❌ Render Starter + Neon (T-012). |
| Avisos en el teléfono (servidor que los envía) | Norma 4.2 y valor real para el usuario | ❌ Nuevo trabajo. |
| Cuenta de prueba para los revisores | Apple y Google exigen entrar sin registrarse | Se crea el día del envío. |

---

## 4. Paso a paso

### 4.1 Trámites del fundador (en paralelo con el trabajo técnico)

1. **Decidir a nombre de quién se publica.**
   - **Persona física:** lo más rápido y barato. En App Store aparecerá **tu nombre** como vendedor. En la Unión Europea, por el Reglamento de Servicios Digitales, Apple pide declarar si eres **comerciante**: si la app genera ingresos, lo eres, y **se mostrarán una dirección, un teléfono y un correo** en la ficha de la tienda (puede valer un apartado de correos). En Google, una cuenta personal **exige una prueba cerrada con 12 personas durante 14 días seguidos** antes de publicar.
   - **Empresa (por ejemplo, una SL):** aparece el nombre de la empresa y Google no exige la prueba de 12 personas, pero hace falta un **número D-U-N-S** (gratuito, puede tardar hasta 30 días) y los costes de la sociedad.
   - Recomendación: **empezar como persona física** y consultar con un gestor cuándo conviene darse de alta como autónomo o crear una sociedad (en cuanto haya ingresos por funciones de pago).
2. **Comprar el dominio** (`.es`, unos 7 € al año) y configurar el correo (ADR-003).
3. **Darse de alta en Apple Developer Program** (developer.apple.com, con un Apple ID con verificación en dos pasos). Cuota anual.
4. **Darse de alta en Google Play Console** (play.google.com/console): 25 $ una vez, documento de identidad y tarjeta a tu nombre. **El tipo de cuenta (personal u organización) no se puede cambiar después.**
5. **Reunir 15–20 personas para la prueba cerrada de Google** (se piden 12, pero si alguien se da de baja el plazo de 14 días vuelve a empezar). Los gimnasios y peleadores con los que ya hablas son ideales: además sirve de prueba con usuarios reales.
6. **Revisión legal mínima**: condiciones de uso, privacidad, consentimiento de vídeos y menores (TRASLADO §7.24 y preguntas del ADR-003).
7. **Material para las fichas de tienda:** icono (1024 × 1024), capturas de iPhone y Android, texto de descripción, palabras clave y categoría (Deportes). Lo puede preparar Claude con capturas reales de la app; **el logotipo conviene que lo haga un diseñador**.

### 4.2 Trabajo técnico (Claude y el equipo, con fichas de tarea)

1. Producción (T-012), correo real (T-008), imágenes fuera de la base (T-004).
2. PWA: manifiesto, iconos y pantalla sin conexión (T-003).
3. Bloquear usuarios, condiciones de uso y filtro de palabras (fichas nuevas).
4. Proyecto Capacitor (carpetas `ios/` y `android/`) con: avisos (Firebase), cámara y galería, compartir, enlaces que abren la app, pantalla sin conexión.
5. Compilación en la nube con Codemagic (iPhone) y en GitHub Actions (Android), firmadas con los certificados de las cuentas del fundador.
6. Pruebas en un iPhone y un Android reales (Safari de iOS no se puede probar desde aquí: ver MOVIL.md).

### 4.3 Publicar en Google Play
1. Crear la app en Play Console, rellenar la **ficha**, el **cuestionario de clasificación por edades** y la sección **«Seguridad de los datos»** (qué datos se recogen y para qué; sale de `/privacidad`).
2. Subir la primera versión a **prueba cerrada**, invitar a las 15–20 personas y **esperar 14 días** con al menos 12 apuntadas sin interrupción.
3. Solicitar el **acceso a producción** (Google hace unas preguntas sobre la prueba) y enviar a revisión. La primera revisión puede tardar varios días.

### 4.4 Publicar en App Store
1. En App Store Connect: crear la app, **etiquetas de privacidad**, clasificación por edades, declaración de comerciante (UE), URL de privacidad y de soporte.
2. Subir la versión desde Codemagic y probarla con **TestFlight** (hasta el grupo de prueba que quieras, con enlace).
3. Enviar a revisión con la **cuenta de prueba** y una nota que explique las funciones nativas y la moderación. Si la rechazan, se corrige y se responde por el Centro de Resolución.

---

## 5. Web frente a app: cómo animar a descargarla sin perder gente

**Lo que no conviene cerrar en la web:** la consulta pública (fichas, veladas, resultados, ránking, noticias). Es una regla vigente del fundador («ver contenido es público») y además:
- es lo que se **comparte** en WhatsApp, Instagram y carteles; si el enlace pide descargar algo antes de verlo, mucha gente no sigue;
- es lo que encuentra **Google**; Google penaliza en sus resultados las ventanas que tapan el contenido en móvil;
- los organizadores y federaciones trabajan a menudo desde el ordenador.

**Propuesta (para decidir; nada está hecho):**

| Función | Web | App | Por qué |
|---|---|---|---|
| Ver fichas, veladas, ránking, noticias | ✅ | ✅ | Es la puerta de entrada y lo que se comparte. |
| Crear cuenta y entrar | ✅ | ✅ | No perder a quien llega desde un enlace. |
| Seguir peleadores | ✅ | ✅ | En la web solo se ve la lista; **los avisos de «combate el sábado» solo llegan con la app**. |
| **Avisos** (combates, vídeos nuevos, aura recibida) | ❌ | ✅ | Es la razón más fuerte para descargarla. |
| **Subir vídeos y fotos de una velada** | Solo con enlace | ✅ Desde la cámara | Mejor experiencia en el móvil; en la web se mantiene el enlace (YouTube, Instagram). |
| **Dar aura** | A decidir | ✅ | Opción del fundador: reservarlo a la app permite usar las comprobaciones de dispositivo de Apple y Google (App Attest, Play Integrity) y **dificulta las cuentas falsas para inflar el ránking**. Contra: la gente que vota desde un enlace compartido se pierde. |
| Gestión de organizador, entrenador y moderación | ✅ | ✅ | Trabajo que se hace a menudo desde el ordenador. |

**Formas de invitar a descargar** (sin bloquear):
1. **Banner** en la parte superior del móvil con «Abrir en la app» / «Descargar» (en iPhone, el banner nativo de Safari).
2. **Invitación en el momento justo**: al pulsar «Seguir» → «Descarga la app para enterarte cuando combata»; al terminar una velada → «Sube tus vídeos desde la app».
3. **Código QR** en los carteles y en la pantalla de las veladas.
4. En escritorio, un aviso discreto con el QR para el móvil.

**Atención con el pago de las funciones premium:** dentro de la app de iPhone y Android, las funciones digitales de pago (suscripciones) deben cobrarse con el sistema de Apple y Google. Según las búsquedas, la comisión para desarrolladores pequeños es del **15 %** (Apple, Small Business Program; Google, suscripciones), con condiciones nuevas en la UE desde el 1 de octubre de 2026. Vender en la web y no en la app tiene sus propias reglas. Se decide cuando se diseñe el modelo premium, **no ahora**.

---

## 6. Costes con 500 usuarios: ¿es sostenible?

**Sí.** La aplicación ya está preparada para proveedores baratos y cambiables (ADR-003). Estimación para **hasta 500 usuarios registrados** (precios de búsquedas, **sin verificar en las páginas oficiales**):

### Pagos únicos o anuales
| Concepto | Coste | Cuándo |
|---|---|---|
| Apple Developer Program | ~99 €/año (confirmar) | Al publicar en iPhone |
| Google Play Console | 25 $ una vez | Al publicar en Android |
| Dominio `.es` | ~7 €/año | Ya: sin dominio no hay correos reales |
| **Total del primer año** | **≈ 130 €** | |

### Mensual
| Pieza | Proveedor | Con 500 usuarios | Notas |
|---|---|---|---|
| Servidor web | Render **Starter** | **7 $/mes** | Imprescindible: el plan gratis se duerme a los 15 min, y un revisor de Apple que espera 50 s a que cargue **rechaza la app**. |
| Tráfico del servidor | Render (plan del espacio de trabajo gratis) | 0–3 $/mes | Desde agosto de 2026 incluye **5 GB al mes** y cobra 0,15 $/GB adicional. Los vídeos **no** cuentan: se sirven directamente desde R2. Sacar las fotos de la base (T-004) reduce este tráfico. |
| Base de datos | Neon | **0 $** en el plan gratis (0,5 GB, 100 horas de cómputo al mes) → **5–20 $/mes** si se queda corto | Con 500 personas activas a lo largo del día puede superar las 100 horas: pasa a pago por uso, sin cuota fija. Alternativa: base de Render desde ~6 $/mes. |
| Vídeos y fotos | Cloudflare R2 (UE) | **0–2 $/mes** | 10 GB gratis y descarga gratis; después 0,015 $ por GB al mes. Ejemplo: 100 GB de vídeos ≈ 1,5 $/mes. |
| Correo | Resend gratis | 0 € | **Ojo:** 100 correos al día. Un día de lanzamiento con 300 altas **bloquearía** la confirmación de cuentas: pasar a Brevo (300/día gratis) o pagar Resend (20 $/mes) **antes** del lanzamiento. |
| Avisos al móvil | Firebase Cloud Messaging | 0 € | Gratuito. |
| Errores y vigilancia | Sentry y UptimeRobot gratis | 0 € | |
| Compilar la app de iPhone | Codemagic | 0 € | 500 minutos de Mac gratis al mes; cada versión tarda unos minutos. |
| **Total mensual** | | **≈ 7–30 $/mes** (unos 7–28 €) | Lo normal, unos **10–15 €/mes**. |

### Costes que no son de servidores (los más importantes)
- **Asesoría legal** (condiciones de uso, privacidad, menores, derecho de imagen): de gratis (herramientas de la AEPD, primera consulta en el colegio de abogados) a unos cientos de euros. **Es el gasto más recomendable antes de abrir al público.**
- **Autónomo o sociedad** cuando haya ingresos: consultar con un gestor (cuota de autónomo, IVA de las ventas en tiendas).
- **Diseñador** para el logotipo e icono (recomendado en DISENO.md).
- **Dispositivos de prueba**: prestados, no hace falta comprarlos.

**Conclusión:** con 500 usuarios **no hace falta inversión grande**. Unos **130 € el primer año** en cuentas y dominio, más **10–30 € al mes** de servicios. Todo escala por uso, y con 1.000–10.000 usuarios el ADR-003 estima 15–60 $/mes. El riesgo no es el coste: es **lanzar sin** correo real, sin moderación diaria o sin la política de menores.

---

## 7. Calendario orientativo

| Semana | Trabajo técnico | Fundador |
|---|---|---|
| 1–2 | Producción (Render Starter + Neon), correo real, fotos a R2 | Dominio, cuentas de Apple y Google, gestor y abogado |
| 2–3 | PWA, bloquear usuarios, condiciones de uso, filtro | Reunir 15–20 personas para la prueba |
| 3–5 | Capacitor: avisos, cámara, compartir, enlaces, sin conexión | Logotipo, textos de la tienda |
| 5–7 | **Prueba cerrada en Google (14 días)** y TestFlight en iPhone | Recoger opiniones de los probadores |
| 7–8 | Correcciones, envío a revisión de las dos tiendas | Responder a los revisores si preguntan |
| 8–10 | Publicación y lanzamiento | Promoción |

La tarea de **menores (T-014)** debe estar hecha antes de abrir a menores reales: si se quiere lanzar antes, la app se publica con **edad mínima recomendada** y sin promoción dirigida a menores (decisión del fundador con el abogado).

---

## 8. Qué hay que comprobar en las páginas oficiales (no verificado)

- [ ] Apple Developer Program: precio actual en España (las fuentes de 2015 dicen 99 €) y requisitos de la declaración de comerciante (UE).
- [ ] Google Play: 25 $ y número exacto de probadores (las fuentes recientes dicen 12; una copia antigua de la ayuda de Google dice 20).
- [ ] Comisiones de Apple en la UE desde el 1 de octubre de 2026 (las fuentes no coinciden en si el programa de pequeños desarrolladores queda en el 10 % o el 15 %) y la tarifa de Google para suscripciones (10 % + 5 % de cobro, según un blog).
- [ ] Render: 7 $ del Starter y los 5 GB de tráfico incluidos desde el 1 de agosto de 2026 (render.com/docs/outbound-bandwidth).
- [ ] Neon: 0,5 GB y 100 horas al mes del plan gratis; precio por uso.
- [ ] Cloudflare R2: 10 GB gratis y 0,015 $/GB (una fuente dice que ya no hay plan gratis: comprobarlo).
- [ ] Codemagic: 500 minutos gratis al mes para cuentas individuales.
- [ ] Firebase Cloud Messaging: gratuito.

## Fuentes (búsquedas del 8 de octubre de 2026)
- Apple: [Normas de revisión de App Store](https://developer.apple.com/app-store/review/guidelines/) (1.2 contenido de usuarios; 4.2 funcionalidad mínima), [Small Business Program](https://developer.apple.com/app-store/small-business-program/), [Declaración de comerciante (DSA)](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-compliance-information), [precio en Europa (Applesfera, 2015)](https://www.applesfera.com/apple-1/apple-sube-en-europa-el-precio-de-sus-programas-de-desarrollo-para-mac-e-ios), [nuevas comisiones en la UE (iClarified, agosto de 2026)](https://www.iclarified.com/101814/apple-revises-eu-app-store-terms-replaces-core-technology-fee-with-5-commission).
- Google: [Registro en Play Console](https://support.google.com/googleplay/android-developer/answer/6112435), [requisito de prueba para cuentas personales](https://support.google.com/googleplay/android-developer/answer/14151465), [tarifas de servicio](https://support.google.com/googleplay/android-developer/answer/112622), [cambios de 2026 en suscripciones (Adapty)](https://adapty.io/blog/google-play-billing-changes-subscriptions-fees).
- Render: [tráfico saliente](https://render.com/docs/outbound-bandwidth), [nuevos planes de espacio de trabajo](https://render.com/docs/new-workspace-plans).
- [Codemagic, precios](https://docs.codemagic.io/billing/pricing/) · [Neon, resumen de precios (Jetadmin, sept. 2026)](https://www.jetadmin.io/blog/neon-pricing/) · [Cloudflare R2, resumen de precios (Filebase)](https://filebase.com/blog/cloudflare-r2-pricing-costs-savings-and-alternatives-in-2026/) · [Capacitor y avisos con Firebase](https://capawesome.io/blog/the-push-notifications-guide-for-capacitor) · [Apps envueltas y la norma 4.2 (MobiLoud)](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper).
