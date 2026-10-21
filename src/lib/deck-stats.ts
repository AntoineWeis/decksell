// Statistiques d'un deck calculées à partir de son estimation. Fonctions pures.
import type { Estimate } from "./pricing.ts";

/** Colonnes de la courbe : 0, 1, 2, 3, 4, 5, 6, puis 7 et plus. */
export const CURVE_BUCKETS = ["0", "1", "2", "3", "4", "5", "6", "7+"] as const;

export type ManaCurve = {
  /** Nombre d'exemplaires par colonne, terrains exclus. */
  counts: number[];
  /** Cartes du principal comptées dans la courbe (hors terrains). */
  spells: number;
  lands: number;
  /** Valeur de mana moyenne des cartes hors terrains, ou null. */
  average: number | null;
  /** Exemplaires sans donnée (carte introuvable, ou base pas encore à jour). */
  unknown: number;
};

/** Un terrain se reconnaît à sa face avant : « Instant // Land » (carte modale) n'en est pas un. */
export function isLand(typeLine: string | null | undefined): boolean {
  if (!typeLine) return false;
  return /\bLand\b/.test(typeLine.split(" // ")[0]);
}

/**
 * Courbe de mana du deck principal (la réserve n'est pas comptée).
 * Null si aucune carte n'a de valeur de mana connue.
 */
export function manaCurve(estimate: Estimate): ManaCurve | null {
  const counts = CURVE_BUCKETS.map(() => 0);
  let spells = 0;
  let lands = 0;
  let unknown = 0;
  let total = 0;
  for (const line of estimate.lines) {
    if (line.board !== "main") continue;
    const card = line.card;
    if (!card || card.typeLine == null || card.cmc == null) {
      unknown += line.quantity;
      continue;
    }
    if (isLand(card.typeLine)) {
      lands += line.quantity;
      continue;
    }
    const cmc = Math.max(0, Math.floor(card.cmc));
    counts[Math.min(cmc, CURVE_BUCKETS.length - 1)] += line.quantity;
    spells += line.quantity;
    total += card.cmc * line.quantity;
  }
  if (spells === 0 && lands === 0) return null;
  return { counts, spells, lands, average: spells > 0 ? total / spells : null, unknown };
}
