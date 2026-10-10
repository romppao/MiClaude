"use client";
import { useState } from "react";

/**
 * Foto opcional (avatar, banner, highlight): si no existe o no carga, desaparece y queda lo que haya debajo (iniciales o el color
 * de la disciplina). `alt` vacío cuando la foto es decorativa porque el nombre ya está escrito al lado.
 */
export default function Foto({ src, alt = "", className, loading = "lazy" }: { src: string; alt?: string; className?: string; loading?: "lazy" | "eager" }) {
  // El fallo pertenece a una dirección concreta: una foto nueva debe poder volver a cargar.
  const [fallo, setFallo] = useState<string | null>(null);
  if (fallo === src) return null;
  return <img src={src} alt={alt} className={className} loading={loading} decoding="async" onError={() => setFallo(src)} onLoad={(e) => { if (!e.currentTarget.naturalWidth) setFallo(src); }} />;
}
