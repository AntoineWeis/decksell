import { formatEur, type Estimate } from "@/lib/pricing";
import { CardList } from "./card-list";
import { groupAnchor } from "./card-types";
import { detailsByKey, type CardDetail } from "@/lib/card-details";
import { typeGroup } from "@/lib/deck-stats";
import { HandTester, type HandCard } from "./hand-tester";

/** Exemplaires du deck principal pour le testeur de main (une entrée par carte physique). */
function handCards(estimate: Estimate): HandCard[] {
  return estimate.lines
    .filter((l) => l.board === "main")
    .flatMap((l) => {
      const card = { name: l.card?.name ?? l.name, imageUrl: l.card?.imageUrl ?? null, land: typeGroup(l.card?.typeLine) === "Land" };
      return Array.from({ length: l.quantity }, () => card);
    });
}

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
        action={<HandTester cards={handCards(estimate)} />}
      />
      <CardList
        title="Réserve"
        lines={estimate.lines.filter((l) => l.board === "side")}
        totalCents={estimate.sideCents}
        id={groupAnchor("side")}
        previewSide="right"
        details={byKey}
      />
    </div>
  );
}
