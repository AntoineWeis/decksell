import { test } from "node:test";
import assert from "node:assert/strict";
import { isLand, manaCurve } from "../src/lib/deck-stats.ts";
import type { Estimate, PricedLine } from "../src/lib/pricing.ts";

function line(name: string, quantity: number, cmc: number | null, typeLine: string | null, board: "main" | "side" = "main"): PricedLine {
  return {
    board,
    name,
    quantity,
    status: "priced",
    card: {
      oracleId: name, name, printId: name, setCode: "x", collectorNumber: "1", imageUrl: null, artist: null,
      rarity: null, priceEur: 1, minPriceEurFoil: null, cmc, typeLine,
    },
    unitCents: 100,
    lineCents: 100 * quantity,
  };
}
const est = (lines: PricedLine[]) => ({ lines } as Estimate);

test("isLand regarde la face avant", () => {
  assert.equal(isLand("Land"), true);
  assert.equal(isLand("Artifact Land"), true);
  assert.equal(isLand("Instant // Land"), false);
  assert.equal(isLand("Land Creature — Forest Dryad"), true);
  assert.equal(isLand("Creature — Elemental"), false);
});

test("manaCurve compte le principal, hors terrains, avec 7+ et la moyenne", () => {
  const curve = manaCurve(
    est([
      line("Bolt", 4, 1, "Instant"),
      line("Titan", 2, 6, "Creature"),
      line("Emrakul", 1, 13, "Creature"),
      line("Mountain", 20, 0, "Basic Land — Mountain"),
      line("Blood Moon", 3, 3, "Enchantment", "side"),
      line("Inconnue", 2, null, null),
    ]),
  )!;
  assert.deepEqual(curve.counts, [0, 4, 0, 0, 0, 0, 2, 1]);
  assert.equal(curve.spells, 7);
  assert.equal(curve.lands, 20);
  assert.equal(curve.unknown, 2);
  assert.equal(curve.average, (4 * 1 + 2 * 6 + 13) / 7);
});

test("manaCurve renvoie null sans donnée", () => {
  assert.equal(manaCurve(est([line("X", 4, null, null)])), null);
});
