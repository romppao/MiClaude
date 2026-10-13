"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapaLibre, Marker } from "maplibre-gl";
import { distanciaKm, mejoresDeLaZona, textoDistancia, type OrigenUbicacion, type Punto } from "../../lib/common/mapa";
import { crearMapa } from "./mapa/base";

/**
 * Mapa de gimnasios (petición del fundador, 13 de octubre de 2026: «que el usuario, en vez de que le salga una lista muy aburrida y larga
 * hacia abajo, mire directamente en el mapa. Que le salga un mapa y luego los mejores gimnasios de su zona según la valoración»).
 *
 * - Mapa libre (components/mapa/base.ts). En el tema oscuro se invierte por CSS.
 * - «Los mejores de tu zona»: por la valoración Lona (lib/common/mapa.ts: aura de sus peleadores, peleadores, entrenadores y sello).
 *   Sin ubicación, los mejores de la búsqueda o provincia; con «Usar mi ubicación», los de alrededor, y se puede ordenar por cercanía.
 * - La ubicación **no sale del dispositivo** (la distancia se calcula aquí) y no se guarda.
 * - Accesible: los marcadores son botones con nombre y 44 px de zona táctil; lo que hay en el mapa está también en texto.
 */
export type GimnasioEnMapa = Punto & {
  id: string; slug: string; nombre: string; ciudad: string; provincia: string; verificado: boolean;
  peleadores: number; entrenadores: number; aura: number; valoracion: number; origen: OrigenUbicacion;
};

const CUANTOS = 6;
type Estado = { tipo: "inicio" | "buscando" | "listo" | "sin-permiso" | "sin-ubicacion" | "sin-mapa"; texto: string };
type Orden = "valoracion" | "cercania";

