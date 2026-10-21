import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDecklist } from "../src/lib/decklist.ts";
import {
  buildDetails,
  detailsByKey,
  detailKey,
  dominantCondition,
  frenchPercentOf,
  hasMixedConditions,
  languageMix,
} from "../src/lib/card-details.ts";

const deck = parseDecklist("4 Lightning Bolt\n2 Ragavan, Nimble Pilferer\n\nSideboard\n2 Blood Moon");
const fallback = { condition: "near_mint" as const, lang: "en" as const };

test("buildDetails suit la liste et applique les choix valides", () => {
  const details = buildDetails(
    deck,
    [
      { board: "main", name: "lightning bolt", condition: "played", lang: "fr" },
      { board: "side", name: "Blood Moon", condition: "n'importe quoi", lang: "ja" },
      { board: "main", name: "Carte absente", condition: "good", lang: "de" },
    ],
    fallback,
  );
  assert.deepEqual(details, [
    { board: "main", name: "Lightning Bolt", quantity: 4, condition: "played", lang: "fr" },
    { board: "main", name: "Ragavan, Nimble Pilferer", quantity: 2, condition: "near_mint", lang: "en" },
    { board: "side", name: "Blood Moon", quantity: 2, condition: "near_mint", lang: "ja" },
  ]);
});

test("buildDetails ignore une saisie illisible", () => {
  assert.equal(buildDetails(deck, "pas un tableau", fallback).length, 3);
});

test("résumés : langues, part de français, état dominant", () => {
  const details = buildDetails(
    deck,
    [
      { board: "main", name: "Lightning Bolt", condition: "excellent", lang: "fr" },
      { board: "side", name: "Blood Moon", condition: "excellent", lang: "ja" },
    ],
    fallback,
  );
  assert.deepEqual(languageMix(details), [
    { lang: "fr", count: 4 },
    { lang: "en", count: 2 },
    { lang: "ja", count: 2 },
  ]);
  assert.equal(frenchPercentOf(details), 50);
  assert.equal(dominantCondition(details, "good"), "excellent");
  assert.equal(hasMixedConditions(details), true);
  assert.equal(frenchPercentOf([]), null);
});

test("detailsByKey retrouve une ligne malgré la casse et les accents", () => {
  const map = detailsByKey(buildDetails(deck, [], fallback));
  assert.equal(map.get(detailKey("main", "LIGHTNING BOLT"))?.quantity, 4);
  assert.equal(map.get(detailKey("side", "Lightning Bolt")), undefined);
});

test("readFlash lit un cookie encodé une ou deux fois", async () => {
  const { readFlash } = await import("../src/lib/flash-shared.ts");
  const value = JSON.stringify({ kind: "success", message: "Annonce « Test » publiée" });
  const once = encodeURIComponent(value);
  assert.deepEqual(readFlash(`a=1; decksell_flash=${once}`), { kind: "success", message: "Annonce « Test » publiée" });
  assert.deepEqual(readFlash(`decksell_flash=${encodeURIComponent(once)}`)?.message, "Annonce « Test » publiée");
  const percent = encodeURIComponent(JSON.stringify({ kind: "success", message: "Annonce « 100 % FR » publiée" }));
  assert.equal(readFlash(`decksell_flash=${encodeURIComponent(percent)}`)?.message, "Annonce « 100 % FR » publiée");
  assert.equal(readFlash("decksell_flash=%7Bpas-du-json"), null);
  assert.equal(readFlash("autre=1"), null);
});
