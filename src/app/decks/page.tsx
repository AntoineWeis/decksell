import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { fetchPublicListings } from "@/lib/public-listings";
import { ListingTile } from "@/components/listing-tile";
import { DeckFilters } from "@/components/deck-filters";
import { filterListings, readDeckQuery, sortListings } from "@/lib/deck-index";

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

  // Archétypes présents parmi les decks qui correspondent aux autres filtres, avec leur nombre.
  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const { listing: l } of filterListings(listings, { ...query, archetype: null })) {
    if (!l.archetype) continue;
    const entry = counts.get(l.archetype.slug) ?? { slug: l.archetype.slug, name: l.archetype.name, count: 0 };
    entry.count++;
    counts.set(entry.slug, entry);
  }
  const archetypeCounts = [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
  const shown = sortListings(filterListings(listings, query), query.sort);

  return (
    <div className="space-y-6">
      <DeckFilters query={query} archetypeCounts={archetypeCounts} resultCount={shown.length} />
      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center">
          <p className="font-semibold">Aucun deck ne correspond à ces filtres</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {query.card
              ? "Vérifie l'orthographe de la carte (en anglais), ou retire un filtre pour voir plus de decks."
              : "Retire une couleur ou change d'archétype pour voir plus de decks."}
          </p>
          <Link href="/decks" className="mt-5 inline-flex font-semibold text-link hover:underline">
            Voir tous les decks →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map(({ listing, hits }) => (
            <ListingTile key={listing.id} listing={listing} hits={hits} />
          ))}
        </ul>
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
