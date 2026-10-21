// État et langue de chaque carte d'une annonce, saisis par le vendeur.
// Une entrée par ligne de la decklist : tous les exemplaires d'une même ligne partagent
// le même état et la même langue. Fonctions pures, testées dans tests/card-details.test.ts.
import { normalizeName, type ParsedDeck } from "./decklist.ts";
import { CONDITIONS, type Condition } from "./listings.ts";

/** Langues proposées (codes Cardmarket courants), avec leur abréviation affichée. */
export const LANGUAGES = {
  en: { label: "Anglais", short: "EN" },
  fr: { label: "Français", short: "FR" },
  de: { label: "Allemand", short: "DE" },
  it: { label: "Italien", short: "IT" },
  es: { label: "Espagnol", short: "ES" },
  pt: { label: "Portugais", short: "PT" },
  ja: { label: "Japonais", short: "JA" },
  other: { label: "Autre", short: "AUT" },
} as const;
export type Language = keyof typeof LANGUAGES;

/** Abréviations d'état, façon Cardmarket. */
export const CONDITION_SHORT: Record<Condition, string> = {
  near_mint: "NM",
  excellent: "EX",
  good: "GD",
  played: "PL",
};

/** Couleur du tag d'état (classes Tailwind complètes, pour qu'elles soient générées). */
export const CONDITION_TONE: Record<Condition, string> = {
  near_mint: "bg-cond-nm-soft text-cond-nm ring-cond-nm/30",
  excellent: "bg-cond-ex-soft text-cond-ex ring-cond-ex/30",
  good: "bg-cond-gd-soft text-cond-gd ring-cond-gd/30",
  played: "bg-cond-pl-soft text-cond-pl ring-cond-pl/30",
};

export type Board = "main" | "side";

/** Une ligne de carte de l'annonce. */
export type CardDetail = { board: Board; name: string; quantity: number; condition: Condition; lang: Language };

/** Clé d'une ligne : réserve et principal sont distincts. */
export function detailKey(board: Board, name: string): string {
  return `${board}|${normalizeName(name)}`;
}

/** Index des détails par ligne, pour l'affichage. */
export function detailsByKey(details: CardDetail[] | null | undefined): Map<string, CardDetail> {
  return new Map((details ?? []).map((d) => [detailKey(d.board, d.name), d]));
}

/**
 * Construit les détails d'une annonce à partir de la liste (source de vérité pour les
 * noms et les quantités) et de ce qu'a envoyé le navigateur. Une ligne absente ou
 * invalide prend l'état et la langue par défaut.
 */
export function buildDetails(
  deck: ParsedDeck,
  raw: unknown,
  fallback: { condition: Condition; lang: Language },
): CardDetail[] {
  const sent = new Map<string, { condition?: unknown; lang?: unknown }>();
  if (Array.isArray(raw)) {
    for (const r of raw.slice(0, 400)) {
      if (!r || typeof r !== "object") continue;
      const { board, name, condition, lang } = r as Record<string, unknown>;
      if ((board !== "main" && board !== "side") || typeof name !== "string") continue;
      sent.set(detailKey(board, name), { condition, lang });
    }
  }
  const lines: { board: Board; entries: ParsedDeck["main"] }[] = [
    { board: "main", entries: deck.main },
    { board: "side", entries: deck.side },
  ];
  return lines.flatMap(({ board, entries }) =>
    entries.map((e) => {
      const s = sent.get(detailKey(board, e.name));
      const condition = typeof s?.condition === "string" && s.condition in CONDITIONS ? (s.condition as Condition) : fallback.condition;
      const lang = typeof s?.lang === "string" && s.lang in LANGUAGES ? (s.lang as Language) : fallback.lang;
      return { board, name: e.name, quantity: e.quantity, condition, lang };
    }),
  );
}

/** Nombre d'exemplaires par valeur, trié du plus fréquent au moins fréquent. */
function tally<K extends string>(details: CardDetail[], pick: (d: CardDetail) => K): { key: K; count: number }[] {
  const counts = new Map<K, number>();
  for (const d of details) counts.set(pick(d), (counts.get(pick(d)) ?? 0) + d.quantity);
  return [...counts].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

/** Répartition des langues, en exemplaires. */
export function languageMix(details: CardDetail[]): { lang: Language; count: number }[] {
  return tally(details, (d) => d.lang).map(({ key, count }) => ({ lang: key, count }));
}

/** Part des cartes en français, arrondie (null sans détail). */
export function frenchPercentOf(details: CardDetail[]): number | null {
  const total = details.reduce((n, d) => n + d.quantity, 0);
  if (total === 0) return null;
  const fr = details.filter((d) => d.lang === "fr").reduce((n, d) => n + d.quantity, 0);
  return Math.round((fr / total) * 100);
}

/** État le plus fréquent (sert d'état général de l'annonce). */
export function dominantCondition(details: CardDetail[], fallback: Condition): Condition {
  return tally(details, (d) => d.condition)[0]?.key ?? fallback;
}

/** Vrai si toutes les cartes n'ont pas le même état. */
export function hasMixedConditions(details: CardDetail[]): boolean {
  return new Set(details.map((d) => d.condition)).size > 1;
}
