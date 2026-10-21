import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { estimateDecklistNow, fetchPublicListing } from "@/lib/public-listings";
import { DeckBanner } from "@/components/deck-banner";
import { DeckView } from "@/components/deck-view";
import { ListingAside } from "@/components/listing-aside";
import { DeckTags } from "@/components/deck-tags";

export const metadata: Metadata = { title: "Deck en vente" };

export default function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="flex-1">
      {/* L'identifiant vient de l'adresse : tout le contenu est lu au moment de la requête. */}
      <Suspense fallback={<DeckSkeleton />}>
        <DeckContent params={params} />
      </Suspense>
    </main>
  );
}

async function DeckContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await fetchPublicListing(id);
  if (!listing) notFound();

  const { estimate, pricesAsOf } = await estimateDecklistNow(listing.decklist);

  return (
    <>
      <DeckBanner
        title={listing.title}
        coverImageUrl={listing.cover_image_url}
        coverCardName={listing.cover_card_name}
        back={{ href: "/decks", label: "Tous les decks en vente" }}
      >
        <div className="mt-4">
          <DeckTags colors={listing.colors ?? []} archetype={listing.archetype} onDark />
        </div>
      </DeckBanner>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-6 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start">
        <div className="min-w-0 lg:order-1">
          <DeckView estimate={estimate} pricesAsOf={pricesAsOf} />
        </div>
        <div className="lg:order-2">
          <ListingAside listing={listing} seller={listing.seller} todayCents={estimate.totalCents}>
            <p className="mt-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-link">
              La prise de contact avec le vendeur arrive bientôt sur decksell.
            </p>
          </ListingAside>
        </div>
      </div>
    </>
  );
}

function DeckSkeleton() {
  return (
    <div aria-busy>
      <div className="h-48 animate-pulse bg-banner" />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
        <div className="h-96 animate-pulse rounded-xl bg-sunken" />
        <div className="h-72 animate-pulse rounded-xl bg-sunken" />
      </div>
    </div>
  );
}
