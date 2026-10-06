# ADR-003 — Proveedores para la fase 0: gastar casi nada, poder crecer y poder cambiar

**Estado:** **APROBADA por el fundador el 6 de octubre de 2026** («todas esas herramientas las apruebo», con la condición de que Claude las vuelva a verificar: hecho en la «Segunda verificación» de abajo). Los precios siguen sin leerse en las páginas oficiales: se comprueban al crear cada cuenta.  
**Fecha:** 6 de octubre de 2026 · **Pedida por el fundador:** «quiero utilizar el mínimo capital posible y que me funcione la aplicación […] herramientas gratuitas o de mínimo coste, muy fiables, escalables y **fáciles de modificar en un futuro**».

## Criterios (en este orden)
1. Coste cercano a 0 € al empezar, sin trampas (que no caduque ni borre datos).
2. Que escale sin reescribir la aplicación.
3. **Sin atadura al proveedor**: estándares abiertos (PostgreSQL, API S3, Docker/Node, API HTTP de correo). Cambiar de proveedor = cambiar variables de entorno y copiar datos.
4. Datos en la UE cuando sea posible (RGPD) y uso comercial permitido.
5. Poco mantenimiento (el fundador no es técnico).

## Elecciones propuestas

| Pieza | Fase 0 (ahora) | Cuándo se paga y cuánto | Alternativa (para cambiar) |
|---|---|---|---|
| **Base de datos** | **Neon Free** (PostgreSQL estándar, Fráncfort; **0,5 GB y 100 horas de cómputo al mes por proyecto**) + **copia nocturna propia** (`pg_dump` desde GitHub Actions a un cubo de R2) | Al llegar usuarios reales: Neon Launch, **de pago por uso** (según fuentes secundarias, unos 0,106 $ por hora de cómputo y 0,35 $ por GB al mes, sin mínimo mensual: estimación 5–20 $/mes) | Supabase (solo si se quiere su autenticación/almacenamiento), Render Postgres, Scaleway; el cambio es `pg_dump` + `pg_restore` + una variable |
| **Alojamiento de la web** | Render gratis para la demo (se duerme a los 15 min); **Render Starter, 7 $/mes, siempre activa** cuando se abra a gente real | Standard 25 $/mes al crecer | Hetzner + Coolify/Dokploy (~6–9 €/mes, pero hay que administrar el servidor): es Docker puro |
| **Imágenes** | **Cloudflare R2 en jurisdicción UE** (10 GB gratis, salida de datos gratis, API S3) servidas **a través de la aplicación** (para ocultar al instante lo que modere un moderador y proteger a menores) | A partir de 10 GB: 0,015 $/GB-mes; con 100.000 usuarios, unos 4 $/mes | Scaleway Object Storage (empresa europea, 75 GB gratis), Backblaze B2 |
| **Correo** | **Resend gratis** (3.000/mes, **100/día**, un dominio verificado; ya está programado en `src/lib/common/mail.ts`) — **necesita un dominio propio** | Resend Pro 20 $/mes (50.000 correos). **Antes de pagar**, si se superan los 100 correos al día, pasar a **Brevo gratis** (300/día, empresa francesa) | Brevo, Scaleway TEM (París, 0,25 € por 1.000) o Amazon SES (Irlanda/Fráncfort); es un único fichero |
| **Errores** | **Sentry gratis (región UE, Fráncfort)**, con filtro que borra correos y contraseñas antes de enviar | Team 26 $/mes cuando haga falta | GlitchTip o Better Stack (usan el mismo SDK) |
| **¿Está viva la web?** | **UptimeRobot gratis** vigilando `/salud` (50 monitores, cada 5 min) | — | Better Stack |
| **Dominio** | Un `.es` (~6–7 €/año con IVA en OVH; **confirmar** que se admite al fundador) | Renovación anual | — |

### Escalera de coste mensual (orientativa, **no verificada**)
| Usuarios activos al mes | Coste aproximado |
|---|---|
| Hoy (demo, pocas personas) | **0 €** (+ dominio ~7 €/año cuando se quiera correo real) |
| 1.000 | 7–15 $ |
| 10.000 | 30–60 $ |
| 100.000 | 150–400 $ (el tramo más incierto: depende de poner caché a las páginas públicas, T-005) |

