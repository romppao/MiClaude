"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapaLibre } from "maplibre-gl";
import type { OrigenUbicacion } from "../../lib/common/mapa";
import { crearMapa } from "./mapa/base";

/**
 * Mapa pequeño con un solo punto, para la ficha de un gimnasio o de un entrenador (petición del fundador, 13 de octubre de 2026: «cuando
 * entres al perfil de un entrenador o de un club de gimnasio […] en el mapa la ubicación exacta de dónde se le puede ir a acudir»).
 * El texto de la dirección y el enlace «Cómo llegar» los pone la página, para que funcionen aunque el mapa no se pueda dibujar.
 */
export default function MapaUbicacion({ lat, lng, nombre, origen }: { lat: number; lng: number; nombre: string; origen: OrigenUbicacion }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [fallo, setFallo] = useState(false);
  const [listo, setListo] = useState(false);
  useEffect(() => {
    let cancelado = false;
    let m: MapaLibre | null = null;
    (async () => {
      try {
        if (!contenedor.current) return;
        const creado = await crearMapa(contenedor.current, { lat, lng }, origen === "direccion" ? 15 : origen === "ciudad" ? 12 : 9);
        if (cancelado) { creado.m.remove(); return; }
        m = creado.m;
        const punto = document.createElement("span");
        punto.className = "marcador-sitio";
        punto.setAttribute("aria-hidden", "true");
        new creado.ml.Marker({ element: punto }).setLngLat([lng, lat]).addTo(m);
        setListo(true);
      } catch {
        if (!cancelado) setFallo(true);
      }
    })();
    return () => { cancelado = true; m?.remove(); };
  }, [lat, lng, origen]);
  if (fallo) return null;
  return <div ref={contenedor} className="mapa-lienzo mapa-ficha" data-listo={listo ? "si" : "no"} role="region" aria-label={`Mapa: ubicación ${origen === "direccion" ? "" : "aproximada "}de ${nombre}`} />;
}
