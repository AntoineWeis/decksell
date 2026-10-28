import Form from "next/form";
import Link from "next/link";
import { MANA_COLORS, type ManaColor } from "@/lib/listings";
import { MIN_CARD_QUERY, SORTS, catalogPath, decksHref, sortsFor, type DeckQuery } from "@/lib/deck-index";
import { BRACKETS, type BracketLevel } from "@/lib/bracket";
import { ManaSymbol } from "./mana";
import { FiltersPanel } from "./filters-panel";
import { CardSearchInput } from "./card-search-input";
import { AutoSubmit } from "./auto-submit";

const ORDER = Object.keys(MANA_COLORS) as ManaColor[];

const chip = "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition";
const on = "border-link bg-brand-soft text-link";
const off = "border-line bg-surface text-muted hover:border-link/40 hover:text-foreground";
const field = "h-9 rounded-lg border border-line bg-sunken px-3 text-sm outline-none focus:border-link focus:ring-2 focus:ring-link/25";
const label = "mb-1 block text-xs font-semibold text-muted";

/**
 * Filtres de l'index, en barre compacte : carte, archétype, prix et tri sur une ligne, couleurs et
 * « avec photos » sur la suivante. Un seul formulaire GET qui s'applique tout seul (menus, prix,
 * case) ; les couleurs sont des liens. Tout se partage par l'adresse et marche sans JavaScript
 * (Entrée envoie le formulaire).
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
    (query.photos ? 1 : 0) +
    (query.level != null ? 1 : 0);
  const commander = query.format === "commander";
  const active = activeCount > 0;
  const decks = `${resultCount} deck${resultCount > 1 ? "s" : ""}`;
  const summary = active ? `${activeCount} filtre${activeCount > 1 ? "s" : ""} · ${decks}` : decks;
  const cardTooShort = query.card !== "" && query.card.length < MIN_CARD_QUERY;
  // L'archétype choisi reste dans la liste même s'il ne correspond plus aux autres filtres.
  const archetypes =
    query.archetype && !archetypeCounts.some((a) => a.slug === query.archetype)
      ? [...archetypeCounts, { slug: query.archetype, name: query.archetype, count: 0 }]
      : archetypeCounts;

  return (
    <FiltersPanel summary={summary}>
      <Form action={catalogPath(query.format)} scroll={false} role="search" className="space-y-3 p-4 sm:p-4">
        <AutoSubmit />
        {query.colors.length > 0 && <input type="hidden" name="c" value={query.colors.join("")} />}

        <div
          className={`grid gap-3 sm:grid-cols-2 ${
            commander ? "lg:grid-cols-[minmax(0,1fr)_11rem_10rem_auto_10rem]" : "lg:grid-cols-[minmax(0,1fr)_13rem_auto_12rem]"
          }`}
        >
          {/* Carte : envoyée avec Entrée ou la loupe */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="deck-card-search" className={label}>
              {commander ? "Commandant ou carte" : "Carte dans le deck"}
            </label>
            <div className="relative">
              <CardSearchInput
                id="deck-card-search"
                type="search"
                name="carte"
                defaultValue={query.card}
                placeholder={commander ? "Commandant ou carte : Atraxa, Sol Ring…" : "Ragavan, Foudre… (anglais ou français)"}
                maxLength={60}
                autoComplete="off"
                aria-describedby={cardTooShort ? "deck-card-search-hint" : undefined}
                className={`${field} w-full pl-3 pr-10`}
              />
              <button
                type="submit"
                aria-label="Chercher"
                className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-link"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
              </button>
            </div>
            {cardTooShort && (
              <p id="deck-card-search-hint" className="mt-1 text-xs text-warn">
                Écris au moins {MIN_CARD_QUERY} lettres du nom de la carte.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="deck-archetype" className={label}>
              Archétype
            </label>
            <select id="deck-archetype" name="a" defaultValue={query.archetype ?? ""} className={`${field} w-full`}>
              <option value="">Tous les archétypes</option>
              {archetypes.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name} ({a.count})
                </option>
              ))}
            </select>
          </div>

          {/* Commander : niveau de puissance annoncé par le vendeur (brackets officiels). */}
          {commander && (
            <div>
              <label htmlFor="deck-level" className={label}>
                Niveau de puissance
              </label>
              <select id="deck-level" name="niveau" defaultValue={query.level ?? ""} className={`${field} w-full`}>
                <option value="">Tous les niveaux</option>
                {([1, 2, 3, 4, 5] as BracketLevel[]).map((b) => (
                  <option key={b} value={b}>
                    {b} · {BRACKETS[b].name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div role="group" aria-labelledby="deck-price-label">
            <p id="deck-price-label" className={label}>
              Prix (€)
            </p>
            <div className="flex items-center gap-1.5">
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
                className={`${field} w-full tabular-nums lg:w-20`}
              />
              <span className="text-sm text-muted" aria-hidden>–</span>
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
                className={`${field} w-full tabular-nums lg:w-20`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="deck-sort" className={label}>
              Trier par
            </label>
            <select id="deck-sort" name="tri" defaultValue={query.sort} className={`${field} w-full`}>
              {sortsFor(query.format).map((s) => (
                <option key={s} value={s}>
                  {SORTS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ORDER.map((c) => {
            const selected = query.colors.includes(c);
            return (
              <Link
                key={c}
                href={toggleColor(c)}
                scroll={false}
                aria-pressed={selected}
                aria-label={MANA_COLORS[c]}
                title={MANA_COLORS[c]}
                className={`${chip} ${selected ? on : `${off} [&_img]:opacity-60 [&_img]:grayscale`}`}
              >
                <ManaSymbol color={c} size={18} />
                <span className="hidden xl:inline">{MANA_COLORS[c]}</span>
              </Link>
            );
          })}
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
          <label className={`${chip} cursor-pointer ${query.photos ? on : off}`}>
            <input type="checkbox" name="photos" value="1" defaultChecked={query.photos} className="size-4" />
            Avec photos
          </label>

          <p className="ml-auto flex items-center gap-3 pl-2 text-sm text-muted">
            <span className="tabular-nums">
              {decks}
              {query.card && !cardTooShort && (
                <>
                  {" "}
                  avec « <span className="font-medium text-foreground">{query.card}</span> »
                </>
              )}
            </span>
            {active && (
              <Link href={decksHref({ format: query.format, sort: query.sort })} scroll={false} className="font-medium text-link hover:underline">
                Effacer
              </Link>
            )}
          </p>
        </div>
      </Form>
    </FiltersPanel>
  );
}
