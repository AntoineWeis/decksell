import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "@/lib/auth";
import { getUnreadCount } from "@/lib/messaging";
import { MessagesLink } from "./messages-link";
import { StarIcon } from "./favorite-button";
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
        href="/espace/favoris"
        aria-label="Mes favoris"
        title="Mes favoris"
        className="flex h-9 w-9 items-center justify-center rounded-md text-banner-muted hover:bg-white/10 hover:text-banner-ink"
      >
        <StarIcon className="h-[22px] w-[22px]" />
      </Link>
      <MessagesLink initialUnread={unread} />
      <Link
        href="/espace/profil"
        aria-label={`Mon profil (${profile.displayName})`}
        className="flex items-center gap-2 rounded-full p-1 font-medium hover:bg-white/10 sm:pr-3"
      >
        <Avatar name={profile.displayName} url={profile.avatarUrl} size={28} />
        <span className="hidden max-w-32 truncate sm:inline">{profile.displayName}</span>
      </Link>
    </>
  );
}
