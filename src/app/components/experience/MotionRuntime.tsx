"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);
const settle = CustomEase.create("ring-settle", ".23,1,.32,1");

export default function MotionRuntime({ root }: { root: HTMLElement }) {
  useGSAP((_context, contextSafe) => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Solo las superficies que lo piden: ni formularios ni tablas ni toda la página.
      const elements = gsap.utils.toArray<HTMLElement>("[data-reveal]", root).slice(0, 30);
      const enter = contextSafe!((batch: Element[]) => {
        const tl = gsap.timeline({ defaults: { duration: .18, ease: settle } });
        tl.addLabel("contenido").fromTo(batch, { y: 8, opacity: .72 }, { y: 0, opacity: 1, stagger: .03, clearProps: "transform,opacity", overwrite: "auto" }, "contenido");
      });
      const triggers = ScrollTrigger.batch(elements, {
        start: "top 94%", once: true, batchMax: 6, interval: .04,
        onEnter: batch => enter(batch),
      });
      // Perspectiva únicamente decorativa, con puntero preciso. Nunca mover datos de récord.
      const fine = matchMedia("(hover: hover) and (pointer: fine)");
      const cards = fine.matches ? gsap.utils.toArray<HTMLElement>("[data-tilt]", root) : [];
      const removers = cards.map(card => {
        const x = gsap.quickTo(card, "rotationX", { duration: .4, ease: "power3.out" });
        const y = gsap.quickTo(card, "rotationY", { duration: .4, ease: "power3.out" });
        const clamp = gsap.utils.clamp(-3, 3);
        const move = (e: PointerEvent) => { const box = card.getBoundingClientRect(); x(clamp((.5 - (e.clientY-box.top)/box.height)*6)); y(clamp(((e.clientX-box.left)/box.width-.5)*6)); };
        const leave = () => { x(0); y(0); };
        card.addEventListener("pointermove", move, { passive: true }); card.addEventListener("pointerleave", leave);
        return () => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); };
      });
      return () => { triggers.forEach(t => t.kill()); removers.forEach(fn => fn()); };
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [root], revertOnUpdate: true });
  return null;
}
