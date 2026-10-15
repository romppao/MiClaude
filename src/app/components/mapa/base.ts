import type { Map as MapaLibre } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * Lo común a todos los mapas de Lona (13 de octubre de 2026): mapa libre de OpenFreeMap (datos de OpenStreetMap), textos en español,
 * botones de acercar y alejar, y el «trabajador» servido desde public/vendor (scripts/copiar-maplibre.mjs). Solo se usa en el navegador
 * y la librería se carga al abrir una pantalla con mapa, no en las demás. Si el dispositivo no puede dibujarlo (sin WebGL), lanza:
 * quien lo llama lo dice y deja la información en texto.
 */
export const ESTILO_MAPA = "https://tiles.openfreemap.org/styles/positron";

const TEXTOS_MAPA = {
  "AttributionControl.ToggleAttribution": "Mostrar u ocultar la autoría del mapa",
  "AttributionControl.MapFeedback": "Avisar de un error en el mapa",
  "Map.Title": "Mapa",
  "Marker.Title": "Punto del mapa",
  "NavigationControl.ZoomIn": "Acercar",
  "NavigationControl.ZoomOut": "Alejar",
  "NavigationControl.ResetBearing": "Volver a orientar al norte",
  "Popup.Close": "Cerrar",
};

export async function crearMapa(contenedor: HTMLElement, centro: { lat: number; lng: number }, zoom: number): Promise<{ ml: typeof import("maplibre-gl"); m: MapaLibre }> {
  const ml = await import("maplibre-gl");
  ml.setWorkerUrl(`/vendor/maplibre/${ml.getVersion()}/maplibre-gl-worker.mjs`);
  const m = new ml.Map({
    container: contenedor, style: ESTILO_MAPA, center: [centro.lng, centro.lat], zoom,
    attributionControl: { compact: true }, locale: TEXTOS_MAPA, dragRotate: false, pitchWithRotate: false,
  });
  // MapLibre y el estilo crean enlaces de autoría fuera de React. Se conservan sus textos y destinos;
  // al actualizar fuentes o estilo se repone el aviso accesible y la protección de la pestaña de origen (T-013).
  const avisarEnlaces = () => {
    for (const enlace of contenedor.querySelectorAll<HTMLAnchorElement>('.maplibregl-ctrl-attrib a[target="_blank"]')) {
      const nombre = enlace.getAttribute("aria-label") || enlace.textContent?.trim() || "Autoría del mapa";
      if (!/otra pestaña|otra página web/i.test(nombre)) enlace.setAttribute("aria-label", `${nombre} (se abre en otra pestaña)`);
      enlace.rel = [...new Set([...enlace.rel.split(/\s+/).filter(Boolean), "noopener", "noreferrer"])].join(" ");
    }
  };
  avisarEnlaces();
  for (const evento of ["load", "styledata", "sourcedata", "terrain"] as const) m.on(evento, avisarEnlaces);
  m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
  // «Acercar» y «Alejar» actúan sobre el mapa: se dice con aria-controls (lo usan los lectores de pantalla y tests/e2e/enlaces.mjs).
  if (!contenedor.id) contenedor.id = `mapa-${Math.random().toString(36).slice(2, 10)}`;
  for (const b of contenedor.querySelectorAll(".maplibregl-ctrl-zoom-in, .maplibregl-ctrl-zoom-out")) b.setAttribute("aria-controls", contenedor.id);
  m.on("error", () => { /* Sin conexión con el servidor de mapas: el mapa sale sin fondo, pero los marcadores siguen. */ });
  return { ml, m };
}