## Por qué estas y no otras (resumen)
- **Neon** y no Supabase/Render: Neon no caduca ni pausa por inactividad semanal, es PostgreSQL normal y el escalado es por uso. **Render Postgres gratis caduca a los 30 días** (14 de gracia) y borra los datos; Supabase gratis se pausa tras 1 semana sin actividad y no tiene copias.
- **R2** y no S3/Cloudinary/Vercel Blob: salida de datos gratis (las imágenes son lo que más tráfico mueve), API S3 estándar (un solo adaptador) y jurisdicción UE configurable. Cloudinary, ImageKit, Vercel Blob y UploadThing atan el código a su servicio.
- **Resend**: ya está integrado; SendGrid ya no tiene plan gratis; Amazon SES retiró la gratuidad para cuentas nuevas (julio de 2026).
- **Sentry**: mejor soporte de Next.js y salida fácil a GlitchTip/Better Stack. **Highlight.io** cerró en febrero de 2026.
- **Vercel** queda descartado mientras la aplicación se monetice: su plan gratis es solo para uso no comercial. **Koyeb** se descarta por la adquisición y cierre de altas.

## Lo que no está verificado (hay que comprobarlo antes de pagar)
**No se pudo abrir ninguna página oficial de proveedor** (el entorno bloquea esos dominios). Todas las cifras de los cuatro informes proceden de resúmenes de búsqueda que citan las páginas oficiales. Comprobar a mano, o desde Claude Code en el portátil del fundador (que sí tiene acceso a internet):
- [ ] Neon: plan gratis permite **uso comercial** (no se encontró ninguna prohibición, pero tampoco una autorización expresa: leer los términos al crear la cuenta); **0,5 GB/proyecto** y 100 h de cómputo (corregido: antes se decía 1 GB); historial de 6 h; región Fráncfort; precio de Launch.
- [ ] Render: caducidad de 30 días de la base gratis (cuándo se creó la de la demo → **fecha límite**), precio de Starter, términos comerciales.
- [ ] Cloudflare R2: 10 GB, operaciones gratuitas, salida gratis, jurisdicción UE (no se puede cambiar después de crear el cubo), términos comerciales.
- [ ] Resend: 3.000/mes y 100/día; que **no** envía a terceros sin dominio verificado; acuerdo de tratamiento de datos (DPA) del RGPD (guarda datos de cuenta en EE. UU.).
- [ ] Sentry: 5.000 errores/mes gratis y región UE; soporte de las *server actions* de Next.js 15.
- [ ] OVH `.es`: precio, y requisitos de vínculo con España y de titular (persona física).
- [ ] Marco de Privacidad UE–EE. UU.: estado del recurso ante el TJUE (C-703/25 P).

## Segunda verificación (6 de octubre de 2026, a petición del fundador: «verifícame otra vez que son las mejores»)

Hecha con búsquedas web (las páginas oficiales siguen sin poder abrirse desde este entorno). **Qué cambia respecto a la primera propuesta:**

