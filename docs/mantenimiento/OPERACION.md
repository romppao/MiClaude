# Operación, diagnóstico y entrega

## Arrancar sin contexto previo

Usar Node 22, PostgreSQL 16 y una base local vacía propia. [README](../../README.md) explica variables y pruebas. Crear `.env` desde `.env.example`, sin subirlo al repositorio ni copiar credenciales de producción a pruebas.

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

`db:seed` es solo para una base local vacía y ficticia: leer [`seed.ts`](../../prisma/seed.ts) antes de usarlo. No usar `SEED_CONFIRMAR=si` como instrucción rutinaria. `scripts/entorno-aislado.sh` prepara base/servidor propios si se dispone de las herramientas que exige; revisar sus comandos antes de iniciarlo. `scripts/demo.sh` y `arranque-demo.sh` corresponden a demo, no son un procedimiento de producción.

## Qué comprobar según el cambio

| Cambio | Comprobación y alcance |
|---|---|
| Explicaciones y catálogo | `node scripts/generar-catalogo.mjs --comprobar` y `node --test tests/documentacion/catalogo.test.mjs`; leer manualmente el contrato contra el código. |
| Regla de negocio | `npm run typecheck`, `npm test`; casos límite y llamadas afectadas. |
| Pantalla o acción | Lo anterior, `npm run build`, mapa, recorrido de navegador como rol autorizado y rechazado; accesibilidad y móvil si corresponde. |
| Esquema | Migraciones sobre base desechable, paridad y compatibilidad con datos anteriores, exportación/baja/retención e índices. |
| Servicio externo o despliegue | Configuración y respuesta real del servicio; salud no demuestra correo, restauración o envío de avisos. |

Comandos de catálogo sin dependencias; el mapa funcional importa TypeScript instalado con `npm ci`. Generar ambos antes del PR:

```bash
node scripts/generar-catalogo.mjs
npm run mapa
npm run mapa:comprobar
```

Para navegador hace falta el build en marcha, Chromium y PostgreSQL; consultar el procedimiento del [README](../../README.md). El CI de [ci.yml](../../.github/workflows/ci.yml) es la receta ejecutable de referencia: instala, migra, comprueba paridad, tipos, unitarias, build, navegador y axe. `test:escenarios` deja capturas y no está incluido en `test:e2e`; revisarlas a ojo. No afirmar Safari o dispositivo real probado a partir de Chromium emulado.

## Diagnóstico por síntoma

| Síntoma | Por dónde empezar | Qué evidencia conservar |
|---|---|---|
| Botón devuelve un problema | Acción en mapa → `messages.ts` → guarda/validación | Ruta, rol, pasos y código de mensaje; sin contraseñas/tokens. |
| Error 500 | Logs del servidor y punto exacto de la acción/consulta | Hora UTC, ruta, excepción y SHA; redactar datos personales. `guard` no oculta fallos inesperados. |
| `/salud` devuelve 503 | Conexión a PostgreSQL y disponibilidad | Respuesta y logs. `/salud` solo ejecuta `SELECT 1`, no valida todo el schema. |
| Servidor no arranca | `instrumentation.ts`, `env.ts`, variables exigidas | Nombres ausentes y mensaje, nunca valores secretos. |
| No llega correo | `mail.ts`, llamada a `after`, filtros de `notify.ts`, proveedor | Estado de envío y destinatario redactado. En modo log es simulación, no entrega. |
| Récord/aura no coincide | Nivel, categoría histórica, cancelación/revisión, antecedentes y tipo de contador | IDs técnicos y filtro exacto, comparados con reglas y prueba. |
| Foto desaparece o no actualiza | Propiedad/visibilidad, flags, `updatedAt`, ETag y respuesta 204/304/404 | URL sin datos privados, código y cabeceras relevantes. |
| Prueba ve cambios antiguos | PID/puerto y build servido; comprobar `EADDRINUSE` | Comando de arranque y log; parar por PID, no `pkill -f` genérico. |
| Fallo solo con muchos datos | Consulta, orden/paginación y volumen del fixture | Dataset ficticio reproducible y condición de carrera si la hay. |

`MAIL_TRANSPORT=log` imprime enlaces con secretos de verificación/recuperación. Los archivos `server.log` y capturas de pruebas pueden contener datos sensibles: no publicarlos sin revisar. Usar datos ficticios en pruebas.

## Límites operativos de la versión de partida

Avisos: `after()` y bucles de envío, sin cola durable ni reintentos garantizados. Retención: activada por peticiones y limitada por proceso, sin horario garantizado. Imágenes: bytes en PostgreSQL. Lecturas: muchas rutas dinámicas, sin dar por integrada la propuesta de caché. Clases: publicación sin reserva/pago. Copias/restauración y proveedores reales: consultar las tareas y decisiones vigentes; no inferirlos de `render.yaml`.

La configuración de demo permite excepciones de correo y papel con `DEMO_MODE=si`, exclusivamente para una copia ficticia. Un `/salud` en verde o un CI aprobado no autoriza abrir la demo como servicio real.

## Recursos y código fuera del catálogo

`public/` contiene recursos estáticos (incluida la fuente del diseño); comprobar licencia/origen y rutas al sustituirlos. Dependencias se reproducen con `package-lock.json`, no se documenta cada línea del código de terceros. `.next`, `node_modules`, cobertura y capturas son resultados, no fuentes mantenidas.

`docs/ingreso/` contiene ejercicios y entregas aisladas del equipo, no runtime de la aplicación. Sus instrucciones prohíben consultar claves de corrección y trabajos ajenos durante las pruebas. `scripts/corregir-escalera.sh` es una herramienta de evaluación; no usarla como prueba de producto ni descargar la rama de clave en un mantenimiento normal.

## Entregar a otro programador o a Claude

El relevo debe incluir: rama y SHA de partida/final; problema y alcance; archivos/contratos cambiados; comandos ejecutados con resultado real; comprobaciones pendientes; migraciones/variables nuevas si existen; PR y CI del último commit; riesgos conocidos y siguiente paso reproducible. Registrar en `APORTACIONES-<NOMBRE>.md` y diario, siguiendo [EQUIPO](../EQUIPO.md).

La revisión de documentación requiere que la otra persona compruebe un flujo y localice una regla usando el manual. Si debe pedir una conversación anterior, documentar ese atasco. Integración y despliegue siguen el protocolo del fundador; una rama preparada no equivale a cambio publicado en la demo.
