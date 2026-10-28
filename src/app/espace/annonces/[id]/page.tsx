import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProfile, requireUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { estimateDecklistNow, fetchListingBracket } from "@/lib/public-listings";
import { commanderBracket } from "@/lib/bracket-view";
import { commanderCards } from "@/lib/pricing";
import { BracketCard } from "@/components/bracket-card";
import { metaResultFor } from "@/lib/meta-corpus";
import { fromStoredDetail } from "@/lib/meta-score";
import { mediaOf } from "@/lib/listing-media";
import { ListingPhotosForm, PrimerForm } from "@/components/listing-media-forms";
import { MetaProximityCard } from "@/components/meta-proximity";
import { LISTING_COLUMNS, PUBLIC_STATUSES, STATUSES, type Listing } from "@/lib/listings";
import { DeckView } from "@/components/deck-view";
import { ListingAside } from "@/components/listing-aside";
import { ManaCurveCard } from "@/components/mana-curve";
import { cardTypeCounts, manaCurve } from "@/lib/deck-stats";
import { CardTypesCard, anchorsFor } from "@/components/card-types";
import { DeckTags } from "@/components/deck-tags";
import { CardDetailsForm } from "@/components/card-details-form";
import { DecklistEditor } from "@/components/decklist-editor";
import { ListingEditForm } from "@/components/listing-edit-form";
import { getArchetypes } from "@/lib/archetypes";
import { FormatTag } from "@/components/format-tag";

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

  const [{ deck, estimate, pricesAsOf }, profile, archetypes, storedMeta, media, storedBracket] = await Promise.all([
    estimateDecklistNow(listing.decklist),
    getProfile(),
    getArchetypes(),
    // Détail du score enregistré (colonne absente tant que le schéma n'est pas à jour : null).
    supabase
      .from("listings")
      .select("meta_detail")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => fromStoredDetail((data as { meta_detail?: unknown } | null)?.meta_detail)),
    // Photos et primer (colonnes absentes tant que le schéma n'est pas à jour : formulaires masqués).
    supabase
      .from("listings")
      .select("photos, primer")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => (error ? null : mediaOf(data))),
    // Niveau de puissance (Commander) : annoncé et détail enregistrés.
    listing.format === "commander" ? fetchListingBracket(id) : null,
  ]);
  const power = listing.format === "commander" ? await commanderBracket(deck, estimate, storedBracket) : null;
  const isPublic = (PUBLIC_STATUSES as readonly string[]).includes(listing.status);

  return (
    <div>
      <Link href="/espace" className="text-sm font-medium text-muted hover:text-foreground">
        ← Mes annonces
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h2 className="display text-2xl sm:text-3xl">{listing.title}</h2>
        <FormatTag format={listing.format} />
        <span className="rounded-md bg-sunken px-2 py-0.5 text-xs font-semibold text-muted">{STATUSES[listing.status]}</span>
      </div>
      <div className="mt-2">
        <DeckTags colors={listing.colors ?? []} archetype={listing.archetype} format={listing.format} />
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
        Tout se modifie ci-dessous : l&apos;annonce, les photos et le primer, l&apos;état et la langue des cartes, puis la liste.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <ListingEditForm
            key={`${listing.title}|${listing.format}|${listing.status}|${listing.asking_cents}|${(listing.colors ?? []).join("")}|${listing.archetype?.id ?? ""}|${power?.declared ?? ""}`}
            listing={listing}
            archetypes={archetypes}
            bracket={power ? { declared: power.declared, min: power.min } : null}
          />
          {media && (
            <>
              <ListingPhotosForm listingId={listing.id} photos={media.photos} />
              <PrimerForm key={media.primer ?? ""} listingId={listing.id} primer={media.primer} />
            </>
          )}
          <CardDetailsForm
            // Repart de zéro quand la liste change : les lignes ne sont plus les mêmes.
            key={listing.decklist}
            listingId={listing.id}
            lines={estimate.lines.map(({ board, name, quantity }) => ({ board, name, quantity }))}
            initial={listing.card_details ?? []}
          />
          <DeckView estimate={estimate} pricesAsOf={pricesAsOf} details={listing.card_details} commanders={listing.format === "commander" ? deck.commanders : []} />
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
          commanders={listing.format === "commander" ? commanderCards(estimate, deck.commanders) : []}
          stats={<>
            {/* Score méta : comparaison aux listes de tournoi Modern, sans objet en Commander. */}
            {power && <BracketCard facts={power.facts} min={power.min} declared={power.declared} />}
            {listing.format !== "commander" && (
              <MetaProximityCard result={storedMeta ?? (await metaResultFor(estimate, deck.errors.length, listing.decklist))} />
            )}
            <CardTypesCard counts={cardTypeCounts(estimate)} targets={anchorsFor(estimate)} />
            <ManaCurveCard curve={manaCurve(estimate)} />
          </>}
        />
      </div>
    </div>
  );
}