| Punto | Resultado | Consecuencia |
|---|---|---|
| Render, base de datos gratuita | Caduca a los **30 días de crearse**; después, **14 días de gracia** para pasarla a un plan de pago; pasado ese plazo **se borra con todos sus datos**. Avisan por correo al acercarse. | Demo creada el 2 de octubre → caduca **hacia el 1–2 de noviembre** y se borraría **hacia el 15–16 de noviembre**. La web (servicio) no caduca, pero sin base de datos no funciona. **Migrar a Neon antes** (T-012). El fundador confirma la fecha exacta en el panel de Render. |
| Neon gratis | **0,5 GB** por proyecto (no 1 GB), 100 horas de cómputo al mes, se apaga a los 5 minutos sin uso (la primera visita tarda un poco más). No caduca. | Las **imágenes guardadas en la base** llenarían 0,5 GB rápido: T-004 (imágenes fuera de la base) pasa a ser **requisito para abrir al público**, no un extra. Con datos de ejemplo cabe de sobra. |
| Neon de pago | Por uso, sin mínimo mensual desde diciembre de 2025. | El gasto sube solo si sube el uso: encaja con «mínimo capital al empezar». |
| Cloudflare R2 | Confirmados 10 GB gratis, salida de datos gratis y **cubos con jurisdicción UE** (dirección `…eu.r2.cloudflarestorage.com`); **la jurisdicción no se puede cambiar después de crear el cubo**. | Al crear el cubo hay que elegir **Unión Europea** a la primera. Al crear la clave de acceso, darle solo permiso sobre ese cubo. |
| Resend | Confirmado: 3.000/mes, **100/día**, un dominio. | Es el punto débil: con una oleada de altas, el límite de 100 al día corta el registro. Brevo (300 al día, gratis, UE) es el recambio **antes** de pagar; se cambia en un solo fichero (T-008). |
| Sentry gratis | Confirmado: plan «Developer», **un solo usuario**, unos 5.000 errores al mes, región UE disponible. | Suficiente para empezar. Si entra más gente al equipo, GlitchTip o plan de pago. |
| Alojamiento | Comparado con Railway, Fly.io y Hetzner + Coolify (fuentes secundarias de 2026): Render Starter (7 $) es el más sencillo y predecible; Hetzner es más barato (~5 €) pero hay que administrar el servidor; Fly.io es barato pero su base de datos gestionada es cara. | Se mantiene Render para empezar. Hetzner + Coolify queda como salida si el coste de Render pesa más adelante. |
| Dominio `.es` | OVH: unos 5,99 € + IVA el primer año (7,25 € con IVA) y renovación desde 6,99 € + IVA; se exige vínculo con España; los contactos del dominio deben ser personas físicas. | Cuadra con el fundador (persona física). Confirmarlo al comprar. |

**Conclusión:** no hay una elección mejor para el conjunto «gratis + fiable + escalable + fácil de cambiar». Se aprueban las seis piezas con **dos correcciones** (Neon 0,5 GB y el límite de Resend) y **una prioridad nueva** (sacar las imágenes de la base antes de abrir al público).

## Plan de aplicación (orden recomendado)
1. **Ya (urgente):** la base de datos gratuita de la demo en Render **caduca a los 30 días**: pasar la demo a Neon Free (ficha **T-012**, ahora sin coste). Antes, el fundador comprueba en el panel de Render la fecha de creación.
2. **Copias:** copia nocturna `pg_dump` → R2 con GitHub Actions + **prueba de restauración** documentada (ficha **T-012**).
3. **Imágenes:** `ImageStore` + driver R2 y migración sin parada (ficha **T-004**, ahora desbloqueada).
4. **Errores y vigilancia:** Sentry con filtro de datos personales y UptimeRobot (ficha **T-010**).
5. **Correo real:** cuando el fundador tenga dominio: verificar el dominio en Resend (SPF/DKIM/DMARC) y activar `RESEND_API_KEY`/`MAIL_FROM`; después cola de correos (ficha **T-008**). **Sin dominio no hay correos reales** (ni verificación de cuentas): hasta entonces la demo sigue en modo registro.
6. **Menores:** implementar la política de abajo (ficha nueva **T-014**) **antes** de abrir el registro al público.

## Política de menores — BORRADOR de fase 0 (NO es asesoramiento jurídico; se aplica al final, ver decisiones del fundador)
Base: el art. 7 de la LOPDGDD fija en **14 años** la edad para consentir el tratamiento de datos (no leído en el BOE; resumen de búsqueda). Hay un proyecto de ley en tramitación que podría subirla a **16**: la edad debe ser un **parámetro**, no un número fijo en el código.
- **Superado por la decisión del fundador:** el alta de cuenta **no** pide fecha de nacimiento ni impone edad mínima. La edad mínima de 14 y el perfil gestionado por tutor quedan como **opción a valorar con el abogado** (el consentimiento de los menores de 14 en España exige a madre, padre o tutor), no como diseño actual.
- Perfiles de menores de 18: **sin foto ni banner**, apellido abreviado, solo provincia (sin ciudad ni club exactos), **no indexados** por buscadores, **sin comentarios ni aura de desconocidos** (propuesta: el fundador decidirá los límites concretos al final), cualquier cambio con confirmación del tutor.
- Perfiles creados por terceros (ya se muestran con inicial y sin indexar): avisar al titular si hay correo y retirar al primer aviso.
- Formulario «Esto soy yo / quiero que se retire»: retirada provisional en **7 días laborables** como máximo y resolución en **1 mes**.
- Política de privacidad y aviso legal en el pie; informar de las cookies técnicas (solo hay de sesión: no hace falta banner de consentimiento).
- Procedimiento de brechas: aviso a la AEPD en **72 horas**; registro de actividades de una página.

