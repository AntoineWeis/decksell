// Calcul du prix d'un deck à partir des prix déjà récupérés en base.
// Fonction pure : ne touche ni à la base ni au réseau.
//
// Règle : chaque carte prend son impression non-foil la moins chère (Cardmarket).
// Une carte sans prix n'est pas comptée : l'estimation est alors marquée
// « incomplète » et la carte apparaît dans `unpriced`, pour que le vendeur la complète.
// Les montants sont en centimes (entiers) pour éviter les erreurs d'arrondi.

import type { ParsedDeck } from "./decklist.ts";
import { normalizeName } from "./decklist.ts";

/** Une carte trouvée en base (une ligne de la fonction SQL lookup_prices). */
export type CardPrice = {
  oracleId: string;
  name: string;
  printId: string;
  setCode: string;
  collectorNumber: string;
  imageUrl: string | null;
  artist: string | null;
  rarity: string | null; // common, uncommon, rare, mythic, special, bonus
  priceEur: number | null; // impression non-foil la moins chère ; null = aucun prix
  minPriceEurFoil: number | null; // pour info quand la carte n'existe qu'en foil
  cmc?: number | null; // valeur de mana (coût converti) ; absente avant la migration de la base
  typeLine?: string | null; // ex. "Creature — Human Wizard", "Instant // Land"
  legalModern?: boolean | null; // légale en Modern (ni interdite, ni hors format) ; absente = inconnue
  legalCommander?: boolean | null; // légale en Commander ; absente = inconnue
  colorIdentity?: string[] | null; // identité de couleur (ex. ["U", "G"]) ; absente = inconnue
  gameChanger?: boolean | null; // sur la liste des Game Changers (Commander) ; absente = inconnue
  /** Impression précise demandée par la liste (édition et numéro), et non la moins chère. */
  exactPrint?: boolean;
  /** Prix foil de cette impression (impressions précises seulement). */
  priceEurFoil?: number | null;
};

/**
 * Impression retenue pour le prix d'une ligne :
 * - exact : l'impression indiquée dans la liste (édition, numéro, foil) ;
 * - cheapest : aucune indiquée, la moins chère (règle par défaut) ;
 * - fallback : celle indiquée est introuvable ou sans prix, la moins chère à la place.
 */
export type PrintMatch = "exact" | "cheapest" | "fallback";

export type LineStatus =
  | "priced" // prix Cardmarket trouvé
  | "manual" // prix saisi par le vendeur
  | "no_price" // carte connue, mais sans prix non-foil
  | "not_found"; // nom inconnu

export type PricedLine = {
  board: "main" | "side";
  name: string; // tel que saisi
  quantity: number;
  status: LineStatus;
  card: CardPrice | null;
  unitCents: number | null;
  lineCents: number | null;
  /** Impression demandée par la liste (absente : aucune précisée). */
  requested?: { set: string; number: string | null; found: boolean } | null;
  foil?: boolean;
  printMatch?: PrintMatch;
};

export type Estimate = {
  lines: PricedLine[];
  mainCents: number;
  sideCents: number;
  totalCents: number;
  complete: boolean; // false dès qu'une carte n'a pas de prix
  unpriced: PricedLine[]; // cartes à compléter (no_price et not_found)
  unpricedCardCount: number; // en nombre d'exemplaires
};

/** Prix saisis par le vendeur, en centimes, indexés par normalizeName(nom). */
export type ManualPrices = Record<string, number>;

/** Clé de rapprochement : nom normalisé de la première face. */
export function frontKey(name: string): string {
  return normalizeName(name).split(" // ")[0];
}

/**
 * Noms à envoyer à lookup_prices : première face en minuscules, avec et sans
 * accents (la base garde les accents, la saisie ne les a pas toujours).
 */
