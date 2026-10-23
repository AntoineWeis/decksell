"use client";

import { useState } from "react";

/**
 * Panneau de filtres repliable sur mobile (fermé au départ), toujours ouvert sur grand écran.
 * `summary` : le résumé affiché sur le bouton (ex. « 2 filtres actifs »).
 */
export function FiltersPanel({ summary, children }: { summary: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="deck-filters-body"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold sm:hidden"
      >
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filtres et tri
        </span>
        <span className="flex items-center gap-2 font-normal text-muted">
          {summary}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`size-4 transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      <div id="deck-filters-body" className={`${open ? "block border-t border-line" : "hidden"} sm:block sm:border-t-0`}>
        {children}
      </div>
    </div>
  );
}
