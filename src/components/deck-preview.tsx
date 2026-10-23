import Link from "next/link";
import { connection } from "next/server";
import { estimateDecklistNow, fetchPublicListings } from "@/lib/public-listings";
import { CONDITIONS, type PublicListing } from "@/lib/listings";
import { cardTypeCounts, manaCurve } from "@/lib/deck-stats";
import { formatEur, type Estimate } from "@/lib/pricing";
import { CardTypesCard } from "./card-types";
import { ManaCurveCard } from "./mana-curve";
import { FormatTag } from "./format-tag";

const POINTS = [
  ["Le prix face à la valeur du jour", "L'écart est calculé carte par carte, avec les prix Cardmarket du jour."],
  ["L'état et la langue de chaque carte", "Déclarés par le vendeur, visibles avant d'écrire."],
  ["La liste rangée par type", "Créatures, éphémères, terrains… avec le sous-total de chaque groupe et la courbe de mana."],
  ["La liste à emporter", "Lien à partager, ou fichier .txt à importer dans Moxfield, Arena ou MTGO pour tester le deck."],
];

/**
 * Aperçu de la fiche du dernier deck en ligne, avec ses vraies données.
 * Rien n'est affiché si aucun deck n'est en vente (ou si la lecture échoue).
 */
export async function DeckPreview() {
  // Hors du try : ce signal de Next (lecture au moment de la requête) ne doit pas être intercepté.
  await connection();
  let data: { l: PublicListing; estimate: Estimate } | null = null;
  try {
    const listings = await fetchPublicListings();
    const l = listings.find((x) => x.status === "active") ?? listings[0];
    if (l) data = { l, estimate: (await estimateDecklistNow(l.decklist)).estimate };
  } catch (e) {
    console.error("Accueil : aperçu de fiche indisponible", e);
  }
  if (!data) return null;
  const { l, estimate } = data;
  const today = estimate.totalCents;
  const diff = today > 0 ? Math.round(((l.asking_cents - today) / today) * 100) : null;

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
      <div>
        <h2 className="display max-w-xl text-3xl sm:text-4xl">Une fiche qui répond avant qu&apos;on demande</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-muted">
          Chaque deck en vente a sa fiche, générée à partir de sa liste. Voici celle du dernier deck mis en ligne,
          telle que la voit un acheteur.
        </p>
        <ul className="mt-8 space-y-5">
          {POINTS.map(([title, text]) => (
            <li key={title} className="flex gap-4">
              <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-accent" />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-4">
        <Link
          href={`/decks/${l.id}`}
          className="group block rounded-xl border border-line bg-surface p-5 transition hover:border-link/50"
        >
          <p className="flex items-center gap-2 font-semibold group-hover:text-link">
            <FormatTag format={l.format} />
            <span className="truncate">{l.title}</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {l.card_count} cartes · {CONDITIONS[l.condition]}
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="text-xs text-muted">Prix demandé</p>
              <p className="display text-3xl tabular-nums">{formatEur(l.asking_cents)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Valeur du jour</p>
              <p className="font-semibold tabular-nums">
                {formatEur(today)}
                {diff != null && diff !== 0 && (
                  <span className={`ml-1.5 text-xs font-normal ${diff < 0 ? "text-ok" : "text-muted"}`}>
                    ({diff > 0 ? "+" : ""}
                    {diff} %)
                  </span>
                )}
              </p>
            </div>
          </div>
        </Link>
        <CardTypesCard counts={cardTypeCounts(estimate)} />
        <ManaCurveCard curve={manaCurve(estimate)} />
        <Link href={`/decks/${l.id}`} className="inline-flex font-semibold text-link hover:underline">
          Voir la fiche complète →
        </Link>
      </div>
    </section>
  );
}

/** Emplacement réservé pendant la lecture de l'aperçu. */
export function DeckPreviewSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]" aria-busy>
      <div className="h-72 animate-pulse rounded-xl bg-sunken" />
      <div className="h-96 animate-pulse rounded-xl bg-sunken" />
    </div>
  );
}
