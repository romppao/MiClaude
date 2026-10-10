"use client";

import { useState } from "react";
import type { Discipline } from "@prisma/client";
import type { Noticia } from "../../lib/news/feed";
import IconoDisciplina from "./IconoDisciplina";
import { COLOR_DISCIPLINA } from "../../lib/common/apariencia";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";

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
  const etiqueta = disciplina ? DISCIPLINE_LABEL[disciplina] : "COMBATE";

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
          background: `radial-gradient(circle at 50% 20%, ${color}28, #101217 80%)`,
          border: `1px solid ${color}33`,
        }}
      >
        <svg
          viewBox="0 0 96 72"
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none" }}
        >
          <line x1="0" y1="20" x2="96" y2="35" stroke={color} strokeWidth="1" />
          <line x1="0" y1="36" x2="96" y2="51" stroke={color} strokeWidth="1" />
          <line x1="0" y1="52" x2="96" y2="67" stroke={color} strokeWidth="1" />
        </svg>
        <div style={{ color, zIndex: 1, filter: `drop-shadow(0 2px 8px ${color}66)` }}>
          {disciplina ? <IconoDisciplina d={disciplina} tam={28} grosor={2} /> : <span style={{ font: "800 13px var(--font)" }}>RE</span>}
        </div>
      </div>
    );
  }

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
        background: `radial-gradient(120% 85% at 50% 0%, ${color}26 0%, #0d0f15 75%, #08090d 100%)`,
      }}
    >
      {/* Geometría de ring y cuerdas de combate */}
      <svg
        viewBox="0 0 600 360"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.18 }}
      >
        <defs>
          <linearGradient id={`grad-ring-${color.replace("#", "")}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Lona en perspectiva */}
        <polygon points="40,360 560,360 480,210 120,210" fill="rgba(255,255,255,0.02)" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
        {/* Cuerdas */}
        <line x1="0" y1="120" x2="600" y2="155" stroke={`url(#grad-ring-${color.replace("#", "")})`} strokeWidth="1.6" />
        <line x1="0" y1="150" x2="600" y2="185" stroke={`url(#grad-ring-${color.replace("#", "")})`} strokeWidth="1.6" />
        <line x1="0" y1="180" x2="600" y2="215" stroke={`url(#grad-ring-${color.replace("#", "")})`} strokeWidth="1.6" />
        {/* Foco cenital */}
        <circle cx="300" cy="0" r="160" fill={color} opacity="0.12" />
      </svg>

      {/* Marca de agua artística con el pictograma del deporte */}
      {disciplina && (
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "18px",
            color,
            opacity: 0.22,
            transform: "scale(2.2)",
            transformOrigin: "top right",
            filter: "blur(0.4px)",
          }}
        >
          <IconoDisciplina d={disciplina} tam={56} grosor={1.6} />
        </div>
      )}

      {/* Sello Ring España */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "14px",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "999px",
          background: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${color}44`,
          color: "#ffffff",
          font: "700 10px var(--font)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
        {etiqueta} · RING ESPAÑA
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
  const [fallo, setFallo] = useState(false);

  if (n.imageUrl && !fallo) {
    return (
      <img
        src={n.imageUrl}
        alt=""
        loading={loading}
        referrerPolicy="no-referrer"
        onError={() => setFallo(true)}
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
  const [fallo, setFallo] = useState(false);

  if (n.imageUrl && !fallo) {
    return (
      <img
        src={n.imageUrl}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className="noticia-imagen"
        onError={() => setFallo(true)}
      />
    );
  }

  return <CubiertaGenerada disciplina={n.disciplines[0]} titulo={n.title} compacta />;
}
