import Link from "next/link";
import { MANA_COLORS, type ManaColor } from "@/lib/listings";
import { ManaSymbol } from "./mana";

export type DeckFilter = { colors: ManaColor[]; archetype: string | null };

/** Adresse de l'index avec ces filtres (couleurs dans l'ordre WUBRG). */
export function decksHref({ colors, archetype }: DeckFilter): string {
  const params = new URLSearchParams();
  if (colors.length) params.set("c", colors.join(""));
  if (archetype) params.set("a", archetype);
  const q = params.toString();
  return q ? `/decks?${q}` : "/decks";
}

const ORDER = Object.keys(MANA_COLORS) as ManaColor[];

/** Filtres de l'index : couleurs (cumulables) et archétype (un seul). Simples liens, sans JavaScript. */
export function DeckFilters({
  filter,
  archetypeCounts,
  resultCount,
}: {
  filter: DeckFilter;
  archetypeCounts: { slug: string; name: string; count: number }[];
  resultCount: number;
}) {
  const toggleColor = (c: ManaColor) => {
    const next = filter.colors.includes(c) ? filter.colors.filter((x) => x !== c) : [...filter.colors, c];
    return decksHref({ ...filter, colors: ORDER.filter((x) => next.includes(x)) });
  };
  const active = filter.colors.length > 0 || filter.archetype != null;
  const chip = "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition";
  const on = "border-link bg-brand-soft text-link";
  const off = "border-line bg-surface text-muted hover:border-link/40 hover:text-foreground";

  return (
    <div className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="w-24 shrink-0 text-sm font-semibold">Couleurs</p>
        <div className="flex flex-wrap gap-1.5">
          {ORDER.map((c) => {
            const selected = filter.colors.includes(c);
            return (
              <Link
                key={c}
                href={toggleColor(c)}
                scroll={false}
                aria-pressed={selected}
                className={`${chip} ${selected ? on : `${off} [&_img]:opacity-60 [&_img]:grayscale`}`}
              >
                <ManaSymbol color={c} size={18} />
                <span className="hidden sm:inline">{MANA_COLORS[c]}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {archetypeCounts.length > 0 && (
        <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
          <p className="w-24 shrink-0 pt-2 text-sm font-semibold">Archétype</p>
          <div className="flex flex-1 flex-wrap gap-1.5">
            <Link href={decksHref({ ...filter, archetype: null })} scroll={false} aria-pressed={!filter.archetype} className={`${chip} ${!filter.archetype ? on : off}`}>
              Tous
            </Link>
            {archetypeCounts.map((a) => {
              const selected = filter.archetype === a.slug;
              return (
                <Link
                  key={a.slug}
                  href={decksHref({ ...filter, archetype: selected ? null : a.slug })}
                  scroll={false}
                  aria-pressed={selected}
                  className={`${chip} ${selected ? on : off}`}
                >
                  {a.name}
                  <span className="text-xs tabular-nums opacity-70">{a.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm">
        <p className="text-muted">
          {resultCount} deck{resultCount > 1 ? "s" : ""}
          {filter.colors.length > 1 && " contenant toutes ces couleurs"}
          {filter.colors.length === 1 && " contenant cette couleur"}
        </p>
        {active && (
          <Link href="/decks" scroll={false} className="font-medium text-link hover:underline">
            Effacer les filtres
          </Link>
        )}
      </div>
    </div>
  );
}
