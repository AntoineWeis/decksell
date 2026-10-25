import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { countSellerDecks, estimateDecklistNow, fetchPublicListing } from "@/lib/public-listings";
import { metaResultFor } from "@/lib/meta-corpus";
import { fromStoredDetail } from "@/lib/meta-score";
import { MetaProximityCard } from "@/components/meta-proximity";
import { DeckBanner } from "@/components/deck-banner";
import { DeckView } from "@/components/deck-view";
import { ListingAside } from "@/components/listing-aside";
import { ManaCurveCard } from "@/components/mana-curve";
import { cardTypeCounts, manaCurve } from "@/lib/deck-stats";
import { CardTypesCard, anchorsFor } from "@/components/card-types";
import { DeckTags } from "@/components/deck-tags";
import { ContactSeller } from "@/components/contact-seller";
import { DeckFavorite } from "@/components/deck-favorite";
import { DeckShare } from "@/components/deck-share";
import { ReportListing } from "@/components/report-listing";
import { getUser } from "@/lib/auth";
import { formatDecklist, parseDecklist } from "@/lib/decklist";

import { CONDITIONS, FORMATS, normalizeFormat } from "@/lib/listings";
import { formatEur } from "@/lib/pricing";
import { deckProductJsonLd, jsonLdScript } from "@/lib/structured-data";
import { siteUrl } from "@/lib/site-url";
import { getUserBadges } from "@/lib/badges-server";
import { DeckPageSkeleton } from "@/components/deck-skeleton";
import { DeckMedia } from "@/components/deck-media";
import { MobileBuyBar } from "@/components/mobile-buy-bar";

type Props = { params: Promise<{ id: string }> };

/** Titre et aperçu de partage : nom du deck, prix, archétype. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchPublicListing(id);
  if (!listing) return { title: "Deck introuvable" };
  const parts = [
    `Deck ${FORMATS[normalizeFormat(listing.format)]}${listing.archetype ? ` ${listing.archetype.name}` : ""}`,
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
      <Suspense fallback={<DeckPageSkeleton />}>
        <DeckContent params={params} />
      </Suspense>
    </main>
  );
}

async function DeckContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await fetchPublicListing(id);
  if (!listing) notFound();

  // Tout en parallèle : le score méta part dès que l'estimation est prête.
  const estimated = estimateDecklistNow(listing.decklist);
  const [{ estimate, pricesAsOf }, meta, sellerDeckCount, sellerBadges] = await Promise.all([
    estimated,
    // Détail enregistré avec l'annonce ; recalcul (corpus en mémoire) seulement s'il manque.
    fromStoredDetail(listing.metaDetail) ??
      estimated.then(({ deck, estimate }) => metaResultFor(estimate, deck.errors.length, listing.decklist)),
    // Déjà lus avec l'annonce ; requêtes à part seulement si la base ne les a pas fournis.
    listing.sellerDeckCount ?? (listing.seller ? countSellerDecks(listing.seller.id) : null),
    listing.sellerBadges ?? (listing.seller ? getUserBadges(listing.seller.id) : []),
  ]);

  return (
    <>
      {/* Fiche produit pour Google : prix, disponibilité, état. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(deckProductJsonLd(listing, `${siteUrl()}/decks/${listing.id}`)) }}
      />
      <DeckBanner
        title={listing.title}
        coverImageUrl={listing.cover_image_url}
        coverCardName={listing.cover_card_name}
        format={listing.format}
        back={{ href: "/decks", label: "Tous les decks en vente" }}
      >
        <div className="mt-4">
          <DeckTags colors={listing.colors ?? []} archetype={listing.archetype} onDark />
        </div>
      </DeckBanner>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-6 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start">
        <div className="min-w-0">
          <DeckView estimate={estimate} pricesAsOf={pricesAsOf} details={listing.card_details} />
          <div className="mt-4 flex justify-end">
            {/* Lit la session : à part, comme le contact. */}
            <Suspense fallback={null}>
              <ReportSlot listingId={listing.id} sellerId={listing.seller?.id ?? null} />
            </Suspense>
          </div>
        </div>
        {/* Sur mobile, le prix et le contact passent avant la liste de cartes (voir ListingAside). */}
        <div className="contents lg:block">
          <ListingAside listing={listing} seller={listing.seller} todayCents={estimate.totalCents} priceFirstOnMobile sellerDeckCount={sellerDeckCount} sellerBadges={sellerBadges}
          stats={<>
            <MetaProximityCard result={meta} />
            <CardTypesCard counts={cardTypeCounts(estimate)} targets={anchorsFor(estimate)} />
            <ManaCurveCard curve={manaCurve(estimate)} />
          </>}>
            {/* Lit la session : à part, pour ne pas retarder le reste de l'annonce. */}
            <Suspense fallback={<div className="mt-4 h-11 animate-pulse rounded-xl bg-sunken" />}>
              <ContactSeller listingId={listing.id} sellerId={listing.seller?.id ?? null} title={listing.title} />
            </Suspense>
            <Suspense fallback={<div className="mt-2 h-10 animate-pulse rounded-xl bg-sunken" />}>
              <DeckFavorite listingId={listing.id} sellerId={listing.seller?.id ?? null} />
            </Suspense>
            {/* Une seule rangée : photos, primer, partager (lien et .txt dans un menu). */}
            <DeckMedia title={listing.title} photos={listing.media.photos} primer={listing.media.primer}>
              <DeckShare listingId={listing.id} title={listing.title} decklistText={formatDecklist(parseDecklist(listing.decklist))} />
            </DeckMedia>
          </ListingAside>
        </div>
      </div>
      {/* Mobile : le prix et le contact restent à portée pendant qu'on parcourt les cartes. */}
      <MobileBuyBar price={formatEur(listing.asking_cents)} />
    </>
  );
}

/** Lien « Signaler l'annonce », sauf pour son vendeur. */
async function ReportSlot({ listingId, sellerId }: { listingId: string; sellerId: string | null }) {
  const user = await getUser();
  if (user && user.id === sellerId) return null;
  return <ReportListing listingId={listingId} loggedIn={!!user} />;
}
