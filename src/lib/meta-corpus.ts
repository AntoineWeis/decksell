import "server-only";
import { cacheLife } from "next/cache";
import { getSupabaseAdmin } from "./supabase-server.ts";
import { META_WINDOW_DAYS } from "./meta-config.ts";
import { buildCorpus, type MetaCorpus, type MetaDeck, type MetaResult } from "./meta-match.ts";
import { metaColumns, scoreDecklist, scoreEstimate } from "./meta-score.ts";
import type { Estimate } from "./pricing.ts";
import { refreshUserBadges } from "./badges-server.ts";

// Listes de tournoi de référence (table meta_decks), lues en cache : elles ne changent qu'à
// l'import quotidien. Table absente (schéma pas encore à jour) : corpus vide, pas d'erreur.

const COLUMNS = "id, source, event_name, event_date, placement, player, archetype, source_url, main, side, names";

async function loadMetaDecks(): Promise<MetaDeck[]> {
  "use cache";
  const since = new Date(Date.now() - META_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  const rows: MetaDeck[] = [];
  for (let from = 0; from < 20_000; from += 1000) {
    const { data, error } = await getSupabaseAdmin()
      .from("meta_decks")
      .select(COLUMNS)
      .gte("event_date", since)
      .order("id")
      .range(from, from + 999);
    if (error) {
      console.error("Corpus méta indisponible :", error.message);
      cacheLife("minutes"); // erreur passagère : on réessaie vite
      return [];
    }
    rows.push(...((data ?? []) as MetaDeck[]));
    if (!data || data.length < 1000) break;
  }
  // Corpus vide (avant le premier import) : gardé quelques minutes seulement ; sinon une heure
  // (les listes ne changent qu'à l'import quotidien).
  if (rows.length > 0) cacheLife("hours");
  else cacheLife("minutes");
  return rows;
}

// Gardés en mémoire du serveur : relire ~4 Mo de listes depuis le cache et recalculer les poids
// des cartes coûtait jusqu'à plusieurs centaines de ms à chaque affichage d'un deck.
const CORPUS_TTL = 15 * 60_000;
let corpusMemo: { at: number; corpus: Promise<MetaCorpus> } | null = null;
// Résultat par liste (une page de deck revue souvent ne recompare pas tout le corpus).
const resultMemo = new Map<string, MetaResult>();
const RESULT_MEMO_MAX = 500;

/** Corpus prêt à comparer, partagé entre les requêtes pendant 15 min. */
export function getMetaCorpus(): Promise<MetaCorpus> {
  if (corpusMemo && Date.now() - corpusMemo.at < CORPUS_TTL) return corpusMemo.corpus;
  const corpus = loadMetaDecks().then(buildCorpus);
  corpusMemo = { at: Date.now(), corpus };
  resultMemo.clear();
  // Corpus vide (avant l'import, ou erreur passagère) : on ne le garde pas.
  corpus.then((c) => { if (c.decks.length === 0 && corpusMemo?.corpus === corpus) corpusMemo = null; }, () => { corpusMemo = null; });
  return corpus;
}

/** Proximité méta d'une liste déjà estimée (page d'un deck). */
export async function metaResultFor(estimate: Estimate, parseErrors: number, decklist?: string): Promise<MetaResult> {
  const corpus = await getMetaCorpus();
  const key = decklist == null ? null : `${parseErrors}:${decklist}`;
  const known = key == null ? undefined : resultMemo.get(key);
  if (known) return known;
  const result = scoreEstimate(estimate, parseErrors, corpus);
  if (key != null && result.status !== "empty") {
    if (resultMemo.size >= RESULT_MEMO_MAX) resultMemo.delete(resultMemo.keys().next().value!);
    resultMemo.set(key, result);
  }
  return result;
}

/**
 * Recalcule et enregistre le score d'une annonce (après publication ou changement de liste).
 * Lancé après la réponse : une erreur ici ne bloque jamais l'enregistrement de l'annonce.
 */
export async function refreshListingMeta(listingId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("listings").select("decklist, seller_id").eq("id", listingId).maybeSingle();
  if (!data) return;
  const cols = metaColumns(await scoreDecklist(admin, data.decklist, await getMetaCorpus()));
  if (!cols) return;
  const { error } = await admin.from("listings").update(cols).eq("id", listingId);
  if (error) console.error("Score méta non enregistré :", error.message);
  // Le score peut débloquer « Liste méta ».
  await refreshUserBadges(data.seller_id);
}
