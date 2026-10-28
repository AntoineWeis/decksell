import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDecklist } from "../src/lib/decklist.ts";
import { buildEstimate, printRequests, type CardPrice } from "../src/lib/pricing.ts";

const base = (extra: Partial<CardPrice>): CardPrice => ({
  oracleId: "bolt",
  name: "Lightning Bolt",
  printId: "cheap",
  setCode: "m10",
  collectorNumber: "146",
  imageUrl: "img/cheap",
  artist: null,
  rarity: "common",
  priceEur: 0.5,
  minPriceEurFoil: 3,
  ...extra,
});

// La moins chère (par nom), puis deux impressions précises de MH3 et une de 2X2.
const PRICES: CardPrice[] = [
  base({}),
  base({ printId: "mh3-123", setCode: "mh3", collectorNumber: "123", priceEur: 2, priceEurFoil: 9, exactPrint: true, imageUrl: "img/mh3" }),
  base({ printId: "mh3-300", setCode: "mh3", collectorNumber: "300", priceEur: 6, priceEurFoil: 20, exactPrint: true }),
  base({ printId: "2x2", setCode: "2x2", collectorNumber: "117", priceEur: 1, priceEurFoil: null, exactPrint: true }),
];
const line = (text: string) => buildEstimate(parseDecklist(text), PRICES).lines[0];

test("sans édition : l'impression la moins chère, comme avant", () => {
  const l = line("4 Lightning Bolt");
  assert.equal(l.unitCents, 50);
  assert.equal(l.printMatch, "cheapest");
  assert.equal(l.card?.printId, "cheap");
});

test("édition et numéro : le prix de cette impression", () => {
  const l = line("4 Lightning Bolt (MH3) 300");
  assert.equal(l.unitCents, 600);
  assert.equal(l.lineCents, 2400);
  assert.equal(l.printMatch, "exact");
  assert.equal(l.card?.printId, "mh3-300");
});

test("foil : le prix foil de l'impression, ou le foil le moins cher sans édition", () => {
  assert.equal(line("1 Lightning Bolt (MH3) 123 *F*").unitCents, 900);
  assert.equal(line("1 Lightning Bolt *F*").unitCents, 300);
});

test("édition sans numéro : la moins chère de cette édition", () => {
  const l = line("1 Lightning Bolt [MH3]");
  assert.equal(l.unitCents, 200);
  assert.equal(l.card?.printId, "mh3-123");
});

test("impression introuvable ou sans prix dans cette finition : repli sur la moins chère, signalé", () => {
  const unknown = line("1 Lightning Bolt (ZZZ) 1");
  assert.equal(unknown.printMatch, "fallback");
  assert.equal(unknown.unitCents, 50);
  const noFoil = line("1 Lightning Bolt (2X2) 117 *F*");
  assert.equal(noFoil.printMatch, "fallback");
  assert.equal(noFoil.unitCents, 300);
});

test("les impressions précises ne remplacent jamais la moins chère d'une ligne sans édition", () => {
  const e = buildEstimate(parseDecklist("1 Lightning Bolt (MH3) 300\n1 Lightning Bolt"), PRICES);
  assert.deepEqual(e.lines.map((l) => l.unitCents), [600, 50]);
  assert.equal(e.totalCents, 650);
});

test("impressions à chercher : première face et édition", () => {
  assert.deepEqual(printRequests(parseDecklist("1 Lightning Bolt (MH3) 123\n1 Opt\n1 Fable of the Mirror-Breaker // Reflection of Kiki-Jiki (NEO) 141")), [
    "lightning bolt|mh3",
    "fable of the mirror-breaker|neo",
  ]);
});

test("import Archidekt : édition, numéro et foil gardés dans la liste", async () => {
  const { archidektToText } = await import("../src/lib/deck-import.ts");
  const text = archidektToText({
    cards: [
      { quantity: 4, modifier: "Foil", card: { oracleCard: { name: "Lightning Bolt" }, edition: { editioncode: "mh3" }, collectorNumber: "300" } },
      { quantity: 1, modifier: "Normal", card: { oracleCard: { name: "Opt" } } },
    ],
  });
  assert.equal(text, "4 Lightning Bolt (MH3) 300 *F*\n1 Opt");
  const d = parseDecklist(text);
  assert.deepEqual(d.main[0], { name: "Lightning Bolt", quantity: 4, set: "mh3", number: "300", foil: true });
});
