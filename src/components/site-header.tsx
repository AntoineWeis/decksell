import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "@/lib/auth";
import { getUnreadCount } from "@/lib/messaging";
import { Avatar } from "./avatar";

// Barre de navigation façon outil de deck : bleu nuit dans les deux thèmes.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-banner text-banner-ink">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-6 sm:px-6">
        <Link href="/" aria-label="decksell, accueil" className="shrink-0 rounded-md font-logo text-[25px] font-bold leading-none sm:text-[27px]">
          <span aria-hidden>
            deck<span className="text-[#5a90ff]">sell</span>
          </span>
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
  const unread = await getUnreadCount();
  return (
    <>
      <Link
        href="/espace"
        className="hidden whitespace-nowrap rounded-md px-3 py-2 font-medium text-banner-muted hover:bg-white/10 hover:text-banner-ink sm:block"
      >
        Mes annonces
      </Link>
      <Link
        href="/espace/messages"
        aria-label={unread > 0 ? `Messages, ${unread} non lus` : "Messages"}
        className="relative flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-2 font-medium text-banner-muted hover:bg-white/10 hover:text-banner-ink sm:px-3"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-5 w-5 sm:hidden">
          <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v8a1.5 1.5 0 0 1-1.5 1.5H8l-3.6 2.7A.25.25 0 0 1 4 16.5V14h.5A1.5 1.5 0 0 1 3 12.5v-8Z" />
        </svg>
        <span className="hidden sm:inline">Messages</span>
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 top-0.5 min-w-[18px] rounded-full bg-reveal px-1 text-center text-[11px] font-bold leading-[18px] text-white sm:static sm:min-w-0 sm:px-1.5"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      <Link href="/espace/profil" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 font-medium hover:bg-white/10">
        <Avatar name={profile.displayName} url={profile.avatarUrl} size={28} />
        <span className="max-w-32 truncate">{profile.displayName}</span>
      </Link>
    </>
  );
}
