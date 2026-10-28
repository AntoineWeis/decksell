import { LANGUAGES, languageMix, type CardDetail, type Language } from "@/lib/card-details";

// Couleur de chaque langue dans la barre : français en accent, anglais en gris, les autres nuancées.
const COLOR: Partial<Record<Language, string>> = { fr: "bg-accent", en: "bg-muted/50" };
const OTHER = ["bg-link/60", "bg-reveal/70", "bg-ok/70", "bg-warn/70"];

/**
 * Langue des cartes. Avec le détail carte par carte, toutes les langues présentes ;
 * sinon (anciennes annonces), la part de français déclarée, le reste en anglais.
 */
export function LanguageBar({
  frenchPercent,
  details,
  className = "",
  textOnly = false,
}: {
  frenchPercent: number | null;
  details?: CardDetail[] | null;
  className?: string;
  /** Une ligne de texte seule (« 60 % français, 40 % anglais »), sans barre ni pastilles. */
  textOnly?: boolean;
}) {
  const parts = segments(frenchPercent, details);
  if (!parts) {
    return <p className={`text-xs text-muted ${className}`}>Langue des cartes non renseignée</p>;
  }
  let other = 0;
  const colored = parts.map((p) => ({ ...p, color: COLOR[p.lang] ?? OTHER[other++ % OTHER.length] }));
  const label = colored.map((p) => `${p.percent} % ${LANGUAGES[p.lang].label.toLowerCase()}`).join(", ");

  if (textOnly) {
    return (
      <p className={`text-xs tabular-nums text-muted ${className}`}>
        {colored.map((p, i) => (
          <span key={p.lang}>
            {i > 0 && ", "}
            <span className="font-semibold text-foreground">{p.percent} %</span> {LANGUAGES[p.lang].label.toLowerCase()}
          </span>
        ))}
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex h-1.5 gap-px overflow-hidden rounded-full bg-sunken" role="img" aria-label={`Langue des cartes : ${label}`}>
        {colored.map((p) => (
          <span key={p.lang} className={p.color} style={{ width: `${p.percent}%` }} />
        ))}
      </div>
      <p className="mt-1 flex flex-wrap justify-between gap-x-3 text-xs tabular-nums text-muted">
        {colored.map((p) => (
          <span key={p.lang} className="inline-flex items-center gap-1">
            <span aria-hidden className={`size-1.5 rounded-full ${p.color}`} />
            <span className="font-semibold text-foreground">{p.percent} %</span> {LANGUAGES[p.lang].label.toLowerCase()}
          </span>
        ))}
      </p>
    </div>
  );
}

function segments(frenchPercent: number | null, details?: CardDetail[] | null) {
  if (details?.length) {
    const mix = languageMix(details);
    const total = mix.reduce((n, m) => n + m.count, 0);
    // Pourcentages entiers dont la somme fait 100 : on arrondit à l'inférieur, puis les points
    // manquants vont aux plus grands restes (même arrondi que le pourcentage de français).
    const exact = mix.map((m) => ({ lang: m.lang, value: (m.count / total) * 100 }));
    const parts = exact.map((e) => ({ lang: e.lang, percent: Math.floor(e.value) }));
    let missing = 100 - parts.reduce((n, p) => n + p.percent, 0);
    for (const i of exact.map((e, i) => i).sort((a, b) => (exact[b].value % 1) - (exact[a].value % 1))) {
      if (missing-- <= 0) break;
      parts[i].percent++;
    }
    return parts.filter((p) => p.percent > 0);
  }
  if (frenchPercent == null) return null;
  return [
    { lang: "fr" as Language, percent: frenchPercent },
    { lang: "en" as Language, percent: 100 - frenchPercent },
  ].filter((p) => p.percent > 0);
}
