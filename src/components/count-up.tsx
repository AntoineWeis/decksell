"use client";

import { useEffect, useRef, useState } from "react";
import { formatEur } from "@/lib/pricing";

/**
 * Montant qui défile de 0 € jusqu'à sa valeur à l'affichage (moins d'une seconde), puis suit
 * les changements sans animation (ex. un prix saisi à la main). Pour le total de l'estimation.
 */
export function CountUp({ cents, delayMs = 150, durationMs = 900 }: { cents: number; delayMs?: number; durationMs?: number }) {
  const [shown, setShown] = useState(cents);
  const done = useRef(false);

  useEffect(() => {
    // Déjà animé : on suit la valeur directement.
    if (done.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      done.current = true;
      setShown(cents);
      return;
    }
    let raf = 0;
    let start = 0;
    const target = cents;
    const tick = (t: number) => {
      if (!start) start = t + delayMs;
      const p = Math.min(1, Math.max(0, (t - start) / durationMs));
      const eased = 1 - Math.pow(1 - p, 3); // ralentit en arrivant
      setShown(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else done.current = true;
    };
    setShown(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cents, delayMs, durationMs]);

  return (
    <>
      {/* Les lecteurs d'écran lisent directement la valeur finale. */}
      <span aria-hidden>{formatEur(shown)}</span>
      <span className="sr-only">{formatEur(cents)}</span>
    </>
  );
}
