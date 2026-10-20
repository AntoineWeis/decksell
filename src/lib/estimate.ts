import "server-only";
import { parseDecklist, type ParsedDeck } from "./decklist.ts";
import { buildEstimate, lookupNames, type Estimate, type ManualPrices } from "./pricing.ts";
import { fetchCardPrices, fetchPricesDate } from "./price-lookup.ts";
import { getSupabaseAdmin } from "./supabase-server.ts";

export type DeckEstimate = Estimate & {
  deck: ParsedDeck;
  pricesAsOf: string | null;
};

/** Estime une decklist collée par l'utilisateur. À appeler côté serveur. */
export async function estimateDecklist(text: string, manual: ManualPrices = {}): Promise<DeckEstimate> {
  const deck = parseDecklist(text);
  const client = getSupabaseAdmin();
  const [prices, pricesAsOf] = await Promise.all([
    fetchCardPrices(client, lookupNames(deck)),
    fetchPricesDate(client),
  ]);
  return { ...buildEstimate(deck, prices, manual), deck, pricesAsOf };
}
