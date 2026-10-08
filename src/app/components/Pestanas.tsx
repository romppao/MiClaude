"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type Pestana = { id: string; titulo: string; contenido: React.ReactNode };

/**
 * Secciones agrupadas que se cambian deslizando en horizontal (petición del fundador, 8 de octubre de 2026: «tienes que scrollear mucho
 * para llegar al final de la página; en lugar de ir hacia abajo sería mejor deslizar de manera horizontal y con las cosas bien agrupadas»).
 *
 * Una barra de botones arriba y, debajo, las secciones una al lado de otra en un «riel» que se mueve con `transform`: se cambia de
 * sección con el dedo (el gesto horizontal lo gestiona este componente; el vertical sigue siendo el de la página), con la barra o con
 * las flechas del teclado en la barra. No se usa el desplazamiento nativo de la pista porque el navegador lo mueve por su cuenta al
 * llevar algo a la vista y la dejaba a medio camino entre dos secciones (lección del 8 de octubre de 2026).
 *
 * Todas las secciones están siempre en la página: los enlaces con «#ancla» y las vueltas de los formularios («?seccion=…») abren la
 * sección que contiene su destino, y el foco del teclado o del lector de pantalla que entra en otra sección la activa. La altura se
 * ajusta a la sección visible para que no quede un hueco debajo.
 */
