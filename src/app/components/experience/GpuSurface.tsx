"use client";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import EffectBoundary from "./EffectBoundary";
const Arena = lazy(() => import("./Arena3D"));
const Ambient = lazy(() => import("./ShaderAmbient"));
/** Un efecto mejora una superficie; no es necesario para leerla o usarla. */
export default function GpuSurface({ kind = "arena" }: { kind?: "arena" | "medal" | "ambient" }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    let visible = false;
    const update = () => setActive(visible && !document.hidden && !motion.matches && !connection?.saveData);
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }, { rootMargin: "100px" });
    observer.observe(node); motion.addEventListener("change", update); document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); motion.removeEventListener("change", update); document.removeEventListener("visibilitychange", update); };
  }, []);
  return <div ref={root} className={`gpu-surface gpu-${kind}`} aria-hidden="true">
    {kind === "arena" && <svg className="arena-fallback" viewBox="0 0 400 270"><g fill="none" stroke="currentColor" strokeWidth="2"><path d="M60 110L205 50L345 108L200 178ZM60 138L200 207L345 138M60 110V166M345 108V166M205 50V90M200 178V225"/><path d="M60 122L205 64L345 120L200 193ZM60 135L205 77L345 133L200 205Z" opacity=".4"/></g></svg>}
    {kind === "medal" && <svg className="arena-fallback" viewBox="0 0 400 270"><circle cx="200" cy="120" r="70" fill="none" stroke="currentColor" strokeWidth="3" /></svg>}
    {active && <EffectBoundary><Suspense fallback={null}>{kind === "ambient" ? <Ambient /> : <Arena medal={kind === "medal"} />}</Suspense></EffectBoundary>}
  </div>;
}
