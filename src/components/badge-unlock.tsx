"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fetchUnseenBadges, markBadgeSeen } from "@/app/badge-actions";
import { BADGE_BY_KEY, ROMAN, type EarnedBadge } from "@/lib/badges";
import { BadgeMedal } from "./badge-medal";
import { BRAND } from "@/lib/brand-colors";

const DURATION = 6500;
const SPARKS = 10;

/**
 * Animation de déblocage d'un badge : carte qui monte, médaillon qui apparaît avec un rebond,
 * reflet, étincelles. Vérifie les badges non vus à chaque changement de page ; les montre un
 * par un et les marque comme vus. Respecte « moins d'animations » (via CSS).
 */
export function BadgeUnlock() {
  const pathname = usePathname();
  const [queue, setQueue] = useState<EarnedBadge[]>([]);
  const shown = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    fetchUnseenBadges()
      .then((badges) => {
        if (cancelled) return;
        const fresh = badges.filter((b) => !shown.current.has(`${b.key}:${b.level}`));
        fresh.forEach((b) => shown.current.add(`${b.key}:${b.level}`));
        if (fresh.length) setQueue((q) => [...q, ...fresh]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const current = queue[0];

  useEffect(() => {
    if (!current) return;
    markBadgeSeen(current.key).catch(() => {});
    const t = window.setTimeout(() => setQueue((q) => q.slice(1)), DURATION);
    return () => window.clearTimeout(t);
  }, [current]);

  if (!current) return null;
  const def = BADGE_BY_KEY.get(current.key);
  if (!def) return null;
  const title = def.levels ? `${def.label} ${ROMAN[current.level]}` : def.label;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex justify-center sm:inset-x-auto sm:bottom-6 sm:left-6 sm:justify-start">
      <div
        key={`${current.key}:${current.level}`}
        role="status"
        aria-live="polite"
        className="badge-toast pointer-events-auto relative flex w-full max-w-sm items-center gap-4 overflow-hidden rounded-2xl border border-mana-violet/40 bg-surface px-4 py-3.5 shadow-2xl"
      >
        {/* Lueur de fond qui s'éteint doucement */}
        <span aria-hidden className="badge-glow absolute -left-6 top-1/2 size-28 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(157,132,255,0.45),transparent_70%)]" />

        <span className="relative">
          {/* Étincelles qui jaillissent du médaillon */}
          <span aria-hidden className="absolute inset-0">
            {Array.from({ length: SPARKS }, (_, i) => (
              <span
                key={i}
                className="badge-spark absolute left-1/2 top-1/2 size-1.5 rounded-full"
                style={
                  {
                    "--angle": `${(360 / SPARKS) * i}deg`,
                    "--dist": `${30 + (i % 3) * 8}px`,
                    background: i % 2 ? BRAND.manaViolet : BRAND.manaBlue,
                    animationDelay: `${180 + (i % 4) * 30}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </span>
          <span className="badge-medal relative block overflow-hidden rounded-full">
            <BadgeMedal badgeKey={current.key} level={current.level} size={52} />
            <span aria-hidden className="badge-shine absolute inset-0" />
          </span>
        </span>

        <span className="relative min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wider text-mana-violet">Badge débloqué</span>
          <span className="block font-semibold">{title}</span>
          <span className="mt-0.5 block text-xs leading-snug text-muted">{def.description}</span>
          <Link href="/espace/badges" className="mt-1 inline-block text-xs font-medium text-link hover:underline">
            Voir mes badges
          </Link>
        </span>

        <button
          type="button"
          onClick={() => setQueue((q) => q.slice(1))}
          aria-label="Fermer"
          className="relative -mr-1 self-start rounded-md p-1 text-muted hover:bg-sunken hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
