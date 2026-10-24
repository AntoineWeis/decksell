// Réglages du score de proximité méta. Tout ce qui se règle est ici, avec sa justification.
// Voir docs/score-meta.md pour la méthode complète.

/**
 * Poids du principal et de la réserve dans le score global (leur somme vaut 1).
 *
 * 0,8 / 0,2 : le principal fait 60 cartes sur 75 (80 %) et porte le plan de jeu ; la réserve
 * (15 cartes) répond surtout au méta du moment et varie beaucoup d'une liste à l'autre, même
 * entre deux pilotes du même archétype. Lui donner son poids « au nombre de cartes » évite
 * qu'une réserve personnelle fasse chuter une liste au principal identique.
 */
export const BOARD_WEIGHTS = { main: 0.8, side: 0.2 } as const;

/**
 * Poids des cartes selon leur rareté dans le méta (inverse de la fréquence documentaire).
 * Une carte présente dans presque toutes les listes (fetchlands, Lightning Bolt) dit peu de
 * choses ; une carte qui signe un archétype en dit beaucoup. poids = ln(1 + N / df), borné.
 */
export const CARD_WEIGHT = {
  /** Poids minimal : même une carte omniprésente compte un peu. */
  min: 0.35,
  /** Poids maximal (cartes absentes du méta, ou très rares). */
  max: 4.5,
  /** Terres de base : interchangeables et peu révélatrices, poids divisé d'autant. */
  basicLandFactor: 0.4,
} as const;

/** Lecture du score (0–100). Sert à classer et à résumer, jamais à promettre un niveau de jeu. */
export const VERDICTS = [
  { min: 75, key: "meta", label: "Liste méta", hint: "Très proche d'une liste récente de tournoi." },
  { min: 55, key: "close", label: "Proche du méta", hint: "Même base qu'une liste de tournoi, plusieurs choix différents." },
  { min: 35, key: "variant", label: "Variante", hint: "Un noyau commun avec le méta, une construction personnelle." },
  { min: 0, key: "off", label: "Hors méta", hint: "Aucune liste récente de tournoi n'en est proche." },
] as const;

export type VerdictKey = (typeof VERDICTS)[number]["key"];

/** Garde-fous sur la liste comparée : en dessous, pas de score (ou un score signalé fragile). */
export const VALIDITY = {
  /** Principal minimal pour calculer un score (une liste Modern en compte 60). */
  minMainCards: 40,
  /** Au-delà de cette part de cartes inconnues (en exemplaires), le score est marqué fragile. */
  maxUnknownShare: 0.2,
} as const;

/** Fenêtre des listes de tournoi prises en référence. */
export const META_WINDOW_DAYS = 30;
