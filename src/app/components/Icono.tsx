/** Iconos de trazo (estilo Lucide, diseño v3). Siempre decorativos: el texto del botón o enlace dice lo que hace. */
const TRAZOS = {
  atras: "m15 18-6-6 6-6",
  siguiente: "m9 18 6-6-6-6",
  abajo: "m6 9 6 6 6-6",
  mas: "M5 12h14M12 5v14",
  flecha: "M5 12h14M12 5l7 7-7 7",
  buscar: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  aura: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  trofeo: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M18 2H6v7a6 6 0 0 0 12 0V2Z",
  gimnasio: "M2 9v6m3-9v12m3-7h8m0-5v12m3-9v6",
  capas: "M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5",
  camara: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  check: "M20 6 9 17l-5-5",
  calendario: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  personas: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  bandeja: "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
  reto: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 6.5 21 18v3h-3L6.5 9.5M11 5l-6 6M8 8 4 4M5 3 3 5",
  enviar: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  escudo: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4",
  campana: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  externo: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
} as const;

export type NombreIcono = keyof typeof TRAZOS | "play";

export default function Icono({ nombre, tam = 20, grosor = 2 }: { nombre: NombreIcono; tam?: number; grosor?: number }) {
  if (nombre === "play") return <svg aria-hidden="true" viewBox="0 0 24 24" width={tam} height={tam} fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={tam} height={tam} fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round"><path d={TRAZOS[nombre]} /></svg>;
}

/** El logotipo de dos anillos. */
export const Marca = ({ ancho = 30 }: { ancho?: number }) => (
  <svg aria-hidden="true" viewBox="0 0 64 48" width={ancho} height={(ancho * 3) / 4} style={{ color: "var(--acc)", flex: "none" }}><ellipse cx="24" cy="24" rx="18" ry="12" transform="rotate(-35 24 24)" fill="none" stroke="currentColor" strokeWidth="7" /><ellipse cx="42" cy="24" rx="18" ry="12" transform="rotate(-35 42 24)" fill="none" stroke="currentColor" strokeWidth="7" /></svg>
);
