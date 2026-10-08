# Manual para mantener Ring España

Este manual permite trabajar en el proyecto sin conocer las conversaciones de sus asistentes. Se incorpora por petición expresa del fundador del 8 de octubre de 2026: «que absolutamente todo el código […] esté bien explicado» para que un programador pueda corregirlo y ampliarlo en el futuro.

## Primera lectura

1. [Reglas del proyecto](../../CLAUDE.md) y [protocolo de equipo](../EQUIPO.md): permisos, ramas y revisión.
2. [Guía de desarrollo](../DESARROLLO.md): estructura y recetas para cambiar código.
3. [Módulos y contratos](MODULOS.md): responsabilidades, restricciones y pruebas por dominio.
4. [Flujos completos](FLUJOS.md): desde el gesto de la persona hasta los datos y la respuesta.
5. [Modelo de datos](DATOS.md): relaciones, estados y consecuencias de borrar o modificar datos.
6. [Decisiones técnicas](DECISIONES.md): motivos documentados, alternativas y límites.
7. [Operación y diagnóstico](OPERACION.md): arranque, errores, pruebas y entrega a otra persona.

Para localizar cualquier archivo mantenido: [catálogo del código](CATALOGO.md). Para localizar acciones, tablas y guardas: [mapa funcional](../MAPA-FUNCIONAL.md). Ambos son índices; leer sus filas no sustituye la revisión de una regla o un permiso.

## Fuentes y vigencia

La revisión de partida corresponde a `a34deabb856ff027d74bc15cce8b1abdd943611f`, rama `claude/ring-espana-mvp`. Los PR abiertos de imágenes (#23), índices (#24) y deporte activo (#25/#26) no forman parte de esa base. El catálogo se genera con los archivos del checkout actual y deberá actualizarse cuando se integren.

El comportamiento se contrasta con el código, las migraciones y las pruebas. Una decisión del fundador tiene como fuente sus instrucciones y registros; un motivo inferido de la implementación se identifica como explicación técnica actual, sin atribuirlo a una conversación desconocida. El historial de `DIARIO.md` conserva lo sucedido entonces, aunque hoy el comportamiento haya cambiado.

## Qué significa documentar todo

Cada archivo de aplicación, prueba, script, migración y configuración mantenida tiene una entrada individual con su responsabilidad y una guía de contexto. `docs/catalogo-codigo.json` contiene las explicaciones escritas por una persona o asistente; `CATALOGO.md` es la vista generada. Se excluyen dependencias instaladas, resultados de compilación, archivos binarios de recursos y entregas aisladas de los exámenes en `docs/ingreso/`. Su finalidad y límites se explican en [Operación](OPERACION.md).

Dentro del código, una función pública con comportamiento no evidente necesita un contrato: entradas admitidas, salida, condiciones de rechazo, permisos si los hay, efectos y reglas que no pueden romperse. Los comentarios explican el motivo de una restricción, un caso límite o una elección; la sintaxis y los nombres claros explican las operaciones sencillas. Cambiar un contrato exige cambiar su explicación y sus pruebas.

## Comprobación automática

Desde cualquier directorio, con Node 22 o posterior:

```bash
node scripts/generar-catalogo.mjs
node scripts/generar-catalogo.mjs --comprobar
node --test tests/documentacion/catalogo.test.mjs
```

El primer comando regenera el catálogo. El segundo falla si falta una entrada, sobra un archivo eliminado, una explicación está vacía, una guía no existe o la salida está desactualizada. No añade automáticamente descripciones genéricas para los archivos nuevos. El CI ejecuta estas comprobaciones.

La cobertura es **estructural**: demuestra que todos los archivos del alcance tienen explicación, no que el texto sea correcto ni suficiente. La revisión humana de [REVISION.md](../REVISION.md) comprueba exactitud, contratos, casos límite y claridad. Las pruebas de la aplicación siguen siendo obligatorias para cambios funcionales.

## Actualizar al cambiar código

1. Añadir o corregir la entrada individual en `docs/catalogo-codigo.json`.
2. Actualizar la sección de módulos, flujo, datos u operación afectada. No copiar la misma regla a varias guías.
3. Explicar junto al código las restricciones que un lector no pueda deducir con seguridad; conservar las directivas de Next.js.
4. Registrar una decisión nueva como ADR/RFC según [el protocolo](../decisiones/README.md), con alternativas y evidencia. No inventar retrospectivamente decisiones.
5. Regenerar catálogo y mapa; ejecutar las comprobaciones correspondientes.
6. Anotar lo ejecutado, lo no comprobado y el siguiente paso en el registro y diario. La entrega incluye SHA, PR y límites; no depende de la memoria de un asistente.

## Comprobar que una persona puede hacerse cargo

Una persona que no haya participado debe poder arrancar una base local vacía, recorrer un flujo, localizar su acción y regla, interpretar sus pruebas y proponer un cambio sin pedir una transcripción de chat. Registrar dónde se atasca y corregir esa explicación. Esta prueba humana de transferencia queda pendiente hasta que la haga una persona independiente; el catálogo por sí solo no la acredita.
