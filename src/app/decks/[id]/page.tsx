import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { estimateDecklistNow, fetchPublicListing } from "@/lib/public-listings";
import { DeckBanner } from "@/components/deck-banner";
import { DeckView } from "@/components/deck-view";
import { ListingAside } from "@/components/listing-aside";
import { ManaCurveCard } from "@/components/mana-curve";
import { manaCurve } from "@/lib/deck-stats";
import { DeckTags } from "@/components/deck-tags";

import { CONDITIONS } from "@/lib/listings";
import { formatEur } from "@/lib/pricing";

type Props = { params: Promise<{ id: string }> };

/** Titre et aperçu de partage : nom du deck, prix, archétype. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchPublicListing(id);
  if (!listing) return { title: "Deck introuvable" };
  const parts = [
    listing.archetype ? `Deck Modern ${listing.archetype.name}` : "Deck Modern",
    `${listing.card_count} cartes`,
    `état ${CONDITIONS[listing.condition].toLowerCase()}`,
    `valeur estimée ${formatEur(listing.estimated_cents)}`,
  ];
  const description = `${parts.join(", ")}. En vente ${formatEur(listing.asking_cents)} sur decksell.`;
  return {
    title: `${listing.title} · ${formatEur(listing.asking_cents)}`,
    description,
    alternates: { canonical: `/decks/${listing.id}` },
    openGraph: { title: listing.title, description, type: "website", siteName: "decksell", locale: "fr_FR" },
    twitter: { card: "summary_large_image", title: listing.title, description },
  };
}

export default function DeckPage({ params }: Props) {
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
          <ListingAside listing={listing} seller={listing.seller} todayCents={estimate.totalCents}
          stats={<ManaCurveCard curve={manaCurve(estimate)} />}>
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
