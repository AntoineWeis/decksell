import Link from "next/link";
import { formatEur } from "@/lib/pricing";
import { CONDITIONS, STATUSES, type Listing } from "@/lib/listings";
import { Avatar } from "./avatar";
import { LanguageBar } from "./language-bar";

type Seller = { id?: string; display_name: string; avatar_url: string | null; moxfield_url: string | null; archidekt_url: string | null };

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Encadré d'une annonce : prix, valeur estimée, état, langue, vendeur, description. */
export function ListingAside({
  listing: l,
  seller,
  todayCents,
  children,
  stats,
}: {
  listing: Pick<
    Listing,
    "asking_cents" | "estimated_cents" | "estimate_complete" | "condition" | "french_percent" | "description" | "status" | "created_at" | "card_count"
  >;
  seller: Seller | null;
  todayCents: number;
  children?: React.ReactNode;
  /** Encadrés de statistiques affichés sous le prix (ex. courbe de mana). */
  stats?: React.ReactNode;
}) {
  const diff = todayCents > 0 ? Math.round(((l.asking_cents - todayCents) / todayCents) * 100) : null;
  return (
    <aside className="space-y-4 lg:sticky lg:top-20">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Prix demandé</p>
          {l.status !== "active" && (
            <span className="rounded-md bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">{STATUSES[l.status]}</span>
          )}
        </div>
        <p className="display mt-1 text-4xl tabular-nums">{formatEur(l.asking_cents)}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Valeur du jour">
            {formatEur(todayCents)}
            {diff != null && diff !== 0 && (
              <span className={`ml-1.5 text-xs ${diff < 0 ? "text-ok" : "text-muted"}`}>
                ({diff > 0 ? "+" : ""}
                {diff} % demandé)
              </span>
            )}
          </Row>
          <Row label="Valeur à la publication">
            {formatEur(l.estimated_cents)}
            {!l.estimate_complete && "+"}
          </Row>
          <Row label="État des cartes">{CONDITIONS[l.condition]}</Row>
          <Row label="Cartes">{l.card_count}</Row>
          <Row label="Publiée le">{date(l.created_at)}</Row>
        </dl>
        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-sm font-medium">Langue des cartes</p>
          <LanguageBar frenchPercent={l.french_percent} />
        </div>
        {children}
      </div>

      {stats}

      {seller && (
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">Vendeur</p>
          <p className="mt-2 flex items-center gap-3 font-semibold">
            <Avatar name={seller.display_name} url={seller.avatar_url} size={36} />
            {seller.id ? (
              <Link href={`/vendeurs/${seller.id}`} className="hover:text-link hover:underline">
                {seller.display_name}
              </Link>
            ) : (
              seller.display_name
            )}
          </p>
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
