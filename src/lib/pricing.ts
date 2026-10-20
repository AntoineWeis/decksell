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
  priceEur: number | null; // impression non-foil la moins chère ; null = aucun prix
  minPriceEurFoil: number | null; // pour info quand la carte n'existe qu'en foil
};

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
  const byFront = new Map<string, CardPrice[]>();
  for (const p of prices) {
    const k = frontKey(p.name);
    const list = byFront.get(k);
    if (list) list.push(p);
    else byFront.set(k, [p]);
  }

  const lines: PricedLine[] = [];
  const boards = [
    ["main", deck.main],
    ["side", deck.side],
  ] as const;

  for (const [board, entries] of boards) {
    for (const e of entries) {
      const card = pickCard(e.name, byFront.get(frontKey(e.name)));
      const manualCents = manual[normalizeName(e.name)];

      let status: LineStatus;
      let unitCents: number | null = null;
      if (manualCents != null && Number.isFinite(manualCents) && manualCents >= 0) {
        status = "manual";
        unitCents = Math.round(manualCents);
      } else if (!card) {
        status = "not_found";
      } else if (card.priceEur == null) {
        status = "no_price";
      } else {
        status = "priced";
        unitCents = toCents(card.priceEur);
      }

      lines.push({
        board,
        name: e.name,
        quantity: e.quantity,
        status,
        card,
        unitCents,
        lineCents: unitCents == null ? null : unitCents * e.quantity,
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
