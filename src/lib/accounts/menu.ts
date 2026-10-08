import type { Papel } from "./landing";

/**
 * Contenido del menú por tipo de cuenta. Decisión del fundador (8 de octubre de 2026): «en el menú solo te pueden aparecer las opciones
 * del usuario»; la excepción es el entrenador, que reúne las funciones de entrenador, de club y de promotora (crea veladas e interclubs).
 * «Explorar» (consultar lo público) es igual para todos; las noticias están en «Inicio». Como mucho cinco enlaces por bloque.
 * Una sola fuente para el diálogo del menú y para las pruebas.
 */
export type EnlaceMenu = { href: string; texto: string };
export type SeccionMenu = { titulo: string; enlaces: EnlaceMenu[] };
export type ExtrasMenu = { admin?: boolean; creador?: boolean; canSupport?: boolean; perfilesGestionados?: boolean; gimnasio?: string | null; promotorId?: string | null; entrenador?: string | null };

export const EXPLORAR: SeccionMenu = {
  titulo: "Explorar",
  enlaces: [
    { href: "/peleadores", texto: "Peleadores" },
    { href: "/veladas", texto: "Veladas y resultados" },
    { href: "/ranking", texto: "Ránking de aura" },
    { href: "/gimnasios", texto: "Gimnasios" },
    { href: "/entrenadores", texto: "Entrenadores" },
  ],
};

const PANEL: EnlaceMenu = { href: "/mi-panel", texto: "Mi panel" };
const SIGUIENDO: EnlaceMenu = { href: "/siguiendo", texto: "Peleadores que sigo" };
const RESERVAS: EnlaceMenu = { href: "/mis-reservas", texto: "Mis reservas de clases" };
const COMPARTIR: EnlaceMenu = { href: "/compartir", texto: "Subir vídeos o fotos de una velada" };

export function menuDe(papel: Papel, x: ExtrasMenu = {}): SeccionMenu[] {
  const propias: SeccionMenu[] = [];
  if (papel === "visitante") {
    propias.push({ titulo: "Empieza", enlaces: [{ href: "/registro", texto: "Crear una cuenta" }, { href: "/entrar", texto: "Entrar" }] });
  } else if (papel === "usuario") {
    propias.push({ titulo: "Tu espacio de aficionado", enlaces: [PANEL, SIGUIENDO, RESERVAS, COMPARTIR, { href: "/mi-panel#mis-subidas", texto: "Mis vídeos y fotos" }] });
  } else if (papel === "peleador") {
    propias.push({
      titulo: "Tu carrera",
      enlaces: [PANEL, { href: "/mi-ficha", texto: "Mi ficha y trayectoria" }, { href: "/mi-ficha#highlights", texto: "Mis highlights" }, RESERVAS, SIGUIENDO],
    });
  } else if (papel === "entrenador") {
    propias.push({ titulo: "Entrenador", enlaces: [PANEL, { href: "/mis-clases", texto: "Mis clases y solicitudes" }, ...(x.entrenador ? [{ href: `/entrenadores/${x.entrenador}`, texto: "Mi perfil de entrenador" }] : [])] });
    propias.push({
      titulo: "Club",
      enlaces: [
        ...(x.gimnasio ? [{ href: `/gimnasios/${x.gimnasio}`, texto: "Mi club o gimnasio" }] : []),
        ...(x.perfilesGestionados ? [{ href: "/mi-cuenta#perfiles", texto: "Gestionar mis perfiles" }] : []),
        { href: "/organizador#crear", texto: "Organizar un interclub" },
      ],
    });
    propias.push({ titulo: "Promotora", enlaces: [{ href: "/organizador", texto: "Mis veladas e interclubs" }, { href: "/organizador#crear", texto: "Crear una velada" }] });
  } else {
    propias.push({
      titulo: "Tu entidad",
      enlaces: [
        PANEL,
        { href: "/organizador", texto: "Mis veladas" },
        { href: "/organizador#crear", texto: "Crear una velada o un interclub" },
        ...(x.promotorId ? [{ href: `/promotores/${x.promotorId}`, texto: "Mi perfil público" }] : []),
        ...(x.perfilesGestionados ? [{ href: "/mi-cuenta#perfiles", texto: "Gestionar mis perfiles" }] : []),
      ],
    });
  }
  const cuenta: EnlaceMenu[] = [{ href: "/ayuda", texto: "¿Cómo funciona?" }];
  if (papel !== "visitante") {
    cuenta.push({ href: "/mi-cuenta", texto: "Mi cuenta" });
    if (x.canSupport) cuenta.push({ href: "/respaldar", texto: "Respaldar resultados y títulos" });
    if (x.admin) cuenta.push({ href: "/moderacion", texto: "Moderación" });
    if (x.creador) cuenta.push({ href: "/moderacion/usuarios", texto: "Administración" });
  }
  return [...propias, EXPLORAR, { titulo: papel === "visitante" ? "Ayuda" : "Tu cuenta y ayuda", enlaces: cuenta }];
}
