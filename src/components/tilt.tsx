"use client";

import { useRef } from "react";
import { TILT_CLASS } from "@/lib/tilt-class";

// Inclinaison 3D d'une carte qui suit la souris, comme une carte qu'on tient en main.
// Souris seulement (pas au toucher), et rien si l'on préfère moins d'animations.

const prefersStill = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Applique l'inclinaison : x et y vont de -0,5 à 0,5 (position de la souris). */
function tilt(el: HTMLElement, x: number, y: number, max: number) {
  el.style.setProperty("--ry", `${(x * max * 2).toFixed(2)}deg`);
  el.style.setProperty("--rx", `${(-y * max * 2).toFixed(2)}deg`);
}

/** Carte inclinable : suit la souris quand on la survole, revient à plat quand on la quitte. */
export function TiltCard({ children, className = "", max = 9 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`${TILT_CLASS} ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || prefersStill()) return;
        const r = e.currentTarget.getBoundingClientRect();
        tilt(e.currentTarget, (e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5, max);
      }}
      onPointerLeave={(e) => tilt(e.currentTarget, 0, 0, max)}
    >
      {children}
    </div>
  );
}
