import { useId } from "react";
import { BADGE_BY_KEY, ROMAN } from "@/lib/badges";

// Médaillon d'un badge : cercle en dégradé (du bleu au violet selon le niveau), icône du badge,
// niveau en chiffres romains. Couleurs de la marque (fiole bleu → violet), pas de doré.

const LEVEL_COLORS: Record<number, [string, string]> = {
  1: ["#5a90ff", "#6f8dff"],
  2: ["#6f7dff", "#9d84ff"],
  3: ["#9d84ff", "#c08bff"],
};

/** Icônes au trait, 24 × 24, dessinées en blanc sur le médaillon. */
const ICONS: Record<string, React.ReactNode> = {
  // Éclair : répond vite
  reactive: <path d="M13 3 6 13h5l-1 8 7-10h-5l1-8Z" />,
  // Balance : prix juste
  "fair-price": (
    <>
      <path d="M12 4v16M7 20h10M5 8h14M12 6l-7 2 0 0M12 6l7 2" />
      <path d="M5 8l-2.5 5a2.5 2.5 0 0 0 5 0L5 8ZM19 8l-2.5 5a2.5 2.5 0 0 0 5 0L19 8Z" />
    </>
  ),
  // Sablier : ancienneté
  veteran: <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />,
  // Étincelle : annonce soignée
  "neat-listing": <path d="M12 3c.7 4.6 2.3 6.3 7 7-4.7.7-6.3 2.4-7 7-.7-4.6-2.3-6.3-7-7 4.7-.7 6.3-2.4 7-7Z" />,
  // Fiole : liste méta (le symbole du site)
  "meta-list": (
    <>
      <path d="M10 3h4M10.5 3v5.2a6 6 0 1 0 3 0V3" />
      <path d="M7.4 14.5h9.2" />
    </>
  ),
  // Cartes en éventail : collectionneur
  collector: (
    <>
      <rect x="4" y="6" width="9" height="13" rx="1.6" transform="rotate(-10 8.5 12.5)" />
      <rect x="11" y="5" width="9" height="13" rx="1.6" transform="rotate(10 15.5 11.5)" />
    </>
  ),
  // Drapeau : premiers pas
  "first-steps": <path d="M6 21V4M6 4h11l-2 4 2 4H6" />,
  // Loupe sur un euro : estimateur
  estimator: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5M12.6 8.2a2.6 2.6 0 1 0 0 4.6M7.8 9.7h3.6M7.8 11.3h3.6" />
    </>
  ),
};

export function BadgeMedal({ badgeKey, level, size = 40, className = "" }: { badgeKey: string; level: number; size?: number; className?: string }) {
  const id = useId();
  const def = BADGE_BY_KEY.get(badgeKey);
  const [from, to] = LEVEL_COLORS[Math.min(3, Math.max(1, level))];
  const multi = !!def?.levels;
  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <defs>
          <linearGradient id={`m${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill={`url(#m${id})`} />
        <circle cx="20" cy="20" r="16.5" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.2" />
        <g transform="translate(8 8)" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[badgeKey] ?? <circle cx="12" cy="12" r="4" />}
        </g>
      </svg>
      {multi && (
        <span
          className="absolute -bottom-1 -right-1 rounded-full bg-banner px-1 text-[11px] font-bold leading-[15px] text-banner-ink ring-2 ring-surface"
          style={{ minWidth: 14, textAlign: "center" }}
        >
          {ROMAN[level]}
        </span>
      )}
    </span>
  );
}
