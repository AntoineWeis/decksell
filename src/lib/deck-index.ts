// Logique de l'index des decks en vente : lecture de l'adresse, filtres, recherche par carte, tri.
// Fonctions pures : ni base, ni réseau. Testées dans tests/deck-index.test.ts.
import { normalizeName, parseDecklist } from "./decklist.ts";
import { normalizeColors, type ManaColor, type PublicListing } from "./listings.ts";

export const SORTS = {
  recent: "Plus récents",
  "prix-asc": "Prix croissant",
  "prix-desc": "Prix décroissant",
  affaire: "Meilleures affaires",
} as const;
export type SortKey = keyof typeof SORTS;
export const DEFAULT_SORT: SortKey = "recent";

export type DeckQuery = {
  colors: ManaColor[];
  archetype: string | null;
  /** Texte cherché dans les noms de cartes, tel que saisi. */
  card: string;
  sort: SortKey;
};

export const EMPTY_QUERY: DeckQuery = { colors: [], archetype: null, card: "", sort: DEFAULT_SORT };

/** Longueur minimale d'une recherche par carte : en dessous, presque tout correspond. */
export const MIN_CARD_QUERY = 3;

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Lit l'adresse : ?c=UR (couleurs) & a=burn (archétype) & carte=ragavan & tri=prix-asc. */
export function readDeckQuery(sp: RawParams): DeckQuery {
  const c = first(sp.c);
  const a = first(sp.a);
  const card = (first(sp.carte) ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const sort = first(sp.tri);
  return {
    colors: normalizeColors(typeof c === "string" ? c.toUpperCase().split("") : []),
    archetype: typeof a === "string" && /^[a-z0-9-]{1,60}$/.test(a) ? a : null,
    card,
    sort: sort && sort in SORTS ? (sort as SortKey) : DEFAULT_SORT,
  };
}

/** Adresse de l'index pour cette requête (couleurs dans l'ordre WUBRG, paramètres par défaut omis). */
export function decksHref(q: DeckQuery): string {
  const params = new URLSearchParams();
  if (q.colors.length) params.set("c", q.colors.join(""));
  if (q.archetype) params.set("a", q.archetype);
  if (q.card) params.set("carte", q.card);
  if (q.sort !== DEFAULT_SORT) params.set("tri", q.sort);
  const s = params.toString();
  return s ? `/decks?${s}` : "/decks";
}

export type CardHit = { name: string; quantity: number };

/**
 * Cartes de la liste dont le nom contient le texte cherché (sans tenir compte des
 * majuscules, des accents ni des apostrophes typographiques). Principal et réserve
 * sont additionnés.
 */
export function findCards(decklist: string, query: string): CardHit[] {
  const q = normalizeName(query);
  if (q.length < MIN_CARD_QUERY) return [];
  const deck = parseDecklist(decklist);
  const hits = new Map<string, CardHit>();
  for (const e of [...deck.main, ...deck.side]) {
    if (!normalizeName(e.name).includes(q)) continue;
    const key = normalizeName(e.name);
    const hit = hits.get(key);
    if (hit) hit.quantity += e.quantity;
    else hits.set(key, { name: e.name, quantity: e.quantity });
  }
  return [...hits.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
}

/** Écart entre le prix demandé et la valeur estimée, en % (négatif : moins cher que l'estimation). */
export function priceGap(l: Pick<PublicListing, "asking_cents" | "estimated_cents">): number | null {
  return l.estimated_cents > 0 ? ((l.asking_cents - l.estimated_cents) / l.estimated_cents) * 100 : null;
}

export type IndexedListing = { listing: PublicListing; hits: CardHit[] };

/** Applique couleurs, archétype et recherche par carte (sans le tri). */
export function filterListings(listings: PublicListing[], q: DeckQuery): IndexedListing[] {
  const out: IndexedListing[] = [];
  for (const l of listings) {
    const colors = l.colors ?? [];
    if (!q.colors.every((c) => colors.includes(c))) continue;
    if (q.archetype && l.archetype?.slug !== q.archetype) continue;
    let hits: CardHit[] = [];
    // Recherche trop courte : ignorée (l'interface le signale) plutôt que de tout masquer.
    if (normalizeName(q.card).length >= MIN_CARD_QUERY) {
      hits = findCards(l.decklist, q.card);
      if (hits.length === 0) continue;
    }
    out.push({ listing: l, hits });
  }
  return out;
}

/** Trie sans modifier le tableau reçu. À égalité, le plus récent d'abord. */
export function sortListings<T extends { listing: PublicListing }>(items: T[], sort: SortKey): T[] {
  const recent = (a: T, b: T) => b.listing.created_at.localeCompare(a.listing.created_at);
  const by: Record<SortKey, (a: T, b: T) => number> = {
    recent,
    "prix-asc": (a, b) => a.listing.asking_cents - b.listing.asking_cents || recent(a, b),
    "prix-desc": (a, b) => b.listing.asking_cents - a.listing.asking_cents || recent(a, b),
    // Les decks sans estimation passent à la fin.
    affaire: (a, b) => {
      const ga = priceGap(a.listing);
      const gb = priceGap(b.listing);
      if (ga == null || gb == null) return (ga == null ? 1 : 0) - (gb == null ? 1 : 0) || recent(a, b);
      return ga - gb || recent(a, b);
    },
  };
  return [...items].sort(by[sort]);
}
