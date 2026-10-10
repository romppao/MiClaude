"use client";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import EffectBoundary from "./EffectBoundary";

const MotionRuntime = lazy(() => import("./MotionRuntime"));
const Feedback = lazy(() => import("./Feedback"));
/** Contenido del servidor visible desde el primer momento. La mejora no bloquea hidratación. */
export default function Experience({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 200);
    return () => window.clearTimeout(id);
  }, []);
  return <div ref={root} className="experience-root">{children}{ready && root.current && <><EffectBoundary><Suspense fallback={null}><MotionRuntime key={pathname} root={root.current} /></Suspense></EffectBoundary><EffectBoundary><Suspense fallback={null}><Feedback /></Suspense></EffectBoundary></>}</div>;
}
