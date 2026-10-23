import { CARD_TYPES, type CardTypeCounts } from "@/lib/deck-stats";

/** Nombre de cartes du deck principal par type ; les types absents ne sont pas affichés. */
export function CardTypesCard({ counts }: { counts: CardTypeCounts | null }) {
  const present = counts ? CARD_TYPES.filter((t) => counts[t.key] > 0) : [];
  if (present.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold">Types de cartes</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {present.map((t) => {
          const n = counts![t.key];
          return (
            <li key={t.key} className="inline-flex items-center gap-1.5 rounded-md bg-sunken px-2 py-1 text-sm ring-1 ring-line">
              <span className="font-semibold tabular-nums">{n}</span>
              <span className="text-muted">
                {t.label}
                {n > 1 ? "s" : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
