/** Part des cartes en français et en anglais, déclarée par le vendeur. */
export function LanguageBar({ frenchPercent, className = "" }: { frenchPercent: number | null; className?: string }) {
  if (frenchPercent == null) {
    return <p className={`text-xs text-muted ${className}`}>Langue des cartes non renseignée</p>;
  }
  const english = 100 - frenchPercent;
  return (
    <div className={className}>
      <div
        className="flex h-1.5 overflow-hidden rounded-full bg-sunken"
        role="img"
        aria-label={`${frenchPercent} % de cartes en français, ${english} % en anglais`}
      >
        <span className="bg-accent" style={{ width: `${frenchPercent}%` }} />
        <span className="bg-muted/50" style={{ width: `${english}%` }} />
      </div>
      <p className="mt-1 flex justify-between gap-3 text-xs tabular-nums text-muted">
        <span>
          <span className="font-semibold text-foreground">{frenchPercent} %</span> français
        </span>
        <span>
          <span className="font-semibold text-foreground">{english} %</span> anglais
        </span>
      </p>
    </div>
  );
}
