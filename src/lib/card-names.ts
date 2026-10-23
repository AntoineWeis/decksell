import "server-only";
import { cacheLife } from "next/cache";

// Noms de cartes en français, via l'API Scryfall : la base ne garde que les noms anglais
// (le fichier français complet pèserait ~2 Go à importer chaque jour).
// Scryfall demande un User-Agent et un en-tête Accept, et au plus 10 requêtes par seconde :
// chaque recherche est mise en cache plusieurs jours, et une panne renvoie simplement [].

const HEADERS = { "User-Agent": "decksell/1.0 (https://decksell.fr)", Accept: "application/json" };
const TIMEOUT_MS = 3000;

export type CardSuggestion = {
  /** Nom anglais : c'est lui qu'on cherche dans les listes. */
  name: string;
  /** Nom français imprimé, s'il diffère. */
  french: string | null;
};

type ScryfallCard = { name: string; printed_name?: string; card_faces?: { printed_name?: string }[] };

async function scryfall<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`https://api.scryfall.com${path}`, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
    // 404 : aucune carte ne correspond (pas une erreur).
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.error("Scryfall indisponible :", (e as Error).message);
    return null;
  }
}

const frenchName = (c: ScryfallCard) => c.printed_name ?? c.card_faces?.[0]?.printed_name ?? null;

/** Cartes dont le nom français contient ces mots (« foudre » → Lightning Bolt…). Au plus 20. */
export async function searchFrenchNames(query: string): Promise<CardSuggestion[]> {
  "use cache";
  cacheLife("days");
  const q = query.trim();
  if (q.length < 3) return [];
  const data = await scryfall<{ data?: ScryfallCard[] }>(
    `/cards/search?unique=cards&order=name&q=${encodeURIComponent(`${q} lang:fr`)}`,
  );
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const nq = norm(q);
  // Nom exact d'abord (« Foudre »), puis ceux qui commencent par la saisie, puis les autres.
  const rank = (fr: string | null) => (!fr ? 3 : norm(fr) === nq ? 0 : norm(fr).startsWith(nq) ? 1 : 2);
  return (data?.data ?? [])
    .map((c) => {
      const fr = frenchName(c);
      return { name: c.name, french: fr && fr !== c.name ? fr : null };
    })
    .sort((a, b) => rank(a.french) - rank(b.french))
    .slice(0, 20);
}

/** Noms anglais qui commencent comme la saisie (autocomplétion Scryfall). Au plus 20. */
export async function autocompleteEnglish(query: string): Promise<string[]> {
  "use cache";
  cacheLife("days");
  const q = query.trim();
  if (q.length < 3) return [];
  const data = await scryfall<{ data?: string[] }>(`/cards/autocomplete?q=${encodeURIComponent(q)}`);
  return (data?.data ?? []).slice(0, 20);
}

/** Suggestions pour la recherche : noms anglais d'abord, puis noms français traduits. */
export async function suggestCards(query: string): Promise<CardSuggestion[]> {
  const [english, french] = await Promise.all([autocompleteEnglish(query), searchFrenchNames(query)]);
  const seen = new Set<string>();
  const out: CardSuggestion[] = [];
  for (const s of [...english.map((name) => ({ name, french: null })), ...french]) {
    if (seen.has(s.name)) continue;
    seen.add(s.name);
    out.push(s);
  }
  return out.slice(0, 12);
}
