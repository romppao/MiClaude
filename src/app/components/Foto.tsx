"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Foto opcional (avatar, banner, highlight): si no existe o no carga, desaparece y queda lo que haya debajo (iniciales o el color
 * de la disciplina). `alt` vacío cuando la foto es decorativa porque el nombre ya está escrito al lado.
 */
export default function Foto({ src, alt = "", className, loading = "lazy" }: { src: string; alt?: string; className?: string; loading?: "lazy" | "eager" }) {
  // El fallo pertenece a una dirección concreta: una foto nueva debe poder volver a cargar.
  const [fallo, setFallo] = useState<string | null>(null);
  const imagen = useRef<HTMLImageElement>(null);
  // La descarga puede fallar antes de la hidratación, cuando React aún no escucha onError.
  useEffect(() => {
    if (imagen.current?.complete && !imagen.current.naturalWidth) setFallo(src);
  }, [src]);
  if (fallo === src) return null;
  return <img ref={imagen} src={src} alt={alt} className={className} loading={loading} decoding="async" onError={() => setFallo(src)} onLoad={(e) => { if (!e.currentTarget.naturalWidth) setFallo(src); }} />;
}
