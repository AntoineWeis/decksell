import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { fetchPublicSeller } from "@/lib/public-listings";
import { formatEur } from "@/lib/pricing";
import { Avatar } from "@/components/avatar";
import { ListingTile } from "@/components/listing-tile";

export const metadata: Metadata = { title: "Vendeur" };

const monthYear = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export default function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="flex-1">
      {/* L'identifiant vient de l'adresse : tout le contenu est lu au moment de la requête. */}
      <Suspense fallback={<SellerSkeleton />}>
        <SellerContent params={params} />
      </Suspense>
    </main>
  );
}

async function SellerContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchPublicSeller(id);
  if (!data) notFound();
  const { seller, listings } = data;

  const active = listings.filter((l) => l.status === "active");
  const totalAsking = active.reduce((sum, l) => sum + l.asking_cents, 0);
  const links = [
    seller.moxfield_url && { href: seller.moxfield_url, label: "Moxfield" },
    seller.archidekt_url && { href: seller.archidekt_url, label: "Archidekt" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <>
      <section className="bg-banner text-banner-ink">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-10">
          <Link href="/decks" className="text-sm text-banner-muted hover:text-banner-ink">
            ← Tous les decks en vente
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Avatar name={seller.display_name} url={seller.avatar_url} size={88} />
            <div className="min-w-0">
              <p className="text-sm text-banner-muted">Vendeur</p>
              <h1 className="display break-words text-3xl sm:text-4xl">{seller.display_name}</h1>
              <p className="mt-1 text-sm text-banner-muted">Membre depuis {monthYear(seller.created_at)}</p>
            </div>
          </div>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            <Stat label="En vente">{active.length}</Stat>
            {listings.length > active.length && <Stat label="Réservés">{listings.length - active.length}</Stat>}
            {totalAsking > 0 && <Stat label="Valeur des decks en vente">{formatEur(totalAsking)}</Stat>}
          </dl>

          {links.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-semibold text-banner-ink ring-1 ring-white/25 transition hover:bg-white/10"
                >
                  Profil {l.label} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        <h2 className="display text-2xl">
          {listings.length > 1 ? `Ses ${listings.length} decks` : "Son deck"}
        </h2>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingTile key={l.id} listing={l} showSeller={false} />
          ))}
        </ul>
      </div>
    </>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-banner-muted">{label}</dt>
      <dd className="display mt-0.5 text-2xl tabular-nums">{children}</dd>
    </div>
  );
}

function SellerSkeleton() {
  return (
    <div aria-busy>
      <div className="h-72 bg-banner" />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-80 animate-pulse rounded-xl bg-sunken" />
          ))}
        </ul>
      </div>
    </div>
  );
}
