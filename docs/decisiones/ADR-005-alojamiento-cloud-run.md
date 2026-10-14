# ADR-005 — La versión real se aloja en Google Cloud Run; la demo sigue en Render

**Estado:** aprobada por el fundador el 14 de octubre de 2026. Eligió «Google Cloud Run (recomendado)» tras pedir que se investigara «profundamente y al más mínimo detalle si son las mejores herramientas». Actualiza el apartado de alojamiento de [ADR-003](ADR-003-proveedores-fase-0.md); el resto de ADR-003 sigue vigente.
**Fecha:** 14 de octubre de 2026 · **Dominio:** lonaclub.es (Infomaniak, comprado el 14-10-2026).

## Contexto
- ADR-003 preveía Render Starter (7 $ al mes) cuando entrase gente real. El fundador quiere gastar lo mínimo: «que funcionara de manera gratuita sin contar la licencia de Apple».
- La documentación de Render dice de sus instancias gratuitas: «Do not use them for production applications». Además, da **750 horas gratis al mes por espacio de trabajo**, que la demo ya consume entera porque se mantiene despierta.
- La base gratuita de Render caduca a los 30 días y se borra 14 días después (https://render.com/docs/free).

## Decisión

| Pieza | Elección | Límites verificados el 14-10-2026 |
|---|---|---|
| Web real | **Cloud Run**, `europe-west1` (Bélgica, nivel 1 de precios; la asignación de dominio de Cloud Run, en «Preview», solo existe en 10 regiones y Madrid no está) | Gratis al mes: 2 M de peticiones, 180.000 vCPU-s y 360.000 GiB-s, con CPU solo durante las peticiones. Pide cuenta de facturación. |
| Base real | **Neon Free**, `aws-eu-central-1` (Fráncfort), proyecto `lona-produccion` | 1 GB por proyecto, 100 CU-h al mes, restauración de las últimas 6 h, se apaga a los 5 minutos sin uso y no cobra excesos. |
| Base de la demo | **Neon Free**, proyecto `lona-demo` (copia de la base de Render) | Igual que la real. |
| Copias | `pg_dump` diario (`.github/workflows/copia-diaria.yml`) → **R2 con jurisdicción UE** | R2: 10 GB, salida de datos gratis. |
| Demo | Sigue en **Render gratis**, sin dominio propio | — |

## Por qué Cloud Run
- **Frente a Render gratis:** Cloud Run arranca en segundos, mientras que Render tarda unos 50 s tras 15 minutos sin uso. Además, Render no admite producción en su plan gratuito.
- **Frente a Render Starter:** cuesta 0 € en lugar de 84 $ al año.
- **Northflank** se descarta: su plan gratuito tiene 2 servicios con recursos «Limited».
- **Oracle Always Free** se descarta: hay que administrar el servidor.
- **Vercel Hobby** se descarta: no admite uso comercial.
- **Koyeb** se descarta: cerró las altas gratuitas.
- **Bélgica y no Madrid:** Madrid (`europe-southwest1`) no admite la asignación de dominio de Cloud Run, y Bélgica está a unos 8 ms de Neon en Fráncfort.
- Es una imagen Docker estándar: para cambiar de proveedor (Render, Hetzner, Fly) basta con publicar la misma imagen.

## Consecuencias
- Con la CPU solo durante las peticiones, hay **arranque en frío** de unos segundos tras un rato sin visitas. Si molesta, la salida es `--min-instances 1`, que tiene coste y requiere decisión del fundador.
- La cuenta de facturación de Google necesita un medio de pago. Se pone una **alerta de gasto de 1 €**.
- La prueba gratuita de Google (hasta finales de diciembre de 2026) hay que pasarla a cuenta normal; el uso dentro del plan gratuito no se cobra.
- Las migraciones las aplica el flujo de despliegue antes de publicar, nunca el contenedor al arrancar.
- **La versión real empieza vacía:** sin datos de ejemplo. Solo tendrá los gimnasios reales cuando se carguen (bloque D del encargo de Codex).
- Minutos de GitHub Actions (2.000 al mes, repositorio privado):
  - copia diaria: unos 60;
  - cada despliegue: unos 8;
  - `mantener-demo-despierta.yml` consume unos 4.300 y **hay que sustituirlo por un monitor externo** (UptimeRobot o Better Stack) o desactivarlo.
- Guía de operación: [`docs/PRODUCCION.md`](../PRODUCCION.md).
