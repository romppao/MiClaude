# Lecciones aprendidas y cómo retomar

Errores, callejones sin salida y sus causas reales, para no repetirlos y para poder retomar cualquier punto.
Se completa en cada sesión (ver [`DIARIO.md`](DIARIO.md)). Formato: **qué pasó → causa real → cómo se resolvió → qué hacer la próxima vez**.

## Producto y decisiones

| Qué pasó | Causa real | Cómo se resolvió / regla |
|---|---|---|
| El primer MVP copiaba el enfoque BoxRec (profesional, catálogo) | Se interpretó la petición literalmente y no se había explorado el foco real del fundador | El fundador reorientó a amateur + valoración del público + Madrid. **Regla:** enseñar algo pronto y reorientar es más barato que planificar en abstracto |
| Se asumió que registrar «tu propio récord» era suficiente | Un dato autodeclarado no es fiable | Niveles de respaldo (`SELF_REPORTED` → `CONFIRMED` → `VERIFIED`, `DISPUTED`). **Regla:** todo dato que aporta un usuario necesita un estado de fiabilidad visible |
| El diseño gráfico no se trató | El fundador prefirió aplazarlo (los diseños generados no le suelen gustar) | UI provisional y funcional. **Regla:** no invertir en diseño hasta que lo pida; si se aborda, consultar antes qué le gusta |

## Técnicas

| Qué pasó | Causa real | Cómo se resolvió / regla |
|---|---|---|
| El build de Next.js fallaba con «Can't resolve '@/lib/db'» | Se instaló **TypeScript 7**, incompatible con Next 15 (no ofrece la API que Next necesita, y por eso no leía los alias del `tsconfig`). El mensaje de error real solo salió después | Se fijó TypeScript 5 y se usan imports relativos. **Regla:** ante un error de resolución de módulos, mirar antes las versiones de las dependencias que la configuración. Fijar versiones mayores de TypeScript |
| Un test e2e marcaba «OK» sin comprobar nada | Escribí `check(..., true)` como marcador y se me pasó | Se sustituyó por una comprobación real (y para eso hubo que ocultar el formulario de valorar a quien no tiene email verificado: era un fallo de producto, no solo de test). **Regla:** un test que no puede fallar no es un test; revisar los marcadores antes de dar algo por probado |
| El script e2e fallaba en el primer `click("button")` | Con la sesión iniciada, el primer botón de la página era «Salir» de la cabecera | Selectores acotados a `main form button`. **Regla:** selectores específicos en tests de navegador |
| Se probó contra el servidor **antiguo** y `/registro` daba 404 | Una prueba anterior dejó `next start` vivo en el puerto; el nuevo no arrancó (`EADDRINUSE`) | Matar el proceso y relanzar. **Regla:** comprobar el log de arranque y que el puerto es del build actual antes de diagnosticar |
| `pkill -f "next start"` mataba también mi propia shell | El patrón coincidía con la línea de comandos del propio comando | Patrón con corchetes (`next-serve[r]`) o proceso por PID. **Regla:** no usar `pkill -f` con un texto que aparezca en el propio comando |
| Redirect abierto en la acción de valorar | El destino `back` venía del formulario sin validar | Se limita a rutas internas (`/…` y no `//…`). Detectado al revisar el código antes de probar. **Regla:** nunca redirigir a una URL que venga del cliente sin validarla |
| Un cambio en el esquema pedía `--accept-data-loss` | Prisma avisó por la restricción única nueva en `Boxer.userId` | Aceptado solo porque era la BD local de demostración. **Regla:** con datos reales, migraciones (`prisma migrate`), no `db push` |
| El PostgreSQL local se paraba entre sesiones | El entorno de trabajo es efímero y no conserva los procesos | Reiniciarlo con `pg_ctl` antes de probar. **Regla:** si «no puede alcanzar la base de datos», comprobarlo antes de sospechar del código |
| El CI no se ejecutaba al subir la rama | El workflow solo se disparaba en `push` a `master/main` y en pull requests; la rama no tenía PR | `on: push` sin filtro de ramas. **Regla:** comprobar en GitHub que la primera ejecución arranca de verdad |
| Un cambio de texto con `replace` no se aplicó y no dio error | El patrón no coincidía con el formato (Prisma reformatea el esquema); el fallo solo apareció después en tipos | Editar con la herramienta de edición o verificar con `grep` tras cada sustitución. **Regla:** comprobar que un reemplazo automático se aplicó |

## Del proceso de trabajo

- El clasificador de permisos del entorno falló de forma intermitente y bloqueó varios comandos; mientras tanto se avanzó en tareas que no necesitaban shell (documentación). **Regla:** cuando algo externo se cae, avanzar en lo que no depende de ello.
- Se dejó un marcador de posición sin implementar (una función vacía) al escribir un fichero largo; se detectó al releer. **Regla:** releer lo escrito antes de compilar; nunca dejar «TODO» invisibles.

## Cómo retomar el proyecto (guía rápida)

1. Leer [`ARQUITECTURA.md`](ARQUITECTURA.md) (estado vigente) y la última entrada de [`DIARIO.md`](DIARIO.md).
2. `npm install`, copiar `.env.example` a `.env`, tener un PostgreSQL y ejecutar `npx prisma db push` y `npm run db:seed`.
3. Comprobar que todo está sano: `npm run typecheck && npm test`; para el flujo completo, `npm run test:e2e` (ver README).
4. Consultar [`IDEAS.md`](IDEAS.md) para elegir el siguiente paso (empezar por lo marcado 🔵).
5. Al terminar, añadir la entrada al diario y actualizar ideas y lecciones.
