"use client";

import { useState } from "react";

/**
 * Panneau de filtres : la recherche toujours visible en haut, le reste (archétype, prix, tri,
 * couleurs…) replié derrière « Filtres et tri », sur mobile comme sur ordinateur. Ouvert d'office
 * quand un de ces filtres est actif, pour qu'on voie ce qui restreint la liste.
 * `summary` : le résumé affiché sur le bouton (ex. « 2 filtres · 11 decks »).
 */
export function FiltersPanel({
  summary,
  search,
  defaultOpen = false,
  children,
}: {
  summary: string;
  search: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-0 flex-1 basis-64">{search}</div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="deck-filters-body"
          className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition max-sm:w-full max-sm:justify-between ${
            open ? "border-link/50 text-link" : "border-line hover:border-link/40"
          }`}
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
      </div>
      <div id="deck-filters-body" hidden={!open} className="border-t border-line">
        {children}
      </div>
    </div>
  );
}
