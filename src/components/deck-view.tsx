import { formatEur, type Estimate } from "@/lib/pricing";
import { CardList } from "./card-list";
import { detailsByKey, type CardDetail } from "@/lib/card-details";

/** Vue d'un deck : valeur du jour, puis deck principal et réserve carte par carte. */
export function DeckView({
  estimate,
  pricesAsOf,
  details,
}: {
  estimate: Estimate;
  pricesAsOf: string | null;
  /** État et langue de chaque carte, pour une annonce. */
  details?: CardDetail[];
}) {
  const byKey = details?.length ? detailsByKey(details) : undefined;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-xl border border-line bg-surface px-5 py-4">
        <p>
          Valeur du jour : <span className="font-semibold tabular-nums">{formatEur(estimate.totalCents)}</span>
          {!estimate.complete && (
            <span className="text-warn">
              {" "}
              (hors {estimate.unpricedCardCount} carte{estimate.unpricedCardCount > 1 ? "s" : ""} sans prix)
            </span>
          )}
        </p>
        <p className="text-xs text-muted">
          Prix Cardmarket via Scryfall
          {pricesAsOf && <> · mis à jour le {new Date(pricesAsOf).toLocaleDateString("fr-FR")}</>}
        </p>
      </div>
      <CardList
        title="Deck principal"
        lines={estimate.lines.filter((l) => l.board === "main")}
        totalCents={estimate.mainCents}
        previewSide="right"
        details={byKey}
        groupByType
      />
      <CardList
        title="Réserve"
        lines={estimate.lines.filter((l) => l.board === "side")}
        totalCents={estimate.sideCents}
        previewSide="right"
        details={byKey}
      />
    </div>
  );
}
