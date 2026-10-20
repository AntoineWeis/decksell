"use server";

import { parseDecklist, type ParsedDeck } from "@/lib/decklist";
import type { CardPrice } from "@/lib/pricing";
import { lookupDeckPrices } from "@/lib/estimate";

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
