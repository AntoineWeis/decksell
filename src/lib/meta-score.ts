// Score de proximité méta d'une liste d'annonce : partagé par le site (publication, changement
// de liste, page d'un deck) et par le script d'import (recalcul de toutes les annonces).
// Pas de « server-only » : le script Node l'importe aussi. Le client Supabase est fourni par l'appelant.

import type { SupabaseClient } from "@supabase/supabase-js";
import { parseDecklist } from "./decklist.ts";
import { buildEstimate, lookupNames, type Estimate } from "./pricing.ts";
import { fetchCardPrices } from "./price-lookup.ts";
import { deckCardsFromEstimate, matchMeta, type MetaCorpus, type MetaResult } from "./meta-match.ts";

/** Colonnes de l'annonce mises à jour avec le score. */
export type MetaColumns = {
  meta_score: number | null;
  meta_status: "ok" | "partial" | "unreliable" | "invalid" | null;
  meta_deck_id: number | null;
  meta_archetype: string | null;
  meta_computed_at: string;
};

/** Note une liste déjà estimée (évite de relire les prix quand on les a). */
export function scoreEstimate(estimate: Estimate, parseErrors: number, corpus: MetaCorpus): MetaResult {
  const { cards, unknownCards } = deckCardsFromEstimate(estimate);
  return matchMeta(cards, { unknownCards, parseErrors }, corpus);
}

/** Note une liste texte : analyse, noms officiels (base des cartes), puis comparaison au corpus. */
export async function scoreDecklist(client: SupabaseClient, decklist: string, corpus: MetaCorpus): Promise<MetaResult> {
  const deck = parseDecklist(decklist);
  const prices = await fetchCardPrices(client, lookupNames(deck));
  return scoreEstimate(buildEstimate(deck, prices), deck.errors.length, corpus);
}

/** Résultat → colonnes de l'annonce. Corpus vide : rien n'est enregistré (score inconnu, pas nul). */
export function metaColumns(result: MetaResult): MetaColumns | null {
  const now = new Date().toISOString();
  if (result.status === "empty") return null;
  if (result.status === "invalid") {
    return { meta_score: null, meta_status: "invalid", meta_deck_id: null, meta_archetype: null, meta_computed_at: now };
  }
  return {
    meta_score: result.score,
    meta_status: result.status,
    meta_deck_id: result.best.deck.id,
    meta_archetype: result.best.deck.archetype,
    meta_computed_at: now,
  };
}
