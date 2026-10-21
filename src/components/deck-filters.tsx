import Link from "next/link";
import { MANA_COLORS, type ManaColor } from "@/lib/listings";
import { MIN_CARD_QUERY, SORTS, decksHref, type DeckQuery, type SortKey } from "@/lib/deck-index";
import { ManaSymbol } from "./mana";

const ORDER = Object.keys(MANA_COLORS) as ManaColor[];

const chip = "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition";
const on = "border-link bg-brand-soft text-link";
const off = "border-line bg-surface text-muted hover:border-link/40 hover:text-foreground";

/**
 * Filtres de l'index : recherche par carte, couleurs (cumulables), archétype (un seul) et tri.
 * Simples liens et un formulaire GET : tout marche sans JavaScript et se partage par l'adresse.
 */
export function DeckFilters({
  query,
  archetypeCounts,
  resultCount,
}: {
  query: DeckQuery;
  archetypeCounts: { slug: string; name: string; count: number }[];
  resultCount: number;
}) {
  const toggleColor = (c: ManaColor) => {
    const next = query.colors.includes(c) ? query.colors.filter((x) => x !== c) : [...query.colors, c];
    return decksHref({ ...query, colors: ORDER.filter((x) => next.includes(x)) });
  };
  const active = query.colors.length > 0 || query.archetype != null || query.card !== "";
  const cardTooShort = query.card !== "" && query.card.length < MIN_CARD_QUERY;

  return (
    <div className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      {/* Recherche par carte : formulaire GET qui garde les autres filtres */}
      <form action="/decks" role="search" className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label htmlFor="deck-card-search" className="w-24 shrink-0 text-sm font-semibold">
          Carte
        </label>
        <div className="flex min-w-0 flex-1 gap-2">
          {query.colors.length > 0 && <input type="hidden" name="c" value={query.colors.join("")} />}
          {query.archetype && <input type="hidden" name="a" value={query.archetype} />}
          {query.sort !== "recent" && <input type="hidden" name="tri" value={query.sort} />}
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              id="deck-card-search"
              type="search"
              name="carte"
              defaultValue={query.card}
              placeholder="Ragavan, Urza's Saga…"
              maxLength={60}
              autoComplete="off"
              aria-describedby="deck-card-search-hint"
              className="h-9 w-full rounded-lg border border-line bg-sunken pl-9 pr-3 text-sm outline-none focus:border-link focus:ring-2 focus:ring-link/25"
            />
          </div>
          <button
            type="submit"
            className="h-9 shrink-0 rounded-lg bg-accent px-3.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            Chercher
          </button>
        </div>
        {cardTooShort ? (
          <p id="deck-card-search-hint" className="w-full text-sm text-warn sm:pl-28">Écris au moins {MIN_CARD_QUERY} lettres du nom de la carte.</p>
        ) : (
          <p id="deck-card-search-hint" className="w-full text-xs text-muted sm:pl-28">
            Carte présente dans le deck, en principal ou en réserve. Nom en anglais.
          </p>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="w-24 shrink-0 text-sm font-semibold">Couleurs</p>
        <div className="flex flex-wrap gap-1.5">
          {ORDER.map((c) => {
            const selected = query.colors.includes(c);
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
            <Link
              href={decksHref({ ...query, archetype: null })}
              scroll={false}
              aria-pressed={!query.archetype}
              className={`${chip} ${!query.archetype ? on : off}`}
            >
              Tous
            </Link>
            {archetypeCounts.map((a) => {
              const selected = query.archetype === a.slug;
              return (
                <Link
                  key={a.slug}
                  href={decksHref({ ...query, archetype: selected ? null : a.slug })}
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="w-24 shrink-0 text-sm font-semibold">Trier par</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SORTS) as SortKey[]).map((s) => (
            <Link
              key={s}
              href={decksHref({ ...query, sort: s })}
              scroll={false}
              aria-current={query.sort === s ? "true" : undefined}
              className={`${chip} ${query.sort === s ? on : off}`}
            >
              {SORTS[s]}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm">
        <p className="text-muted">
          {resultCount} deck{resultCount > 1 ? "s" : ""}
          {query.card && !cardTooShort && (
            <>
              {" "}
              avec « <span className="font-medium text-foreground">{query.card}</span> »
            </>
          )}
          {query.colors.length > 1 && " contenant toutes ces couleurs"}
          {query.colors.length === 1 && " contenant cette couleur"}
          {query.sort === "affaire" && " · du plus avantageux au moins avantageux par rapport à l'estimation"}
        </p>
        {active && (
          <Link href={decksHref({ colors: [], archetype: null, card: "", sort: query.sort })} scroll={false} className="font-medium text-link hover:underline">
            Effacer les filtres
          </Link>
        )}
      </div>
    </div>
  );
}
