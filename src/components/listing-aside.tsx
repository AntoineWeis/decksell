import Link from "next/link";
import { formatEur } from "@/lib/pricing";
import { CONDITIONS, STATUSES, type Listing } from "@/lib/listings";
import { Avatar } from "./avatar";
import { LanguageBar } from "./language-bar";
import { hasMixedConditions } from "@/lib/card-details";
import { formatLocation } from "@/lib/departments";
import { PriceGauge } from "./price-gauge";
import { SellerBadges } from "./badge-list";
import { isTransactionBadge, type EarnedBadge } from "@/lib/badges";

type Seller = {
  id?: string;
  display_name: string;
  avatar_url: string | null;
  moxfield_url: string | null;
  archidekt_url: string | null;
  department?: string | null;
  city?: string | null;
  /** Date d'inscription, pour « Membre depuis … ». */
  created_at?: string;
};

const monthYear = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Encadré d'une annonce : prix, valeur estimée, état, langue, vendeur, description. */
export function ListingAside({
  listing: l,
  seller,
  todayCents,
  children,
  stats,
  priceFirstOnMobile = false,
  sellerDeckCount = null,
  sellerBadges = [],
}: {
  listing: Pick<
    Listing,
    "asking_cents" | "estimated_cents" | "estimate_complete" | "condition" | "french_percent" | "description" | "status" | "created_at" | "card_count" | "card_details"
  >;
  seller: Seller | null;
  todayCents: number;
  children?: React.ReactNode;
  /** Encadrés de statistiques affichés sous le prix (ex. courbe de mana). */
  stats?: React.ReactNode;
  /**
   * Sur mobile, place l'encadré du prix avant le contenu de la page (le reste suit).
   * La page doit poser l'encadré dans une grille, via un parent en `contents lg:block`.
   */
  priceFirstOnMobile?: boolean;
  /** Nombre de decks que le vendeur a en vente (affiché à droite de son nom). */
  sellerDeckCount?: number | null;
  /** Badges du vendeur : seuls ceux de confiance sont affichés ici, les autres sur son profil. */
  sellerBadges?: EarnedBadge[];
}) {
  return (
    // En mode « prix d'abord », l'encadré s'efface sur mobile : ses blocs deviennent des
    // éléments de la grille de la page, que l'on peut ordonner autour de la liste de cartes.
    <aside className={priceFirstOnMobile ? "contents lg:sticky lg:top-20 lg:block lg:space-y-4" : "space-y-4 lg:sticky lg:top-20"}>
      <div className={`rounded-xl border border-line bg-surface p-5 ${priceFirstOnMobile ? "order-first lg:order-none" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Prix demandé</p>
          {l.status !== "active" && (
            <span className="rounded-md bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">{STATUSES[l.status]}</span>
          )}
        </div>
        <p className="display mt-1 text-4xl tabular-nums">{formatEur(l.asking_cents)}</p>
        <PriceGauge askingCents={l.asking_cents} valueCents={todayCents} className="mt-3" />
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Valeur du jour">
            {formatEur(todayCents)}
          </Row>
          <Row label="Valeur à la publication">
            {formatEur(l.estimated_cents)}
            {!l.estimate_complete && "+"}
          </Row>
          <Row label="État des cartes">
            {CONDITIONS[l.condition]}
            {hasMixedConditions(l.card_details ?? []) && <span className="font-normal text-muted"> en majorité</span>}
          </Row>
          <Row label="Cartes">{l.card_count}</Row>
          <Row label="Publiée le">{date(l.created_at)}</Row>
        </dl>
        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-sm font-medium">Langue des cartes</p>
          <LanguageBar frenchPercent={l.french_percent} details={l.card_details} />
        </div>
        {children}
      </div>

      <div className="space-y-4">
        {stats}

        {seller && (
          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">Vendeur</p>
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={seller.display_name} url={seller.avatar_url} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {seller.id ? (
                    <Link href={`/vendeurs/${seller.id}`} className="hover:text-link hover:underline">
                      {seller.display_name}
                    </Link>
                  ) : (
                    seller.display_name
                  )}
                </p>
                {seller.created_at && <p className="text-xs text-muted">Membre depuis {monthYear(seller.created_at)}</p>}
              </div>
              {sellerDeckCount != null && sellerDeckCount > 0 && (
                <p className="shrink-0 text-right leading-tight">
                  <span className="block text-lg font-semibold tabular-nums">{sellerDeckCount}</span>
                  <span className="text-xs text-muted">deck{sellerDeckCount > 1 ? "s" : ""} en vente</span>
                </p>
              )}
            </div>
            <SellerBadges badges={sellerBadges.filter(isTransactionBadge)} />
            {formatLocation(seller.department, seller.city) && (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {formatLocation(seller.department, seller.city) && (
                <span className="inline-flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted" aria-hidden>
                    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  Expédié depuis <span className="font-medium text-foreground">{formatLocation(seller.department, seller.city)}</span>
                </span>
              )}
            </p>
          )}
          {(seller.moxfield_url || seller.archidekt_url) && (
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {seller.moxfield_url && (
                  <a href={seller.moxfield_url} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-link hover:underline">
                    Profil Moxfield ↗
                  </a>
                )}
                {seller.archidekt_url && (
                  <a href={seller.archidekt_url} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-link hover:underline">
                    Profil Archidekt ↗
                  </a>
                )}
              </p>
            )}
            {seller.id && (
              <Link
                href={`/vendeurs/${seller.id}`}
                className="mt-4 flex h-9 items-center justify-center rounded-lg border border-line text-sm font-medium transition hover:border-link/50 hover:text-link"
              >
                Voir ses decks en vente
              </Link>
            )}
          </div>
        )}

        {l.description && (
          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">Description</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{l.description}</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}
