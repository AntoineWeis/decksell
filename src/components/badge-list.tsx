import { BADGE_BY_KEY, ROMAN, topBadges, type EarnedBadge } from "@/lib/badges";
import { BadgeMedal } from "./badge-medal";

const titleOf = (b: EarnedBadge) => {
  const def = BADGE_BY_KEY.get(b.key)!;
  return def.levels ? `${def.label} ${ROMAN[b.level]}` : def.label;
};

const TONES = {
  surface: "bg-sunken ring-line",
  banner: "bg-white/10 text-banner-ink ring-white/15",
};

/** Badges compacts d'un vendeur : médaillons et nom, les plus forts d'abord (description au survol). */
export function SellerBadges({
  badges,
  max = 3,
  tone = "surface",
  className = "mt-3",
}: {
  badges: EarnedBadge[];
  max?: number;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  const top = topBadges(badges, max);
  if (top.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Badges du vendeur">
      {top.map((b) => (
        <li
          key={b.key}
          title={BADGE_BY_KEY.get(b.key)!.description}
          className={`inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-xs font-medium ring-1 ${TONES[tone]}`}
        >
          <BadgeMedal badgeKey={b.key} level={b.level} size={22} className="[&>span:last-child]:hidden" />
          {titleOf(b)}
        </li>
      ))}
    </ul>
  );
}
