"use server";

import { parseDecklist, withFormat, type ParsedDeck } from "@/lib/decklist";
import { buildEstimate, type CardPrice } from "@/lib/pricing";
import { lookupDeckPrices, lookupDeckPricesCached } from "@/lib/estimate";
import { fetchBracketFacts } from "@/lib/bracket-server";
import { minBracket, type BracketFacts, type BracketLevel } from "@/lib/bracket";
import { archidektToText, parseDeckUrl } from "@/lib/deck-import";

export type EstimateState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ok"; deck: ParsedDeck; prices: CardPrice[]; pricesAsOf: string | null };

const MAX_CHARS = 20_000;
const MAX_LINES = 300; // cartes différentes

// Accessible à n'importe qui (requête POST) : on valide tout ce qui arrive.
export async function estimateAction(_prev: EstimateState, formData: FormData): Promise<EstimateState> {
  const text = formData.get("decklist");
  if (typeof text !== "string" || text.trim() === "") {
    return { status: "error", message: "Colle d'abord une decklist." };
  }
  if (text.length > MAX_CHARS) {
    return { status: "error", message: "Liste trop longue pour un deck." };
  }

  const deck = parseDecklist(text);
  const lineCount = deck.main.length + deck.side.length;
  if (lineCount === 0) {
    return { status: "error", message: "Aucune carte reconnue. Format attendu : « 4 Lightning Bolt », une carte par ligne." };
  }
  if (lineCount > MAX_LINES) {
    return { status: "error", message: "Trop de cartes différentes pour un deck." };
  }

  try {
    const { prices, pricesAsOf } = await lookupDeckPrices(deck);
    return { status: "ok", deck, prices, pricesAsOf };
  } catch (e) {
    console.error("Estimation impossible :", e);
    return { status: "error", message: "Les prix sont momentanément indisponibles. Réessaie dans un instant." };
  }
}

export type ImportResult = { status: "ok"; text: string } | { status: "error"; message: string };

/** Récupère la liste d'un deck à partir de son lien (Archidekt). Accessible à tous : on valide le lien. */
export async function importDeckAction(url: string): Promise<ImportResult> {
  const target = parseDeckUrl(typeof url === "string" ? url.slice(0, 300) : "");
  if (target.site === "moxfield") {
    return {
      status: "error",
      message: "Moxfield bloque l'import automatique. Sur ton deck Moxfield : Exporter › Copier pour MTGO, puis colle la liste ici.",
    };
  }
  if (target.site !== "archidekt") {
    return { status: "error", message: "Lien non reconnu. Colle l'adresse d'un deck Archidekt (archidekt.com/decks/…)." };
  }
  try {
    const res = await fetch(`https://archidekt.com/api/decks/${target.id}/`, {
      headers: { "User-Agent": "decksell/1.0 (https://decksell.fr)", Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) return { status: "error", message: "Deck introuvable sur Archidekt (supprimé ou privé ?)." };
    if (!res.ok) return { status: "error", message: "Archidekt ne répond pas pour l'instant. Réessaie dans un moment." };
    const text = archidektToText(await res.json());
    if (!text) return { status: "error", message: "Ce deck Archidekt ne contient aucune carte." };
    return { status: "ok", text };
  } catch {
    return { status: "error", message: "Archidekt ne répond pas pour l'instant. Réessaie dans un moment." };
  }
}

export type BracketState = { status: "ok"; facts: BracketFacts; min: BracketLevel } | { status: "error" };

/**
 * Niveau de puissance d'une liste Commander, avec le ou les commandants choisis.
 * Accessible à tous, comme l'estimation : on valide la liste.
 */
export async function bracketAction(text: string, commanders: string[]): Promise<BracketState> {
  if (typeof text !== "string" || text.length === 0 || text.length > MAX_CHARS) return { status: "error" };
  const names = Array.isArray(commanders) ? commanders.filter((c) => typeof c === "string").slice(0, 2) : [];
  const deck = withFormat(parseDecklist(text), "commander", names);
  if (deck.main.length === 0 || deck.main.length > MAX_LINES) return { status: "error" };
  try {
    const { prices } = await lookupDeckPricesCached(deck);
    const facts = await fetchBracketFacts(deck, buildEstimate(deck, prices));
    return { status: "ok", facts, min: minBracket(facts) };
  } catch (e) {
    console.error("Niveau de puissance impossible :", e);
    return { status: "error" };
  }
}
