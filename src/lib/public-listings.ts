import "server-only";
import { connection } from "next/server";
import { parseDecklist, type ParsedDeck } from "./decklist.ts";
import { buildEstimate, starCard, type Estimate } from "./pricing.ts";
import { lookupDeckPrices } from "./estimate.ts";
import { getSupabaseAdmin } from "./supabase-server.ts";
import { LISTING_COLUMNS, PUBLIC_STATUSES, type PublicListing } from "./listings.ts";

// Lecture publique des annonces. On passe par la clé secrète côté serveur, mais on ne
// renvoie que les annonces en vente ou réservées, et seulement les colonnes publiques.

const SELECT = `${LISTING_COLUMNS}, seller:profiles(display_name, avatar_url, moxfield_url, archidekt_url)`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Annonces publiées avant l'enregistrement de la carte phare : on la calcule à partir
 * de leur liste, on l'enregistre une fois pour toutes, et on l'utilise tout de suite.
 */
async function fillMissingCovers(listings: PublicListing[]): Promise<void> {
  const missing = listings.filter((l) => !l.cover_image_url).slice(0, 12);
  if (missing.length === 0) return;
  const admin = getSupabaseAdmin();
  await Promise.all(
    missing.map(async (l) => {
      try {
        const deck = parseDecklist(l.decklist);
        const { prices } = await lookupDeckPrices(deck);
        const star = starCard(buildEstimate(deck, prices));
        if (!star?.imageUrl) return;
        l.cover_card_name = star.name;
        l.cover_image_url = star.imageUrl;
        // Seulement si elle manque toujours : ne remplace jamais une image déjà enregistrée.
        await admin
          .from("listings")
          .update({ cover_card_name: star.name, cover_image_url: star.imageUrl })
          .eq("id", l.id)
          .is("cover_image_url", null);
      } catch (e) {
        console.error("Carte phare impossible à calculer pour l'annonce", l.id, e);
      }
    }),
  );
}

export async function fetchPublicListings(): Promise<PublicListing[]> {
  await connection(); // toujours à jour : lu à chaque requête
  const { data, error } = await getSupabaseAdmin()
    .from("listings")
    .select(SELECT)
    .in("status", [...PUBLIC_STATUSES])
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`Lecture des annonces impossible : ${error.message}`);
  const listings = (data ?? []) as unknown as PublicListing[];
  await fillMissingCovers(listings);
  return listings;
}

export async function fetchPublicListing(id: string): Promise<PublicListing | null> {
  await connection();
  if (!UUID.test(id)) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("listings")
    .select(SELECT)
    .eq("id", id)
    .in("status", [...PUBLIC_STATUSES])
    .maybeSingle();
  if (error) throw new Error(`Lecture de l'annonce impossible : ${error.message}`);
  const listing = (data as unknown as PublicListing) ?? null;
  if (listing) await fillMissingCovers([listing]);
  return listing;
}

/** Recalcule l'estimation d'une decklist avec les prix du jour. */
export async function estimateDecklistNow(
  decklist: string,
): Promise<{ deck: ParsedDeck; estimate: Estimate; pricesAsOf: string | null }> {
  const deck = parseDecklist(decklist);
  const { prices, pricesAsOf } = await lookupDeckPrices(deck);
  return { deck, estimate: buildEstimate(deck, prices), pricesAsOf };
}
