# T-016 — Hallazgos de Codex, partes 3–5

Fecha: 2026-10-14. Base revisada: `8f0798561875d06dc88ed828dbe2d6eb922f838e`, rama `claude/ring-espana-mvp`, versión 0.13.1. Rama del informe: `codex/revision-t016`.

Revisión de solo lectura de la aplicación: los arreglos se deciden y se entregan después. Los cambios de F (#56) y el avance local de G no forman parte de esta base.

## Método y límites

- Comprobada coincidencia del commit remoto con `origin/claude/ring-espana-mvp` local. `git fetch`, `scripts/estado.mjs` y su reserva se intentaron: la red de terminal impide fetch/push. Reserva equivalente publicada mediante el conector GitHub, con commit vacío y sin CI.
- Se inspeccionan pantallas, consultas, acciones, guardas y pruebas; los casos indicados como renderizados se ejecutan con las fuentes reales y dependencias simuladas, sin base de datos ni escrituras de producto.
- `npm test`: 737/737 unitarias pasan en la base 0.13.1. Esto no descarta los hallazgos que esas pruebas no cubren.
- No se ha ejecutado una vuelta de navegador con PostgreSQL vacío ni se ha modificado la demo/oficial. La revisión de Antigravity es independiente. «Comprobado» identifica la evidencia concreta, no una validación integral del servicio.

## Parte 3 — Visitante y aficionado (revisada)

### C3-01 — El listado de seguidos desvela resultados amateur privados

- **Gravedad:** BLOQUEA EL LANZAMIENTO.
- **Archivo:línea:** `src/app/siguiendo/page.tsx:74`.
- **Qué falla y reproducción:** seguir a un amateur con `recordPublic=false` y un combate celebrado con resultado. En `/siguiendo`, «Últimos resultados» escribe «Gana …» y el método, sin comprobar la privacidad de ninguno de los dos participantes.
- **Arreglo:** reutilizar la regla de privacidad compartida para mostrar solo el enfrentamiento si el récord amateur de alguno es privado.
- **Estado:** **comprobado** por lectura y renderizado de la pantalla real con ambos participantes privados: el HTML contiene ganador y `(KO)`. La ficha y el panel sí tienen una regla de ocultación; el fallo está en este recorrido.

### C3-02 — La galería publica el apellido completo de fichas provisionales

- **Gravedad:** BLOQUEA EL LANZAMIENTO.
- **Archivo:línea:** `src/app/components/Multimedia.tsx:22`, `src/app/components/Multimedia.tsx:26`.
- **Qué falla y reproducción:** compartir un vídeo/foto asociado a un combate contra una persona sin cuenta cuya ficha es provisional. `SELECT_MEDIO` pide nombre y apellidos pero no `listed`/`hiddenAt`; el texto del combate concatena el apellido completo. Aparece en la galería de velada y ficha, aunque la política promete solo la inicial para estas personas (`src/app/privacidad/page.tsx:44`).
- **Arreglo:** seleccionar el estado público de la ficha y usar `publicFighterName` también en los nombres y textos alternativos de las galerías.
- **Estado:** **comprobado** por lectura y renderizado de `GaleriaMedios`: un participante provisional se publica como «Provisional ApellidoCompleto».

### C3-03 — No hay condiciones de uso y la información de almacenamiento está incompleta

- **Gravedad:** BLOQUEA EL LANZAMIENTO por las condiciones pendientes de la revisión jurídica; la ausencia de una página separada de cookies no obliga por sí sola a añadir un banner.
- **Archivo:línea:** `src/app/registro/page.tsx:101`, `src/app/layout.tsx:110`, `src/app/privacidad/page.tsx:29`.
- **Qué falla y reproducción:** abrir registro y pie de página: solo enlazan privacidad; no existen rutas de condiciones ni cookies. El registro presenta una aceptación genérica del tratamiento de datos, sin condiciones del servicio. La ficha de lanzamiento deja los textos jurídicos pendientes del abogado.
- **Arreglo:** publicar las condiciones aprobadas, enlazarlas en registro/pie y completar la información de almacenamiento y el texto del alta con revisión jurídica.
- **Estado:** **comprobado** por inventario de rutas y lectura. Hallazgo ya conocido por Claude, confirmado en esta base.

**Inventario de almacenamiento:** cookie `session` de autenticación (30 días), `volver` para retorno del registro (2 h), cookie temporal de viaje a Google; preferencia de tema `lona:tema` en localStorage y recuperación de formularios en sessionStorage. No se ha encontrado analítica, publicidad ni reproductor externo incrustado: los vídeos externos se abren por enlace. La privacidad dice «una cookie» y omite el resto. En el código propio los usos son funcionales; si el servicio desplegado mantiene exclusivamente finalidades exentas, no necesita banner de consentimiento. Queda por comprobar el tráfico/almacenamiento de terceros en navegador y la revisión jurídica. Fuente: [Guía sobre cookies de la AEPD](https://www.aepd.es/guias/guia-cookies.pdf), apartados de cookies técnicas y finalidades exentas.

**Lo revisado sin otro fallo demostrado:** estados vacíos explícitos de portada, noticias, búsqueda, seguidos y panel; búsqueda parametrizada con exclusión de fichas ocultas y veladas no públicas; acceso, recuperación y verificación con guardas y pruebas existentes; límites de aura y avisos en servidor; banner/acciones de demo condicionados a `DEMO_MODE=si`. No se ha comprobado entrega de correos reales ni funcionamiento del mapa en dispositivo.

## Parte 4 — Peleador y entrenador

Pendiente de revisión.

## Parte 5 — Gimnasios, organizadores y veladas

Pendiente de revisión.
