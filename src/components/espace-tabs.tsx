"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/espace", label: "Mes annonces" },
  { href: "/espace/messages", label: "Messages" },
  { href: "/espace/favoris", label: "Favoris" },
  { href: "/espace/profil", label: "Profil" },
];

export function EspaceTabs({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-line">
      {TABS.map((t) => {
        // « Mes annonces » reste actif sur la vue détaillée d'une annonce, « Messages » sur une conversation.
        const active =
          t.href === "/espace"
            ? pathname === "/espace" || pathname.startsWith("/espace/annonces")
            : pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active ? "border-link text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {t.href === "/espace/messages" && unread > 0 && (
              <span className="rounded-full bg-link px-1.5 text-xs font-semibold tabular-nums text-background">
                {unread}
                <span className="sr-only"> non lus</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
