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
  cards?: { quantity?: number; categories?: string[] | null; card?: { oracleCard?: { name?: string } } }[];
};

/**
 * Liste texte (« 4 Nom », puis « Sideboard ») à partir de la réponse de l'API Archidekt.
 * Les cartes des catégories hors deck (Maybeboard…) sont ignorées ; la catégorie
 * « Sideboard » va en réserve.
 */
export function archidektToText(deck: ArchidektDeck): string {
  const excluded = new Set((deck.categories ?? []).filter((c) => c.includedInDeck === false).map((c) => c.name));
  const main = new Map<string, number>();
  const side = new Map<string, number>();
  for (const c of deck.cards ?? []) {
    const name = c.card?.oracleCard?.name;
    const qty = c.quantity ?? 0;
    if (!name || qty < 1) continue;
    const cats = c.categories ?? [];
    if (cats.length > 0 && cats.every((cat) => excluded.has(cat))) continue;
    const board = cats.some((cat) => /^sideboard$/i.test(cat)) ? side : main;
    board.set(name, (board.get(name) ?? 0) + qty);
  }
  const lines = [...main].map(([n, q]) => `${q} ${n}`);
  if (side.size > 0) lines.push("", "Sideboard", ...[...side].map(([n, q]) => `${q} ${n}`));
  return lines.join("\n");
}
