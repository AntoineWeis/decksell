import Link from "next/link";
import { MANA_COLORS, type ManaColor } from "@/lib/listings";
import { MIN_CARD_QUERY, SORTS, decksHref, type DeckQuery, type SortKey } from "@/lib/deck-index";
import { ManaSymbol } from "./mana";
import { FiltersPanel } from "./filters-panel";
import { CardSearchInput } from "./card-search-input";
import { DEPARTMENTS } from "@/lib/departments";

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
    return decksHref({ ...query, page: 1, colors: ORDER.filter((x) => next.includes(x)) });
  };
  const activeCount =
    query.colors.length +
    (query.archetype ? 1 : 0) +
    (query.card ? 1 : 0) +
    (query.min != null || query.max != null ? 1 : 0) +
    (query.department ? 1 : 0) +
    (query.ships ? 1 : 0);
  const active = activeCount > 0;
  const summary = active ? `${activeCount} filtre${activeCount > 1 ? "s" : ""} · ${resultCount} deck${resultCount > 1 ? "s" : ""}` : `${resultCount} deck${resultCount > 1 ? "s" : ""}`;
  // Champs cachés qui gardent les autres filtres quand on envoie un des formulaires.
  const keep = (except: "card" | "price" | "place") => (
    <>
      {query.colors.length > 0 && <input type="hidden" name="c" value={query.colors.join("")} />}
      {query.archetype && <input type="hidden" name="a" value={query.archetype} />}
      {except !== "card" && query.card && <input type="hidden" name="carte" value={query.card} />}
      {except !== "price" && query.min != null && <input type="hidden" name="min" value={query.min} />}
      {except !== "price" && query.max != null && <input type="hidden" name="max" value={query.max} />}
      {except !== "place" && query.department && <input type="hidden" name="dep" value={query.department} />}
      {except !== "place" && query.ships && <input type="hidden" name="envoi" value="1" />}
      {query.sort !== "recent" && <input type="hidden" name="tri" value={query.sort} />}
    </>
  );
  const cardTooShort = query.card !== "" && query.card.length < MIN_CARD_QUERY;

  return (
    <FiltersPanel summary={summary}>
      <div className="space-y-4 p-4 sm:p-5">
        {/* Recherche par carte : formulaire GET qui garde les autres filtres */}
        <form action="/decks" role="search" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label htmlFor="deck-card-search" className="w-24 shrink-0 text-sm font-semibold">
            Carte
          </label>
          <div className="flex min-w-0 flex-1 gap-2">
            {keep("card")}
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
              <CardSearchInput
                id="deck-card-search"
                type="search"
                name="carte"
                defaultValue={query.card}
                placeholder="Ragavan, Foudre…"
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
              Carte présente dans le deck, en principal ou en réserve. Nom en anglais ou en français.
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
                href={decksHref({ ...query, page: 1, archetype: null })}
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
                    href={decksHref({ ...query, page: 1, archetype: selected ? null : a.slug })}
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

        {/* Fourchette de prix : formulaire GET qui garde les autres filtres */}
        <form action="/decks" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p id="deck-price-label" className="w-24 shrink-0 text-sm font-semibold">
            Prix
          </p>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="deck-price-label">
            {keep("price")}
            <label className="sr-only" htmlFor="deck-price-min">Prix minimum en euros</label>
            <input
              id="deck-price-min"
              name="min"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={query.min ?? ""}
              placeholder="Min"
              className="h-9 w-24 rounded-lg border border-line bg-sunken px-3 text-sm tabular-nums outline-none focus:border-link focus:ring-2 focus:ring-link/25"
            />
            <span className="text-sm text-muted" aria-hidden>à</span>
            <label className="sr-only" htmlFor="deck-price-max">Prix maximum en euros</label>
            <input
              id="deck-price-max"
              name="max"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={query.max ?? ""}
              placeholder="Max"
              className="h-9 w-24 rounded-lg border border-line bg-sunken px-3 text-sm tabular-nums outline-none focus:border-link focus:ring-2 focus:ring-link/25"
            />
            <span className="text-sm text-muted">€</span>
            <button
              type="submit"
              className="h-9 rounded-lg border border-line px-3 text-sm font-medium transition hover:border-link/50 hover:text-link"
            >
              Appliquer
            </button>
          </div>
        </form>

        {/* Lieu : département du vendeur et envoi, formulaire GET qui garde les autres filtres */}
        <form action="/decks" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label htmlFor="deck-dep" className="w-24 shrink-0 text-sm font-semibold">
            Lieu
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {keep("place")}
            <select
              id="deck-dep"
              name="dep"
              defaultValue={query.department ?? ""}
              className="h-9 max-w-56 rounded-lg border border-line bg-sunken px-2.5 text-sm outline-none focus:border-link focus:ring-2 focus:ring-link/25"
            >
              <option value="">Toute la France</option>
              {Object.entries(DEPARTMENTS).map(([code, name]) => (
                <option key={code} value={code}>
                  {code} · {name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="envoi" value="1" defaultChecked={query.ships} className="h-4 w-4 accent-[var(--accent)]" />
              Envoi possible
            </label>
            <button
              type="submit"
              className="h-9 rounded-lg border border-line px-3 text-sm font-medium transition hover:border-link/50 hover:text-link"
            >
              Appliquer
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="w-24 shrink-0 text-sm font-semibold">Trier par</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SORTS) as SortKey[]).map((s) => (
              <Link
                key={s}
                href={decksHref({ ...query, page: 1, sort: s })}
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
            {query.min != null && query.max != null && ` entre ${query.min} et ${query.max} €`}
            {query.min != null && query.max == null && ` à partir de ${query.min} €`}
            {query.min == null && query.max != null && ` jusqu'à ${query.max} €`}
          {query.department && ` · vendeurs du ${query.department} (${DEPARTMENTS[query.department]})`}
          {query.ships && " · envoi possible"}
            {query.sort === "affaire" && " · du plus avantageux au moins avantageux par rapport à l'estimation"}
          </p>
          {active && (
            <Link href={decksHref({ sort: query.sort })} scroll={false} className="font-medium text-link hover:underline">
              Effacer les filtres
            </Link>
          )}
        </div>
      </div>
    </FiltersPanel>
  );
}
