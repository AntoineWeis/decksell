"use client";

import { useEffect, useState } from "react";

/**
 * Barre fixe en bas de l'écran, sur mobile : le prix et un bouton qui ramène à l'encadré prix
 * (contact, favori, photos). Elle n'apparaît qu'une fois cet encadré sorti de l'écran par le haut,
 * pendant qu'on parcourt la liste de cartes.
 */
export function MobileBuyBar({ price, targetId = "prix", label = "Contacter le vendeur" }: { price: string; targetId?: string; label?: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(target);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <div
      aria-hidden={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.5)] backdrop-blur transition duration-200 lg:hidden ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <p className="leading-tight">
          <span className="block text-xs text-muted">Prix demandé</span>
          <span className="display text-xl tabular-nums">{price}</span>
        </p>
        <button
          type="button"
          tabIndex={shown ? 0 : -1}
          onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="h-11 shrink-0 rounded-xl bg-accent px-5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
        >
          {label}
        </button>
      </div>
    </div>
  );
}
