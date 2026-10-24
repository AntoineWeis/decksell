import { BADGE_BY_KEY, ROMAN, topBadges, type EarnedBadge } from "@/lib/badges";
import { BadgeMedal } from "./badge-medal";

const titleOf = (b: EarnedBadge) => {
  const def = BADGE_BY_KEY.get(b.key)!;
  return def.levels ? `${def.label} ${ROMAN[b.level]}` : def.label;
};

/** Badges compacts d'un vendeur (encadré d'une annonce) : médaillons et nom, les plus forts d'abord. */
export function SellerBadges({ badges, max = 3 }: { badges: EarnedBadge[]; max?: number }) {
  const top = topBadges(badges, max);
  if (top.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Badges du vendeur">
      {top.map((b) => (
        <li
          key={b.key}
          title={BADGE_BY_KEY.get(b.key)!.description}
          className="inline-flex items-center gap-1.5 rounded-full bg-sunken py-0.5 pl-0.5 pr-2.5 text-xs font-medium ring-1 ring-line"
        >
          <BadgeMedal badgeKey={b.key} level={b.level} size={22} className="[&>span:last-child]:hidden" />
          {titleOf(b)}
        </li>
      ))}
    </ul>
  );
}

/** Tous les badges d'un membre en grille (page publique d'un vendeur). */
export function BadgeGrid({ badges }: { badges: EarnedBadge[] }) {
  const sorted = topBadges(badges, badges.length);
  if (sorted.length === 0) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {sorted.map((b) => (
        <li key={b.key} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
          <BadgeMedal badgeKey={b.key} level={b.level} size={40} />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{titleOf(b)}</span>
            <span className="block text-xs leading-snug text-muted">{BADGE_BY_KEY.get(b.key)!.description}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
