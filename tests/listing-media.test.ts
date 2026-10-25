import { test } from "node:test";
import assert from "node:assert/strict";
import { mediaOf } from "../src/lib/listing-media.ts";

test("mediaOf garde les photos valides et ignore un primer vide", () => {
  assert.deepEqual(mediaOf({ photos: ["a.webp", 3, null, "b.webp"], primer: "  " }), { photos: ["a.webp", "b.webp"], primer: null });
  assert.deepEqual(mediaOf({ photos: null, primer: "Plan de jeu" }), { photos: [], primer: "Plan de jeu" });
  assert.deepEqual(mediaOf(null), { photos: [], primer: null });
});

test("completeness : pourcentage et tâches dans l'ordre d'importance", async () => {
  const { completeness } = await import("../src/lib/listing-media.ts");
  assert.deepEqual(completeness({ colors: ["R"], archetype: { id: 1 } }), {
    percent: 40,
    todo: ["ajoute des photos des cartes", "précise l'état et la langue carte par carte", "écris un primer (comment jouer le deck)"],
  });
  assert.deepEqual(completeness({ photos: ["a"], primer: "Plan", card_details: [{}], archetype: {}, colors: ["U"] }), { percent: 100, todo: [] });
});
