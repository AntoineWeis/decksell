// Score de proximité entre deux listes Modern. Fonctions pures : ni base, ni réseau.
// Méthode : similarité de Ruzicka pondérée (Jaccard pondéré sur les quantités), calculée
// séparément sur le principal et la réserve, puis combinée (voir meta-config.ts et
// docs/score-meta.md). Testé dans tests/similarity.test.ts.

import { BOARD_WEIGHTS, CARD_WEIGHT, VALIDITY, VERDICTS, type VerdictKey } from "./meta-config.ts";
import { frontKey } from "./pricing.ts";

/** Cartes d'une partie du deck : clé normalisée → quantité. */
export type Board = Map<string, number>;

/** Une liste prête à comparer. `names` garde un nom lisible par clé, pour les résumés. */
export type DeckCards = { main: Board; side: Board; names: Map<string, string> };

/** Poids des cartes, calculé sur le corpus de référence. */
export type CardWeights = { get(key: string): number };

/**
 * Clé de comparaison d'une carte : nom de la première face, normalisé (accents, casse, apostrophes).
 * « Wear/Tear » (export MTGTop8), « Wear / Tear » et « Wear // Tear » donnent tous « wear » :
 * aucun nom de carte ne contient de barre oblique, hors cartes doubles.
 */
export const cardKey = (name: string) => frontKey(name).split("/")[0].trim();

const BASIC_LANDS = new Set(
  ["plains", "island", "swamp", "mountain", "forest", "wastes"].flatMap((n) => [n, `snow-covered ${n}`]),
);

/** Nombre d'exemplaires d'une partie du deck. */
export const boardSize = (b: Board) => [...b.values()].reduce((n, q) => n + q, 0);

/**
 * Poids de chaque carte d'après sa fréquence dans le corpus : ln(1 + N / df), borné, les terres
 * de base réduites. Une carte inconnue du corpus prend le poids maximal : jouer une carte que
 * personne ne joue en tournoi éloigne vraiment une liste du méta.
 */
export function buildWeights(corpus: DeckCards[]): CardWeights {
  const df = new Map<string, number>();
  for (const deck of corpus) {
    for (const key of new Set([...deck.main.keys(), ...deck.side.keys()])) df.set(key, (df.get(key) ?? 0) + 1);
  }
  const n = Math.max(1, corpus.length);
  const cache = new Map<string, number>();
  return {
    get(key) {
      let w = cache.get(key);
      if (w !== undefined) return w;
      const d = df.get(key);
      w = d ? Math.log(1 + n / d) : CARD_WEIGHT.max;
      w = Math.min(CARD_WEIGHT.max, Math.max(CARD_WEIGHT.min, w));
      if (BASIC_LANDS.has(key)) w *= CARD_WEIGHT.basicLandFactor;
      cache.set(key, w);
      return w;
    },
  };
}

/** Poids uniformes (1 partout) : pour comparer sans corpus, ou dans les tests. */
export const UNIFORM_WEIGHTS: CardWeights = { get: () => 1 };

/**
 * Similarité de Ruzicka pondérée entre deux parties de deck, de 0 à 1 :
 * Σ poids × min(qa, qb) / Σ poids × max(qa, qb).
 * Prend en compte les cartes communes, les quantités et les différences dans les deux sens
 * (une carte en plus d'un côté augmente le dénominateur). Null si les deux sont vides.
 */
export function boardSimilarity(a: Board, b: Board, weights: CardWeights): number | null {
  let shared = 0;
  let union = 0;
  for (const key of new Set([...a.keys(), ...b.keys()])) {
    const qa = a.get(key) ?? 0;
    const qb = b.get(key) ?? 0;
    const w = weights.get(key);
    shared += w * Math.min(qa, qb);
    union += w * Math.max(qa, qb);
  }
  return union > 0 ? shared / union : null;
}

export type Comparison = {
  /** Score global de 0 à 100 (arrondi). */
  score: number;
  /** Similarité du principal et de la réserve, de 0 à 1 (null si non calculable). */
  main: number;
  side: number | null;
  /** « missing » : une des deux réserves est vide, le score ne repose que sur le principal. */
  sideboard: "compared" | "missing";
};

/**
 * Compare deux listes. Principal et réserve pèsent selon BOARD_WEIGHTS ; si une réserve manque
 * d'un côté, le score ne porte que sur le principal et le signale (sideboard: "missing")
 * plutôt que de compter une réserve absente comme totalement différente.
 */
