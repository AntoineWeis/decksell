import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseDecklist, type ParsedDeck } from "./decklist.ts";
import { buildEstimate, type Estimate } from "./pricing.ts";
import { lookupDeckPricesCached } from "./estimate.ts";
import { getSupabaseAdmin, getSupabasePublic } from "./supabase-server.ts";
import { getArchetypes } from "./archetypes.ts";
import type { EarnedBadge } from "./badges.ts";
import { mediaOf, type ListingMedia } from "./listing-media.ts";
import { PUBLIC_STATUSES, type Archetype, type PublicListing } from "./listings.ts";

// Lecture publique des annonces, des vendeurs et de leurs badges, avec la clé publique, sur les vues
// public_listings, public_sellers et public_seller_badges (schema.sql, section 28) : la base ne renvoie
// que les annonces en vente ou réservées de vendeurs non suspendus, et leurs seules colonnes publiques.
// Tant que la section 28 n'est pas passée, repli sur les tables avec la clé secrète et les mêmes filtres ici.
// On ne fait que lire : l'image manquante d'une ancienne annonce est calculée par l'import quotidien.

const LISTING_COLS =
  "id, seller_id, title, decklist, card_count, estimated_cents, estimate_complete, asking_cents, condition, description, status, created_at, french_percent, cover_card_name, cover_image_url, colors, card_details, format, archetype_id, meta_score, meta_status, meta_archetype, photos, commanders, bracket";
const DETAIL_COLS = `${LISTING_COLS}, meta_detail, primer`;
const SELLER_COLS = "id, display_name, avatar_url, moxfield_url, archidekt_url, created_at, department, city";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Source = {
  client: SupabaseClient;
  listings: string;
  sellers: string;
  badges: string;
  /** Repli sur les tables (vues absentes) : filtres de statut et de suspension faits ici. */
  legacy: boolean;
};

// Présence des vues, revérifiée toutes les 5 minutes tant qu'elles manquent.
let viewsReady = false;
let viewsCheckedAt = 0;
async function source(): Promise<Source> {
  if (!viewsReady && Date.now() - viewsCheckedAt > 5 * 60_000) {
    viewsCheckedAt = Date.now();
    const { error } = await getSupabasePublic().from("public_listings").select("id").limit(1);
    viewsReady = !error;
    if (error) console.warn("Vues publiques absentes (schema.sql, section 28) : lecture avec la clé secrète en attendant.");
  }
  return viewsReady
    ? { client: getSupabasePublic(), listings: "public_listings", sellers: "public_sellers", badges: "public_seller_badges", legacy: false }
    : { client: getSupabaseAdmin(), listings: "listings", sellers: "profiles", badges: "user_badges", legacy: true };
}

type SellerRow = NonNullable<PublicListing["seller"]> & { suspended_until?: string | null };
type ListingRow = Omit<PublicListing, "seller" | "archetype"> & {
  seller_id: string;
  archetype_id: number | null;
  meta_detail?: unknown;
  primer?: unknown;
};
type Hydrated = PublicListing & { seller_id: string; seller: SellerRow; meta_detail?: unknown; primer?: unknown };

/** Requête sur les annonces publiques (filtre de statut ajouté en repli). */
function listingsQuery(src: Source, cols: string) {
  const q = src.client.from(src.listings).select(cols);
  return src.legacy ? q.in("status", [...PUBLIC_STATUSES]) : q;
}

/** Vendeurs publics par identifiant (en repli : profils non suspendus). */
async function sellersById(src: Source, ids: string[]): Promise<Map<string, SellerRow>> {
  const out = new Map<string, SellerRow>();
  const unique = [...new Set(ids)];
  const cols = src.legacy ? `${SELLER_COLS}, suspended_until` : SELLER_COLS;
  for (let i = 0; i < unique.length; i += 200) {
    const { data, error } = await src.client.from(src.sellers).select(cols).in("id", unique.slice(i, i + 200));
    if (error) throw new Error(`Lecture des vendeurs impossible : ${error.message}`);
    for (const s of (data ?? []) as unknown as SellerRow[]) {
      if (src.legacy && s.suspended_until && new Date(s.suspended_until).getTime() > Date.now()) continue;
      delete s.suspended_until;
      out.set(s.id, s);
    }
  }
  return out;
}

/** Rattache l'archétype et le vendeur ; une annonce sans vendeur public disparaît. */
async function hydrate(src: Source, rows: ListingRow[]): Promise<Hydrated[]> {
  if (rows.length === 0) return [];
  const [sellers, archetypes] = await Promise.all([sellersById(src, rows.map((r) => r.seller_id)), getArchetypes()]);
  const byId = new Map<number, Archetype>(archetypes.map((a) => [a.id, { id: a.id, slug: a.slug, name: a.name }]));
  return rows.flatMap((r) => {
    const seller = sellers.get(r.seller_id);
    if (!seller) return [];
    const archetype = r.archetype_id != null ? (byId.get(r.archetype_id) ?? null) : null;
    return [{ ...r, archetype, seller } as unknown as Hydrated];
  });
}

