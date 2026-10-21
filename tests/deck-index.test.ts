import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decksHref,
  filterListings,
  findCards,
  readDeckQuery,
  sortListings,
  EMPTY_QUERY,
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
    colors: ["U", "R"],
    archetype: "burn",
    card: "Ragavan",
    sort: "prix-asc",
  });
  assert.deepEqual(readDeckQuery({ a: "<script>", tri: "n'importe" }), EMPTY_QUERY);
});

test("decksHref omet les valeurs par défaut", () => {
  assert.equal(decksHref(EMPTY_QUERY), "/decks");
  assert.equal(
    decksHref({ colors: ["W", "U"], archetype: null, card: "Ragavan", sort: "affaire" }),
    "/decks?c=WU&carte=Ragavan&tri=affaire",
  );
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
