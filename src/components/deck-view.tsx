import type { Estimate, PricedLine } from "@/lib/pricing";
import { normalizeName } from "@/lib/decklist";
import { CardList } from "./card-list";
import { groupAnchor } from "./card-types";
import { detailsByKey, type CardDetail } from "@/lib/card-details";
import { typeGroup } from "@/lib/deck-stats";
import { HandTester, type HandCard } from "./hand-tester";

/** Exemplaires du deck pour le testeur de main (une entrée par carte physique). */
function handCards(lines: PricedLine[]): HandCard[] {
  return lines.flatMap((l) => {
      const card = { name: l.card?.name ?? l.name, imageUrl: l.card?.imageUrl ?? null, land: typeGroup(l.card?.typeLine) === "Land" };
      return Array.from({ length: l.quantity }, () => card);
    });
}

const sumCents = (lines: PricedLine[]) => lines.reduce((n, l) => n + (l.lineCents ?? 0), 0);

/**
 * Vue d'un deck : valeur du jour, puis deck principal et réserve carte par carte.
 * Deck Commander : le ou les commandants à part, en tête (hors du testeur de main).
 */
export function DeckView({
  estimate,
  pricesAsOf,
  details,
  commanders = [],
}: {
  estimate: Estimate;
  pricesAsOf: string | null;
  /** État et langue de chaque carte, pour une annonce. */
  details?: CardDetail[];
  /** Commandant(s) d'un deck Commander. */
  commanders?: string[];
}) {
  const byKey = details?.length ? detailsByKey(details) : undefined;
  const keys = new Set(commanders.map(normalizeName));
  const main = estimate.lines.filter((l) => l.board === "main");
  const leaders = main.filter((l) => keys.has(normalizeName(l.name)));
  const deck = main.filter((l) => !keys.has(normalizeName(l.name)));
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
        title={leaders.length > 1 ? "Commandants" : "Commandant"}
        lines={leaders}
        totalCents={sumCents(leaders)}
        previewSide="right"
        details={byKey}
      />
      <CardList
        title={leaders.length > 0 ? "Deck" : "Deck principal"}
        lines={deck}
        totalCents={leaders.length > 0 ? sumCents(deck) : estimate.mainCents}
        previewSide="right"
        details={byKey}
        groupByType
        action={<HandTester cards={handCards(deck)} />}
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
