import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "@/lib/auth";
import { Avatar } from "./avatar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-sm text-on-accent">d</span>
          decksell
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/#estimer" className="hidden rounded-lg px-3 py-2 text-muted hover:text-foreground sm:block">
            Estimer un deck
          </Link>
          {/* Lit la session : à part, pour ne pas ralentir le reste de la page */}
          <Suspense fallback={<div className="h-9 w-28 rounded-lg bg-sunken" />}>
            <UserMenu />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

async function UserMenu() {
  const profile = await getProfile();
  if (!profile) {
    return (
      <>
        <Link href="/connexion" className="rounded-lg px-3 py-2 font-medium hover:bg-sunken">
          Connexion
        </Link>
        <Link
          href="/inscription"
          className="rounded-lg bg-foreground px-3 py-2 font-medium text-background transition hover:opacity-85"
        >
          Créer un compte
        </Link>
      </>
    );
  }
  return (
    <Link href="/espace" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 font-medium hover:bg-sunken">
      <Avatar name={profile.displayName} url={profile.avatarUrl} size={30} />
      <span className="max-w-32 truncate">{profile.displayName}</span>
    </Link>
  );
}
