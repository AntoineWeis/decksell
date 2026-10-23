// Statistiques d'un deck calculées à partir de son estimation. Fonctions pures.
import type { Estimate } from "./pricing.ts";
import { normalizeName } from "./decklist.ts";

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

/** Types de cartes comptés, dans l'ordre d'affichage. */
export const CARD_TYPES = [
  { key: "Creature", label: "Créature" },
  { key: "Planeswalker", label: "Planeswalker" },
  { key: "Sorcery", label: "Rituel" },
  { key: "Instant", label: "Éphémère" },
  { key: "Artifact", label: "Artefact" },
  { key: "Enchantment", label: "Enchantement" },
  { key: "Land", label: "Terrain" },
  { key: "Companion", label: "Compagnon" },
] as const;

export type CardTypeKey = (typeof CARD_TYPES)[number]["key"];
export type CardTypeCounts = Record<CardTypeKey, number>;

/**
 * Les dix compagnons (Ikoria). « Compagnon » est une capacité, pas un type :
 * on les reconnaît par leur nom, la base ne gardant pas le texte des cartes.
 */
const COMPANIONS = new Set(
  [
    "Gyruda, Doom of Depths",
    "Jegantha, the Wellspring",
    "Kaheera, the Orphanguard",
    "Keruga, the Macrosage",
    "Lurrus of the Dream-Den",
    "Lutri, the Spellchaser",
    "Obosh, the Preypiercer",
    "Umori, the Collector",
    "Yorion, Sky Nomad",
    "Zirda, the Dawnwaker",
  ].map(normalizeName),
);

/**
 * Nombre d'exemplaires du deck principal par type, d'après la face avant.
 * Une carte à plusieurs types compte dans chacun (« Artifact Creature » : artefact et créature).
 * Le compagnon se joue depuis la réserve : il est compté là, et seulement là.
 * Null si aucune carte n'a de type connu.
 */
export function cardTypeCounts(estimate: Estimate): CardTypeCounts | null {
  const counts = Object.fromEntries(CARD_TYPES.map((t) => [t.key, 0])) as CardTypeCounts;
  let known = 0;
  for (const line of estimate.lines) {
    if (line.board === "side") {
      if (COMPANIONS.has(normalizeName(line.card?.name ?? line.name))) counts.Companion += line.quantity;
      continue;
    }
    if (!line.card?.typeLine) continue;
    // Types avant le tiret long : « Legendary Creature — Elf » → « Legendary Creature ».
    const types = new Set(line.card.typeLine.split(" // ")[0].split("—")[0].trim().split(/\s+/));
    known += line.quantity;
    for (const t of CARD_TYPES) {
      if (types.has(t.key)) counts[t.key] += line.quantity;
    }
  }
  return known > 0 ? counts : null;
}
