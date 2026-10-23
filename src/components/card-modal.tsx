"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatEur } from "@/lib/pricing";

/** Une carte de la liste, telle qu'affichée dans la fenêtre (données déjà mises en forme côté serveur). */
export type CardModalItem = {
  name: string;
  quantity: number;
  imageUrl: string | null;
  typeLine: string | null;
  setCode: string | null;
  collectorNumber: string | null;
  artist: string | null;
  rarity: string | null;
  unitCents: number | null;
  lineCents: number | null;
  manual: boolean;
  condition: string | null;
  lang: string | null;
};

/** Grande image Scryfall (672 × 936) pour la fenêtre, à partir de l'image « normal ». */
const largeImage = (url: string) => url.replace("/normal/", "/large/");

/**
 * Fenêtre « carte en grand », façon Moxfield. Un seul écouteur pour toute la liste : un clic
 * sur un bouton [data-card-index] ouvre la carte correspondante. Flèches ← → pour passer
 * d'une carte à l'autre, Échap ou clic à côté pour fermer (fenêtre <dialog> du navigateur).
 */
export function CardModal({ items }: { items: CardModalItem[] }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  const open = useCallback((i: number) => {
    setIndex(i);
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  const move = useCallback((step: number) => setIndex((i) => (i == null ? i : (i + step + items.length) % items.length)), [items.length]);

  // Clics sur les cartes de la liste (le parent de ce composant).
  useEffect(() => {
    const list = anchor.current?.parentElement;
    if (!list) return;
    const onClick = (e: MouseEvent) => {
      const button = (e.target as HTMLElement).closest<HTMLElement>("[data-card-index]");
      if (button && list.contains(button)) open(Number(button.dataset.cardIndex));
    };
    list.addEventListener("click", onClick);
    return () => list.removeEventListener("click", onClick);
  }, [open]);

  const item = index == null ? null : items[index];
  const scryfall = item?.setCode && item.collectorNumber ? `https://scryfall.com/card/${item.setCode.toLowerCase()}/${item.collectorNumber}` : null;
  const cardmarket = item ? `https://www.cardmarket.com/fr/Magic/Products/Search?searchString=${encodeURIComponent(item.name.split(" // ")[0])}` : null;

  return (
    <>
      <span ref={anchor} hidden />
      <dialog
        ref={dialog}
        aria-label={item ? item.name : "Carte"}
        onClose={() => setIndex(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") move(1);
          if (e.key === "ArrowLeft") move(-1);
        }}
        // Clic sur le fond (hors du contenu) : ferme.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[min(56rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-[2px]"
      >
        {item && (
          <div className="relative grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Fermer"
              className="absolute right-3 top-3 z-10 rounded-full bg-surface/90 p-2 text-muted shadow ring-1 ring-line backdrop-blur transition hover:bg-sunken hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>

            <div className="mx-auto w-full max-w-[15rem] sm:max-w-[20rem]">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- image Scryfall telle quelle, chargée à l'ouverture
                <img
                  key={item.imageUrl}
                  src={largeImage(item.imageUrl)}
                  alt={item.name}
                  width={672}
                  height={936}
                  // La miniature (déjà en cache) s'affiche dessous pendant que la grande image arrive.
                  style={{ backgroundImage: `url("${item.imageUrl.replace("/normal/", "/small/")}")` }}
                  className="aspect-[488/680] w-full rounded-[4.75%/3.5%] bg-sunken bg-cover shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)]"
                />
              ) : (
                <div className="flex aspect-[488/680] w-full items-center justify-center rounded-[4.75%/3.5%] bg-sunken text-sm text-muted">
                  Image indisponible
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col">
              <h2 className="display pr-10 text-2xl">{item.name}</h2>
              {item.typeLine && <p className="mt-1 text-muted">{item.typeLine}</p>}

              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                {item.setCode && (
                  <Row label="Édition">
                    {item.setCode.toUpperCase()} · {item.collectorNumber}
                    {item.rarity && <span className="text-muted"> · {item.rarity}</span>}
                  </Row>
                )}
                {item.artist && <Row label="Illustration">{item.artist}</Row>}
                <Row label="Quantité">{item.quantity}</Row>
                {item.condition && <Row label="État">{item.condition}</Row>}
                {item.lang && <Row label="Langue">{item.lang}</Row>}
                <Row label="Prix à l'unité">
                  {item.unitCents != null ? (
                    <>
                      {formatEur(item.unitCents)}
                      {item.manual && <span className="text-muted"> (saisi)</span>}
                    </>
                  ) : (
                    <span className="text-warn">Sans prix</span>
                  )}
                </Row>
                {item.lineCents != null && item.quantity > 1 && <Row label="Total">{formatEur(item.lineCents)}</Row>}
              </dl>

              <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {scryfall && (
                  <a href={scryfall} target="_blank" rel="noopener noreferrer" className="font-medium text-link hover:underline">
                    Voir sur Scryfall ↗
                  </a>
                )}
                {cardmarket && (
                  <a href={cardmarket} target="_blank" rel="noopener noreferrer" className="font-medium text-link hover:underline">
                    Prix sur Cardmarket ↗
                  </a>
                )}
              </p>

              {items.length > 1 && (
                <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => move(-1)}
                    className="rounded-lg border border-line px-3 py-2 text-sm font-medium transition hover:border-link/50 hover:text-link"
                  >
                    ← Précédente
                  </button>
                  <span className="text-xs tabular-nums text-muted">
                    {index! + 1} / {items.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => move(1)}
                    className="rounded-lg border border-line px-3 py-2 text-sm font-medium transition hover:border-link/50 hover:text-link"
                  >
                    Suivante →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}
