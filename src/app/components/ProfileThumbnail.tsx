import Foto from "./Foto";

/** Miniatura de un listado: iniciales debajo y la foto encima. Foto también detecta la que falla antes de la hidratación (sin foto, la
 * ruta responde 204), así no queda el icono de imagen rota sobre las iniciales. */
export default function ProfileThumbnail({ kind, id, name }: { kind: string; id: string; name: string }) {
  return <span className="card-avatar"><span aria-hidden="true">{name.split(/\s+/).map(w => w[0]).slice(0,2).join("")}</span><Foto src={`/imagenes/${kind}/${id}/avatar`} alt={`Foto o logotipo de ${name}`} /></span>;
}
