# Revisión de un PR (lista del líder técnico)

Claude revisa cada PR antes de que el fundador lo integre. Los demás asistentes pueden usar esta lista para autorevisarse **antes** de abrirlo.

**1. Alcance:** el PR hace lo que dice su ficha de tarea y nada más (sin refactores ni diseño por la libre). Si la ficha era insuficiente, el PR lo dice y propone la corrección.
**2. Comprobaciones ejecutadas de verdad:** `npm run typecheck`, `npm test`, `npm run build`, `npm run mapa:comprobar` y las pruebas de navegador de lo tocado; el registro dice qué se ejecutó y qué solo valida el CI. CI en verde en el último commit.
**3. Reglas del proyecto** (`CLAUDE.md`): español sin jerga; accesibilidad (16 px, 44 px, contraste, teclado); sin enlaces ni botones muertos (`enlaces.mjs`); móvil primero (`movil.mjs`); acciones públicas clasificadas en `autorizacion.test.ts`; sin `in`/`obj[clave]` con claves del usuario; importaciones relativas; datos de ejemplo ficticios.
**4. Datos y migraciones:** migraciones nuevas y aditivas (nunca se edita una ya integrada); sin pérdida de datos; índices para las consultas nuevas; sin consultas sin límite ni N+1.
**5. Seguridad y privacidad:** permisos comprobados en el servidor; entradas validadas; nada de datos de terceros expuestos; cuentas y archivos subidos con límites.
**6. Pruebas:** hay prueba nueva para lo nuevo (unitaria y/o de navegador con datos únicos y esperas a estados visibles); ninguna prueba saltada, relajada o con esperas arbitrarias.
**7. Documentación:** `DIARIO`, `LECCIONES`, `IDEAS`, `ARQUITECTURA`, mapa funcional y el registro del asistente; la ficha pasa a «hecha» con enlace al PR.
**8. Mirar la pantalla:** si cambia la interfaz, capturas en móvil (390 px) y se han mirado.

Resultado de la revisión: **aprobado**, **cambios pedidos** (lista numerada y concreta) o **RFC** (el PR revela un problema de plan). Claude lo escribe como comentario del PR con el pie de atribución.
