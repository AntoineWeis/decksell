import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { fetchPublicListings } from "@/lib/public-listings";
import { CONDITIONS, artCrop, type PublicListing } from "@/lib/listings";
import { formatEur } from "@/lib/pricing";
import { Avatar } from "./avatar";
import { ManaColors } from "./mana";
import { FormatTag } from "./format-tag";
import { MetaBadge } from "./meta-proximity";
import { BracketBadge } from "./bracket-card";

/** Score phare du format : MetaScore en Modern, niveau de puissance en Commander. */
function DeckScore({ listing: l }: { listing: PublicListing }) {
  return l.format === "commander" ? <BracketBadge level={l.bracket} /> : <MetaBadge score={l.meta_score} status={l.meta_status} />;
}

const SHOWN = 4;

/**
 * Derniers decks mis en ligne, pour l'accueil. La mise en page suit le nombre de decks :
 * un seul en grand, deux côte à côte, trois et plus avec le plus récent en vedette.
 * Rien n'est affiché si aucun deck n'est en vente (ou si la lecture échoue).
 */
export async function LatestDecks() {
  // Hors du try : ce signal de Next (lecture au moment de la requête) ne doit pas être intercepté.
  await connection();
  let listings: PublicListing[];
  try {
    listings = await fetchPublicListings();
  } catch (e) {
    console.error("Accueil : derniers decks indisponibles", e);
    return null;
  }
  const onSale = listings.filter((l) => l.status === "active");
  return <LatestDecksView pool={onSale.length > 0 ? onSale : listings} />;
}

/** Affichage seul, à partir des annonces déjà lues (les plus récentes d'abord). */
export function LatestDecksView({ pool }: { pool: PublicListing[] }) {
  if (pool.length === 0) return null;
  const latest = pool.slice(0, SHOWN);
  const [first, ...others] = latest;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display text-2xl sm:text-3xl">{latest.length > 1 ? "Derniers decks en ligne" : "Dernier deck en ligne"}</h2>
          <p className="mt-1 text-muted">Des decks complets mis en vente par des joueurs, avec leur valeur du jour.</p>
        </div>
        <Link href="/decks" className="font-semibold text-link hover:underline">
          {pool.length > SHOWN ? `Voir les ${pool.length} decks en vente →` : "Voir les decks en vente →"}
        </Link>
      </div>

      {latest.length === 1 && (
        <div className="mt-6">
          <FeaturedDeck listing={first} wide />
        </div>
      )}

      {latest.length === 2 && (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {latest.map((l) => (
            <FeaturedDeck key={l.id} listing={l} />
          ))}
        </div>
      )}

      {latest.length >= 3 && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <FeaturedDeck listing={first} />
          {/* Sur grand écran, les petites cartes se partagent la hauteur de la carte vedette. */}
          <ul className={`grid gap-3 lg:auto-rows-fr lg:grid-cols-1 ${others.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            {others.map((l) => (
              <li key={l.id}>
                <CompactDeck listing={l} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}


/** Grande carte : illustration de la carte phare, nom, couleurs, prix, vendeur. */
function FeaturedDeck({ listing: l, wide = false }: { listing: PublicListing; wide?: boolean }) {
  const art = artCrop(l.cover_image_url);
  return (
    <Link
      href={`/decks/${l.id}`}
      className={`group flex h-full overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-link/50 hover:shadow-lg ${
        wide ? "flex-col md:flex-row" : "flex-col"
      }`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-banner ${wide ? "aspect-[16/9] md:aspect-auto md:w-[55%]" : "aspect-[16/9]"}`}>
        {art && (
          <Image
            src={art}
            alt=""
            fill
            unoptimized
            sizes={wide ? "(min-width: 768px) 620px, 100vw" : "(min-width: 1024px) 660px, 100vw"}
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute left-4 top-4 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">Nouveau</span>
        {l.cover_card_name && (
          <p className="absolute bottom-3 left-4 right-4 truncate text-xs font-medium text-white/90">{l.cover_card_name}</p>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div>
          <h3 className="display text-xl group-hover:text-link sm:text-2xl">
            <FormatTag format={l.format} className="mr-2 -translate-y-0.5" />
            {l.title}
          </h3>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <ManaColors colors={l.colors ?? []} size={18} />
            {l.archetype && <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-xs font-semibold text-link">{l.archetype.name}</span>}
            <DeckScore listing={l} />
            <span>
              {l.card_count} cartes · {CONDITIONS[l.condition]}
            </span>
          </p>
        </div>
        <div className="mt-auto space-y-4 border-t border-line pt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="display text-3xl tabular-nums">{formatEur(l.asking_cents)}</p>
            <p className="text-xs tabular-nums text-muted">Estimé {formatEur(l.estimated_cents)}</p>
          </div>
          {l.seller && (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Avatar name={l.seller.display_name} url={l.seller.avatar_url} size={24} />
              <span className="max-w-36 truncate">{l.seller.display_name}</span>
            </p>
          )}
        </div>
        </div>
      </div>
    </Link>
  );
}

/** Petite carte horizontale, pour les decks qui suivent le plus récent : l'essentiel de la grande carte, en plus court. */
function CompactDeck({ listing: l }: { listing: PublicListing }) {
  const art = artCrop(l.cover_image_url);
  return (
    <Link
      href={`/decks/${l.id}`}
      className="group flex h-full gap-3 overflow-hidden rounded-xl border border-line bg-surface p-3 transition hover:border-link/50 hover:shadow-md sm:flex-col lg:flex-row"
    >
      {/* Sur grand écran, l'illustration prend toute la hauteur de la carte. */}
      <span className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-banner sm:h-auto sm:w-full sm:aspect-[16/9] lg:h-auto lg:min-h-20 lg:w-32 lg:aspect-auto lg:self-stretch">
        {art && (
          <Image src={art} alt="" fill unoptimized sizes="(min-width: 1024px) 128px, (min-width: 640px) 33vw, 112px" className="object-cover transition duration-300 group-hover:scale-105" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="line-clamp-2 text-sm font-semibold group-hover:text-link">
          <FormatTag format={l.format} className="mr-1.5 -translate-y-px" />
          {l.title}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <ManaColors colors={l.colors ?? []} size={14} />
          {l.archetype && (
            <span className="truncate rounded bg-brand-soft px-1.5 py-px text-[11px] font-semibold text-link">{l.archetype.name}</span>
          )}
          <DeckScore listing={l} />
        </p>
        <p className="mt-1 truncate text-xs text-muted">
          {l.card_count} cartes · {CONDITIONS[l.condition]}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className="min-w-0 text-sm font-bold tabular-nums">
            {formatEur(l.asking_cents)}
            <span className="block text-xs font-normal text-muted">estimé {formatEur(l.estimated_cents)}</span>
          </p>
          {l.seller && (
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
              <Avatar name={l.seller.display_name} url={l.seller.avatar_url} size={18} />
              <span className="hidden max-w-24 truncate lg:inline">{l.seller.display_name}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
