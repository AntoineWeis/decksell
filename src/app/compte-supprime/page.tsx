import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Compte supprimé", robots: { index: false } };

export default function AccountDeletedPage() {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-md text-center">
        <p className="mx-auto flex size-12 items-center justify-center rounded-full bg-ok-soft text-ok">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6" aria-hidden>
            <path d="m5 12 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>
        <h1 className="display mt-5 text-3xl">Compte supprimé</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Ton compte, ton profil et tes annonces ont été effacés. Tu peux toujours estimer un deck sans compte.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/estimer"
            className="inline-flex h-11 items-center rounded-lg bg-accent px-5 font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            Estimer un deck
          </Link>
          <Link href="/" className="inline-flex h-11 items-center rounded-lg px-5 font-semibold text-muted hover:text-foreground">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
