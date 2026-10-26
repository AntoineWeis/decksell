import "server-only";
import type { ParsedDeck } from "./decklist.ts";
import type { Estimate } from "./pricing.ts";
import { fetchBracketFacts } from "./bracket-server.ts";
import { fromStoredBracket, minBracket, normalizeBracket, type BracketFacts, type BracketLevel } from "./bracket.ts";

/** Niveau d'une annonce Commander : détail enregistré s'il existe, sinon recalculé. */
export async function commanderBracket(
  deck: ParsedDeck,
  estimate: Estimate,
  stored: { bracket: number | null; detail: unknown } | null,
): Promise<{ facts: BracketFacts; min: BracketLevel; declared: BracketLevel | null }> {
  const facts = fromStoredBracket(stored?.detail) ?? (await fetchBracketFacts(deck, estimate));
  const min = minBracket(facts);
  const declared = stored?.bracket != null ? normalizeBracket(stored.bracket, min) : null;
  return { facts, min, declared };
}
