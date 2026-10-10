# Experiencia fluida conservando la identidad

Base: 2f8fee7. Encargo explícito del fundador: rendimiento, móvil, GSAP, shaders y Three.js; sin desplegar y con logo pendiente.

| Antes | Después | Por qué |
|---|---|---|
| Pestanas hace setState por touchmove | Referencias y una escritura transform por frame | El dedo no necesita renderizar todas las secciones |
| Alto de panel animado 250 ms | Ajuste de alto inmediato | Evitar layout en cada frame |
| Hover sin distinguir puntero | Solo hover:hover y pointer:fine | Evitar estados pegados en móvil |
| safe-area sin viewport-fit | viewport-fit cover y padding en chrome fijo | Mantener controles fuera de notch/home indicator |
| Efectos grandes en carga inicial | Importación diferida, visibilidad y degradación | Priorizar contenido y batería |

Oportunidades: menú ocasional (continuidad, 240 ms ease-drawer); confirmaciones/notificaciones (feedback, Sonner); presentación de bienvenida (explicación y deleite, escena limitada); aparición de tarjetas secundarias (continuidad, 180 ms power3.out, máximo seis por grupo). Rechazados: animación de navegación por teclado, contador que oculta o cambia un récord real mientras se lee, partículas detrás de formularios/moderación y scroll artificial que bloquea desplazamiento nativo.

Implementación: ampliar tokens --ease-out cubic-bezier(0.23,1,0.32,1) y --ease-drawer cubic-bezier(0.32,0.72,0,1). Usar useGSAP con scope y limpieza para timelines/ScrollTrigger. CSS para pulsaciones simples. Three.js únicamente en objeto decorativo, carga diferida y límites DPR/draw calls; WebGPU Shaders solo con capacidad disponible. Un canvas por efecto, detener fuera de pantalla y con documento oculto. Movimiento reducido: contenidos siempre visibles, color/fade suave, sin escenas animadas. Transparencia reducida: superficies opacas.

Verificación: compilación, pruebas de controles, gestos cancelados/interrumpidos, teclado, no GPU, movimiento reducido, vacíos y datos extremos; screenshots reales escritorio/móvil; medir intervalos de frames y recursos en navegador de producción. No certificar 60 fps en teléfonos físicos ni Swift/Expo/APK sin ese hardware/toolchain.
