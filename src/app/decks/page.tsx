import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { fetchPublicListings } from "@/lib/public-listings";
import { ListingTile } from "@/components/listing-tile";
import { DeckFilters, type DeckFilter } from "@/components/deck-filters";
import { normalizeColors, type PublicListing } from "@/lib/listings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Lit les filtres de l'adresse : ?c=UR (couleurs) & a=burn (archétype). */
function readFilter(sp: Record<string, string | string[] | undefined>): DeckFilter {
  const c = typeof sp.c === "string" ? sp.c.toUpperCase().split("") : [];
  const a = typeof sp.a === "string" && /^[a-z0-9-]{1,60}$/.test(sp.a) ? sp.a : null;
  return { colors: normalizeColors(c), archetype: a };
}

/** Un deck correspond s'il contient toutes les couleurs choisies, et l'archétype choisi s'il y en a un. */
function matches(l: PublicListing, f: DeckFilter): boolean {
  const colors = l.colors ?? [];
  if (!f.colors.every((c) => colors.includes(c))) return false;
  if (f.archetype && l.archetype?.slug !== f.archetype) return false;
  return true;
}

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
  const filter = readFilter(await searchParams);
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

  // Archétypes présents parmi les decks qui correspondent aux couleurs choisies, avec leur nombre.
  const byColor = listings.filter((l) => matches(l, { ...filter, archetype: null }));
  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const l of byColor) {
    if (!l.archetype) continue;
    const entry = counts.get(l.archetype.slug) ?? { slug: l.archetype.slug, name: l.archetype.name, count: 0 };
    entry.count++;
    counts.set(entry.slug, entry);
  }
  const archetypeCounts = [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
  const shown = listings.filter((l) => matches(l, filter));

  return (
    <div className="space-y-6">
      <DeckFilters filter={filter} archetypeCounts={archetypeCounts} resultCount={shown.length} />
      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center">
          <p className="font-semibold">Aucun deck ne correspond à ces filtres</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Retire une couleur ou change d&apos;archétype pour voir plus de decks.</p>
          <Link href="/decks" className="mt-5 inline-flex font-semibold text-link hover:underline">
            Voir tous les decks →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((l) => (
            <ListingTile key={l.id} listing={l} />
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