export default function Pestanas({ etiqueta, pestanas, inicial = 0 }: { etiqueta: string; pestanas: Pestana[]; inicial?: number }) {
  const pista = useRef<HTMLDivElement>(null);
  const riel = useRef<HTMLDivElement>(null);
  const barra = useRef<HTMLElement>(null);
  const [activa, setActiva] = useState(inicial);
  const [arrastre, setArrastre] = useState(0);
  const toque = useRef<{ x: number; y: number; t: number; horizontal: boolean | null } | null>(null);
  const ultima = pestanas.length - 1;

  // El texto de la «#ancla», tolerando una dirección mal formada (decodeURIComponent lanza un error con «%E0» y similares).
  const ancla = (texto: string) => { try { return decodeURIComponent(texto); } catch { return texto; } };
  const panel = (i: number) => riel.current?.children[i] as HTMLElement | undefined;
  const indiceDe = (nodo: Node | null) => (nodo && riel.current ? [...riel.current.children].findIndex((c) => c.contains(nodo)) : -1);

  const ajustarAltura = useCallback((i: number) => {
    const p = panel(i);
    if (pista.current && p) pista.current.style.height = `${p.offsetHeight}px`;
  }, []);

  const ir = useCallback((i: number, volverArriba = false) => {
    setActiva(Math.min(ultima, Math.max(0, i)));
    // Si la barra se ha quedado arriba, fuera de la vista, se vuelve a ella para leer la sección desde el principio.
    const raiz = barra.current?.parentElement;
    if (volverArriba && raiz && raiz.getBoundingClientRect().top < 0) raiz.scrollIntoView({ block: "start" });
  }, [ultima]);

  // Al cargar: la sección de la «#ancla» (o de «?seccion=», tras guardar un formulario), si está dentro; si no, la inicial.
  useEffect(() => {
    const id = ancla(location.hash.slice(1)) || new URLSearchParams(location.search).get("seccion") || "";
    const destino = id ? document.getElementById(id) : null;
    const i = indiceDe(destino);
    if (i >= 0) {
      setActiva(i);
      requestAnimationFrame(() => requestAnimationFrame(() => destino?.scrollIntoView({ block: "start" })));
    }
    const alCambiarHash = () => {
      const j = indiceDe(document.getElementById(ancla(location.hash.slice(1))));
      if (j >= 0) setActiva(j);
    };
    // Los enlaces de la aplicación (next/link, como los del menú) cambian la «#ancla» sin el evento «hashchange»: se atienden sus clics.
    const alPulsarEnlace = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a || a.closest(".pestanas-barra")) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const j = indiceDe(document.getElementById(ancla(url.hash.slice(1))));
      if (j >= 0) setActiva(j);
    };
    window.addEventListener("hashchange", alCambiarHash);
    document.addEventListener("click", alPulsarEnlace, true);
    return () => { window.removeEventListener("hashchange", alCambiarHash); document.removeEventListener("click", alPulsarEnlace, true); };
  }, []);

  // El foco que entra en otra sección la activa; y la pista nunca se desplaza por su cuenta (lo que se mueve es el riel).
  useEffect(() => {
    const p = pista.current;
    if (!p) return;
    const alEnfocar = (e: FocusEvent) => { const i = indiceDe(e.target as Node); if (i >= 0) setActiva(i); };
    const alDesplazar = () => { if (p.scrollLeft || p.scrollTop) { p.scrollLeft = 0; p.scrollTop = 0; } };
    p.addEventListener("focusin", alEnfocar);
    p.addEventListener("scroll", alDesplazar, { passive: true });
    return () => { p.removeEventListener("focusin", alEnfocar); p.removeEventListener("scroll", alDesplazar); };
  }, []);

  // La altura sigue a la sección visible, también cuando su contenido cambia (un desplegable que se abre…). Y la barra enseña su botón.
  useEffect(() => {
    // Por si el navegador desplazó la pista antes de arrancar este componente (el salto a una «#ancla» al cargar la página).
    if (pista.current && (pista.current.scrollLeft || pista.current.scrollTop)) { pista.current.scrollLeft = 0; pista.current.scrollTop = 0; }
    ajustarAltura(activa);
    const b = barra.current;
    const enlace = b?.children[activa] as HTMLElement | undefined;
    if (b && enlace && b.scrollWidth > b.clientWidth) b.scrollTo({ left: enlace.offsetLeft - (b.clientWidth - enlace.offsetWidth) / 2 });
    const p = panel(activa);
    if (!p || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => ajustarAltura(activa));
    ro.observe(p);
    const alRedimensionar = () => ajustarAltura(activa);
    window.addEventListener("resize", alRedimensionar);
    return () => { ro.disconnect(); window.removeEventListener("resize", alRedimensionar); };
  }, [activa, ajustarAltura]);

  // Gesto con el dedo: solo cuenta si es claramente horizontal; el desplazamiento vertical sigue siendo el de la página.
  const alTocar = (e: React.TouchEvent) => {
    // Dentro de una fila que ya se desliza a los lados (récords, highlights, galería…), el gesto es de esa fila, no de las pestañas.
    for (let el = e.target as HTMLElement | null; el && el !== pista.current; el = el.parentElement) {
      if (el.scrollWidth > el.clientWidth + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowX)) { toque.current = null; return; }
    }
    const t = e.touches[0];
    toque.current = { x: t.clientX, y: t.clientY, t: Date.now(), horizontal: null };
  };
  const alMover = (e: React.TouchEvent) => {
    const t0 = toque.current;
    if (!t0) return;
    const dx = e.touches[0].clientX - t0.x, dy = e.touches[0].clientY - t0.y;
    if (t0.horizontal === null && Math.abs(dx) + Math.abs(dy) > 10) t0.horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
    if (!t0.horizontal) return;
    // En la primera y en la última sección, el riel se resiste a salir.
    const borde = (activa === 0 && dx > 0) || (activa === ultima && dx < 0);
    setArrastre(borde ? dx / 4 : dx);
  };
  const alSoltar = () => {
    const t0 = toque.current;
    toque.current = null;
    if (t0?.horizontal) {
      const ancho = pista.current?.clientWidth ?? 1;
      const rapido = Math.abs(arrastre) / Math.max(1, Date.now() - t0.t) > 0.5;
      if (arrastre < 0 && (arrastre < -ancho * 0.2 || rapido)) ir(activa + 1);
      else if (arrastre > 0 && (arrastre > ancho * 0.2 || rapido)) ir(activa - 1);
    }
    setArrastre(0);
  };

  // Flechas del teclado en la barra: sección anterior o siguiente.
  const alTecla = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = Math.min(ultima, Math.max(0, activa + (e.key === "ArrowRight" ? 1 : -1)));
    ir(i);
    history.replaceState(null, "", `#${pestanas[i].id}`);
    (barra.current?.children[i] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className="pestanas">
      <nav ref={barra} className="pestanas-barra" aria-label={etiqueta} onKeyDown={alTecla}>
        {pestanas.map((t, i) => (
          <a key={t.id} className="pestana" href={`#${t.id}`} aria-current={i === activa ? "true" : undefined} onClick={(e) => { e.preventDefault(); ir(i, true); history.replaceState(null, "", `#${t.id}`); }}>{t.titulo}</a>
        ))}
      </nav>
      <p className="sr-only">Desliza a los lados para cambiar de sección, o usa los botones de arriba.</p>
      <div ref={pista} className="pestanas-pista" onTouchStart={alTocar} onTouchMove={alMover} onTouchEnd={alSoltar} onTouchCancel={alSoltar}>
        <div ref={riel} className={`pestanas-riel${arrastre ? " arrastrando" : ""}`} style={{ transform: `translateX(calc(${-activa * 100}% + ${arrastre}px))` }}>
          {pestanas.map((t) => (
            <section key={t.id} id={t.id} className="pestanas-panel" aria-label={t.titulo}>{t.contenido}</section>
          ))}
        </div>
      </div>
    </div>
  );
}
