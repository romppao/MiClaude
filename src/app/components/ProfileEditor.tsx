"use client";
import { useState } from "react";
import InputFoto from "./InputFoto";
export default function ProfileEditor({ kind, id, avatarX, avatarY, bannerX, bannerY, version }: { kind: string; id: string; avatarX: number; avatarY: number; bannerX: number; bannerY: number; version?: number }) {
  const [aX, setAX] = useState(avatarX), [aY, setAY] = useState(avatarY), [bX, setBX] = useState(bannerX), [bY, setBY] = useState(bannerY);
  const [avatar, setAvatar] = useState(`/imagenes/${kind}/${id}/avatar?v=${version ?? 0}`), [banner, setBanner] = useState(`/imagenes/${kind}/${id}/banner?v=${version ?? 0}`);
  const file = (f: File | null, setter: (s: string) => void) => { if (!f) return; const r = new FileReader(); r.onload = () => setter(String(r.result)); r.readAsDataURL(f); };
  return <fieldset className="image-editor"><legend>Foto y banner</legend>
    <p className="mut">Elige cualquier foto de tu móvil o de tu ordenador: se ajusta sola. Después mueve los deslizadores para elegir el encuadre. Se retiran sus metadatos, como el lugar donde se hizo.</p>
    <div className="image-preview"><img onError={e => { e.currentTarget.style.visibility = "hidden"; }} onLoad={e => { e.currentTarget.style.visibility = "visible"; }} className="preview-banner" src={banner} alt="Vista previa del banner" style={{ objectPosition: `${bX}% ${bY}%` }} /><img onError={e => { e.currentTarget.style.visibility = "hidden"; }} onLoad={e => { e.currentTarget.style.visibility = "visible"; }} className="preview-avatar" src={avatar} alt="Vista previa de la foto" style={{ objectPosition: `${aX}% ${aY}%` }} /></div>
    <div className="editor-columns"><div>
      <label className="field"><span>Foto o logotipo</span><InputFoto name="avatar" alElegir={f => file(f, setAvatar)} /></label>
      <label className="field"><span>Encuadre horizontal de la foto</span><input type="range" name="avatarX" min="0" max="100" value={aX} onChange={e => setAX(Number(e.target.value))} /></label>
      <label className="field"><span>Encuadre vertical de la foto</span><input type="range" name="avatarY" min="0" max="100" value={aY} onChange={e => setAY(Number(e.target.value))} /></label>
      <label><input type="checkbox" name="removeAvatar" /> Quitar la foto actual</label>
    </div><div>
      <label className="field"><span>Banner</span><InputFoto name="banner" alElegir={f => file(f, setBanner)} /></label>
      <label className="field"><span>Encuadre horizontal del banner</span><input type="range" name="bannerX" min="0" max="100" value={bX} onChange={e => setBX(Number(e.target.value))} /></label>
      <label className="field"><span>Encuadre vertical del banner</span><input type="range" name="bannerY" min="0" max="100" value={bY} onChange={e => setBY(Number(e.target.value))} /></label>
      <label><input type="checkbox" name="removeBanner" /> Quitar el banner actual</label>
    </div></div>
    <p className="mut">Sin banner se mostrará el fondo violeta de Ring España. Usa imágenes tuyas o que tengas permiso para publicar. Si subes una imagen nueva, sustituye a la anterior.</p>
  </fieldset>;
}
