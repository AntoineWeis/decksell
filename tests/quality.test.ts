import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDecklist } from "../src/lib/decklist.ts";
import { buildEstimate, type CardPrice } from "../src/lib/pricing.ts";
import { checkDeckQuality, priceGap } from "../src/lib/quality.ts";

function card(name: string, legalModern: boolean | null = true): CardPrice {
  return {
    oracleId: `oracle-${name}`,
    name,
    printId: `print-${name}`,
    setCode: "tst",
    collectorNumber: "1",
    imageUrl: null,
    artist: null,
    rarity: "common",
    priceEur: 1,
    minPriceEurFoil: null,
    legalModern,
  };
}

const prices = [card("Lightning Bolt"), card("Mountain"), card("Ponder", false), card("Island")];
const quality = (text: string) => checkDeckQuality(buildEstimate(parseDecklist(text), prices));

test("un deck Modern de 60 cartes passe", () => {
  const r = quality("4 Lightning Bolt\n56 Mountain\n\nSideboard\n15 Island");
  assert.deepEqual(r.blocking, []);
});

test("bloque sous 60 cartes et au-delà de 15 en réserve", () => {
  const r = quality("4 Lightning Bolt\n50 Mountain\n\nSideboard\n16 Island");
  assert.equal(r.blocking.length, 2);
  assert.match(r.blocking[0], /54 cartes/);
  assert.match(r.blocking[1], /16 cartes/);
});

test("bloque une carte non légale en Modern", () => {
  const r = quality("4 Ponder\n56 Mountain");
  assert.equal(r.blocking.length, 1);
  assert.match(r.blocking[0], /Ponder/);
});

test("légalité inconnue (base pas à jour) ou carte inconnue : pas de blocage, une remarque", () => {
  const unknownLegality = checkDeckQuality(
    buildEstimate(parseDecklist("60 Mountain"), [{ ...card("Mountain"), legalModern: null }]),
  );
  assert.deepEqual(unknownLegality.blocking, []);
  const r = quality("56 Mountain\n4 Lightnin Bolt");
  assert.deepEqual(r.blocking, []);
  assert.match(r.warnings[0], /Lightnin Bolt/);
});

test("alerte quand le prix s'écarte fortement de l'estimation", () => {
  assert.equal(priceGap(10_000, 10_000).level, "ok");
  assert.equal(priceGap(14_000, 10_000).level, "ok");
  assert.equal(priceGap(15_000, 10_000).level, "high");
  assert.equal(priceGap(6_000, 10_000).level, "low");
  assert.equal(priceGap(null, 10_000).level, "ok");
  assert.equal(priceGap(5_000, 0).level, "ok");
});
