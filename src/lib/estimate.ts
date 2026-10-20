import "server-only";
import type { ParsedDeck } from "./decklist.ts";
import { lookupNames, type CardPrice } from "./pricing.ts";
import { fetchCardPrices, fetchPricesDate } from "./price-lookup.ts";
import { getSupabaseAdmin } from "./supabase-server.ts";

/** Prix des cartes d'un deck et date des prix. À appeler côté serveur. */
export async function lookupDeckPrices(
  deck: ParsedDeck,
): Promise<{ prices: CardPrice[]; pricesAsOf: string | null }> {
  const client = getSupabaseAdmin();
  const [prices, pricesAsOf] = await Promise.all([
    fetchCardPrices(client, lookupNames(deck)),
    fetchPricesDate(client),
  ]);
  return { prices, pricesAsOf };
}
