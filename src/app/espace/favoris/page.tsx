import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { listFavorites, type Favorite } from "@/lib/favorites";
import { PUBLIC_STATUSES, STATUSES, artCrop, type ListingStatus } from "@/lib/listings";
import { formatEur } from "@/lib/pricing";
import { Avatar } from "@/components/avatar";
import { ManaColors } from "@/components/mana";
import { RemoveFavoriteButton, StarIcon } from "@/components/favorite-button";

export const metadata: Metadata = { title: "Mes favoris" };

const isAvailable = (s: ListingStatus) => (PUBLIC_STATUSES as readonly string[]).includes(s);

const STATUS_STYLE: Record<ListingStatus, string> = {
  active: "bg-ok-soft text-ok",
  reserved: "bg-warn-soft text-warn",
  sold: "bg-sunken text-muted",
  withdrawn: "bg-sunken text-muted",
};

export default function FavoritesPage() {
  return (
    <Suspense fallback={<FavoritesSkeleton />}>
      <Favorites />
    </Suspense>
  );
}

async function Favorites() {
  await requireUser("/espace/favoris");
  const favorites = await listFavorites();

  if (!favorites) {
    return <p className="rounded-xl bg-danger-soft px-5 py-4 text-danger">Impossible de charger tes favoris.</p>;
  }

  if (favorites.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
        <StarIcon className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-3 font-semibold">Aucun favori pour l&apos;instant</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Clique sur l&apos;étoile d&apos;un deck en vente pour le suivre : tu le retrouveras ici, même une fois vendu.
        </p>
        <Link
          href="/decks"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-accent px-4 font-semibold text-on-accent hover:bg-accent-hover"
        >
          Voir les decks en vente
        </Link>
      </div>
    );
  }

  const available = favorites.filter((f) => isAvailable(f.status));
  const gone = favorites.filter((f) => !isAvailable(f.status));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-semibold">
          Toujours disponibles <span className="font-normal text-muted">· {available.length}</span>
        </h2>
        {available.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-5 py-6 text-center text-sm text-muted">
            Aucun de tes favoris n&apos;est encore en vente.{" "}
            <Link href="/decks" className="font-medium text-link hover:underline">
              Voir les decks en vente
            </Link>
          </p>
        ) : (
          <FavoriteList items={available} />
        )}
      </section>

      {gone.length > 0 && (
        <section>
          <h2 className="mb-1 font-semibold">
            Plus disponibles <span className="font-normal text-muted">· {gone.length}</span>
          </h2>
          <p className="mb-3 text-sm text-muted">Vendus ou retirés par leur vendeur. Garde-les pour comparer les prix.</p>
          <FavoriteList items={gone} />
        </section>
      )}
    </div>
  );
}

function FavoriteList({ items }: { items: Favorite[] }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {items.map((f) => {
        const available = isAvailable(f.status);
        const cover = artCrop(f.cover_image_url);
        return (
          <li key={f.listing_id} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
            {available ? (
              <Link
                href={`/decks/${f.listing_id}`}
                tabIndex={-1}
                aria-hidden
                className="group relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-banner"
              >
                {cover && (
                  <Image src={cover} alt="" fill sizes="80px" unoptimized className="object-cover transition duration-300 group-hover:scale-105" />
                )}
              </Link>
            ) : (
              // Annonce vendue ou retirée : plus de page publique, la vignette n'est pas un lien.
              <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-banner opacity-50 grayscale">
                {cover && <Image src={cover} alt="" fill sizes="80px" unoptimized className="object-cover" />}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {available ? (
                  <Link href={`/decks/${f.listing_id}`} className="truncate font-semibold hover:text-link hover:underline">
                    {f.title}
                  </Link>
                ) : (
                  <span className="truncate font-semibold text-muted">{f.title}</span>
                )}
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[f.status]}`}>{STATUSES[f.status]}</span>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <ManaColors colors={f.colors ?? []} size={14} />
                {f.archetype_name && <span>{f.archetype_name}</span>}
                <span>{f.card_count} cartes</span>
                <span className="inline-flex items-center gap-1">
                  · <Avatar name={f.seller_name} url={f.seller_avatar_url} size={16} /> {f.seller_name}
                </span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`font-bold tabular-nums ${available ? "" : "text-muted"}`}>
                {formatEur(f.asking_cents)}
              </p>
              <p className="hidden text-xs tabular-nums text-muted sm:block">Estimé {formatEur(f.estimated_cents)}</p>
            </div>
            <RemoveFavoriteButton listingId={f.listing_id} title={f.title} />
          </li>
        );
      })}
    </ul>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="space-y-px overflow-hidden rounded-xl border border-line" aria-busy>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[84px] animate-pulse bg-sunken" />
      ))}
    </div>
  );
}
