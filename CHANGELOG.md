# Registro de cambios de Lona

Todas las versiones de la aplicación, de la más nueva a la más antigua. Cómo se numeran, cuándo se sube cada número y cómo se vuelve
a una versión anterior: [`docs/VERSIONES.md`](docs/VERSIONES.md).

Cada versión se agrupa en **Añadido** (funciones nuevas), **Cambiado** (lo que ya existía y ahora funciona o se ve distinto),
**Corregido** (fallos), **Eliminado** y **Seguridad**. Se escribe para personas: qué notará quien use la aplicación o quien la mantenga.

Las versiones 0.1.0 a 0.8.0 se reconstruyeron el 13 de octubre de 2026 a partir de los PR fusionados, cuando se empezó a llevar el
control de versiones. La línea «Fusión» indica el commit de cada una: el CI crea su etiqueta (`v0.X.Y`) en GitHub.

## [Sin publicar]


## [0.14.0] — 2026-10-15

PR de Claude: textos legales para el lanzamiento (petición del fundador). Son borradores pendientes de revisión jurídica (`docs/LEGAL.md`).

### Añadido
- **Aviso legal** (`/aviso-legal`): titular, NIF, domicilio y contacto, que se leen de variables de entorno, y un **bloque de responsabilidad**: contenido de usuarios, datos orientativos, veladas de terceros, riesgo deportivo, enlaces y disponibilidad.
- **Condiciones de uso** (`/condiciones`): normas, licencia del contenido, cómo avisar de contenido ilícito, moderación, sanciones y reclamaciones (DSA).
- **Política de cookies** (`/cookies`) con el inventario real: solo cookies técnicas y de preferencia, sin banner.
- El servidor avisa al arrancar si faltan los datos del titular (`TITULAR_NOMBRE`, `TITULAR_NIF`, `TITULAR_DOMICILIO`).

### Cambiado
- **Privacidad:**
  - responsable completo;
  - base legal de cada uso;
  - datos obligatorios;
  - decisiones automatizadas;
  - proveedores y transferencias;
  - menores;
  - plazo de un mes para los derechos;
  - fecha de actualización.
- **Pie de página:** enlaces a Condiciones, Privacidad, Cookies y Aviso legal.
- **Consentimiento al crear la cuenta:** el registro y «Continuar con Google» mencionan también las condiciones de uso.

### Corregido (recorrido de Antigravity por la demo, 14-10-2026)
- **Noticias:** las búsquedas de Google Noticias colaban en la portada común titulares ajenos a los deportes de contacto (fundas de móvil, camiones, vela, fútbol). Ahora, si el titular no nombra ninguna disciplina, se descarta. Las ya guardadas se borran al reiniciar el servidor.
- **Privacidad:** los dos avisos sobre fotos y highlights iban encima del título; ahora van debajo.
- **Veladas:** la etiqueta «no oficial» pasa a escribirse con mayúscula inicial, como las demás.
