"use client";
import { useId, useState } from "react";

/**
 * Formulario de reserva de entradas con el desglose al momento: total, señal por Bizum (la mitad, redondeada hacia arriba) y lo que
 * queda para la puerta. La acción del servidor vuelve a calcularlo todo; esto solo lo enseña antes de reservar.
 */
export default function ReservaEntradas({ eventId, precio, maximo, accion }: { eventId: string; precio: number; maximo: number; accion: (f: FormData) => Promise<void> }) {
  const [cantidad, setCantidad] = useState(1);
  const id = useId();
  const total = precio * cantidad, senal = Math.ceil(total / 2);
  return (
    <form action={accion} className="reserva-entradas">
      <input type="hidden" name="eventId" value={eventId} />
      <div className="field">
        <label htmlFor={id}>Entradas</label>
        <select id={id} name="cantidad" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}>
          {Array.from({ length: maximo }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n === 1 ? "1 entrada" : `${n} entradas`}</option>)}
        </select>
      </div>
      <dl className="desglose" aria-live="polite">
        <div><dt>Total</dt><dd>{total} €</dd></div>
        <div className="desglose-senal"><dt>Señal ahora por Bizum</dt><dd>{senal} €</dd></div>
        <div><dt>En la puerta</dt><dd>{total - senal} €</dd></div>
      </dl>
      <button className="btn btn-grande">Reservar {cantidad === 1 ? "1 entrada" : `${cantidad} entradas`}</button>
      <p className="meta" style={{ margin: 0 }}>Después verás el número de Bizum de la promotora y tu código para el concepto. Tienes hasta 24 horas para enviar la señal (menos si la velada está muy cerca); si no llega, la reserva caduca. La promotora verá tu nombre y tu correo.</p>
    </form>
  );
}
