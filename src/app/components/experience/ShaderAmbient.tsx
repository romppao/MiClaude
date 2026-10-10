"use client";
import { useState } from "react";
import { Shader, MeshGradient, CursorTrail } from "shaders/react";
export default function ShaderAmbient() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <Shader className="shader-ambient" disableTelemetry onUnavailable={() => setFailed(true)}>
    <MeshGradient colorA="#0A0A0C" colorB="#BE33F5" stops={null} colorSpace="oklab" speed={.18} count={3} drift={.2} />
    <CursorTrail colorA="#D4F67C" colorB="#BE33F5" radius={.5} length={.18} opacity={.14} blendMode="screen" />
  </Shader>;
}
