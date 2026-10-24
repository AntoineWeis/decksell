// Comparaison d'une liste aux listes de tournoi récentes. Fonctions pures.
// La conversion réutilise l'analyse des decklists (parseDecklist) et les noms officiels trouvés
// en base (estimation) : « Wear/Tear », « wear // tear » et « Wear // Tear » donnent la même clé.

import type { ParsedDeck } from "./decklist.ts";
import type { Estimate } from "./pricing.ts";
import {
  buildWeights,
  cardKey,
  compareDecks,
  diffBoards,
  validateDeck,
  verdictOf,
  type Board,
  type CardWeights,
  type Comparison,
  type DeckCards,
  type DeckDiff,
  type Validity,
} from "./similarity.ts";

/** Une liste de tournoi de référence (table meta_decks). */
export type MetaDeck = {
  id: number;
  source: "mtgo" | "mtgtop8";
  event_name: string;
  event_date: string; // AAAA-MM-JJ
  placement: string | null; // « 1 », « 5-8 », « 5-0 »
  player: string | null;
  archetype: string | null;
  source_url: string | null;
  main: Record<string, number>; // clé normalisée → quantité
  side: Record<string, number>;
  names: Record<string, string>; // clé → nom lisible
};

const add = (board: Board, names: Map<string, string>, name: string, qty: number) => {
  const key = cardKey(name);
  if (!key) return;
  board.set(key, (board.get(key) ?? 0) + qty);
  if (!names.has(key)) names.set(key, name);
};

/** Liste analysée (texte) → cartes comparables. Sert aux listes de tournoi, déjà en anglais officiel. */
export function deckCardsFromParsed(deck: Pick<ParsedDeck, "main" | "side">): DeckCards {
  const out: DeckCards = { main: new Map(), side: new Map(), names: new Map() };
  for (const e of deck.main) add(out.main, out.names, e.name, e.quantity);
  for (const e of deck.side) add(out.side, out.names, e.name, e.quantity);
  return out;
}

/**
 * Estimation d'une annonce → cartes comparables. Le nom officiel trouvé en base remplace le nom
 * saisi (variantes d'écriture) ; une carte introuvable garde son nom saisi et est comptée comme
 * inconnue, pour que la validation le signale.
 */
export function deckCardsFromEstimate(estimate: Estimate): { cards: DeckCards; unknownCards: number } {
  const cards: DeckCards = { main: new Map(), side: new Map(), names: new Map() };
  let unknownCards = 0;
  for (const l of estimate.lines) {
    const name = l.card?.name ?? l.name;
    if (!l.card) unknownCards += l.quantity;
    add(l.board === "main" ? cards.main : cards.side, cards.names, name, l.quantity);
  }
  return { cards, unknownCards };
}

/** Liste de tournoi stockée → cartes comparables. */
export function deckCardsFromMeta(m: MetaDeck): DeckCards {
  return {
    main: new Map(Object.entries(m.main)),
    side: new Map(Object.entries(m.side)),
    names: new Map(Object.entries(m.names)),
  };
}

/** Corpus prêt à l'emploi : listes converties et poids des cartes. */
export type MetaCorpus = { decks: MetaDeck[]; cards: DeckCards[]; weights: CardWeights };

export function buildCorpus(decks: MetaDeck[]): MetaCorpus {
  const cards = decks.map(deckCardsFromMeta);
  return { decks, cards, weights: buildWeights(cards) };
}

export type MetaMatch = { deck: MetaDeck; comparison: Comparison };

export type MetaResult =
  | { status: "invalid"; reason: string }
  | { status: "empty" } // aucune liste de référence (import pas encore fait)
  | {
      status: "ok" | "partial" | "unreliable";
      warnings: string[];
      score: number;
      verdict: ReturnType<typeof verdictOf>;
      best: MetaMatch;
      /** Meilleure liste de chaque archétype, hors la meilleure : « proche aussi de… ». */
      alsoClose: MetaMatch[];
      /** Points communs et différences avec la liste la plus proche. */
      diff: { main: DeckDiff; side: DeckDiff };
      corpusSize: number;
    };

/**
 * Compare une liste à tout le corpus et garde la plus proche. Le score est celui de la liste
 * la plus proche (pas une moyenne d'archétype) : l'archétype ne sert qu'à grouper l'affichage.
 * ~1 500 listes × ~45 cartes : quelques millisecondes.
 */
export function matchMeta(target: DeckCards, info: { unknownCards: number; parseErrors: number }, corpus: MetaCorpus): MetaResult {
  const validity: Validity = validateDeck(target, info);
  if (validity.status === "invalid") return validity;
  if (corpus.decks.length === 0) return { status: "empty" };

  const matches: MetaMatch[] = corpus.cards.map((c, i) => ({ deck: corpus.decks[i], comparison: compareDecks(target, c, corpus.weights) }));
  // À score égal : la liste la plus récente, puis la mieux classée.
  matches.sort(
    (a, b) =>
      b.comparison.score - a.comparison.score ||
      b.deck.event_date.localeCompare(a.deck.event_date) ||
      rankOf(a.deck.placement) - rankOf(b.deck.placement),
  );
  const best = matches[0];
  const seen = new Set([best.deck.archetype ?? `#${best.deck.id}`]);
  const alsoClose: MetaMatch[] = [];
  for (const m of matches.slice(1)) {
    const key = m.deck.archetype ?? null;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    alsoClose.push(m);
    if (alsoClose.length === 2) break;
  }
  const bestCards = corpus.cards[corpus.decks.indexOf(best.deck)];
  const name = (key: string) => target.names.get(key) ?? bestCards.names.get(key) ?? key;
  return {
    status: validity.status,
    warnings: validity.warnings,
    score: best.comparison.score,
    verdict: verdictOf(best.comparison.score),
    best,
    alsoClose,
    diff: {
      main: diffBoards(target.main, bestCards.main, corpus.weights, name),
      side: diffBoards(target.side, bestCards.side, corpus.weights, name),
    },
    corpusSize: corpus.decks.length,
  };
}

/** Classement numérique pour départager : « 1 » → 1, « 5-8 » → 5, « 5-0 » → 16, inconnu → 99. */
export function rankOf(placement: string | null): number {
  if (!placement) return 99;
  if (/^\d+-0$/.test(placement)) return 16; // 5-0 en League : très bon, sans classement
  const n = parseInt(placement, 10);
  return Number.isFinite(n) ? n : 99;
}
