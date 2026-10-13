"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapaLibre, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { distanciaKm, textoDistancia, type OrigenUbicacion, type Punto } from "../../lib/common/mapa";

/**
 * Mapa de gimnasios (petición del fundador, 13 de octubre de 2026: «un mapa de la ubicación en la que se encuentra el usuario en el que
 * le muestren los gimnasios más cercanos […] una lista se ve un poco aburrida»).
 *
 * - Mapa libre: MapLibre con los mapas de OpenFreeMap (datos de OpenStreetMap). Sin cuenta, sin clave, sin tarjeta y sin límite de
 *   visitas. Se eligió frente a Google Maps por coste y privacidad (docs/DISENO.md). En el tema oscuro el mapa se invierte por CSS.
 * - «Usar mi ubicación»: el navegador pide permiso; la ubicación **no sale del dispositivo** (la distancia se calcula aquí) y no se guarda.
 * - Si el dispositivo no puede dibujar el mapa (sin WebGL) o no hay conexión con el servidor de mapas, se dice y la lista sigue funcionando.
 * - Accesible: los marcadores son botones con nombre; toda la información del mapa está también en la lista de la página.
 */
export type GimnasioEnMapa = Punto & { id: string; slug: string; nombre: string; ciudad: string; provincia: string; verificado: boolean; peleadores: number; origen: OrigenUbicacion };

const ESTILO = "https://tiles.openfreemap.org/styles/positron";
const CERCANOS = 8;
const TEXTOS_MAPA = {
  "AttributionControl.ToggleAttribution": "Mostrar u ocultar la autoría del mapa",
  "AttributionControl.MapFeedback": "Avisar de un error en el mapa",
  "Map.Title": "Mapa de gimnasios",
  "Marker.Title": "Gimnasio",
  "NavigationControl.ZoomIn": "Acercar",
  "NavigationControl.ZoomOut": "Alejar",
  "NavigationControl.ResetBearing": "Volver a orientar al norte",
  "Popup.Close": "Cerrar",
};

type Estado = { tipo: "inicio" | "buscando" | "listo" | "sin-permiso" | "sin-ubicacion" | "sin-mapa"; texto: string };

