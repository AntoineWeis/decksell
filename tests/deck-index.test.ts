import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decksHref,
  filterListings,
  findCards,
  readDeckQuery,
  sortListings,
  EMPTY_QUERY,
  paginate,
} from "../src/lib/deck-index.ts";
import type { PublicListing } from "../src/lib/listings.ts";

function listing(id: string, extra: Partial<PublicListing> = {}): PublicListing {
  return {
    id,
    title: id,
    decklist: "4 Lightning Bolt\n4 Ragavan, Nimble Pilferer\n\n2 Blood Moon",
    card_count: 10,
    estimated_cents: 10000,
    estimate_complete: true,
    asking_cents: 10000,
    condition: "near_mint",
    description: null,
    status: "active",
    created_at: "2026-10-01T10:00:00Z",
    french_percent: 0,
    cover_card_name: null,
    cover_image_url: null,
    colors: ["R"],
    archetype: null,
    seller: null,
    ...extra,
  } as PublicListing;
}

test("readDeckQuery lit et nettoie l'adresse", () => {
  assert.deepEqual(readDeckQuery({ c: "ru", a: "burn", carte: "  Ragavan  ", tri: "prix-asc" }), {
    format: null,
    level: null,
    colors: ["U", "R"],
    archetype: "burn",
    card: "Ragavan",
    sort: "prix-asc",
    min: null,
    max: null,
    photos: false,
    page: 1,
  });
  assert.deepEqual(readDeckQuery({ a: "<script>", tri: "n'importe", min: "abc", page: "-2" }), EMPTY_QUERY);
  // Bornes de prix remises dans l'ordre, centimes ignorés.
  const q = readDeckQuery({ min: "500", max: "99,90", page: "3" });
  assert.deepEqual([q.min, q.max, q.page], [99, 500, 3]);
});

test("decksHref omet les valeurs par défaut", () => {
  assert.equal(decksHref(EMPTY_QUERY), "/decks");
  assert.equal(
    decksHref({ colors: ["W", "U"], archetype: null, card: "Ragavan", sort: "affaire" }),
    "/decks?c=WU&carte=Ragavan&tri=affaire",
  );
  assert.equal(decksHref({ ...EMPTY_QUERY, min: 100, max: 400, page: 2 }), "/decks?min=100&max=400&page=2");
});

test("catalogues par format : adresse, niveau et tris propres à chaque format", () => {
  assert.equal(decksHref({ ...EMPTY_QUERY, format: "modern", sort: "meta" }), "/modern?tri=meta");
  assert.equal(decksHref({ ...EMPTY_QUERY, format: "commander", level: 3 }), "/commander?niveau=3");
  // Le niveau n'existe qu'en Commander ; le tri par méta qu'en Modern.
  assert.equal(readDeckQuery({ niveau: "3" }, "modern").level, null);
  assert.equal(readDeckQuery({ niveau: "3" }, "commander").level, 3);
  assert.equal(readDeckQuery({ niveau: "9" }, "commander").level, null);
  assert.equal(readDeckQuery({ tri: "meta" }, "commander").sort, "recent");
  assert.equal(readDeckQuery({ tri: "puissance" }, "commander").sort, "puissance");
  assert.equal(readDeckQuery({ tri: "meta" }, "modern").sort, "meta");
});

test("filtre par format et par niveau, tri par puissance", () => {
  const deck = (id: string, format: "modern" | "commander", bracket: number | null) =>
    ({ ...listing(id), format, bracket }) as PublicListing;
  const all = [deck("m", "modern", null), deck("c2", "commander", 2), deck("c4", "commander", 4)];
  assert.deepEqual(filterListings(all, { ...EMPTY_QUERY, format: "commander" }).map((x) => x.listing.id), ["c2", "c4"]);
  assert.deepEqual(filterListings(all, { ...EMPTY_QUERY, format: "commander", level: 4 }).map((x) => x.listing.id), ["c4"]);
  assert.deepEqual(filterListings(all, { ...EMPTY_QUERY, format: "modern" }).map((x) => x.listing.id), ["m"]);
  const byPower = sortListings(filterListings(all, EMPTY_QUERY), "puissance").map((x) => x.listing.id);
  assert.deepEqual(byPower.slice(0, 2), ["c4", "c2"]);
});

