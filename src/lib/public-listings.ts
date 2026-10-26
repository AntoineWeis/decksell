import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { parseDecklist, type ParsedDeck } from "./decklist.ts";
import { buildEstimate, starCard, type Estimate } from "./pricing.ts";
import { lookupDeckPrices, lookupDeckPricesCached } from "./estimate.ts";
import { getSupabaseAdmin } from "./supabase-server.ts";
import type { EarnedBadge } from "./badges.ts";
import { mediaOf, type ListingMedia } from "./listing-media.ts";
import { LISTING_COLUMNS, PUBLIC_STATUSES, type PublicListing } from "./listings.ts";

// Lecture publique des annonces. On passe par la clé secrète côté serveur, mais on ne
// renvoie que les annonces en vente ou réservées, et seulement les colonnes publiques.

// La clé étrangère est précisée : les favoris relient aussi annonces et profils, et sans
// elle Supabase refuse la jointure (plusieurs chemins possibles, erreur PGRST201).
const SELLER_BASE = "id, display_name, avatar_url, moxfield_url, archidekt_url, created_at";
// Localisation et suspension (sections 17 et 19 du schéma). Base pas encore migrée : on relit sans.
const SELECT = `${LISTING_COLUMNS}, meta_score, meta_status, meta_archetype, photos, seller:profiles!listings_seller_id_fkey(${SELLER_BASE}, department, city, suspended_until)`;
// Page d'un deck : détail du score méta, badges et nombre de decks en vente du vendeur, en une requête.
const DETAIL_SELECT = SELECT.replace("photos,", "photos, meta_detail, primer,").replace(
  "suspended_until)",
  "suspended_until, user_badges(badge, level), active:listings!listings_seller_id_fkey(count))",
);
const LEGACY_SELECT = `${LISTING_COLUMNS}, seller:profiles!listings_seller_id_fkey(${SELLER_BASE})`;

type Row = PublicListing & { seller: (PublicListing["seller"] & { suspended_until?: string | null }) | null };

/** Vrai si l'erreur vient d'une colonne absente (schéma pas encore à jour). */
const missingColumn = (e: { code?: string; message: string } | null) =>
  !!e && (e.code === "42703" || e.code === "PGRST204" || /does not exist|could not find/i.test(e.message));

/** Retire les annonces des vendeurs suspendus, et l'information de suspension elle-même. */
function visible(rows: Row[]): PublicListing[] {
  const now = Date.now();
  return rows
    .filter((l) => !(l.seller?.suspended_until && new Date(l.seller.suspended_until).getTime() > now))
    .map((l) => {
      if (l.seller) delete l.seller.suspended_until;
      return l;
    });
}
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

/** Annonces publiques, les plus récentes d'abord. Mises en cache le temps de la requête (l'accueil les lit deux fois). */
export const fetchPublicListings = cache(async function fetchPublicListings(): Promise<PublicListing[]> {
  await connection(); // toujours à jour : lu à chaque requête
  // Toutes les annonces publiques, par paquets (Supabase en renvoie 1 000 au plus par requête).
  const CHUNK = 1000;
  const listings: PublicListing[] = [];
  let select = SELECT;
  for (let from = 0; from < 50 * CHUNK; from += CHUNK) {
    const page = (cols: string) =>
      getSupabaseAdmin()
        .from("listings")
        .select(cols)
        .in("status", [...PUBLIC_STATUSES])
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, from + CHUNK - 1);
    let { data, error } = await page(select);
    if (missingColumn(error)) ({ data, error } = await page((select = LEGACY_SELECT)));
    if (error) throw new Error(`Lecture des annonces impossible : ${error.message}`);
    listings.push(...visible((data ?? []) as unknown as Row[]));
    if (!data || data.length < CHUNK) break;
  }
  await fillMissingCovers(listings);
  return listings;
});

/** Annonce publique avec, si la base les fournit, les badges et le nombre de decks en vente du vendeur. */
export type PublicListingDetail = PublicListing & {
  /** Null : non lus (schéma pas à jour) ; l'appelant peut les demander à part. */
  sellerBadges: EarnedBadge[] | null;
  sellerDeckCount: number | null;
  /** Détail enregistré du score méta (null : à recalculer). */
  metaDetail: unknown;
  /** Photos réelles et primer (vides tant que le schéma n'est pas à jour). */
  media: ListingMedia;
};

