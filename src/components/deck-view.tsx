import type { Estimate } from "@/lib/pricing";
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
      {/* La valeur du jour est dans l'encadré prix : ici, seulement la source, la date et les cartes sans prix. */}
      <p className="flex flex-wrap gap-x-2 gap-y-1 px-1 text-xs text-muted">
        <span>
          Prix Cardmarket via Scryfall
          {pricesAsOf && <> · mis à jour le {new Date(pricesAsOf).toLocaleDateString("fr-FR")}</>}
        </span>
        {!estimate.complete && (
          <span className="font-medium text-warn">
            · {estimate.unpricedCardCount} carte{estimate.unpricedCardCount > 1 ? "s" : ""} sans prix, hors total
          </span>
        )}
      </p>
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
