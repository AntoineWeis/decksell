import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "@/lib/auth";
import { Avatar } from "./avatar";

// Barre de navigation façon outil de deck : bleu nuit dans les deux thèmes.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-banner text-banner-ink">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-md">
          <LogoMark />
          <span className="hidden text-lg font-semibold tracking-tight min-[400px]:inline">decksell</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/decks" className="whitespace-nowrap rounded-md px-2 py-2 font-medium text-banner-muted hover:bg-white/10 hover:text-banner-ink sm:px-3">
            <span className="sm:hidden">Decks</span>
            <span className="hidden sm:inline">Decks en vente</span>
          </Link>
          <Link href="/estimer" className="hidden whitespace-nowrap rounded-md px-3 py-2 font-medium text-banner-muted hover:bg-white/10 hover:text-banner-ink sm:block">
            Estimer un deck
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1.5 text-sm">
          {/* Lit la session : à part, pour ne pas ralentir le reste de la page */}
          <Suspense fallback={<div className="h-9 w-28 rounded-md bg-white/10" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function UserMenu() {
  const profile = await getProfile();
  if (!profile) {
    return (
      <>
        <Link
          href="/connexion"
          className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-banner-ink hover:bg-white/10"
        >
          Connexion
        </Link>
        <Link
          href="/inscription"
          className="whitespace-nowrap rounded-md bg-accent px-3 py-2 font-semibold text-on-accent transition hover:bg-accent-hover"
        >
          <span className="sm:hidden">S&apos;inscrire</span>
          <span className="hidden sm:inline">Créer un compte</span>
        </Link>
      </>
    );
  }
  return (
    <>
      <Link
        href="/espace"
        className="hidden whitespace-nowrap rounded-md px-3 py-2 font-medium text-banner-muted hover:bg-white/10 hover:text-banner-ink sm:block"
      >
        Mes annonces
      </Link>
      <Link href="/espace/profil" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 font-medium hover:bg-white/10">
        <Avatar name={profile.displayName} url={profile.avatarUrl} size={28} />
        <span className="max-w-32 truncate">{profile.displayName}</span>
      </Link>
    </>
  );
}

/** Deux cartes décalées sur un carré bleu. */
function LogoMark() {
  return (
    <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
      <rect width="28" height="28" rx="7" fill="var(--accent)" />
      <rect x="7" y="8.5" width="10" height="13.5" rx="1.6" fill="#fff" fillOpacity="0.45" transform="rotate(-10 12 15)" />
      <rect x="11" y="6.5" width="10" height="13.5" rx="1.6" fill="#fff" />
    </svg>
  );
}
