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

  // Rareté (gemme devant chaque carte), valeur de mana et type (courbe de mana) de l'impression retenue.
  // Et légalité en Modern, pour le contrôle qualité à la mise en vente.
  type Extra = {
    id: string;
    rarity: string | null;
    cmc?: number | string | null;
    type_line?: string | null;
    legal_modern?: boolean | null;
    legal_commander?: boolean | null;
    color_identity?: string[] | null;
    game_changer?: boolean | null;
  };
  const extraById = new Map<string, Extra>();
  const ids = rows.map((r) => r.print_id);
  if (ids.length > 0) {
    // Du plus complet au plus simple, selon l'avancement des migrations de la base
    // (section 25 : Commander ; section 10 : courbe de mana) ; au pire, la rareté seule.
    const selects = [
      "id, rarity, cmc, type_line, legal_modern, legal_commander, color_identity, game_changer",
      "id, rarity, cmc, type_line, legal_modern, legal_commander, color_identity",
      "id, rarity, cmc, type_line, legal_modern",
      "id, rarity",
    ];
    let data: unknown[] | null = null;
    for (const cols of selects) {
      const res = await client.from("cards").select(cols).in("id", ids);
      if (!res.error) {
        data = res.data;
        break;
      }
    }
    for (const r of (data ?? []) as Extra[]) extraById.set(r.id, r);
  }

  return rows.map((r) => ({
    oracleId: r.oracle_id,
    name: r.name,
    printId: r.print_id,
    setCode: r.set_code,
    collectorNumber: r.collector_number,
    imageUrl: r.image_url,
    artist: r.artist,
    rarity: extraById.get(r.print_id)?.rarity ?? null,
    cmc: num(extraById.get(r.print_id)?.cmc ?? null),
    typeLine: extraById.get(r.print_id)?.type_line ?? null,
    legalModern: extraById.get(r.print_id)?.legal_modern ?? null,
    legalCommander: extraById.get(r.print_id)?.legal_commander ?? null,
    colorIdentity: extraById.get(r.print_id)?.color_identity ?? null,
    gameChanger: extraById.get(r.print_id)?.game_changer ?? null,
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

type PrintRow = {
  id: string;
  oracle_id: string;
  name: string;
  set_code: string;
  collector_number: string;
  lang: string | null;
  image_url: string | null;
  artist: string | null;
  rarity: string | null;
  cmc?: number | string | null;
  type_line?: string | null;
  legal_modern?: boolean | null;
  legal_commander?: boolean | null;
  color_identity?: string[] | null;
  game_changer?: boolean | null;
  price_eur: number | string | null;
  price_eur_foil: number | string | null;
};

/**
 * Impressions précises demandées par la liste (« Lightning Bolt (MH3) 123 ») : toutes les
 * impressions de ces cartes dans ces éditions, marquées exactPrint. Le choix du numéro et du
 * prix (foil ou non) se fait ensuite dans buildEstimate.
 */
export async function fetchPrintPrices(client: SupabaseClient, oracleIds: string[], sets: string[]): Promise<CardPrice[]> {
  if (oracleIds.length === 0 || sets.length === 0) return [];
  const base = "id, oracle_id, name, set_code, collector_number, lang, image_url, artist, rarity, price_eur, price_eur_foil";
  const selects = [
    `${base}, cmc, type_line, legal_modern, legal_commander, color_identity, game_changer`,
    `${base}, cmc, type_line, legal_modern`,
    base,
  ];
  let rows: PrintRow[] = [];
  for (const cols of selects) {
    const res = await client.from("cards").select(cols).in("oracle_id", oracleIds).in("set_code", sets).limit(3000);
    if (!res.error) {
      rows = (res.data ?? []) as unknown as PrintRow[];
      break;
    }
  }
  // L'anglais d'abord : le prix Cardmarket de référence est celui de l'impression anglaise.
  rows.sort((a, b) => Number(a.lang !== "en") - Number(b.lang !== "en"));
  return rows.map((r) => ({
    oracleId: r.oracle_id,
    name: r.name,
    printId: r.id,
    setCode: r.set_code,
    collectorNumber: r.collector_number,
    imageUrl: r.image_url,
    artist: r.artist,
    rarity: r.rarity,
    cmc: num(r.cmc ?? null),
    typeLine: r.type_line ?? null,
    legalModern: r.legal_modern ?? null,
    legalCommander: r.legal_commander ?? null,
    colorIdentity: r.color_identity ?? null,
    gameChanger: r.game_changer ?? null,
    priceEur: num(r.price_eur),
    minPriceEurFoil: num(r.price_eur_foil),
    priceEurFoil: num(r.price_eur_foil),
    exactPrint: true,
  }));
}
