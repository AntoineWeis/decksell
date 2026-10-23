"use client";

import { useState } from "react";
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

const buttonClass =
  "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line text-sm font-medium text-muted transition hover:border-link/50 hover:text-link";

/** Deux petits boutons sous le prix : copier le lien de l'annonce, télécharger la liste en .txt. */
export function DeckShare({ listingId, title, decklistText }: { listingId: string; title: string; decklistText: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/decks/${listingId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast("success", "Lien du deck copié");
    } catch {
      toast("error", "Copie impossible : copie le lien depuis la barre d'adresse.");
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([decklistText], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName(title);
    a.click();
    // Libéré un peu plus tard : certains navigateurs lisent le lien après le clic.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="mt-2 flex gap-2">
      <button type="button" onClick={copyLink} className={buttonClass}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
          {copied ? (
            <path d="m5 12 4.5 4.5L19 7" />
          ) : (
            <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
          )}
        </svg>
        {copied ? "Copié" : "Copier le lien"}
      </button>
      <button type="button" onClick={download} className={buttonClass}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
          <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
        </svg>
        Télécharger .txt
      </button>
    </div>
  );
}
