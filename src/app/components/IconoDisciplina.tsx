import type { Discipline } from "@prisma/client";

/**
 * Pictograma de cada disciplina (petición del fundador, 8 de octubre de 2026: el panel de disciplinas «está muy soso […] añade imágenes o
 * iconos que indiquen qué deporte es»). Dibujos propios de trazo, en el mismo estilo que el resto de iconos, sin imágenes de terceros:
 * guante (boxeo), kimono con cinturón (jiu-jitsu), patada alta (K-1), patada con guantes (kickboxing), octógono (MMA) y rodillazo con
 * mongkol (Muay Thai). Siempre decorativos: el nombre de la disciplina va escrito al lado.
 */
const DIBUJOS: Record<Discipline, React.ReactNode> = {
  BOXEO: (
    <>
      <path d="M7.5 17.5c-1.6-1.4-2.5-3.4-2.5-6V9a5 5 0 0 1 5-5h3.5A5.5 5.5 0 0 1 19 9.5v3c0 2-.8 3.7-2 5" />
      <path d="M5.2 11.2c1.9-.4 3.6.4 4.3 2.3" />
      <path d="M10.5 4.2c-.4 2.3.6 4 2.8 4.6" />
      <rect x="7" y="17.5" width="10" height="3.5" rx="1" />
    </>
  ),
  JIUJITSU: (
    <>
      <path d="M8.5 3 4 6.5l1.5 5L8 10.5V21h8V10.5l2.5 1 1.5-5L15.5 3" />
      <path d="M8.5 3 12 9l3.5-6" />
      <path d="M8 14h8" />
      <path d="m12 14-2 4M12 14l2 4" />
    </>
  ),
  K1: (
    <>
      <circle cx="7" cy="4" r="2" />
      <path d="M7.5 6.5 9 12.5l-2 8.5" />
      <path d="m9 12.5 11.5-6" />
      <path d="M7.8 8.5 4.5 10M8 8.5l3.5-.5" />
    </>
  ),
  KICKBOXING: (
    <>
      <circle cx="6.5" cy="5" r="2" />
      <path d="M7 7.5 8 13l-2 8" />
      <path d="m8 13 5.5-.5 6.5-.5" />
      <path d="M7.5 9.5 11 9" />
      <circle cx="12.5" cy="9" r="1.6" />
    </>
  ),
  MMA: (
    <>
      <path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z" />
      <path d="M9.8 7h4.4L17 9.8v4.4L14.2 17H9.8L7 14.2V9.8z" strokeDasharray="1.2 1.6" />
    </>
  ),
  MUAYTHAI: (
    <>
      <circle cx="10" cy="4" r="2" />
      <path d="M8.2 3.2c-1.3-.2-2.3.6-2.7 1.8" />
      <path d="M10.3 6.5 10.5 13l-1 8" />
      <path d="m10.5 13 5.5-2-.5 5.5" />
      <path d="m10.4 8.5 5.6-2.5M10.4 8.5 15 9" />
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
