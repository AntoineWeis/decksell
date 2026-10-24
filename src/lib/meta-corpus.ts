import "server-only";
import { cacheLife } from "next/cache";
import { getSupabaseAdmin } from "./supabase-server.ts";
import { META_WINDOW_DAYS } from "./meta-config.ts";
import { buildCorpus, type MetaCorpus, type MetaDeck } from "./meta-match.ts";
import { metaColumns, scoreDecklist, scoreEstimate } from "./meta-score.ts";
import type { Estimate } from "./pricing.ts";

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

/** Corpus prêt à comparer (les poids des cartes sont recalculés à chaque appel : quelques ms). */
export async function getMetaCorpus(): Promise<MetaCorpus> {
  return buildCorpus(await loadMetaDecks());
}

/** Proximité méta d'une liste déjà estimée (page d'un deck). */
export async function metaResultFor(estimate: Estimate, parseErrors: number) {
  return scoreEstimate(estimate, parseErrors, await getMetaCorpus());
}

/**
 * Recalcule et enregistre le score d'une annonce (après publication ou changement de liste).
 * Lancé après la réponse : une erreur ici ne bloque jamais l'enregistrement de l'annonce.
 */
export async function refreshListingMeta(listingId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("listings").select("decklist").eq("id", listingId).maybeSingle();
  if (!data) return;
  const cols = metaColumns(await scoreDecklist(admin, data.decklist, await getMetaCorpus()));
  if (!cols) return;
  const { error } = await admin.from("listings").update(cols).eq("id", listingId);
  if (error) console.error("Score méta non enregistré :", error.message);
}
