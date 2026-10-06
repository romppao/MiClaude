# ADR-004 — Librerías de animación para el diseño «D» (GSAP y Lenis)

**Estado:** **propuesta, pendiente de aprobación del fundador** · **Autor:** Claude · **Fecha:** 6 de octubre de 2026 · Relacionado: [`../diseno/SISTEMA-D.md`](../diseno/SISTEMA-D.md), [ADR-003](ADR-003-proveedores-fase-0.md)

## Contexto
El diseño elegido por el fundador (maqueta de Antigravity) usa **GSAP** con **ScrollTrigger** (entradas, parallax, cuentas) y **Lenis** (scroll suave). Hoy la aplicación no tiene dependencias de animación («sin otras dependencias de ejecución», `README.md`). Añadir una dependencia es una decisión del equipo (`EQUIPO.md`: `package.json` es un archivo delicado). Principio del fundador: coste mínimo, estándares abiertos y fácil de cambiar.

## Hechos comprobados (6 de octubre de 2026, en las fuentes oficiales)
- **GSAP:** la página oficial de la licencia dice «**GSAP is now free for everyone**, thanks to Webflow's support» y el paquete `gsap` 3.15.0 en npm declara la licencia «Standard 'no charge' license». La licencia **prohíbe** usarlo en herramientas que permitan crear animaciones visuales sin código y compitan con Webflow: no es nuestro caso. **No se ha consultado asesoramiento jurídico**; conviene releer el texto completo antes de publicar.
- **Lenis:** licencia **MIT**, paquete `lenis` 1.3.26 en npm.
- La maqueta carga versiones antiguas desde CDN (`gsap` 3.12.2 y `lenis` 1.0.19): en la aplicación se instalan los paquetes y se sirven desde nuestro propio servidor.

## Opciones
| Opción | Ventaja | Inconveniente |
|---|---|---|
| **A. GSAP + ScrollTrigger + Lenis (recomendada)** | Es exactamente lo que ve el fundador en la maqueta; ecosistema grande; rendimiento probado | ~ decenas de KB de JavaScript en el cliente (se **mide** y se anota en cada PR); dependencia nueva; licencia propia de GSAP (no es MIT) |
| B. Solo CSS (`animation-timeline: scroll()`, transiciones) | Sin dependencias ni peso | No reproduce el scroll suave ni todo el parallax; soporte desigual de `animation-timeline` en navegadores; hay que reescribir la maqueta |
| C. Motion (antes Framer Motion) | Muy integrado con React | Otra dependencia; el diseño original está hecho con GSAP |

## Decisión propuesta
**Opción A**, con estas condiciones:
1. Paquetes `gsap` y `lenis` instalados (versiones fijadas en `package-lock.json`), cargados **solo en el cliente** y **solo en las pantallas que los usan** (carga diferida), nunca en el servidor.
2. Todo con **mejora progresiva**: sin JavaScript o con «reducir movimiento», la página se lee igual (ver `SISTEMA-D.md` §3).
3. **Presupuesto:** el peso adicional de JavaScript se mide con `next build` y se anota en cada PR; si una pantalla supera 150 KB de JavaScript propio, se abre una propuesta.
4. **Sin Tailwind** ni otros paquetes de la maqueta.
5. Una capa fina propia (`src/app/ui/movimiento/`) envuelve a GSAP y Lenis: si algún día hay que cambiarlos, se cambia en un solo sitio.

## Qué hace falta del fundador
Aprobar la opción A (o elegir otra). **Hasta entonces, T-016 y las pantallas (Codex) se desarrollan sin movimiento** (todo lo demás del diseño es CSS) y el movimiento se añade al aprobarse.

## Lo que no está verificado
El peso exacto en KB de `gsap` + `ScrollTrigger` + `lenis` con el empaquetado de Next 15: se medirá en la primera implementación. No se afirma una cifra aquí.
