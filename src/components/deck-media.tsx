"use client";

import { useState } from "react";
import { Modal } from "./modal";

const buttonClass =
  "flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line px-2 text-sm font-medium text-muted transition hover:border-link/50 hover:text-link";

/** Une photo de la galerie : squelette animé tant qu'elle n'est pas chargée. */
function Photo({ url, alt, className = "" }: { url: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {!loaded && <span className="skel absolute inset-0 rounded-none" aria-hidden />}
      {/* eslint-disable-next-line @next/next/no-img-element -- photo du vendeur, déjà réduite */}
      <img
        src={url}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`size-full object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}

/** Galerie : grande photo, flèches, miniatures. Sans photo : emplacements vides et invitation. */
function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) {
    return (
      <div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-line bg-sunken text-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-8 opacity-60" aria-hidden>
                <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          Le vendeur n&apos;a pas encore ajouté de photos des cartes. Demande-les-lui avec « Contacter le vendeur » : un
          vendeur sérieux les envoie volontiers.
        </p>
      </div>
    );
  }
  const go = (step: number) => setIndex((i) => (i + step + photos.length) % photos.length);
  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      <div className="relative">
        <Photo key={photos[index]} url={photos[index]} alt={`${title}, photo ${index + 1}`} className="aspect-[4/3] rounded-xl bg-sunken" />
        {photos.length > 1 && (
          <>
            {[-1, 1].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => go(step)}
                aria-label={step < 0 ? "Photo précédente" : "Photo suivante"}
                className={`absolute top-1/2 -translate-y-1/2 ${step < 0 ? "left-2" : "right-2"} rounded-full bg-surface/90 p-2 text-foreground shadow ring-1 ring-line backdrop-blur transition hover:text-link`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
                  <path d={step < 0 ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
                </svg>
              </button>
            ))}
            <span className="absolute bottom-2 right-2 rounded-md bg-banner/80 px-2 py-0.5 text-xs font-medium tabular-nums text-banner-ink">
              {index + 1} / {photos.length}
            </span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <li key={url} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index}
                className={`block overflow-hidden rounded-lg ring-2 transition ${i === index ? "ring-link" : "ring-transparent opacity-70 hover:opacity-100"}`}
              >
                <Photo url={url} alt="" className="h-16 w-20 bg-sunken [&>img]:object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Primer en texte simple : paragraphes séparés par une ligne vide, retours à la ligne gardés. */
function PrimerText({ text }: { text: string }) {
  return (
    <div className="max-w-none space-y-3 text-[15px] leading-7">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

/**
 * Rangée de boutons sous le prix : photos réelles du deck (toujours, avec une invitation s'il n'y
 * en a pas), primer du vendeur (seulement s'il l'a écrit), puis ce qu'on y ajoute (« Partager »).
 */
export function DeckMedia({
  title,
  photos,
  primer,
  children,
}: {
  title: string;
  photos: string[];
  primer: string | null;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState<"photos" | "primer" | null>(null);
  const close = () => setOpen(null);
  return (
    <>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => setOpen("photos")} className={buttonClass}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
            <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          Photos
          {photos.length > 0 && <span className="rounded-full bg-sunken px-1.5 text-xs font-semibold tabular-nums text-foreground">{photos.length}</span>}
        </button>
        {primer && (
          <span className="group relative flex flex-1">
            <button type="button" onClick={() => setOpen("primer")} aria-describedby="primer-tip" className={buttonClass}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
                <path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4Z" />
                <path d="M9 9h6M9 13h4" />
              </svg>
              Primer
            </button>
            {/* Info-bulle au survol et au focus clavier */}
            <span
              id="primer-tip"
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background opacity-0 shadow-lg transition duration-150 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
            >
              Comment jouer le deck
            </span>
          </span>
        )}
        {children}
      </div>
      <Modal
        open={open === "photos"}
        onClose={close}
        title="Photos du deck"
        subtitle={photos.length ? "Photos des cartes réelles, prises par le vendeur." : undefined}
      >
        <Gallery photos={photos} title={title} />
      </Modal>
      {primer && (
        <Modal open={open === "primer"} onClose={close} title="Comment jouer le deck" subtitle="Le primer du vendeur" size="md">
          <PrimerText text={primer} />
        </Modal>
      )}
    </>
  );
}
