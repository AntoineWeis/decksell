import { FAIR_BAND, GAUGE_RANGE, VERDICT_LABEL, formatGap, priceGauge, type GaugeVerdict } from "@/lib/price-gauge";

const TONE: Record<GaugeVerdict, { text: string; dot: string }> = {
  deal: { text: "text-ok", dot: "bg-ok" },
  fair: { text: "text-link", dot: "bg-link" },
  high: { text: "text-warn", dot: "bg-warn" },
};

// Bande du « juste prix » (±10 %) en pourcentage de la largeur de la jauge.
const BAND_LEFT = ((GAUGE_RANGE - FAIR_BAND) / (2 * GAUGE_RANGE)) * 100;
const BAND_WIDTH = (FAIR_BAND / GAUGE_RANGE) * 100;

/**
 * Jauge du juste prix : une barre de -50 % (vert, bonne affaire) à +50 % (orange), un repère
 * au centre pour la valeur, et un point pour le prix demandé. `value` : la valeur estimée
 * (du jour sur une annonce, à la publication sur une vignette).
 */
export function PriceGauge({
  askingCents,
  valueCents,
  label = true,
  className = "",
}: {
  askingCents: number;
  valueCents: number;
  /** Affiche le verdict et l'écart au-dessus de la barre. */
  label?: boolean;
  className?: string;
}) {
  const g = priceGauge(askingCents, valueCents);
  if (!g) return null;
  const tone = TONE[g.verdict];
  const text = `${VERDICT_LABEL[g.verdict]} · ${formatGap(g.gap)}`;
  return (
    <div className={className} role="img" aria-label={`${text} par rapport à la valeur estimée`}>
      {label && (
        <p className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
          <span className={`font-semibold ${tone.text}`}>{VERDICT_LABEL[g.verdict]}</span>
          <span className="tabular-nums text-muted">{formatGap(g.gap)} vs valeur</span>
        </p>
      )}
      <div aria-hidden className="relative h-1.5 rounded-full bg-sunken">
        {/* Dégradé discret : vert (bonne affaire) → bleu (juste prix) → orange (cher). */}
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,var(--ok),var(--link)_50%,var(--warn))] opacity-35" />
        {/* Zone du juste prix, un peu plus marquée. */}
        <div className="absolute inset-y-0 rounded-full bg-link/25" style={{ left: `${BAND_LEFT}%`, width: `${BAND_WIDTH}%` }} />
        {/* Repère de la valeur estimée. */}
        <div className="absolute -top-0.5 left-1/2 h-2.5 w-px -translate-x-1/2 bg-muted/70" />
        {/* Prix demandé. */}
        <div
          className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface ${tone.dot}`}
          style={{ left: `${g.position}%` }}
        />
      </div>
    </div>
  );
}
