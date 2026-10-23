import { test } from "node:test";
import assert from "node:assert/strict";
import { archidektToText, parseDeckUrl } from "../src/lib/deck-import.ts";

test("parseDeckUrl reconnaît Archidekt et Moxfield", () => {
  assert.deepEqual(parseDeckUrl("https://archidekt.com/decks/123456/my-burn"), { site: "archidekt", id: "123456" });
  assert.deepEqual(parseDeckUrl(" https://www.archidekt.com/decks/42 "), { site: "archidekt", id: "42" });
  assert.deepEqual(parseDeckUrl("https://moxfield.com/decks/abcDEF"), { site: "moxfield" });
  assert.deepEqual(parseDeckUrl("https://archidekt.com/search"), { site: "unknown" });
  assert.deepEqual(parseDeckUrl("pas un lien"), { site: "unknown" });
});

test("archidektToText garde principal et réserve, ignore le maybeboard", () => {
  const text = archidektToText({
    categories: [
      { name: "Creature", includedInDeck: true },
      { name: "Sideboard", includedInDeck: true },
      { name: "Maybeboard", includedInDeck: false },
    ],
    cards: [
      { quantity: 4, categories: ["Creature"], card: { oracleCard: { name: "Ragavan, Nimble Pilferer" } } },
      { quantity: 2, categories: ["Sideboard"], card: { oracleCard: { name: "Blood Moon" } } },
      { quantity: 1, categories: ["Maybeboard"], card: { oracleCard: { name: "Emrakul, the Promised End" } } },
      { quantity: 18, categories: [], card: { oracleCard: { name: "Mountain" } } },
    ],
  });
  assert.equal(text, "4 Ragavan, Nimble Pilferer\n18 Mountain\n\nSideboard\n2 Blood Moon");
});
