"use client";
import { useState } from "react";
export default function ProfileThumbnail({ kind, id, name }: { kind: string; id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return <span className="card-avatar"><span aria-hidden="true">{name.split(/\s+/).map(w => w[0]).slice(0,2).join("")}</span>{!failed && <img loading="lazy" src={`/imagenes/${kind}/${id}/avatar`} alt={`Foto o logotipo de ${name}`} onError={() => setFailed(true)} />}</span>;
}