### Decisiones de producto del fundador (6 de octubre de 2026)
Palabras del fundador: «No pongas fecha de nacimiento [en el alta de la cuenta]. […] A la hora de registrar la ficha sí hay que poner fecha de nacimiento para saber en qué categoría está. Pero **no quiero impedir a los más pequeños que puedan utilizar también esta app y disfrutarla**. Lo que sí haremos es limitar alguna cosilla, pero eso lo haremos ya más adelante. Será **el último punto, después del diseño incluso**. Es un tema delicado: habrá que limitarles alguna cosilla, supongo que comentarios, fotos, imágenes delicadas.»

1. **El alta de la cuenta NO pide fecha de nacimiento ni sexo.** Nadie queda fuera por su edad al crear una cuenta.
2. **La fecha de nacimiento se pide solo al crear la ficha de peleador** (para calcular su categoría por edad). Hoy el campo ya existe pero es **opcional** y en público solo se muestra la edad: queda por decidir si pasa a ser obligatoria al crear la ficha (se propone: obligatoria para quien compita, nunca visible).
3. **Las limitaciones para menores (comentarios, fotos, imágenes delicadas, aura de desconocidos…) se aplican al final: después del diseño visual.** Hasta entonces no se limita nada por edad. Esto **reordena** la ficha T-014: pasa de «antes de abrir al público» a «última tarea de la fase básica». Consecuencia que el fundador debe tener presente: **mientras T-014 no se haga, la aplicación no debe abrirse a menores reales**; la demo solo tiene datos ficticios.
4. Sigue siendo necesario el criterio de un abogado o gestor antes del lanzamiento público (preguntas abajo).

### Preguntas para un abogado o gestor (mínimo coste)
1) ¿Vale el interés legítimo para perfiles creados por terceros, y con menores? 2) ¿Y si se aprueba la ley de menores en entornos digitales (16 años)? 3) ¿Hace falta delegado de protección de datos? 4) ¿Sirve Facilita RGPD o hace falta evaluación de impacto? 5) ¿Basta la fecha de nacimiento autodeclarada? 6) ¿Autónomo, persona física o SL? 7) Responsabilidad por los comentarios (LSSI y Reglamento de Servicios Digitales). 8) ¿Puedo apoyarme en federaciones o clubes para el consentimiento de menores? 9) Transferencias a EE. UU. y cláusulas tipo. 10) ¿Debo informar a los titulares de perfiles creados por terceros (art. 14.5 RGPD)?  
**Opciones baratas:** herramientas y guías gratuitas de la AEPD (Facilita RGPD, canal de consultas), primera consulta gratuita o de bajo coste de un colegio de abogados, plantillas de gestoría revisadas por un profesional.

## Cómo se cambia de proveedor luego (sin reescribir)
- **Base de datos:** `pg_dump` → `pg_restore` en el destino y cambiar `DATABASE_URL`/`DIRECT_URL`.
- **Imágenes:** la interfaz `ImageStore` tiene un driver `db` y otro `s3`; cambiar de proveedor S3 = cambiar `S3_ENDPOINT`, claves y copiar el cubo.
- **Correo:** un solo fichero (`src/lib/common/mail.ts`) con su envío; añadir otro proveedor no toca el resto.
- **Alojamiento:** la aplicación es un servidor Node estándar (o Docker); se mueve a otro host cambiando variables.

## Fuentes
Cuatro informes de investigación del 6 de octubre de 2026 (base de datos y alojamiento, imágenes, correo y errores, menores y RGPD), basados en resúmenes de búsqueda de las páginas oficiales de Neon, Render, Cloudflare, Resend, Sentry, UptimeRobot, OVH, AEPD y BOE; **ninguna se pudo abrir directamente**. Detalle de URLs en cada ficha de tarea afectada.
