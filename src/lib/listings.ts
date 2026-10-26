// Libellés partagés entre le navigateur et le serveur pour les annonces.
import type { CardDetail } from "./card-details.ts";

export const CONDITIONS = {
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  played: "Played",
} as const;
export type Condition = keyof typeof CONDITIONS;

/**
 * Formats de jeu proposés. Pour en ouvrir un autre, l'ajouter ici et dans la contrainte
 * listings_format_check (supabase/schema.sql, section 16).
 */
export const FORMATS = {
  modern: "Modern",
  commander: "Commander",
} as const;
export type DeckFormat = keyof typeof FORMATS;
export const DEFAULT_FORMAT: DeckFormat = "modern";

/** Format connu, sinon le format par défaut. */
export function normalizeFormat(value: unknown): DeckFormat {
  return typeof value === "string" && value in FORMATS ? (value as DeckFormat) : DEFAULT_FORMAT;
}

export const STATUSES = {
  active: "En vente",
  reserved: "Réservé",
  sold: "Vendu",
  withdrawn: "Retiré",
} as const;
export type ListingStatus = keyof typeof STATUSES;

export type Listing = {
  id: string;
  title: string;
  decklist: string;
  card_count: number;
  estimated_cents: number;
  estimate_complete: boolean;
  asking_cents: number;
  condition: Condition;
  description: string | null;
  status: ListingStatus;
  sold_cents: number | null;
  sold_at: string | null;
  created_at: string;
  french_percent: number | null; // part des cartes en français, saisie par le vendeur ; le reste en anglais
  cover_card_name: string | null; // carte phare au moment de la mise en vente
  cover_image_url: string | null;
  colors: ManaColor[]; // couleurs du deck, déclarées par le vendeur ; vide = incolore
  archetype: Archetype | null; // archétype choisi dans la liste fixe
  card_details: CardDetail[]; // état et langue par ligne de carte ; vide pour les anciennes annonces
  format: DeckFormat; // format de jeu du deck
  commanders?: string[]; // commandant(s) d'un deck Commander ; absent avant la migration (section 25)
};

/** Couleurs de Magic, dans l'ordre WUBRG. */
export const MANA_COLORS = {
  W: "Blanc",
  U: "Bleu",
  B: "Noir",
  R: "Rouge",
  G: "Vert",
} as const;
export type ManaColor = keyof typeof MANA_COLORS;
const COLOR_ORDER = Object.keys(MANA_COLORS) as ManaColor[];

/** Garde les couleurs valides, sans doublon, dans l'ordre WUBRG. */
export function normalizeColors(values: unknown[]): ManaColor[] {
  const set = new Set(values.filter((v): v is ManaColor => typeof v === "string" && v in MANA_COLORS));
  return COLOR_ORDER.filter((c) => set.has(c));
}

export type Archetype = { id: number; slug: string; name: string };

/** Statuts visibles dans l'index public. */
export const PUBLIC_STATUSES = ["active", "reserved"] as const;

/** Annonce telle qu'affichée publiquement (avec le profil du vendeur). */
export type PublicListing = Omit<Listing, "sold_cents" | "sold_at"> & {
  /** Proximité méta (absente tant que le schéma n'est pas à jour ou le score pas calculé). */
  meta_score?: number | null;
  meta_status?: string | null;
  meta_archetype?: string | null;
  /** Photos réelles du deck (absentes tant que le schéma n'est pas à jour). */
  photos?: string[];
  seller: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    moxfield_url: string | null;
    archidekt_url: string | null;
    created_at?: string;
    /** Lieu d'expédition (absent tant que le schéma n'est pas à jour). */
    department?: string | null;
    city?: string | null;
  } | null;
};

/** Illustration seule (art crop) à partir de l'image Scryfall « normal » d'une carte. */
export function artCrop(imageUrl: string | null): string | null {
  return imageUrl ? imageUrl.replace("/normal/", "/art_crop/") : null;
}

/** Petite image Scryfall (146 × 204, ~15 Ko au lieu de ~110 Ko) pour les miniatures. */
export function smallImage(imageUrl: string | null): string | null {
  return imageUrl ? imageUrl.replace("/normal/", "/small/") : null;
}

/** Colonnes sélectionnées pour une annonce. */
export const LISTING_COLUMNS =
  "id, title, decklist, card_count, estimated_cents, estimate_complete, asking_cents, condition, description, status, created_at, french_percent, cover_card_name, cover_image_url, colors, card_details, format, archetype:archetypes(id, slug, name)";

/** « 70 », « 70 % » -> 70 ; null si vide ou hors de 0 à 100. */
export function parsePercent(raw: string): number | null {
  const cleaned = raw.replace(/[%\s]/g, "");
  if (!/^\d{1,3}$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n >= 0 && n <= 100 ? n : null;
}