test("findCards ignore la casse, les accents et additionne principal et réserve", () => {
  const list = "4 Ragavan, Nimble Pilferer\n2 Lim-Dûl's Vault\n\nSideboard\n1 Ragavan, Nimble Pilferer";
  assert.deepEqual(findCards(list, "ragavan"), [{ name: "Ragavan, Nimble Pilferer", quantity: 5 }]);
  assert.deepEqual(findCards(list, "lim-dul’s"), [{ name: "Lim-Dûl's Vault", quantity: 2 }]);
  assert.deepEqual(findCards(list, "ra"), [], "moins de 3 caractères : pas de recherche");
});

test("filterListings combine couleurs, archétype et carte", () => {
  const a = listing("a");
  const b = listing("b", { decklist: "4 Thoughtseize", colors: ["B"] });
  assert.deepEqual(filterListings([a, b], { ...EMPTY_QUERY, card: "ragavan" }).map((x) => x.listing.id), ["a"]);
  assert.deepEqual(filterListings([a, b], { ...EMPTY_QUERY, colors: ["B"] }).map((x) => x.listing.id), ["b"]);
  assert.equal(filterListings([a], { ...EMPTY_QUERY, card: "ragavan" })[0].hits[0].quantity, 4);
});

test("sortListings trie par prix et par meilleure affaire", () => {
  const items = [
    listing("cher", { asking_cents: 30000, estimated_cents: 30000, created_at: "2026-10-03T00:00:00Z" }),
    listing("affaire", { asking_cents: 8000, estimated_cents: 10000, created_at: "2026-10-01T00:00:00Z" }),
    listing("sans-estimation", { asking_cents: 5000, estimated_cents: 0, created_at: "2026-10-02T00:00:00Z" }),
  ].map((l) => ({ listing: l, hits: [] }));
  const ids = (sort: Parameters<typeof sortListings>[1]) => sortListings(items, sort).map((x) => x.listing.id);
  assert.deepEqual(ids("recent"), ["cher", "sans-estimation", "affaire"]);
  assert.deepEqual(ids("prix-asc"), ["sans-estimation", "affaire", "cher"]);
  assert.deepEqual(ids("prix-desc"), ["cher", "affaire", "sans-estimation"]);
  assert.deepEqual(ids("affaire"), ["affaire", "cher", "sans-estimation"]);
});

test("filterListings applique la fourchette de prix, bornes comprises", () => {
  const cheap = listing("cheap", { asking_cents: 10000 });
  const mid = listing("mid", { asking_cents: 30000 });
  const dear = listing("dear", { asking_cents: 90000 });
  const ids = (min: number | null, max: number | null) =>
    filterListings([cheap, mid, dear], { ...EMPTY_QUERY, min, max }).map((x) => x.listing.id);
  assert.deepEqual(ids(100, 300), ["cheap", "mid"]);
  assert.deepEqual(ids(null, 99), []);
  assert.deepEqual(ids(500, null), ["dear"]);
});

test("paginate découpe par 24 et ramène une page trop loin à la dernière", () => {
  const items = Array.from({ length: 50 }, (_, i) => i);
  assert.deepEqual(paginate(items, 1).items.length, 24);
  assert.deepEqual(paginate(items, 3), { items: [48, 49], page: 3, pages: 3 });
  assert.equal(paginate(items, 9).page, 3);
  assert.deepEqual(paginate([], 1), { items: [], page: 1, pages: 1 });
});

test("findCards trouve aussi les traductions d'une recherche en français", () => {
  const list = "4 Lightning Bolt\n1 Fable of the Mirror-Breaker // Reflection of Kiki-Jiki";
  assert.deepEqual(findCards(list, "foudre", ["Lightning Bolt"]), [{ name: "Lightning Bolt", quantity: 4 }]);
  assert.deepEqual(findCards(list, "fable du", ["Fable of the Mirror-Breaker"]).map((h) => h.name), [
    "Fable of the Mirror-Breaker // Reflection of Kiki-Jiki",
  ]);
  assert.deepEqual(findCards(list, "foudre"), [], "sans traduction : rien");
});

test("filtre « avec photos » et tri par proximité méta", () => {
  const avec = listing("avec", { photos: ["p.webp"], meta_score: 60 });
  const sans = listing("sans", { meta_score: 95 });
  const inconnu = listing("inconnu", { meta_score: null });
  const q = { ...EMPTY_QUERY, photos: true };
  assert.deepEqual(filterListings([avec, sans], q).map((x) => x.listing.id), ["avec"]);
  assert.equal(decksHref(q), "/decks?photos=1");
  assert.equal(readDeckQuery({ photos: "1" }).photos, true);
  const sorted = sortListings(filterListings([inconnu, avec, sans], EMPTY_QUERY), "meta").map((x) => x.listing.id);
  assert.deepEqual(sorted, ["sans", "avec", "inconnu"]);
});
