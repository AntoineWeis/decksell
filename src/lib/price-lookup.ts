// Lecture des prix en base. Le client doit utiliser la clé secrète :
// la table cards et la fonction lookup_prices ne sont pas accessibles avec la clé publishable.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardPrice } from "./pricing.ts";

type LookupRow = {
  oracle_id: string;
  name: string;
  print_id: string;
  set_code: string;
  collector_number: string;
  image_url: string | null;
  artist: string | null;
  price_eur: number | string | null;
  min_price_eur_foil: number | string | null;
};

const num = (v: number | string | null) => (v == null ? null : Number(v));

export async function fetchCardPrices(client: SupabaseClient, names: string[]): Promise<CardPrice[]> {
  if (names.length === 0) return [];
  const { data, error } = await client.rpc("lookup_prices", { front_names: names });
  if (error) {
    const hint = /lookup_prices/.test(error.message)
      ? " (la fonction n'existe pas encore : exécute supabase/schema.sql dans le SQL Editor)"
      : "";
    throw new Error(`Lecture des prix impossible : ${error.message}${hint}`);
  }
  const rows = (data ?? []) as LookupRow[];

  // Rareté de l'impression retenue (gemme affichée devant chaque carte).
  const rarityById = new Map<string, string | null>();
  const ids = rows.map((r) => r.print_id);
  if (ids.length > 0) {
    const { data: rarities } = await client.from("cards").select("id, rarity").in("id", ids);
    for (const r of (rarities ?? []) as { id: string; rarity: string | null }[]) rarityById.set(r.id, r.rarity);
  }

  return rows.map((r) => ({
    oracleId: r.oracle_id,
    name: r.name,
    printId: r.print_id,
    setCode: r.set_code,
    collectorNumber: r.collector_number,
    imageUrl: r.image_url,
    artist: r.artist,
    rarity: rarityById.get(r.print_id) ?? null,
    priceEur: num(r.price_eur),
    minPriceEurFoil: num(r.min_price_eur_foil),
  }));
}

/** Date du fichier Scryfall du dernier import, pour afficher « prix du … ». */
export async function fetchPricesDate(client: SupabaseClient): Promise<string | null> {
  const { data, error } = await client
    .from("price_imports")
    .select("bulk_updated_at, imported_at")
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.bulk_updated_at ?? data.imported_at;
}
