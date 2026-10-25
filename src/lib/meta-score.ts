// Score de proximité méta d'une liste d'annonce : partagé par le site (publication, changement
// de liste, page d'un deck) et par le script d'import (recalcul de toutes les annonces).
// Pas de « server-only » : le script Node l'importe aussi. Le client Supabase est fourni par l'appelant.

import type { SupabaseClient } from "@supabase/supabase-js";
import { parseDecklist } from "./decklist.ts";
import { buildEstimate, lookupNames, type Estimate } from "./pricing.ts";
import { fetchCardPrices } from "./price-lookup.ts";
import { deckCardsFromEstimate, matchMeta, type MetaCorpus, type MetaMatch, type MetaResult } from "./meta-match.ts";
import { verdictOf } from "./similarity.ts";

/** Colonnes de l'annonce mises à jour avec le score. */
export type MetaColumns = {
  meta_score: number | null;
  meta_status: "ok" | "partial" | "unreliable" | "invalid" | null;
  meta_deck_id: number | null;
  meta_archetype: string | null;
  meta_computed_at: string;
  /** Détail affiché sur la page du deck (voir toStoredDetail). */
  meta_detail: StoredMetaDetail;
};

// Détail du score enregistré avec l'annonce : la page d'un deck l'affiche sans relire les
// ~2 000 listes de tournoi. Quelques Ko : les listes de référence sont réduites à leur en-tête
// (les différences du principal restent complètes : la carte affiche « et N autres »). Le verdict (libellés) est recalculé à la lecture.
const DETAIL_VERSION = 1;

export type StoredMetaDetail = { v: number; result: MetaResult };

const slimMatch = (m: MetaMatch): MetaMatch => ({ ...m, deck: { ...m.deck, main: {}, side: {}, names: {} } });

export function toStoredDetail(result: MetaResult): StoredMetaDetail {
  if (result.status === "invalid" || result.status === "empty") return { v: DETAIL_VERSION, result };
  return {
    v: DETAIL_VERSION,
    result: {
      ...result,
      best: slimMatch(result.best),
      alsoClose: result.alsoClose.map(slimMatch),
      diff: {
        main: result.diff.main,
        // La réserve n'affiche que le nombre de cartes différentes.
        side: { shared: [], extra: result.diff.side.extra, missing: [] },
      },
    },
  };
}

/** Détail enregistré → résultat affichable ; null si absent ou d'un ancien format (recalcul). */
export function fromStoredDetail(stored: unknown): MetaResult | null {
  const s = stored as StoredMetaDetail | null;
  if (!s || s.v !== DETAIL_VERSION || !s.result) return null;
  const r = s.result;
  if (r.status === "invalid" || r.status === "empty") return r;
  return { ...r, verdict: verdictOf(r.score) };
}

/** Enregistre le score d'une annonce ; base pas encore migrée (pas de meta_detail) : sans le détail. */
export async function saveListingMeta(client: SupabaseClient, listingId: string, cols: MetaColumns): Promise<string | null> {
  let { error } = await client.from("listings").update(cols).eq("id", listingId);
  if (error && /meta_detail/.test(error.message)) {
    const rest: Partial<MetaColumns> = { ...cols };
    delete rest.meta_detail;
    ({ error } = await client.from("listings").update(rest).eq("id", listingId));
  }
  return error ? error.message : null;
}

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
    return {
      meta_score: null,
      meta_status: "invalid",
      meta_deck_id: null,
      meta_archetype: null,
      meta_computed_at: now,
      meta_detail: toStoredDetail(result),
    };
  }
  return {
    meta_score: result.score,
    meta_status: result.status,
    meta_deck_id: result.best.deck.id,
    meta_archetype: result.best.deck.archetype,
    meta_computed_at: now,
    meta_detail: toStoredDetail(result),
  };
}
