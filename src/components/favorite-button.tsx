"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { setFavorite } from "@/app/espace/favoris/actions";
import { useToast } from "./toaster";

/** Étoile, pleine quand l'annonce est enregistrée. */
export function StarIcon({ filled = false, className = "h-5 w-5" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} aria-hidden className={className}>
      <path
        strokeLinejoin="round"
        d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.13 5.1c.08.2.26.32.47.34l5.5.44c.5.04.7.66.32.99l-4.19 3.59a.56.56 0 0 0-.18.56l1.28 5.37a.56.56 0 0 1-.84.61l-4.72-2.88a.56.56 0 0 0-.58 0l-4.72 2.88a.56.56 0 0 1-.84-.6l1.28-5.38a.56.56 0 0 0-.18-.56L3.06 10.37a.56.56 0 0 1 .32-.99l5.5-.44a.56.56 0 0 0 .47-.34l2.13-5.1Z"
      />
    </svg>
  );
}

/** Bouton « Retirer » de la liste des favoris : l'annonce disparaît de la page. */
export function RemoveFavoriteButton({ listingId, title }: { listingId: string; title: string }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Retirer « ${title} » des favoris`}
      onClick={() =>
        start(async () => {
          const r = await setFavorite(listingId, false, true);
          toast(r.status === "error" ? "error" : "success", r.status === "error" ? r.message : "Retiré de tes favoris");
        })
      }
      className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted transition hover:bg-sunken hover:text-danger disabled:opacity-50"
    >
      <StarIcon filled className="h-4 w-4 text-gem-rare" />
      <span className="hidden sm:inline">{pending ? "Retrait…" : "Retirer"}</span>
    </button>
  );
}

/**
 * Bouton favori d'une annonce. `overlay` : rond, posé sur l'illustration d'une vignette ;
 * `full` : bouton sous le prix, sur la page de l'annonce.
 */
export function FavoriteButton({
  listingId,
  state,
  variant = "overlay",
  refreshPage = false,
}: {
  listingId: string;
  state: "saved" | "unsaved" | "login";
  variant?: "overlay" | "full";
  refreshPage?: boolean;
}) {
  const toast = useToast();
  const pathname = usePathname();
  const [saved, setSaved] = useState(state === "saved");
  const [pending, start] = useTransition();

  const label = saved ? "Retirer des favoris" : "Ajouter aux favoris";
  // Petite étoile blanche, translucide, sans fond ; pleine une fois l'annonce enregistrée.
  const overlayClass = `absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] transition hover:scale-110 hover:text-white focus-visible:outline-2 focus-visible:outline-white ${
    saved ? "text-white" : "text-white/70"
  }`;
  const fullClass = `mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium transition ${
    saved ? "border-gem-rare/50 text-foreground hover:bg-sunken" : "border-line hover:border-link/50 hover:text-link"
  }`;

  if (state === "login") {
    return (
      <Link
        href={`/connexion?next=${encodeURIComponent(pathname)}`}
        aria-label="Connecte-toi pour ajouter aux favoris"
        title="Ajouter aux favoris"
        className={variant === "overlay" ? overlayClass : fullClass}
      >
        <StarIcon />
        {variant === "full" && "Ajouter aux favoris"}
      </Link>
    );
  }

  function toggle() {
    const next = !saved;
    setSaved(next); // affichage immédiat, annulé si l'enregistrement échoue
    start(async () => {
      const r = await setFavorite(listingId, next, refreshPage);
      if (r.status === "error") {
        setSaved(!next);
        toast("error", r.message);
      } else {
        toast("success", next ? "Ajouté à tes favoris" : "Retiré de tes favoris");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={variant === "overlay" ? overlayClass : fullClass}
    >
      <StarIcon filled={saved} className={variant === "full" ? `h-5 w-5 ${saved ? "text-gem-rare" : ""}` : "h-5 w-5"} />
      {variant === "full" && (saved ? "Dans tes favoris" : "Ajouter aux favoris")}
    </button>
  );
}
