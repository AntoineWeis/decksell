import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDecklist } from "../src/lib/decklist.ts";
import { buildEstimate, lookupNames, formatEur, type CardPrice } from "../src/lib/pricing.ts";

function card(name: string, priceEur: number | null, extra: Partial<CardPrice> = {}): CardPrice {
  return {
    oracleId: `oracle-${name}`,
    name,
    printId: `print-${name}`,
    setCode: "mh3",
    collectorNumber: "1",
    imageUrl: null,
    artist: null,
    priceEur,
    minPriceEurFoil: null,
    ...extra,
  };
}

const PRICES = [
  card("Lightning Bolt", 0.95),
  card("Ragavan, Nimble Pilferer", 49.9),
  card("Fable of the Mirror-Breaker // Reflection of Kiki-Jiki", 12.3),
  card("Lim-Dûl's Vault", 2.5),
  card("Foil Only Promo", null, { minPriceEurFoil: 8 }),
];

test("total = somme des quantités × prix, principal et réserve séparés", () => {
  const deck = parseDecklist("4 Lightning Bolt\n2 Ragavan, Nimble Pilferer\n\n3 Lightning Bolt\n");
  const est = buildEstimate(deck, PRICES);
  assert.equal(est.mainCents, 4 * 95 + 2 * 4990);
  assert.equal(est.sideCents, 3 * 95);
  assert.equal(est.totalCents, est.mainCents + est.sideCents);
  assert.equal(est.complete, true);
  assert.deepEqual(est.unpriced, []);
});

test("pas d'erreur d'arrondi en flottants", () => {
  const deck = parseDecklist("3 Lightning Bolt\n");
  const est = buildEstimate(deck, [card("Lightning Bolt", 0.1 + 0.2)]);
  assert.equal(est.totalCents, 90);
});

test("carte sans prix : non comptée, estimation incomplète, prix foil indiqué", () => {
  const deck = parseDecklist("4 Lightning Bolt\n1 Foil Only Promo\n");
  const est = buildEstimate(deck, PRICES);
  assert.equal(est.totalCents, 380);
  assert.equal(est.complete, false);
  assert.equal(est.unpriced.length, 1);
  assert.equal(est.unpriced[0].status, "no_price");
  assert.equal(est.unpriced[0].card?.minPriceEurFoil, 8);
  assert.equal(est.unpricedCardCount, 1);
});

test("carte introuvable : signalée, sans bloquer le reste", () => {
  const deck = parseDecklist("4 Lightning Bolt\n2 Carte Inventee\n");
  const est = buildEstimate(deck, PRICES);
  assert.equal(est.totalCents, 380);
  assert.equal(est.complete, false);
  assert.equal(est.unpriced[0].status, "not_found");
  assert.equal(est.unpricedCardCount, 2);
});

test("prix saisi par le vendeur : complète l'estimation", () => {
  const deck = parseDecklist("4 Lightning Bolt\n1 Foil Only Promo\n2 Carte Inventee\n");
  const est = buildEstimate(deck, PRICES, { "foil only promo": 700, "carte inventee": 150 });
  assert.equal(est.totalCents, 380 + 700 + 2 * 150);
  assert.equal(est.complete, true);
  assert.equal(est.lines[1].status, "manual");
});

test("cartes à deux faces : trouvées par la première face ou le nom complet", () => {
  for (const text of [
    "1 Fable of the Mirror-Breaker",
    "1 Fable of the Mirror-Breaker // Reflection of Kiki-Jiki",
    "1 Fable of the Mirror-Breaker / Reflection of Kiki-Jiki",
  ]) {
    const est = buildEstimate(parseDecklist(text), PRICES);
    assert.equal(est.totalCents, 1230, text);
  }
});

test("casse, accents et apostrophes typographiques ignorés", () => {
  const est = buildEstimate(parseDecklist("1 lightning bolt\n1 Lim-Dul’s Vault\n"), PRICES);
  assert.equal(est.totalCents, 95 + 250);
  assert.equal(est.complete, true);
});

test("noms envoyés à la base : première face, avec et sans accents", () => {
  const deck = parseDecklist("1 Lim-Dûl’s Vault\n1 Fable of the Mirror-Breaker // Reflection of Kiki-Jiki\n");
  assert.deepEqual(lookupNames(deck).sort(), [
    "fable of the mirror-breaker",
    "lim-dul's vault",
    "lim-dûl's vault",
  ]);
});

test("homonymes de première face : le nom complet exact l'emporte", () => {
  const prices = [card("Fire // Ice", 1), card("Fire", 5)];
  assert.equal(buildEstimate(parseDecklist("1 Fire // Ice\n"), prices).totalCents, 100);
  assert.equal(buildEstimate(parseDecklist("1 Fire\n"), prices).totalCents, 500);
});

test("format des montants en euros", () => {
  assert.equal(formatEur(123456).replace(/\s/g, " "), "1 234,56 €");
});

test("saisie de prix en euros", async () => {
  const { parseEur } = await import("../src/lib/pricing.ts");
  assert.equal(parseEur("3,50"), 350);
  assert.equal(parseEur("3.5"), 350);
  assert.equal(parseEur(" 12 € "), 1200);
  assert.equal(parseEur("0"), 0);
  assert.equal(parseEur(""), null);
  assert.equal(parseEur("-2"), null);
  assert.equal(parseEur("abc"), null);
  assert.equal(parseEur("1,234"), null);
});
