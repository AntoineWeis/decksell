import { MANA_COLORS, type ManaColor } from "@/lib/listings";

// Symboles de mana officiels servis par Scryfall (SVG).
const symbolUrl = (c: ManaColor) => `https://svgs.scryfall.io/card-symbols/${c}.svg`;

/** Un symbole de mana. */
export function ManaSymbol({ color, size = 18 }: { color: ManaColor; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- petit SVG externe, rien à optimiser
    <img src={symbolUrl(color)} alt={MANA_COLORS[color]} width={size} height={size} className="inline-block shrink-0" />
  );
}

/** Les couleurs d'un deck ; rien (ou le texte donné) si le vendeur ne les a pas renseignées. */
export function ManaColors({
  colors,
  size = 18,
  emptyLabel = null,
}: {
  colors: ManaColor[];
  size?: number;
  emptyLabel?: string | null;
}) {
  if (colors.length === 0) {
    return emptyLabel ? <span className="text-xs text-muted">{emptyLabel}</span> : null;
  }
  return (
    <span className="inline-flex items-center gap-1" title={colors.map((c) => MANA_COLORS[c]).join(", ")}>
      {colors.map((c) => (
        <ManaSymbol key={c} color={c} size={size} />
      ))}
    </span>
  );
}
