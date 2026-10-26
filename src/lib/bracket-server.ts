import "server-only";
import { isCommander, type ParsedDeck } from "./decklist.ts";
import type { Estimate } from "./pricing.ts";
import { factsFrom, type BracketFacts, type SpellbookResult } from "./bracket.ts";

// Faits du niveau de puissance, fournis par Commander Spellbook (API publique et libre :
// Game Changers, destruction massive de terrains, tours supplémentaires, combos à deux cartes).
// S'il ne répond pas, on se rabat sur les Game Changers connus de Scryfall (import quotidien).

const ENDPOINT = "https://backend.commanderspellbook.com/estimate-bracket";
const TIMEOUT_MS = 6000;
const MEMO_MAX = 300;
const memo = new Map<string, BracketFacts>();

/** Repli sans Commander Spellbook : les Game Changers marqués par Scryfall. */
function fallbackFacts(estimate: Estimate): BracketFacts {
  const gameChangers = [
    ...new Set(estimate.lines.filter((l) => l.card?.gameChanger).map((l) => l.card!.name)),
  ];
  return { gameChangers, massLandDenial: [], extraTurns: [], combos: [], combosChecked: false };
}

/** Faits du niveau de puissance d'un deck Commander (mis en mémoire par liste). */
export async function fetchBracketFacts(deck: ParsedDeck, estimate: Estimate): Promise<BracketFacts> {
  const commanders = deck.main.filter((e) => isCommander(deck, e.name));
  const main = deck.main.filter((e) => !isCommander(deck, e.name));
  const key = JSON.stringify([commanders, main]);
  const known = memo.get(key);
  if (known) return known;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "decksell/1.0 (https://decksell.fr)" },
      body: JSON.stringify({
        commanders: commanders.map((e) => ({ card: e.name, quantity: e.quantity })),
        main: main.map((e) => ({ card: e.name, quantity: e.quantity })),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const facts = factsFrom((await res.json()) as SpellbookResult);
    if (memo.size >= MEMO_MAX) memo.delete(memo.keys().next().value!);
    memo.set(key, facts);
    return facts;
  } catch (e) {
    console.error("Niveau de puissance : Commander Spellbook indisponible", e);
    return fallbackFacts(estimate);
  }
}
