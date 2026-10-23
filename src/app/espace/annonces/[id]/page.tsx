import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProfile, requireUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { estimateDecklistNow } from "@/lib/public-listings";
import { LISTING_COLUMNS, PUBLIC_STATUSES, STATUSES, type Listing } from "@/lib/listings";
import { DeckView } from "@/components/deck-view";
import { ListingAside } from "@/components/listing-aside";
import { ManaCurveCard } from "@/components/mana-curve";
import { manaCurve } from "@/lib/deck-stats";
import { DeckTags } from "@/components/deck-tags";
import { CardDetailsForm } from "@/components/card-details-form";
import { DecklistEditor } from "@/components/decklist-editor";
import { ListingIdentityForm } from "@/components/listing-identity-form";

export const metadata: Metadata = { title: "Mon annonce" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SellerListingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-sunken" />}>
      <SellerListing params={params} />
    </Suspense>
  );
}

async function SellerListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/espace/annonces/${id}`);
  if (!UUID.test(id)) notFound();

  // Client du membre : les règles RLS garantissent qu'il ne lit que ses propres annonces.
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!data) notFound();
  const listing = data as unknown as Listing;

  const [{ estimate, pricesAsOf }, profile] = await Promise.all([estimateDecklistNow(listing.decklist), getProfile()]);
  const isPublic = (PUBLIC_STATUSES as readonly string[]).includes(listing.status);

  return (
    <div>
      <Link href="/espace" className="text-sm font-medium text-muted hover:text-foreground">
        ← Mes annonces
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h2 className="display text-2xl sm:text-3xl">{listing.title}</h2>
        <span className="rounded-md bg-sunken px-2 py-0.5 text-xs font-semibold text-muted">{STATUSES[listing.status]}</span>
      </div>
      <div className="mt-2">
        <DeckTags colors={listing.colors ?? []} archetype={listing.archetype} />
      </div>
      <p className="mt-2 text-sm text-muted">
        {isPublic ? (
          <>
            Visible par tous dans les{" "}
            <Link href={`/decks/${listing.id}`} className="font-medium text-link hover:underline">
              decks en vente
            </Link>
            .
          </>
        ) : (
          "Cette annonce n'est pas visible publiquement."
        )}{" "}
        Le nom, les couleurs, l&apos;état et la langue des cartes et la liste se modifient ci-dessous ; le statut, le
        prix et l&apos;archétype depuis « Mes annonces ».
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <ListingIdentityForm
            key={`${listing.title}|${(listing.colors ?? []).join("")}`}
            listingId={listing.id}
            title={listing.title}
            colors={listing.colors ?? []}
          />
          <CardDetailsForm
            // Repart de zéro quand la liste change : les lignes ne sont plus les mêmes.
            key={listing.decklist}
            listingId={listing.id}
            lines={estimate.lines.map(({ board, name, quantity }) => ({ board, name, quantity }))}
            initial={listing.card_details ?? []}
          />
          <DeckView estimate={estimate} pricesAsOf={pricesAsOf} details={listing.card_details} />
          <DecklistEditor listingId={listing.id} decklist={listing.decklist} />
        </div>
        <ListingAside
          listing={listing}
          seller={
            profile
              ? {
                  display_name: profile.displayName,
                  avatar_url: profile.avatarUrl,
                  moxfield_url: profile.moxfieldUrl,
                  archidekt_url: profile.archidektUrl,
                }
              : null
          }
          todayCents={estimate.totalCents}
          stats={<ManaCurveCard curve={manaCurve(estimate)} />}
        />
      </div>
    </div>
  );
}
