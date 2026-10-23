import "server-only";
import { cacheLife } from "next/cache";
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

/**
 * Comme lookupDeckPrices, mais mis en cache : pour l'affichage des fiches et de l'accueil.
 * Les prix ne changent qu'à l'import quotidien ; une heure de retard au plus est sans effet.
 * La clé du cache est la liste des noms cherchés (triée : l'ordre des lignes n'importe pas).
 */
export async function lookupDeckPricesCached(
  deck: ParsedDeck,
): Promise<{ prices: CardPrice[]; pricesAsOf: string | null }> {
  return cachedPrices([...lookupNames(deck)].sort());
}

async function cachedPrices(names: string[]): Promise<{ prices: CardPrice[]; pricesAsOf: string | null }> {
  "use cache";
  cacheLife("hours");
  const client = getSupabaseAdmin();
  const [prices, pricesAsOf] = await Promise.all([fetchCardPrices(client, names), fetchPricesDate(client)]);
  return { prices, pricesAsOf };
}
