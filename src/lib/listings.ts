// Libellés partagés entre le navigateur et le serveur pour les annonces.

export const CONDITIONS = {
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  played: "Played",
} as const;
export type Condition = keyof typeof CONDITIONS;

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
  seller: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    moxfield_url: string | null;
    archidekt_url: string | null;
  } | null;
};

/** Illustration seule (art crop) à partir de l'image Scryfall « normal » d'une carte. */
export function artCrop(imageUrl: string | null): string | null {
  return imageUrl ? imageUrl.replace("/normal/", "/art_crop/") : null;
}

/** Colonnes sélectionnées pour une annonce. */
export const LISTING_COLUMNS =
  "id, title, decklist, card_count, estimated_cents, estimate_complete, asking_cents, condition, description, status, created_at, french_percent, cover_card_name, cover_image_url, colors, archetype:archetypes(id, slug, name)";

/** « 70 », « 70 % » -> 70 ; null si vide ou hors de 0 à 100. */
export function parsePercent(raw: string): number | null {
  const cleaned = raw.replace(/[%\s]/g, "");
  if (!/^\d{1,3}$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n >= 0 && n <= 100 ? n : null;
}
