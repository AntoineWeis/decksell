import Image from "next/image";
import Link from "next/link";
import { formatEur } from "@/lib/pricing";
import { CONDITIONS, artCrop, type PublicListing } from "@/lib/listings";
import type { CardHit } from "@/lib/deck-index";
import { Avatar } from "./avatar";
import { LanguageBar } from "./language-bar";
import { ManaColors } from "./mana";

/**
 * Une annonce dans l'index public : illustration de la carte phare, prix, langue, vendeur.
 * `hits` : cartes trouvées par la recherche ; `showSeller` à false sur le profil du vendeur.
 */
export function ListingTile({
  listing: l,
  hits = [],
  showSeller = true,
}: {
  listing: PublicListing;
  hits?: CardHit[];
  showSeller?: boolean;
}) {
  const art = artCrop(l.cover_image_url);
  const diff = l.estimated_cents > 0 ? Math.round(((l.asking_cents - l.estimated_cents) / l.estimated_cents) * 100) : null;
  return (
    <li>
      <Link
        href={`/decks/${l.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-link/50 hover:shadow-md"
      >
        <div className="relative aspect-[16/9] bg-banner">
          {art ? (
            <>
              <Image
                src={art}
                alt=""
                fill
                sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                unoptimized
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
            </>
          ) : (
            // Annonce publiée avant l'enregistrement de la carte phare : vignette neutre.
            <svg viewBox="0 0 64 64" className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 text-white/20" aria-hidden>
              <rect x="12" y="14" width="26" height="36" rx="3" fill="currentColor" transform="rotate(-10 25 32)" />
              <rect x="26" y="12" width="26" height="36" rx="3" fill="currentColor" />
            </svg>
          )}
          {l.cover_card_name && (
            <p className="absolute bottom-2 left-3 right-3 truncate text-xs font-medium text-white/90">{l.cover_card_name}</p>
          )}
          {l.status === "reserved" && (
            <span className="absolute left-3 top-3 rounded-md bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
              Réservé
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h2 className="line-clamp-2 font-semibold group-hover:text-link">{l.title}</h2>
            <p className="mt-0.5 text-xs text-muted">
              {l.card_count} cartes · {CONDITIONS[l.condition]}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-2">
              <ManaColors colors={l.colors ?? []} size={16} />
              {l.archetype && (
                <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-xs font-semibold text-link">{l.archetype.name}</span>
              )}
            </p>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xl font-bold tabular-nums">{formatEur(l.asking_cents)}</p>
            <p className="text-xs tabular-nums text-muted">
              Estimé {formatEur(l.estimated_cents)}
              {diff != null && diff !== 0 && (
                <span className={diff < 0 ? "text-ok" : ""}> · {diff > 0 ? "+" : ""}{diff} %</span>
              )}
            </p>
          </div>

          {hits.length > 0 && (
            <p className="rounded-lg bg-brand-soft px-2.5 py-1.5 text-xs text-link">
              Contient{" "}
              {hits.slice(0, 2).map((h, i) => (
                <span key={h.name}>
                  {i > 0 && ", "}
                  <strong className="font-semibold tabular-nums">{h.quantity}×</strong> {h.name}
                </span>
              ))}
              {hits.length > 2 && ` et ${hits.length - 2} autre${hits.length > 3 ? "s" : ""}`}
            </p>
          )}

          <LanguageBar frenchPercent={l.french_percent} />

          {showSeller && l.seller && (
            <p className="mt-auto flex items-center gap-2 border-t border-line pt-3 text-sm text-muted">
              <Avatar name={l.seller.display_name} url={l.seller.avatar_url} size={22} />
              <span className="truncate">{l.seller.display_name}</span>
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
