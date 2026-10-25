import { test } from "node:test";
import assert from "node:assert/strict";
import { mediaOf } from "../src/lib/listing-media.ts";

test("mediaOf garde les photos valides et ignore un primer vide", () => {
  assert.deepEqual(mediaOf({ photos: ["a.webp", 3, null, "b.webp"], primer: "  " }), { photos: ["a.webp", "b.webp"], primer: null });
  assert.deepEqual(mediaOf({ photos: null, primer: "Plan de jeu" }), { photos: [], primer: "Plan de jeu" });
  assert.deepEqual(mediaOf(null), { photos: [], primer: null });
});
