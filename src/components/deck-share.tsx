"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "./toaster";

/** Nom de fichier lisible : « Azorius Control » → « azorius-control.txt ». */
function fileName(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "deck"}.txt`;
}

const itemClass = "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-sunken hover:text-link";

/** Bouton « Partager » et son menu : copier le lien de l'annonce, télécharger la liste en .txt. */
export function DeckShare({ listingId, title, decklistText }: { listingId: string; title: string; decklistText: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Fermeture au clic à côté ou avec Échap.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copyLink() {
    setOpen(false);
    const url = `${window.location.origin}/decks/${listingId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("success", "Lien du deck copié");
    } catch {
      toast("error", "Copie impossible : copie le lien depuis la barre d'adresse.");
    }
  }

  function download() {
    setOpen(false);
    const url = URL.createObjectURL(new Blob([decklistText], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName(title);
    a.click();
    // Libéré un peu plus tard : certains navigateurs lisent le lien après le clic.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div ref={root} className="relative flex flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line text-sm font-medium text-muted transition hover:border-link/50 hover:text-link aria-expanded:border-link/50 aria-expanded:text-link"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
          <path d="M12 15V4m0 0L8 8m4-4 4 4M5 13v6h14v-6" />
        </svg>
        Partager
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1.5 w-52 rounded-lg border border-line bg-surface p-1 shadow-xl">
          <button type="button" role="menuitem" onClick={copyLink} className={itemClass}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted" aria-hidden>
              <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
            </svg>
            Copier le lien
          </button>
          <button type="button" role="menuitem" onClick={download} className={itemClass}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted" aria-hidden>
              <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
            </svg>
            Télécharger la liste (.txt)
          </button>
        </div>
      )}
    </div>
  );
}
