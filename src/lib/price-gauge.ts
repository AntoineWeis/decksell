// Jauge du juste prix : où se situe le prix demandé par rapport à la valeur estimée.
// Fonctions pures, testées dans tests/price-gauge.test.ts.

/** Écart affiché sur la jauge : de -50 % (bord gauche) à +50 % (bord droit). */
export const GAUGE_RANGE = 50;
/** En dessous de -10 % : bonne affaire ; au-dessus de +10 % : au-dessus de la valeur. */
export const FAIR_BAND = 10;

export type GaugeVerdict = "deal" | "fair" | "high";

export const VERDICT_LABEL: Record<GaugeVerdict, string> = {
  deal: "Bonne affaire",
  fair: "Juste prix",
  high: "Au-dessus de la valeur",
};

export type Gauge = {
  /** Écart en %, arrondi (négatif : moins cher que la valeur). */
  gap: number;
  /** Position du repère sur la jauge, de 0 à 100 %. */
  position: number;
  verdict: GaugeVerdict;
};

/** Null si la valeur est inconnue (estimation à 0). */
export function priceGauge(askingCents: number, valueCents: number): Gauge | null {
  if (!(valueCents > 0) || !(askingCents > 0)) return null;
  const gap = Math.round(((askingCents - valueCents) / valueCents) * 100);
  const clamped = Math.max(-GAUGE_RANGE, Math.min(GAUGE_RANGE, gap));
  const verdict: GaugeVerdict = gap <= -FAIR_BAND ? "deal" : gap >= FAIR_BAND ? "high" : "fair";
  return { gap, position: ((clamped + GAUGE_RANGE) / (2 * GAUGE_RANGE)) * 100, verdict };
}

/** « -12 % », « +4 % », « 0 % ». */
export const formatGap = (gap: number) => `${gap > 0 ? "+" : gap < 0 ? "−" : ""}${Math.abs(gap)} %`;