/** Annonces publiques, les plus récentes d'abord. Mises en cache le temps de la requête (l'accueil les lit deux fois). */
export const fetchPublicListings = cache(async function fetchPublicListings(): Promise<PublicListing[]> {
  await connection(); // toujours à jour : lu à chaque requête
  const src = await source();
  // Toutes les annonces publiques, par paquets (Supabase en renvoie 1 000 au plus par requête).
  const CHUNK = 1000;
  const rows: ListingRow[] = [];
  for (let from = 0; from < 50 * CHUNK; from += CHUNK) {
    const { data, error } = await listingsQuery(src, LISTING_COLS)
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + CHUNK - 1);
    if (error) throw new Error(`Lecture des annonces impossible : ${error.message}`);
    rows.push(...((data ?? []) as unknown as ListingRow[]));
    if (!data || data.length < CHUNK) break;
  }
  return hydrate(src, rows);
});

/** Annonce publique avec les badges et le nombre de decks en vente du vendeur. */
export type PublicListingDetail = PublicListing & {
  /** Null : non lus ; l'appelant peut les demander à part. */
  sellerBadges: EarnedBadge[] | null;
  sellerDeckCount: number | null;
  /** Détail enregistré du score méta (null : à recalculer). */
  metaDetail: unknown;
  /** Photos réelles et primer. */
  media: ListingMedia;
};

/** Une annonce publique. Mise en cache le temps de la requête : le titre et la page la partagent. */
export const fetchPublicListing = cache(async function fetchPublicListing(id: string): Promise<PublicListingDetail | null> {
  await connection();
  if (!UUID.test(id)) return null;
  const src = await source();
  const { data, error } = await listingsQuery(src, DETAIL_COLS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Lecture de l'annonce impossible : ${error.message}`);
  if (!data) return null;
  const [listing] = await hydrate(src, [data as unknown as ListingRow]);
  if (!listing) return null;
  const [badges, deckCount] = await Promise.all([badgesOf(src, listing.seller_id), countActive(src, listing.seller_id)]);
  const media = mediaOf(listing);
  const { meta_detail: metaDetail = null, primer: _primer, ...rest } = listing;
  void _primer;
  return { ...rest, sellerBadges: badges, sellerDeckCount: deckCount, metaDetail, media };
});

async function badgesOf(src: Source, sellerId: string): Promise<EarnedBadge[] | null> {
  const { data, error } = await src.client.from(src.badges).select("badge, level").eq("user_id", sellerId);
  return error ? null : (data ?? []).map((b) => ({ key: b.badge as string, level: b.level as number }));
}

async function countActive(src: Source, sellerId: string): Promise<number | null> {
  const { count, error } = await src.client
    .from(src.listings)
    .select("id", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .eq("status", "active");
  return error ? null : count;
}

export type PublicSeller = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  moxfield_url: string | null;
  archidekt_url: string | null;
  created_at: string;
  /** Lieu d'expédition. */
  department?: string | null;
  city?: string | null;
};

/**
 * Profil public d'un vendeur et ses decks en vente ou réservés.
 * Null si le profil n'existe pas ou n'a aucun deck public : un membre sans annonce n'a pas de page.
 */
export const fetchPublicSeller = cache(async function fetchPublicSeller(
  id: string,
): Promise<{ seller: PublicSeller; listings: PublicListing[]; badges: EarnedBadge[] | null } | null> {
  await connection();
  if (!UUID.test(id)) return null;
  const src = await source();
  const { data, error } = await listingsQuery(src, LISTING_COLS)
    .eq("seller_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Lecture des annonces impossible : ${error.message}`);
  const listings = await hydrate(src, (data ?? []) as unknown as ListingRow[]);
  const seller = listings[0]?.seller;
  if (!seller) return null;
  return { seller: seller as PublicSeller, listings, badges: await badgesOf(src, id) };
});

/** Recalcule l'estimation d'une decklist avec les prix du jour (lus en cache, une heure au plus). */
export async function estimateDecklistNow(
  decklist: string,
): Promise<{ deck: ParsedDeck; estimate: Estimate; pricesAsOf: string | null }> {
  const deck = parseDecklist(decklist);
  const { prices, pricesAsOf } = await lookupDeckPricesCached(deck);
  return { deck, estimate: buildEstimate(deck, prices), pricesAsOf };
}

/** Nombre de decks en vente (statut « active ») d'un vendeur, pour son encadré sur une annonce. */
export async function countSellerDecks(sellerId: string): Promise<number | null> {
  if (!UUID.test(sellerId)) return null;
  return countActive(await source(), sellerId);
}

/** Niveau de puissance enregistré d'une annonce Commander publique (null : pas calculé ou annonce non publique). */
export async function fetchListingBracket(
  id: string,
): Promise<{ bracket: number | null; bracketMin: number | null; detail: unknown } | null> {
  if (!UUID.test(id)) return null;
  const src = await source();
  const { data, error } = await listingsQuery(src, "bracket, bracket_min, bracket_detail").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as { bracket: number | null; bracket_min: number | null; bracket_detail: unknown };
  return { bracket: row.bracket ?? null, bracketMin: row.bracket_min ?? null, detail: row.bracket_detail ?? null };
}
