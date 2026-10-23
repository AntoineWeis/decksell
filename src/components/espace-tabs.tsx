"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/espace", label: "Mes annonces" },
  { href: "/espace/messages", label: "Messages" },
  { href: "/espace/favoris", label: "Favoris" },
  { href: "/espace/profil", label: "Profil" },
];

/** Onglets de Mon espace. « Modération » n'apparaît que pour les admins. */
export function EspaceTabs({ unread = 0, moderation }: { unread?: number; moderation?: { open: number } }) {
  const pathname = usePathname();
  const tabs = moderation ? [...TABS, { href: "/espace/moderation", label: "Modération" }] : TABS;
  const badges: Record<string, { count: number; label: string; className: string }> = {
    "/espace/messages": { count: unread, label: "non lus", className: "bg-link" },
    "/espace/moderation": { count: moderation?.open ?? 0, label: "à traiter", className: "bg-danger" },
  };
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => {
        // « Mes annonces » reste actif sur la vue détaillée d'une annonce, les autres sur leurs sous-pages.
        const active =
          t.href === "/espace"
            ? pathname === "/espace" || pathname.startsWith("/espace/annonces")
            : pathname === t.href || pathname.startsWith(`${t.href}/`);
        const badge = badges[t.href];
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active ? "border-link text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {badge && badge.count > 0 && (
              <span className={`rounded-full px-1.5 text-xs font-semibold tabular-nums text-background ${badge.className}`}>
                {badge.count}
                <span className="sr-only"> {badge.label}</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