export function lookupNames(deck: ParsedDeck): string[] {
  const keys = new Set<string>();
  for (const e of [...deck.main, ...deck.side]) {
    // Accents gardés, apostrophes et espaces normalisés comme dans normalizeName.
    const accented = e.name.replace(/[‘’ʼ`´]/g, "'").replace(/\s+/g, " ").toLowerCase();
    keys.add(accented.split(" // ")[0].trim());
    keys.add(frontKey(e.name));
  }
  return [...keys];
}

/** Impressions demandées par la liste, en « première face|édition » (clé de recherche et de cache). */
export function printRequests(deck: Pick<ParsedDeck, "main" | "side">): string[] {
  const keys = new Set<string>();
  for (const e of [...deck.main, ...deck.side]) if (e.set) keys.add(`${frontKey(e.name)}|${e.set}`);
  return [...keys];
}

/** L'impression demandée parmi les impressions précises trouvées (anglaise d'abord). */
function pickPrint(
  front: string,
  set: string,
  number: string | undefined,
  foil: boolean,
  prints: CardPrice[] | undefined,
): CardPrice | null {
  const inSet = (prints ?? []).filter((p) => p.setCode.toLowerCase() === set && frontKey(p.name) === front);
  if (number) return inSet.find((p) => p.collectorNumber.toLowerCase() === number.toLowerCase()) ?? null;
  // Édition sans numéro (« [MH3] ») : l'impression la moins chère de cette édition.
  const priceOf = (p: CardPrice) => (foil ? p.priceEurFoil : p.priceEur) ?? Infinity;
  return [...inSet].sort((a, b) => priceOf(a) - priceOf(b))[0] ?? null;
}

export function toCents(eur: number): number {
  return Math.round(eur * 100);
}

/** Choisit la carte correspondant à un nom saisi parmi les résultats. */
function pickCard(name: string, candidates: CardPrice[] | undefined): CardPrice | null {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  const full = normalizeName(name);
  return (
    candidates.find((c) => normalizeName(c.name) === full) ??
    candidates.find((c) => c.priceEur != null) ??
    candidates[0]
  );
}

export function buildEstimate(
  deck: ParsedDeck,
  prices: CardPrice[],
  manual: ManualPrices = {},
): Estimate {
  // Impressions les moins chères (une par carte) d'un côté, impressions précises de l'autre.
  const byFront = new Map<string, CardPrice[]>();
  const printsByFront = new Map<string, CardPrice[]>();
  for (const p of prices) {
    const k = frontKey(p.name);
    const index = p.exactPrint ? printsByFront : byFront;
    const list = index.get(k);
    if (list) list.push(p);
    else index.set(k, [p]);
  }

  const lines: PricedLine[] = [];
  const boards = [
    ["main", deck.main],
    ["side", deck.side],
  ] as const;

  for (const [board, entries] of boards) {
    for (const e of entries) {
      const front = frontKey(e.name);
      const foil = e.foil === true;
      const cheapest = pickCard(e.name, byFront.get(front));
      // Impression indiquée dans la liste, si elle existe et a un prix dans la finition voulue.
      const exact = e.set ? pickPrint(front, e.set, e.number, foil, printsByFront.get(front)) : null;
      const exactEur = exact ? (foil ? exact.priceEurFoil : exact.priceEur) : null;
      const useExact = exact != null && exactEur != null;
      const card = useExact ? exact : cheapest;
      // Sans impression précise : prix foil le plus bas de la carte pour une ligne foil.
      const eur = useExact ? exactEur : foil ? (cheapest?.minPriceEurFoil ?? cheapest?.priceEur ?? null) : (cheapest?.priceEur ?? null);
      const printMatch: PrintMatch = useExact ? "exact" : e.set ? "fallback" : "cheapest";
      const manualCents = manual[normalizeName(e.name)];

      let status: LineStatus;
      let unitCents: number | null = null;
      if (manualCents != null && Number.isFinite(manualCents) && manualCents >= 0) {
        status = "manual";
        unitCents = Math.round(manualCents);
      } else if (!card) {
        status = "not_found";
      } else if (eur == null) {
        status = "no_price";
      } else {
        status = "priced";
        unitCents = toCents(eur);
      }

      lines.push({
        board,
        name: e.name,
        quantity: e.quantity,
        status,
        card,
        unitCents,
        lineCents: unitCents == null ? null : unitCents * e.quantity,
        requested: e.set ? { set: e.set, number: e.number ?? null, found: exact != null } : null,
        foil,
        printMatch,
      });
    }
  }

  const sum = (b: "main" | "side") =>
    lines.filter((l) => l.board === b).reduce((n, l) => n + (l.lineCents ?? 0), 0);
  const mainCents = sum("main");
  const sideCents = sum("side");
  const unpriced = lines.filter((l) => l.unitCents == null);

  return {
    lines,
    mainCents,
    sideCents,
    totalCents: mainCents + sideCents,
    complete: unpriced.length === 0,
    unpriced,
    unpricedCardCount: unpriced.reduce((n, l) => n + l.quantity, 0),
  };
}

/** "1 234,56 €" */
export function formatEur(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/** Saisie en euros ("3,50", "3.5", "12 €") -> centimes ; null si vide ou invalide. */
export function parseEur(raw: string): number | null {
  const cleaned = raw.replace(/[€\s]/g, "").replace(",", ".");
  if (cleaned === "" || !/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

/** Carte phare d'une estimation : la plus chère à l'unité, avec une image. */
export function starCard(estimate: Estimate): CardPrice | null {
  const star = estimate.lines
    .filter((l) => l.unitCents != null && l.card?.imageUrl)
    .sort((a, b) => b.unitCents! - a.unitCents!)[0];
  return star?.card ?? null;
}

/** Nom et image du ou des commandants, dans l'ordre de la liste (médaillon à côté du prix). */
export function commanderCards(estimate: Estimate, commanders: string[]): { name: string; imageUrl: string | null }[] {
  return commanders.flatMap((c) => {
    const line = estimate.lines.find((l) => l.board === "main" && normalizeName(l.name) === normalizeName(c));
    return line ? [{ name: line.card?.name ?? line.name, imageUrl: line.card?.imageUrl ?? null }] : [];
  });
}

/**
 * Image du deck (vignette de l'index, bandeau de la fiche) : le commandant d'un deck Commander
 * (le premier, s'ils sont deux), sinon la carte la plus chère.
 */
export function coverCard(estimate: Estimate, commanders: string[] = []): CardPrice | null {
  const keys = commanders.map(normalizeName);
  for (const key of keys) {
    const line = estimate.lines.find((l) => l.board === "main" && normalizeName(l.name) === key && l.card?.imageUrl);
    if (line?.card) return line.card;
  }
  return starCard(estimate);
}
