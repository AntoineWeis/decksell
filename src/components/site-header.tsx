import Link from "next/link";
import { LogoMark } from "./logo-mark";
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
        <Link
          href="/"
          aria-label="decksell, accueil"
          className="group flex shrink-0 items-center gap-1.5 rounded-md font-logo text-[25px] font-bold leading-none sm:text-[27px]"
        >
          {/* Fiole de mana : petite inclinaison au survol. */}
          <LogoMark size={24} className="transition-transform duration-500 group-hover:-rotate-12 sm:size-[26px]" />
          <span aria-hidden>
            deck<span className="text-[#5a90ff]">sell</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {/* Les deux formats à égalité. Sur mobile, faute de place : un seul lien vers tous les decks,
              dont la page propose les onglets Modern et Commander. */}
          <Link href="/decks" className="whitespace-nowrap rounded-md px-2 py-2 font-medium text-banner-muted hover:bg-white/10 hover:text-banner-ink sm:hidden">
            Decks
          </Link>
          <Link href="/modern" className="hidden items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 font-medium text-banner-muted hover:bg-white/10 hover:text-banner-ink sm:flex">
            <span aria-hidden className="size-2 rounded-full bg-[#5a90ff]" />
            Modern
          </Link>
          <Link href="/commander" className="hidden items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 font-medium text-banner-muted hover:bg-white/10 hover:text-banner-ink sm:flex">
            <span aria-hidden className="size-2 rounded-full bg-[#a98bff]" />
            Commander
          </Link>
          {/* Sur mobile aussi : c'est l'entrée des vendeurs. */}
          <Link href="/estimer" className="whitespace-nowrap rounded-md px-2 py-2 font-medium text-banner-muted hover:bg-white/10 hover:text-banner-ink sm:px-3">
            <span className="sm:hidden">Estimer</span>
            <span className="hidden sm:inline">Estimer un deck</span>
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
        {/* Masqué sur mobile pour laisser la place à « Estimer » : la page de connexion mène à l'inscription. */}
        <Link
          href="/inscription"
          className="hidden whitespace-nowrap rounded-md bg-accent px-3 py-2 font-semibold text-on-accent transition hover:bg-accent-hover sm:block"
        >
          Créer un compte
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
        // Masqué sur mobile pour laisser la place à « Estimer » : les favoris restent dans Mon espace.
        className="hidden h-9 w-9 items-center justify-center rounded-md text-banner-muted hover:bg-white/10 hover:text-banner-ink sm:flex"
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
