"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type Pestana = { id: string; titulo: string; contenido: React.ReactNode };

/**
 * Secciones agrupadas que se cambian deslizando en horizontal (petición del fundador, 8 de octubre de 2026: «tienes que scrollear mucho
 * para llegar al final de la página; en lugar de ir hacia abajo sería mejor deslizar de manera horizontal y con las cosas bien agrupadas»).
 *
 * Es un carrusel nativo (desplazamiento horizontal con «scroll-snap»): se desliza con el dedo, con la barra de botones de arriba o con
 * el teclado. Todas las secciones están siempre en la página (sin JavaScript se ven igual, una al lado de otra), así que los enlaces con
 * «#ancla» a algo de dentro llevan a su sección, y el foco del teclado o del lector de pantalla también cambia de sección. La altura se
 * ajusta a la sección visible para que no quede un hueco debajo.
 */
export default function Pestanas({ etiqueta, pestanas, inicial = 0 }: { etiqueta: string; pestanas: Pestana[]; inicial?: number }) {
  const pista = useRef<HTMLDivElement>(null);
  const [activa, setActiva] = useState(inicial);

  const panel = (i: number) => pista.current?.children[i] as HTMLElement | undefined;

  const ajustarAltura = useCallback((i: number) => {
    const p = panel(i);
    if (pista.current && p) pista.current.style.height = `${p.offsetHeight}px`;
  }, []);

  const ir = (i: number, suave = true) => {
    const p = pista.current;
    if (!p) return;
    p.scrollTo({ left: i * p.clientWidth, behavior: suave && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
    setActiva(i);
    // Si la barra se ha quedado arriba, fuera de la vista, se vuelve a ella para empezar a leer la sección desde el principio.
    const barra = p.parentElement;
    if (suave && barra && barra.getBoundingClientRect().top < 0) barra.scrollIntoView({ block: "start" });
  };

  // Al cargar: la sección de la «#ancla» de la dirección, si hay una dentro; si no, la inicial.
  useEffect(() => {
    const p = pista.current;
    if (!p) return;
    // Tras guardar un formulario, la aplicación vuelve con «?seccion=…» (las redirecciones pierden la «#ancla»).
    const hash = decodeURIComponent(location.hash.slice(1)) || new URLSearchParams(location.search).get("seccion") || "";
    const destino = hash ? document.getElementById(hash) : null;
    const i = destino ? [...p.children].findIndex((c) => c.contains(destino)) : -1;
    if (i >= 0) {
      ir(i, false);
      requestAnimationFrame(() => destino?.scrollIntoView({ block: "start" }));
    } else ir(inicial, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sección visible según el desplazamiento horizontal (dedo, teclado o foco).
  useEffect(() => {
    const p = pista.current;
    if (!p) return;
    let marco = 0;
    const alDesplazar = () => {
      cancelAnimationFrame(marco);
      marco = requestAnimationFrame(() => setActiva(Math.min(pestanas.length - 1, Math.max(0, Math.round(p.scrollLeft / Math.max(1, p.clientWidth))))));
    };
    p.addEventListener("scroll", alDesplazar, { passive: true });
    return () => { p.removeEventListener("scroll", alDesplazar); cancelAnimationFrame(marco); };
  }, [pestanas.length]);

  // La altura sigue a la sección visible, también cuando su contenido cambia (un desplegable que se abre…).
  useEffect(() => {
    ajustarAltura(activa);
    const p = panel(activa);
    if (!p || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => ajustarAltura(activa));
    ro.observe(p);
    const alRedimensionar = () => { ajustarAltura(activa); ir(activa, false); };
    window.addEventListener("resize", alRedimensionar);
    return () => { ro.disconnect(); window.removeEventListener("resize", alRedimensionar); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa, ajustarAltura]);

  // Un enlace a «#algo» de otra sección de la misma página.
  useEffect(() => {
    const alCambiarHash = () => {
      const destino = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      const i = destino && pista.current ? [...pista.current.children].findIndex((c) => c.contains(destino)) : -1;
      if (i >= 0) ir(i);
    };
    window.addEventListener("hashchange", alCambiarHash);
    return () => window.removeEventListener("hashchange", alCambiarHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pestanas">
      <nav className="pestanas-barra" aria-label={etiqueta}>
        {pestanas.map((t, i) => (
          <a key={t.id} className="pestana" href={`#${t.id}`} aria-current={i === activa ? "true" : undefined} onClick={(e) => { e.preventDefault(); ir(i); history.replaceState(null, "", `#${t.id}`); }}>{t.titulo}</a>
        ))}
      </nav>
      <p className="sr-only">Desliza a los lados para cambiar de sección, o usa los botones de arriba.</p>
      <div ref={pista} className="pestanas-pista">
        {pestanas.map((t) => (
          <section key={t.id} id={t.id} className="pestanas-panel" aria-label={t.titulo}>{t.contenido}</section>
        ))}
      </div>
    </div>
  );
}
