"use client";

import { useEffect, useRef, useState } from "react";
import type { Discipline, Method } from "@prisma/client";
import { METHODS_BY_DISCIPLINE, isDiscipline } from "../../lib/common/disciplines";
import { METHOD_LABEL } from "../../lib/common/labels";

const TODOS: Method[] = ["UD", "SD", "MD", "KO", "TKO", "SUBMISSION", "POINTS", "ADVANTAGE", "RTD", "DQ"];

/**
 * «Cómo terminó» con solo las formas de terminar de la disciplina elegida en el mismo formulario (petición del fundador:
 * en boxeo no puede aparecer la sumisión). El servidor lo vuelve a comprobar (`lib/bouts/rules.ts`). Sin JavaScript se ven todas.
 */
export default function MetodoSegunDisciplina({ inicial, defaultValue = "" }: { inicial?: Discipline; defaultValue?: string }) {
  const ref = useRef<HTMLSelectElement>(null);
  const [disciplina, setDisciplina] = useState<Discipline | undefined>(inicial);
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const leer = () => { const v = (form.elements.namedItem("discipline") as RadioNodeList | HTMLSelectElement | null)?.value ?? ""; setDisciplina(isDiscipline(v) ? v : undefined); };
    leer();
    form.addEventListener("change", leer);
    return () => form.removeEventListener("change", leer);
  }, []);
  const metodos = disciplina ? METHODS_BY_DISCIPLINE[disciplina].filter((m) => m !== "DRAW") : TODOS;
  return (
    <select ref={ref} name="method" defaultValue={defaultValue} key={disciplina ?? "todas"}>
      <option value="">Elige cómo terminó…</option>
      {metodos.map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
    </select>
  );
}