export function compareDecks(a: DeckCards, b: DeckCards, weights: CardWeights, boardWeights = BOARD_WEIGHTS): Comparison {
  const main = boardSimilarity(a.main, b.main, weights) ?? 0;
  const bothSides = a.side.size > 0 && b.side.size > 0;
  const side = bothSides ? boardSimilarity(a.side, b.side, weights) : null;
  const total = boardWeights.main + boardWeights.side;
  const raw = side == null ? main : (boardWeights.main * main + boardWeights.side * side) / total;
  return { score: Math.round(raw * 100), main, side, sideboard: bothSides ? "compared" : "missing" };
}

/** Lecture du score : liste méta, proche, variante, hors méta. */
export function verdictOf(score: number): (typeof VERDICTS)[number] {
  return VERDICTS.find((v) => score >= v.min) ?? VERDICTS[VERDICTS.length - 1];
}
export type { VerdictKey };

export type CardDiff = { name: string; mine: number; theirs: number };

export type DeckDiff = {
  /** Cartes communes (quantité commune), des plus révélatrices aux moins révélatrices. */
  shared: CardDiff[];
  /** Cartes en plus dans la liste comparée (ou en plus grand nombre). */
  extra: CardDiff[];
  /** Cartes de la liste de référence absentes de la liste comparée (ou en moins grand nombre). */
  missing: CardDiff[];
};

/** Résumé des points communs et des différences d'une partie du deck, par importance (poids × écart). */
export function diffBoards(mine: Board, theirs: Board, weights: CardWeights, names: (key: string) => string): DeckDiff {
  const shared: (CardDiff & { w: number })[] = [];
  const extra: (CardDiff & { w: number })[] = [];
  const missing: (CardDiff & { w: number })[] = [];
  for (const key of new Set([...mine.keys(), ...theirs.keys()])) {
    const qm = mine.get(key) ?? 0;
    const qt = theirs.get(key) ?? 0;
    const w = weights.get(key);
    const row = { name: names(key), mine: qm, theirs: qt };
    if (Math.min(qm, qt) > 0) shared.push({ ...row, w: w * Math.min(qm, qt) });
    if (qm > qt) extra.push({ ...row, w: w * (qm - qt) });
    if (qt > qm) missing.push({ ...row, w: w * (qt - qm) });
  }
  const strip = (rows: (CardDiff & { w: number })[]) =>
    rows.sort((x, y) => y.w - x.w || x.name.localeCompare(y.name)).map(({ name, mine: m, theirs: t }) => ({ name, mine: m, theirs: t }));
  return { shared: strip(shared), extra: strip(extra), missing: strip(missing) };
}

export type Validity =
  | { status: "ok" | "partial"; warnings: string[] }
  | { status: "unreliable"; warnings: string[] }
  | { status: "invalid"; reason: string };

/**
 * Contrôle d'une liste avant de la noter. Une liste trop courte n'a pas de score ; trop de
 * cartes inconnues, des lignes illisibles ou une réserve absente rendent le score partiel ou
 * fragile, et c'est affiché comme tel (jamais présenté comme un résultat fiable).
 */
export function validateDeck(
  deck: DeckCards,
  info: { unknownCards: number; parseErrors: number },
): Validity {
  const main = boardSize(deck.main);
  if (main === 0) return { status: "invalid", reason: "Aucune carte dans le deck principal." };
  if (main < VALIDITY.minMainCards) {
    return { status: "invalid", reason: `Deck principal incomplet (${main} cartes) : pas de comparaison possible.` };
  }
  const warnings: string[] = [];
  const total = main + boardSize(deck.side);
  if (info.parseErrors > 0) warnings.push(`${info.parseErrors} ligne${info.parseErrors > 1 ? "s" : ""} illisible${info.parseErrors > 1 ? "s" : ""} ignorée${info.parseErrors > 1 ? "s" : ""}.`);
  if (info.unknownCards > 0) warnings.push(`${info.unknownCards} carte${info.unknownCards > 1 ? "s" : ""} non reconnue${info.unknownCards > 1 ? "s" : ""}.`);
  if (deck.side.size === 0) warnings.push("Réserve absente : comparaison sur le principal seulement.");
  if (info.unknownCards / total > VALIDITY.maxUnknownShare) return { status: "unreliable", warnings };
  return { status: warnings.length > 0 ? "partial" : "ok", warnings };
}
