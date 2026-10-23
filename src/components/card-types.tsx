import { CARD_TYPES, typeTargets, type CardTypeCounts, type CardTypeKey } from "@/lib/deck-stats";
import type { Estimate } from "@/lib/pricing";

/** Ancre d'un groupe de la liste de cartes (voir CardList). */
export const groupAnchor = (key: string) => `type-${key.toLowerCase()}`;

/** Ancres des tags pour une page qui affiche la liste groupée (DeckView). */
export function anchorsFor(estimate: Estimate): Partial<Record<CardTypeKey, string>> {
  return Object.fromEntries(Object.entries(typeTargets(estimate)).map(([k, g]) => [k, groupAnchor(g!)]));
}

/**
 * Nombre de cartes du deck principal par type ; les types absents ne sont pas affichés.
 * Avec `targets`, chaque tag qui a un groupe dans la liste de la page devient un lien vers ce groupe
 * (le compagnon mène à la réserve).
 */
export function CardTypesCard({
  counts,
  targets,
}: {
  counts: CardTypeCounts | null;
  /** Ancres présentes sur la page, par type. */
  targets?: Partial<Record<CardTypeKey, string>>;
}) {
  const present = counts ? CARD_TYPES.filter((t) => counts[t.key] > 0) : [];
  if (present.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold">Types de cartes</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {present.map((t) => {
          const n = counts![t.key];
          const label = (
            <>
              <span className="font-semibold tabular-nums">{n}</span>
              <span className="text-muted">
                {t.label}
                {n > 1 ? "s" : ""}
              </span>
            </>
          );
          const tag = "inline-flex items-center gap-1.5 rounded-md bg-sunken px-2 py-1 text-sm ring-1 ring-line";
          const target = targets?.[t.key];
          return (
            <li key={t.key}>
              {target ? (
                <a href={`#${target}`} className={`${tag} transition hover:ring-link/60 [&:hover_span]:text-link`}>
                  {label}
                </a>
              ) : (
                <span className={tag}>{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