export default function MapaGimnasios({ gimnasios, centro, zoom }: { gimnasios: GimnasioEnMapa[]; centro: Punto; zoom: number }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLibre | null>(null);
  const marcaYo = useRef<Marker | null>(null);
  const libreria = useRef<typeof import("maplibre-gl") | null>(null);
  const [yo, setYo] = useState<Punto | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: "inicio", texto: "" });
  const [mapaListo, setMapaListo] = useState(false);

  // El mapa se carga solo en el navegador y solo en esta pantalla (la librería pesa: no entra en las demás).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (cancelado || !contenedor.current) return;
        libreria.current = ml;
        ml.setWorkerUrl(`/vendor/maplibre/${ml.getVersion()}/maplibre-gl-worker.mjs`);
        const m = new ml.Map({
          container: contenedor.current, style: ESTILO, center: [centro.lng, centro.lat], zoom,
          attributionControl: { compact: true }, locale: TEXTOS_MAPA, cooperativeGestures: false, dragRotate: false, pitchWithRotate: false,
        });
        m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
        m.on("error", () => { /* Sin conexión con el servidor de mapas: los marcadores y la lista siguen funcionando. */ });
        // Marcadores agrupados: los que en pantalla quedarían a menos de 48 px se juntan en uno con el número de gimnasios
        // (tocarlo acerca el mapa). Así ninguno tapa a otro y todos se pueden pulsar con el dedo (zona táctil de 44 px).
        let marcadores: Marker[] = [];
        const pintar = () => {
          for (const mk of marcadores) mk.remove();
          marcadores = [];
          for (const grupo of agrupar(gimnasios, (g) => m.project([g.lng, g.lat]), 48)) {
            if (grupo.length === 1) {
              const g = grupo[0];
              const boton = document.createElement("button");
              boton.type = "button";
              boton.className = g.verificado ? "marcador-gimnasio verificado" : "marcador-gimnasio";
              boton.setAttribute("aria-label", `${g.nombre}, ${g.ciudad}`);
              boton.setAttribute("aria-controls", "mapa-gimnasios-lienzo"); // abre su ventanita dentro del mapa
              const popup = new ml.Popup({ offset: 18, closeButton: true, maxWidth: "260px" }).setDOMContent(contenidoPopup(g));
              marcadores.push(new ml.Marker({ element: boton, anchor: "center" }).setLngLat([g.lng, g.lat]).setPopup(popup).addTo(m));
            } else {
              const boton = document.createElement("button");
              boton.type = "button";
              boton.className = "marcador-grupo";
              boton.textContent = String(grupo.length);
              boton.setAttribute("aria-label", `${grupo.length} gimnasios en esta zona. Acercar el mapa`);
              boton.setAttribute("aria-controls", "mapa-gimnasios-lienzo"); // acerca el mapa
              const caja = new ml.LngLatBounds();
              for (const g of grupo) caja.extend([g.lng, g.lat]);
              const juntos = grupo.every((g) => g.lat === grupo[0].lat && g.lng === grupo[0].lng);
              boton.addEventListener("click", (ev) => {
                ev.stopPropagation();
                if (juntos || m.getZoom() >= 15) m.easeTo({ center: caja.getCenter(), zoom: Math.min(m.getZoom() + 2, 17) });
                else m.fitBounds(caja, { padding: 64, maxZoom: 16 });
              });
              const centroGrupo = caja.getCenter();
              marcadores.push(new ml.Marker({ element: boton, anchor: "center" }).setLngLat(centroGrupo).addTo(m));
            }
          }
        };
        m.on("moveend", pintar);
        if (gimnasios.length > 1) {
          const b = new ml.LngLatBounds();
          for (const g of gimnasios) b.extend([g.lng, g.lat]);
          m.fitBounds(b, { padding: 48, maxZoom: 12, duration: 0 });
        }
        pintar();
        mapa.current = m;
        setMapaListo(true);
      } catch {
        if (!cancelado) setEstado({ tipo: "sin-mapa", texto: "Este dispositivo no puede mostrar el mapa. Puedes usar la lista de gimnasios de abajo." });
      }
    })();
    return () => { cancelado = true; mapa.current?.remove(); mapa.current = null; };
    // Los gimnasios y el centro llegan del servidor con la página: si cambian los filtros, la página se vuelve a cargar entera.
  }, []);

  const cercanos = useMemo(() => {
    if (!yo) return [];
    return gimnasios.map((g) => ({ ...g, km: distanciaKm(yo, g) })).sort((a, b) => a.km - b.km).slice(0, CERCANOS);
  }, [yo, gimnasios]);

  const usarMiUbicacion = () => {
    if (!("geolocation" in navigator)) { setEstado({ tipo: "sin-ubicacion", texto: "Este navegador no puede darnos tu ubicación. Elige tu provincia en los filtros de arriba." }); return; }
    setEstado({ tipo: "buscando", texto: "Buscando tu ubicación…" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setYo(p);
        setEstado({ tipo: "listo", texto: "Te mostramos los gimnasios más cercanos a ti. Tu ubicación no se guarda." });
        const m = mapa.current, ml = libreria.current;
        if (m && ml) {
          marcaYo.current?.remove();
          const punto = document.createElement("span");
          punto.className = "marcador-yo";
          punto.setAttribute("aria-hidden", "true");
          marcaYo.current = new ml.Marker({ element: punto }).setLngLat([p.lng, p.lat]).addTo(m);
          m.flyTo({ center: [p.lng, p.lat], zoom: 11, duration: 900 });
        }
      },
      (err) => setEstado(err.code === err.PERMISSION_DENIED
        ? { tipo: "sin-permiso", texto: "No has dado permiso para usar tu ubicación. Puedes darlo en los ajustes del navegador o elegir tu provincia en los filtros de arriba." }
        : { tipo: "sin-ubicacion", texto: "No hemos podido saber dónde estás. Inténtalo de nuevo o elige tu provincia en los filtros de arriba." }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <section className="mapa-gimnasios" aria-labelledby="titulo-mapa">
      <div className="mapa-cabecera">
        <h2 id="titulo-mapa">Gimnasios en el mapa</h2>
        <button type="button" onClick={usarMiUbicacion} disabled={estado.tipo === "buscando"} aria-controls="mapa-gimnasios-lienzo">Usar mi ubicación</button>
      </div>
      <p className="mut mapa-ayuda">Toca un punto para ver el gimnasio. Con «Usar mi ubicación» te mostramos los más cercanos; tu ubicación se usa solo en tu dispositivo y no se guarda.</p>
      <p role="status" aria-live="polite" className={estado.tipo === "sin-permiso" || estado.tipo === "sin-ubicacion" || estado.tipo === "sin-mapa" ? "notice notice-info" : "sr-only"}>{estado.texto}</p>
      <div ref={contenedor} id="mapa-gimnasios-lienzo" className="mapa-lienzo" data-listo={mapaListo ? "si" : "no"} hidden={estado.tipo === "sin-mapa"} />

      {cercanos.length > 0 && (
        <section aria-labelledby="titulo-cercanos" className="mapa-cercanos">
          <h2 id="titulo-cercanos">Los más cercanos a ti</h2>
          <ol className="lista-gimnasios">
            {cercanos.map((g) => (
              <li key={g.id}>
                <Link href={`/gimnasios/${g.slug}`} className="tarjeta-gimnasio">
                  <span className="distancia">{textoDistancia(g.km)}</span>
                  <span className="cuerpo">
                    <strong>{g.nombre}</strong>
                    <span className="meta">{g.ciudad} ({g.provincia}) · {g.peleadores === 1 ? "1 peleador" : `${g.peleadores} peleadores`}{g.origen !== "direccion" && " · ubicación aproximada"}</span>
                  </span>
                  {g.verificado && <span className="pildora pildora-acc">Verificado</span>}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}

/** Agrupa los puntos que en pantalla quedan a menos de `radio` píxeles del primero de cada grupo (suficiente para unos cientos). */
function agrupar<T>(puntos: T[], enPantalla: (p: T) => { x: number; y: number }, radio: number): T[][] {
  const grupos: { x: number; y: number; miembros: T[] }[] = [];
  for (const p of puntos) {
    const { x, y } = enPantalla(p);
    const g = grupos.find((gr) => Math.hypot(gr.x - x, gr.y - y) < radio);
    if (g) g.miembros.push(p);
    else grupos.push({ x, y, miembros: [p] });
  }
  return grupos.map((g) => g.miembros);
}

/** Ventanita de un marcador: nombre, ciudad y enlace a la ficha. Con nodos del DOM, nunca con HTML escrito a mano. */
function contenidoPopup(g: GimnasioEnMapa): HTMLElement {
  const caja = document.createElement("div");
  caja.className = "popup-gimnasio";
  const nombre = document.createElement("strong");
  nombre.textContent = g.nombre;
  const lugar = document.createElement("span");
  lugar.textContent = `${g.ciudad} (${g.provincia})${g.origen !== "direccion" ? " · ubicación aproximada" : ""}`;
  const enlace = document.createElement("a");
  enlace.href = `/gimnasios/${g.slug}`;
  enlace.textContent = "Ver el gimnasio";
  caja.append(nombre, lugar, enlace);
  return caja;
}
