import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { fetchPublicListings } from "@/lib/public-listings";
import { ListingTile } from "@/components/listing-tile";
import { favoriteStateOf, getFavoriteIds } from "@/lib/favorites";
import { DeckFilters } from "@/components/deck-filters";
import { MIN_CARD_QUERY, decksHref, filterListings, paginate, readDeckQuery, sortListings } from "@/lib/deck-index";
import { searchFrenchNames } from "@/lib/card-names";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Decks en vente",
  description: "Les decks Modern complets mis en vente par les joueurs, avec leur valeur estimée et la langue des cartes.",
};

export default function DecksPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="flex-1">
      <section className="bg-banner text-banner-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
          <div>
            <h1 className="display text-4xl sm:text-5xl">Decks en vente</h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-banner-muted">
              Des decks Modern complets, mis en vente par des joueurs. Chaque annonce affiche son prix, sa valeur
              estimée d&apos;après Cardmarket et la langue des cartes.
            </p>
          </div>
          <Link
            href="/estimer"
            className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            Vendre mon deck
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        <Suspense fallback={<GridSkeleton />}>
          <ListingGrid searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function ListingGrid({ searchParams }: { searchParams: SearchParams }) {
  const query = readDeckQuery(await searchParams);
  // Hors du try : ce signal de Next (lecture au moment de la requête) ne doit pas être intercepté.
  await connection();
  let listings;
  try {
    listings = await fetchPublicListings();
  } catch (e) {
    console.error(e);
    return (
      <p className="rounded-xl bg-danger-soft px-5 py-4 text-danger">
        Les annonces sont momentanément indisponibles. Réessaie dans un instant.
      </p>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center">
        <p className="font-semibold">Aucun deck en vente pour l&apos;instant</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Sois le premier : estime ton deck, puis mets-le en vente.</p>
        <Link href="/estimer" className="mt-5 inline-flex font-semibold text-link hover:underline">
          Estimer mon deck →
        </Link>
      </div>
    );
  }

  // Recherche en français : on cherche aussi les noms anglais correspondants (« foudre » → Lightning Bolt).
  const aliases = query.card.length >= MIN_CARD_QUERY ? (await searchFrenchNames(query.card)).map((s) => s.name) : [];

  // Archétypes présents parmi les decks qui correspondent aux autres filtres, avec leur nombre.
  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const { listing: l } of filterListings(listings, { ...query, archetype: null }, aliases)) {
    if (!l.archetype) continue;
    const entry = counts.get(l.archetype.slug) ?? { slug: l.archetype.slug, name: l.archetype.name, count: 0 };
    entry.count++;
    counts.set(entry.slug, entry);
  }
  const archetypeCounts = [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
  const matching = sortListings(filterListings(listings, query, aliases), query.sort);
  const { items: shown, page, pages } = paginate(matching, query.page);
  const favorites = await getFavoriteIds();

  return (
    <div className="space-y-6">
      <DeckFilters query={query} archetypeCounts={archetypeCounts} resultCount={matching.length} />
      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center">
          <p className="font-semibold">
            {query.card ? "Aucun deck ne contient cette carte… pour l'instant" : "Aucun deck ne correspond à ces filtres… pour l'instant"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {query.card
              ? "Vérifie l'orthographe de la carte, ou retire un filtre pour voir plus de decks."
              : "Retire une couleur, élargis la fourchette de prix ou change d'archétype pour voir plus de decks."}
          </p>
          <Link href="/decks" className="mt-5 inline-flex font-semibold text-link hover:underline">
            Voir tous les decks →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map(({ listing, hits }) => (
            <ListingTile key={listing.id} listing={listing} hits={hits} favorite={favoriteStateOf(favorites, listing)} />
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-center gap-3 pt-2 text-sm">
          {page > 1 ? (
            <Link href={decksHref({ ...query, page: page - 1 })} className="rounded-lg border border-line px-3 py-2 font-medium hover:border-link/50 hover:text-link">
              ← Précédents
            </Link>
          ) : (
            <span className="rounded-lg border border-line px-3 py-2 text-muted opacity-50">← Précédents</span>
          )}
          <span className="tabular-nums text-muted">
            Page {page} sur {pages}
          </span>
          {page < pages ? (
            <Link href={decksHref({ ...query, page: page + 1 })} className="rounded-lg border border-line px-3 py-2 font-medium hover:border-link/50 hover:text-link">
              Suivants →
            </Link>
          ) : (
            <span className="rounded-lg border border-line px-3 py-2 text-muted opacity-50">Suivants →</span>
          )}
        </nav>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-80 animate-pulse rounded-xl bg-sunken" />
      ))}
    </ul>
  );
}
