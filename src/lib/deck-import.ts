// Import d'une liste depuis un lien de site de decks. Fonctions pures (le téléchargement est
// dans l'action serveur). Archidekt a une API publique ; Moxfield bloque les requêtes
// automatiques : on l'indique et on explique comment copier la liste en texte.

export type DeckUrl = { site: "archidekt"; id: string } | { site: "moxfield" } | { site: "unknown" };

/** Reconnaît un lien Archidekt (https://archidekt.com/decks/123/nom) ou Moxfield. */
export function parseDeckUrl(raw: string): DeckUrl {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { site: "unknown" };
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host === "archidekt.com") {
    const m = /^\/(?:api\/)?decks\/(\d{1,10})(?:\/|$)/.exec(url.pathname);
    return m ? { site: "archidekt", id: m[1] } : { site: "unknown" };
  }
  if (host === "moxfield.com") return { site: "moxfield" };
  return { site: "unknown" };
}

type ArchidektDeck = {
  categories?: { name: string; includedInDeck?: boolean }[];
  cards?: {
    quantity?: number;
    categories?: string[] | null;
    /** « Normal », « Foil », « Etched ». */
    modifier?: string | null;
    card?: { oracleCard?: { name?: string }; edition?: { editioncode?: string } | null; collectorNumber?: string | null };
  }[];
};

/**
 * Liste texte (« 4 Nom (ÉDITION) numéro », puis « Sideboard ») à partir de la réponse de l'API
 * Archidekt. L'impression (édition, numéro, foil) est gardée : elle fixe le prix. Les cartes des
 * catégories hors deck (Maybeboard…) sont ignorées ; la catégorie « Sideboard » va en réserve.
 */
export function archidektToText(deck: ArchidektDeck): string {
  const excluded = new Set((deck.categories ?? []).filter((c) => c.includedInDeck === false).map((c) => c.name));
  const commander = new Map<string, number>();
  const main = new Map<string, number>();
  const side = new Map<string, number>();
  for (const c of deck.cards ?? []) {
    const oracleName = c.card?.oracleCard?.name;
    const qty = c.quantity ?? 0;
    if (!oracleName || qty < 1) continue;
    const set = c.card?.edition?.editioncode;
    const number = c.card?.collectorNumber;
    const foil = /^(foil|etched)$/i.test(c.modifier ?? "");
    const name = `${oracleName}${set ? ` (${set.toUpperCase()})${number ? ` ${number}` : ""}` : ""}${foil ? " *F*" : ""}`;
    const cats = c.categories ?? [];
    if (cats.length > 0 && cats.every((cat) => excluded.has(cat))) continue;
    const board = cats.some((cat) => /^commander$/i.test(cat))
      ? commander
      : cats.some((cat) => /^sideboard$/i.test(cat))
        ? side
        : main;
    board.set(name, (board.get(name) ?? 0) + qty);
  }
  const toLines = (m: Map<string, number>) => [...m].map(([n, q]) => `${q} ${n}`);
  // Deck Commander : section « Commander » en tête, comme les exports Arena.
  const lines = commander.size > 0 ? ["Commander", ...toLines(commander), "", "Deck", ...toLines(main)] : toLines(main);
  if (side.size > 0) lines.push("", "Sideboard", ...toLines(side));
  return lines.join("\n");
}
