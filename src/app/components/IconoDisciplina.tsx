import type { Discipline } from "@prisma/client";

/**
 * Pictograma de cada disciplina (petición del fundador, 8 de octubre de 2026: el panel de disciplinas «está muy soso […] añade imágenes o
 * iconos que indiquen qué deporte es»). Dibujos propios de trazo, en el mismo estilo que el resto de iconos, sin imágenes de terceros:
 * guante (boxeo), kimono con cinturón (jiu-jitsu), patada alta con guantes (K-1), patada frontal con espinilleras (kickboxing), octógono
 * con guante de dedos abiertos (MMA) y rodillazo con mongkol y prajied (Muay Thai). El fundador pidió «un pelín más de forma» para que
 * se reconozca cada deporte. Siempre decorativos: el nombre de la disciplina va escrito al lado.
 */
const DIBUJOS: Record<Discipline, React.ReactNode> = {
  // Guante con su puño, el pulgar, la costura y el puño de cordones.
  BOXEO: (
    <>
      <path d="M7.5 16.5C5.9 15.1 5 13.1 5 10.5V8.5A4.5 4.5 0 0 1 9.5 4h4A5.5 5.5 0 0 1 19 9.5v2.5c0 2-.7 3.4-1.9 4.5" />
      <path d="M5.1 10.6c2-.5 3.8.3 4.5 2.4" />
      <path d="M10.2 4.1c-.5 2.4.5 4.1 2.9 4.7" />
      <rect x="7" y="16.5" width="10" height="4.5" rx="1.2" />
      <path d="M9.5 18.75h5" />
    </>
  ),
  // Kimono: mangas, solapas cruzadas y cinturón con su nudo y las dos puntas colgando.
  JIUJITSU: (
    <>
      <path d="M8.5 3 3 6.5l1.8 5.5 3.2-1.4V20h8v-9.4l3.2 1.4L21 6.5 15.5 3" />
      <path d="M8.5 3 12.6 12.6M15.5 3l-2.9 5.6" />
      <path d="M8 12.6h8" strokeWidth="2.6" />
      <path d="m11.4 13.6-1.6 4.4M12.6 13.6l1.6 4.4" />
    </>
  ),
  // Patada alta con guantes (K-1).
  K1: (
    <>
      <circle cx="6.5" cy="4" r="2" />
      <path d="M7 6.5 8.6 12.5 6.6 21" />
      <path d="m8.6 12.5 12-6.5" />
      <path d="M7.4 8.5 5 10M7.6 8.6l2.8-.8" />
      <circle cx="4.6" cy="10.4" r="1.1" fill="currentColor" />
      <circle cx="11" cy="7.6" r="1.1" fill="currentColor" />
    </>
  ),
  // Patada frontal con guantes y espinillera (kickboxing).
  KICKBOXING: (
    <>
      <circle cx="6" cy="5" r="2" />
      <path d="M6.6 7.5 7.8 13l-2 8" />
      <path d="m7.8 13 5.7-.6 6.5-.4" />
      <path d="M14.5 11.5v1.8M16.8 11.3v1.8" />
      <path d="M7 9.5 11 9" />
      <circle cx="12.4" cy="8.9" r="1.6" fill="currentColor" />
    </>
  ),
  // Octógono con la malla de la jaula y un guante de dedos abiertos.
  MMA: (
    <>
      <path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z" />
      <rect x="8.6" y="10.4" width="7" height="5.6" rx="2" />
      <path d="M10 10.4V8.2M11.8 10.4V7.6M13.6 10.4V7.6M15.2 10.8V8.6M8.6 12.6H7.4" />
    </>
  ),
  // Rodillazo con el mongkol (la cinta de la cabeza, con su cola) y el prajied en el brazo.
  MUAYTHAI: (
    <>
      <circle cx="10.5" cy="4.6" r="2.1" />
      <path d="M8.4 4.3c1.3-.7 2.9-.7 4.2 0" strokeWidth="2.4" />
      <path d="M8.5 4.4 5.6 6.4M8.5 4.4 5.4 4" />
      <path d="M10.6 7.1 10.8 13l-1 8" />
      <path d="m10.8 13 5.4-2.2-.6 5.7" />
      <path d="m10.7 8.6 5.3-2.6M10.7 8.6 15.4 9.3" />
      <path d="m12.3 7.9.6 1.2" strokeWidth="2.6" />
    </>
  ),
};

export default function IconoDisciplina({ d, tam = 24, grosor = 1.8 }: { d: Discipline; tam?: number; grosor?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={tam} height={tam} fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      {DIBUJOS[d]}
    </svg>
  );
}
