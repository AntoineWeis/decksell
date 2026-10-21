import "server-only";
import { connection } from "next/server";
import { parseDecklist, type ParsedDeck } from "./decklist.ts";
import { buildEstimate, type Estimate } from "./pricing.ts";
import { lookupDeckPrices } from "./estimate.ts";
import { getSupabaseAdmin } from "./supabase-server.ts";
import { LISTING_COLUMNS, PUBLIC_STATUSES, type PublicListing } from "./listings.ts";

// Lecture publique des annonces. On passe par la clé secrète côté serveur, mais on ne
// renvoie que les annonces en vente ou réservées, et seulement les colonnes publiques.

const SELECT = `${LISTING_COLUMNS}, seller:profiles(display_name, avatar_url, moxfield_url, archidekt_url)`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchPublicListings(): Promise<PublicListing[]> {
  await connection(); // toujours à jour : lu à chaque requête
  const { data, error } = await getSupabaseAdmin()
    .from("listings")
    .select(SELECT)
    .in("status", [...PUBLIC_STATUSES])
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(`Lecture des annonces impossible : ${error.message}`);
  return (data ?? []) as unknown as PublicListing[];
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
  return (data as unknown as PublicListing) ?? null;
}

/** Recalcule l'estimation d'une decklist avec les prix du jour. */
export async function estimateDecklistNow(
  decklist: string,
): Promise<{ deck: ParsedDeck; estimate: Estimate; pricesAsOf: string | null }> {
  const deck = parseDecklist(decklist);
  const { prices, pricesAsOf } = await lookupDeckPrices(deck);
  return { deck, estimate: buildEstimate(deck, prices), pricesAsOf };
}