type SellerExtras = { user_badges?: { badge: string; level: number }[]; active?: { count: number }[] };

/** Une annonce publique. Mise en cache le temps de la requête : le titre et la page la partagent. */
export const fetchPublicListing = cache(async function fetchPublicListing(id: string): Promise<PublicListingDetail | null> {
  await connection();
  if (!UUID.test(id)) return null;
  const one = (cols: string) => {
    const q = getSupabaseAdmin().from("listings").select(cols).eq("id", id).in("status", [...PUBLIC_STATUSES]);
    return (cols === DETAIL_SELECT ? q.eq("seller.active.status", "active") : q).maybeSingle();
  };
  let { data, error } = await one(DETAIL_SELECT);
  if (missingColumn(error)) ({ data, error } = await one(SELECT));
  if (missingColumn(error)) ({ data, error } = await one(LEGACY_SELECT));
  if (error) throw new Error(`Lecture de l'annonce impossible : ${error.message}`);
  const row = data as unknown as
    | (Row & { meta_detail?: unknown; photos?: unknown; primer?: unknown; seller: (Row["seller"] & SellerExtras) | null })
    | null;
  const metaDetail = row?.meta_detail ?? null;
  const media = mediaOf(row);
  if (row) {
    delete row.meta_detail;
    delete row.photos;
    delete row.primer;
  }
  const extras: SellerExtras = { user_badges: row?.seller?.user_badges, active: row?.seller?.active };
  if (row?.seller) {
    delete row.seller.user_badges;
    delete row.seller.active;
  }
  const listing = row ? (visible([row])[0] ?? null) : null;
  if (!listing) return null;
  await fillMissingCovers([listing]);
  return {
    ...listing,
    sellerBadges: extras.user_badges ? extras.user_badges.map((b) => ({ key: b.badge, level: b.level })) : null,
    sellerDeckCount: extras.active?.[0]?.count ?? null,
    metaDetail,
    media,
  };
});

export type PublicSeller = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  moxfield_url: string | null;
  archidekt_url: string | null;
  created_at: string;
  /** Lieu d'expédition (absent tant que le schéma n'est pas à jour). */
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
  const admin = getSupabaseAdmin();
  const sellerListings = (cols: string) =>
    admin
      .from("listings")
      .select(cols)
      .eq("seller_id", id)
      .in("status", [...PUBLIC_STATUSES])
      .order("created_at", { ascending: false })
      .limit(100);
  const sellerProfile = (cols: string) => admin.from("profiles").select(cols).eq("id", id).maybeSingle();
  const PROFILE = "id, display_name, avatar_url, moxfield_url, archidekt_url, created_at";
  const [firstProfile, firstListings] = await Promise.all([
    sellerProfile(`${PROFILE}, department, city, user_badges(badge, level)`),
    sellerListings(SELECT),
  ]);
  const profile = missingColumn(firstProfile.error) ? await sellerProfile(PROFILE) : firstProfile;
  const listings = missingColumn(firstListings.error) ? await sellerListings(LEGACY_SELECT) : firstListings;
  if (profile.error) throw new Error(`Lecture du vendeur impossible : ${profile.error.message}`);
  if (listings.error) throw new Error(`Lecture des annonces impossible : ${listings.error.message}`);
  const rows = visible((listings.data ?? []) as unknown as Row[]);
  if (!profile.data || rows.length === 0) return null;
  await fillMissingCovers(rows);
  const { user_badges, ...seller } = profile.data as unknown as PublicSeller & SellerExtras;
  return {
    seller,
    listings: rows,
    badges: user_badges ? user_badges.map((b) => ({ key: b.badge, level: b.level })) : null,
  };
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
  const { count, error } = await getSupabaseAdmin()
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .eq("status", "active");
  return error ? null : count;
}

/** Niveau de puissance enregistré d'une annonce Commander (null : colonnes absentes ou pas encore calculé). */
export async function fetchListingBracket(
  id: string,
): Promise<{ bracket: number | null; bracketMin: number | null; detail: unknown } | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("listings")
    .select("bracket, bracket_min, bracket_detail")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return { bracket: data.bracket ?? null, bracketMin: data.bracket_min ?? null, detail: data.bracket_detail ?? null };
}
