"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/espace", label: "Mes annonces" },
  { href: "/espace/profil", label: "Profil" },
];

export function EspaceTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-line">
      {TABS.map((t) => {
        // « Mes annonces » reste actif sur la vue détaillée d'une annonce.
        const active = t.href === "/espace" ? pathname === "/espace" || pathname.startsWith("/espace/annonces") : pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active ? "border-link text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
