import { enlaceComoLlegar, type OrigenUbicacion, type Punto } from "../../lib/common/mapa";
import MapaUbicacion from "./MapaUbicacion";

/**
 * «Dónde está» / «Dónde entrena» en la ficha de un gimnasio o de un entrenador (13 de octubre de 2026): la dirección en texto, el mapa
 * y «Cómo llegar» con la aplicación de mapas del teléfono. El texto y el enlace funcionan aunque el mapa no se pueda dibujar.
 */
export default function DondeEsta({ titulo, nombre, direccion, punto }: { titulo: string; nombre: string; direccion: string; punto: (Punto & { origen: OrigenUbicacion }) | null }) {
  return (
    <section className="donde-esta" aria-labelledby="titulo-donde">
      <h2 id="titulo-donde">{titulo}</h2>
      <p className="mut" style={{ margin: "0 0 10px" }}>{direccion}{punto && punto.origen !== "direccion" && <> · <span>ubicación aproximada (todavía no ha puesto su dirección exacta)</span></>}</p>
      {punto && <MapaUbicacion lat={punto.lat} lng={punto.lng} nombre={nombre} origen={punto.origen} />}
      {punto && punto.origen === "direccion" && (
        <p style={{ margin: "10px 0 0" }}><a href={enlaceComoLlegar(punto)} target="_blank" rel="noopener noreferrer">Cómo llegar<span className="sr-only"> (se abre en otra pestaña)</span><span aria-hidden="true"> ↗</span></a></p>
      )}
    </section>
  );
}
