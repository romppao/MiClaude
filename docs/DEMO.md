# Demo local para probar la aplicación

Una demo con **datos ficticios** (peleadores, gimnasios y veladas inventados) para recorrer la aplicación en el navegador como lo haría cualquier persona.

> **Importante:** la demo corre en *tu ordenador* (o en el equipo donde se ejecute). No hay una dirección pública: la sesión de desarrollo en la nube no admite visitas desde fuera. Para una dirección que se pueda compartir hay que alojar la aplicación en un servicio (ver «Para compartirla» al final).

## Arrancar

Requisitos: Node 22 y PostgreSQL 16 (si tienes Docker, el script lo arranca solo).

```bash
git clone https://github.com/romppao/MiClaude && cd MiClaude
git checkout claude/ring-espana-mvp
scripts/demo.sh iniciar        # instala, compila, crea la base con datos de ejemplo y arranca en http://localhost:3000
```

## Probarla con tu propia cuenta

1. Abre `http://localhost:3000/registro` y crea una cuenta (elige «peleador» para tener ficha).
2. **Confirma el correo.** La demo no envía correos de verdad: ejecuta `scripts/demo.sh correos` y abre el enlace `/verificar?token=…` que aparece.
3. Para probar la **moderación** y la aprobación de organizadores: crea otra cuenta y ejecuta `scripts/demo.sh moderador su@correo.es`; cierra sesión y vuelve a entrar.

## Qué conviene recorrer (guion corto)

| Papel | Qué probar |
|---|---|
| Sin cuenta | Buscar un peleador, abrir su ficha, ver el calendario de veladas, entrar en «¿Cómo funciona?» |
| Aficionado | Seguir a un peleador, dar aura a un combate, avisar de un error en una ficha |
| Peleador | Crear la ficha, registrar un combate (con rival nuevo y con rival homónimo), quitar un combate registrado por error |
| Organizador | Solicitar ser organizador, crear una velada, añadir combates al cartel, corregirla, cancelarla |
| Moderación | Aprobar organizadores y reclamaciones, revisar avisos y combates en revisión |

Guion más detallado por personas: [`pruebas/personas.md`](pruebas/personas.md). Si algo no se entiende a la primera o un botón no hace lo que dice, anótalo: es un fallo de la aplicación, no tuyo.

## Terminar

```bash
scripts/demo.sh parar          # detiene el servidor y borra la base de la demo
```

## Para compartirla con otras personas

Hace falta alojar la aplicación (servidor Node + PostgreSQL) en un servicio con una dirección pública y definir las variables de `.env.example` (`APP_URL`, `DATABASE_URL`, el correo, `TRUSTED_PROXY_HOPS`…). Es una decisión pendiente del fundador (alojamiento y proveedor de correo): ver `TRASLADO.md` §7.
