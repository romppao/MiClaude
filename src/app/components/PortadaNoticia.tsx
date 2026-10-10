"use client";

import { useEffect, useRef, useState } from "react";

/** Pictograma de ring (cuatro postes y cuerdas) para noticias de deportes de contacto sin disciplina concreta. */
function IconoRing({ tam }: { tam: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M8 14v24M40 14v24M14 8v22M34 8v22" />
      <path d="M8 18l6-6h20l6 6M8 25l6-6h20l6 6M8 32l6-6h20l6 6" />
    </svg>
  );
}

/**
 * Detecta una foto rota aunque falle antes de que React tome la página (en el móvil el onError se pierde
 * si la imagen ya había fallado al hidratar): si al montar está «completa» sin tamaño, se trata como fallo.
 */
function useFotoRota(url: string | null) {
  const ref = useRef<HTMLImageElement>(null);
  const [fallo, setFallo] = useState(false);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFallo(true);
  }, [url]);
  return { ref, fallo, alFallar: () => setFallo(true) };
}
import type { Discipline } from "@prisma/client";
import type { Noticia } from "../../lib/news/feed";
import IconoDisciplina from "./IconoDisciplina";
import { COLOR_DISCIPLINA } from "../../lib/common/apariencia";

/**
 * Portada generada («Nano Banano / Ring España») para noticias sin fotografía o con imagen externa rota.
 * Crea un póster de combate editorial de alta gama: lona oscura, foco cenital del color de la disciplina,
 * cuerdas de ring en perspectiva y el pictograma del deporte al agua.
 */
export function CubiertaGenerada({
  disciplina,
  titulo,
  compacta = false,
}: {
  disciplina?: Discipline;
  titulo?: string;
  compacta?: boolean;
}) {
  const color = disciplina ? COLOR_DISCIPLINA[disciplina] : "#D4F67C";

  if (compacta) {
    return (
      <div
        className="noticia-imagen noticia-generada-mini"
        aria-hidden="true"
        style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle at 50% 20%, ${color}55, #101217 85%)`,
          border: `1px solid ${color}33`,
        }}
      >
        <svg
          viewBox="0 0 96 72"
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}
        >
          <line x1="0" y1="20" x2="96" y2="35" stroke={color} strokeWidth="1" />
          <line x1="0" y1="36" x2="96" y2="51" stroke={color} strokeWidth="1" />
          <line x1="0" y1="52" x2="96" y2="67" stroke={color} strokeWidth="1" />
        </svg>
        <div style={{ color, zIndex: 1, filter: `drop-shadow(0 2px 8px ${color}66)` }}>
          {disciplina ? <IconoDisciplina d={disciplina} tam={28} grosor={2} /> : <IconoRing tam={30} />}
        </div>
      </div>
    );
  }

  const grad = `grad-ring-${color.replace("#", "")}`;
  return (
    <div
      className="cubierta-generada"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -2,
        overflow: "hidden",
        pointerEvents: "none",
        background: `radial-gradient(110% 80% at 50% 0%, ${color}5c 0%, ${color}1f 38%, #0d0f15 72%, #08090d 100%)`,
      }}
    >
      {/* Ring en perspectiva: lona, tres cuerdas y foco cenital del color de la disciplina */}
      <svg
        viewBox="0 0 600 360"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="50%" stopColor={color} stopOpacity="0.75" />
            <stop offset="100%" stopColor={color} stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <polygon points="20,360 580,360 470,215 130,215" fill={color} fillOpacity="0.07" />
        <line x1="0" y1="150" x2="600" y2="150" stroke={`url(#${grad})`} strokeWidth="3" />
        <line x1="0" y1="178" x2="600" y2="178" stroke={`url(#${grad})`} strokeWidth="3" />
        <line x1="0" y1="206" x2="600" y2="206" stroke={`url(#${grad})`} strokeWidth="3" />
      </svg>

      {/* Pictograma del deporte como marca de agua en la esquina: el titular, abajo a la izquierda, se lee por encima */}
      <div
        style={{
          position: "absolute",
          right: "-14px",
          top: "-6px",
          color,
          opacity: 0.28,
          transform: "rotate(-8deg)",
        }}
      >
        {disciplina ? <IconoDisciplina d={disciplina} tam={150} grosor={1.4} /> : <IconoRing tam={150} />}
      </div>
    </div>
  );
}

/**
 * Portada completa de noticia para tarjetas grandes (destacada y fila deslizable).
 * Intenta cargar la imagen original (con referrer no-referrer). Si no existe o falla,
 * activa la cubierta generada «Nano Banano» sin dejar nunca un hueco vacío.
 */
export function PortadaNoticia({
  n,
  loading = "lazy",
}: {
  n: Pick<Noticia, "imageUrl" | "disciplines" | "title">;
  loading?: "lazy" | "eager";
}) {
  const { ref, fallo, alFallar } = useFotoRota(n.imageUrl);

  if (n.imageUrl && !fallo) {
    return (
      <img
        ref={ref}
        src={n.imageUrl}
        alt=""
        loading={loading}
        referrerPolicy="no-referrer"
        onError={alFallar}
      />
    );
  }

  return <CubiertaGenerada disciplina={n.disciplines[0]} titulo={n.title} />;
}

/**
 * Miniatura lateral para listas verticales (ListaNoticias).
 * Muestra la foto o el pictograma estilizado con textura de ring.
 */
export function MiniaturaNoticia({
  n,
}: {
  n: Pick<Noticia, "imageUrl" | "disciplines" | "title">;
}) {
  const { ref, fallo, alFallar } = useFotoRota(n.imageUrl);

  if (n.imageUrl && !fallo) {
    return (
      <img
        ref={ref}
        src={n.imageUrl}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className="noticia-imagen"
        onError={alFallar}
      />
    );
  }

  return <CubiertaGenerada disciplina={n.disciplines[0]} titulo={n.title} compacta />;
}
