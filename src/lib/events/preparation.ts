import { eventDayReached } from "../common/dates";

/** Lista informativa, nunca autoriza una velada ni certifica categorías o aptitud. */
export function eventPreparation(event: { slug: string; date: Date; ticketUrl: string | null; bouts: { result: string | null; weightClass: string | null }[] }, now = new Date()) {
  const route = `/organizador/${event.slug}`;
  if (eventDayReached(event.date, now)) return [{ texto: "Todos los resultados anotados", completo: event.bouts.length > 0 && event.bouts.every((b) => !!b.result), href: `${route}#cartel` }];
  return [
    { texto: "Cartel con algún combate", completo: event.bouts.length > 0, href: `${route}#anadir-combate` },
    { texto: "Enlace de entradas", completo: !!event.ticketUrl, href: `${route}#datos` },
    { texto: "Categorías de peso puestas", completo: event.bouts.length > 0 && event.bouts.every((b) => !!b.weightClass), href: `${route}#cartel` },
  ];
}
