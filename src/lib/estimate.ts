import "server-only";
import { cacheLife } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedDeck } from "./decklist.ts";
import { frontKey, lookupNames, printRequests, type CardPrice } from "./pricing.ts";
import { fetchCardPrices, fetchPricesDate, fetchPrintPrices } from "./price-lookup.ts";
import { getSupabaseAdmin } from "./supabase-server.ts";

/**
 * Prix par nom (impression la moins chère), puis impressions précises demandées par la liste
 * (édition et numéro), retrouvées par leur carte (oracle_id) pour éviter toute confusion de nom.
 */
async function pricesFor(client: SupabaseClient, names: string[], prints: string[]): Promise<CardPrice[]> {
  const prices = await fetchCardPrices(client, names);
  if (prints.length === 0) return prices;
  const fronts = new Set(prints.map((p) => p.split("|")[0]));
  const sets = [...new Set(prints.map((p) => p.split("|")[1]))];
  const oracleIds = [...new Set(prices.filter((p) => fronts.has(frontKey(p.name))).map((p) => p.oracleId))];
  return [...prices, ...(await fetchPrintPrices(client, oracleIds, sets))];
}

/** Prix des cartes d'un deck et date des prix. À appeler côté serveur. */
export async function lookupDeckPrices(
  deck: ParsedDeck,
): Promise<{ prices: CardPrice[]; pricesAsOf: string | null }> {
  const client = getSupabaseAdmin();
  const [prices, pricesAsOf] = await Promise.all([
    pricesFor(client, lookupNames(deck), printRequests(deck)),
    fetchPricesDate(client),
  ]);
  return { prices, pricesAsOf };
}

/**
 * Comme lookupDeckPrices, mais mis en cache : pour l'affichage des fiches et de l'accueil.
 * Les prix ne changent qu'à l'import quotidien ; une heure de retard au plus est sans effet.
 * La clé du cache : les noms cherchés et les impressions demandées (triés : l'ordre des lignes
 * n'importe pas).
 */
export async function lookupDeckPricesCached(
  deck: ParsedDeck,
): Promise<{ prices: CardPrice[]; pricesAsOf: string | null }> {
  return cachedPrices([...lookupNames(deck)].sort(), [...printRequests(deck)].sort());
}

async function cachedPrices(names: string[], prints: string[]): Promise<{ prices: CardPrice[]; pricesAsOf: string | null }> {
  "use cache";
  cacheLife("hours");
  const client = getSupabaseAdmin();
  const [prices, pricesAsOf] = await Promise.all([pricesFor(client, names, prints), fetchPricesDate(client)]);
  return { prices, pricesAsOf };
}