export default function MapaGimnasios({ gimnasios, centro, zoom, zona }: { gimnasios: GimnasioEnMapa[]; centro: Punto; zoom: number; zona: string }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLibre | null>(null);
  const marcaYo = useRef<Marker | null>(null);
  const libreria = useRef<typeof import("maplibre-gl") | null>(null);
  const [yo, setYo] = useState<Punto | null>(null);
  const [orden, setOrden] = useState<Orden>("valoracion");
  const [estado, setEstado] = useState<Estado>({ tipo: "inicio", texto: "" });
  const [mapaListo, setMapaListo] = useState(false);

  // El mapa se carga solo en el navegador y solo en esta pantalla. Los gimnasios llegan con la página: si cambian los filtros,
  // la página se vuelve a cargar entera (y este componente con ella).
  useEffect(() => {
    let cancelado = false;
    let m: MapaLibre | null = null;
    (async () => {
      try {
        if (!contenedor.current) return;
        const creado = await crearMapa(contenedor.current, centro, zoom);
        if (cancelado) { creado.m.remove(); return; }
        const { ml } = creado;
        const mapaActual = creado.m;
        m = mapaActual;
        libreria.current = ml;
        // Marcadores agrupados: los que en pantalla quedarían a menos de 48 px se juntan en uno con el número de gimnasios
        // (tocarlo acerca el mapa). Así ninguno tapa a otro y todos se pueden pulsar con el dedo.
        let marcadores: Marker[] = [];
        const pintar = () => {
          for (const mk of marcadores) mk.remove();
          marcadores = [];
          for (const grupo of agrupar(gimnasios, (g) => mapaActual.project([g.lng, g.lat]), 48)) {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.setAttribute("aria-controls", "mapa-gimnasios-lienzo");
            if (grupo.length === 1) {
              const g = grupo[0];
              boton.className = g.verificado ? "marcador-gimnasio verificado" : "marcador-gimnasio";
              boton.setAttribute("aria-label", `${g.nombre}, ${g.ciudad}`);
              const popup = new ml.Popup({ offset: 18, closeButton: true, maxWidth: "260px" }).setDOMContent(contenidoPopup(g));
              marcadores.push(new ml.Marker({ element: boton, anchor: "center" }).setLngLat([g.lng, g.lat]).setPopup(popup).addTo(mapaActual));
            } else {
              boton.className = "marcador-grupo";
              boton.textContent = String(grupo.length);
              boton.setAttribute("aria-label", `${grupo.length} gimnasios en esta zona. Acercar el mapa`);
              const caja = new ml.LngLatBounds();
              for (const g of grupo) caja.extend([g.lng, g.lat]);
              const juntos = grupo.every((g) => g.lat === grupo[0].lat && g.lng === grupo[0].lng);
              boton.addEventListener("click", (ev) => {
                ev.stopPropagation();
                if (juntos || mapaActual.getZoom() >= 15) mapaActual.easeTo({ center: caja.getCenter(), zoom: Math.min(mapaActual.getZoom() + 2, 17) });
                else mapaActual.fitBounds(caja, { padding: 64, maxZoom: 16 });
              });
              marcadores.push(new ml.Marker({ element: boton, anchor: "center" }).setLngLat(caja.getCenter()).addTo(mapaActual));
            }
          }
        };
        if (gimnasios.length > 1) {
          const b = new ml.LngLatBounds();
          for (const g of gimnasios) b.extend([g.lng, g.lat]);
          mapaActual.fitBounds(b, { padding: 48, maxZoom: 12, duration: 0 });
        }
        mapaActual.on("moveend", pintar);
        pintar();
        mapa.current = mapaActual;
        setMapaListo(true);
      } catch {
        if (!cancelado) setEstado({ tipo: "sin-mapa", texto: "Este dispositivo no puede mostrar el mapa. Abajo tienes los gimnasios en una lista." });
      }
    })();
    return () => { cancelado = true; m?.remove(); mapa.current = null; };
  }, []);

  const mejores = useMemo(() => {
    if (yo && orden === "cercania") return gimnasios.map((g) => ({ ...g, km: distanciaKm(yo, g) as number | null })).sort((a, b) => (a.km ?? 0) - (b.km ?? 0)).slice(0, CUANTOS);
    return mejoresDeLaZona(gimnasios, yo, CUANTOS);
  }, [yo, orden, gimnasios]);

  const usarMiUbicacion = () => {
    if (!("geolocation" in navigator)) { setEstado({ tipo: "sin-ubicacion", texto: "Este navegador no puede darnos tu ubicación. Elige tu provincia en los filtros de arriba." }); return; }
    setEstado({ tipo: "buscando", texto: "Buscando tu ubicación…" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setYo(p);
        setEstado({ tipo: "listo", texto: "Te mostramos los mejores gimnasios de tu zona. Tu ubicación no se guarda." });
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

  const titulo = yo ? (orden === "cercania" ? "Los más cercanos a ti" : "Los mejores de tu zona") : `Los mejores ${zona}`;
  return (
    <section className="mapa-gimnasios" aria-labelledby="titulo-mapa">
      <div className="mapa-cabecera">
        <h2 id="titulo-mapa">Gimnasios en el mapa</h2>
        <button type="button" onClick={usarMiUbicacion} disabled={estado.tipo === "buscando"} aria-controls="mapa-gimnasios-lienzo">Usar mi ubicación</button>
      </div>
      <p className="mut mapa-ayuda">Toca un punto para ver el gimnasio. Con «Usar mi ubicación» te mostramos los mejores de tu zona; tu ubicación se usa solo en tu dispositivo y no se guarda.</p>
      <p role="status" aria-live="polite" className={estado.tipo === "sin-permiso" || estado.tipo === "sin-ubicacion" || estado.tipo === "sin-mapa" ? "notice notice-info" : "sr-only"}>{estado.texto}</p>
      <div ref={contenedor} id="mapa-gimnasios-lienzo" className="mapa-lienzo" data-listo={mapaListo ? "si" : "no"} hidden={estado.tipo === "sin-mapa"} />

      {mejores.length > 0 && (
        <section aria-labelledby="titulo-mejores" className="mapa-mejores">
          <div className="mapa-cabecera">
            <h2 id="titulo-mejores">{titulo}</h2>
            {yo && (
              <div className="segmentos" role="group" aria-label="Ordenar">
                <button type="button" aria-controls="lista-mejores" aria-pressed={orden === "valoracion"} className={orden === "valoracion" ? "activo" : undefined} onClick={() => setOrden("valoracion")}>Mejores</button>
                <button type="button" aria-controls="lista-mejores" aria-pressed={orden === "cercania"} className={orden === "cercania" ? "activo" : undefined} onClick={() => setOrden("cercania")}>Más cerca</button>
              </div>
            )}
          </div>
          <ol id="lista-mejores" className="lista-gimnasios">
            {mejores.map((g, i) => (
              <li key={g.id}>
                <Link href={`/gimnasios/${g.slug}`} className="tarjeta-gimnasio">
                  {g.km !== null ? <span className="distancia">{textoDistancia(g.km)}</span> : <span className="puesto"><span className="sr-only">Puesto </span>{i + 1}</span>}
                  <span className="cuerpo">
                    <strong>{g.nombre}</strong>
                    <span className="meta">{g.ciudad} ({g.provincia}){g.origen !== "direccion" && " · ubicación aproximada"}</span>
                    <span className="meta">{g.verificado && <span className="sello-verificado"><span aria-hidden="true">✓ </span>Verificado</span>}{razones(g)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <details className="como-se-valora">
            <summary>¿Cómo se valoran los gimnasios?</summary>
            <p>Con lo que pasa de verdad en Lona: el aura que la comunidad ha dado a sus peleadores, cuántos peleadores y entrenadores tiene y si un moderador lo ha verificado. Nadie puede pagar para salir antes.</p>
          </details>
        </section>
      )}
    </section>
  );
}

/** «12 peleadores · 3 entrenadores · 140 de aura»: por qué está en la lista, en palabras. */
function razones(g: GimnasioEnMapa): string {
  const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
  return [plural(g.peleadores, "peleador", "peleadores"), g.entrenadores > 0 && plural(g.entrenadores, "entrenador", "entrenadores"), g.aura > 0 && `${g.aura} de aura`].filter(Boolean).join(" · ");
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
