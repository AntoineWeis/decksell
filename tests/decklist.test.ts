import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDecklist, normalizeName, lookupKeys } from "../src/lib/decklist.ts";

const ELDRAZI = `Mainboard
4 Ancient Stirrings
4 Basking Broodscale
2 Blade of the Bloodchief
2 Boseiju, Who Endures
3 Devourer of Destiny
3 Dismember
4 Eldrazi Temple
4 Emrakul, the Promised End
6 Forest
1 Gemstone Caverns
1 Haywire Mite
4 Kozilek's Command
4 Malevolent Rumble
1 Shifting Woodland
1 Sire of Seven Deaths
1 Soul-Guide Lantern
4 Sowing Mycospawn
1 Springleaf Drum
1 Talisman of Resilience
4 Ugin's Labyrinth
4 Urza's Saga
1 Vexing Bauble

Sideboard
1 Cavern of Souls
2 Disruptor Flute
2 Grafdigger's Cage
2 Nature's Claim
1 Sire of Seven Deaths
1 Thief of Existence
2 Thought-Knot Seer
2 Trinisphere
1 Vexing Bauble
1 Warping Wail
`;

test("liste réelle : 60 cartes en principal, 15 en réserve, aucune erreur", () => {
  const d = parseDecklist(ELDRAZI);
  assert.equal(d.mainCount, 60);
  assert.equal(d.sideCount, 15);
  assert.equal(d.main.length, 22);
  assert.equal(d.side.length, 10);
  assert.deepEqual(d.errors, []);
  assert.deepEqual(d.warnings, []);
});

test("les virgules, apostrophes et tirets dans les noms sont conservés", () => {
  const d = parseDecklist(ELDRAZI);
  const names = d.main.map((e) => e.name);
  assert.ok(names.includes("Boseiju, Who Endures"));
  assert.ok(names.includes("Kozilek's Command"));
  assert.ok(names.includes("Soul-Guide Lantern"));
});

test("une même carte en principal et en réserve reste séparée", () => {
  const d = parseDecklist(ELDRAZI);
  assert.equal(d.main.find((e) => e.name === "Vexing Bauble")?.quantity, 1);
  assert.equal(d.side.find((e) => e.name === "Vexing Bauble")?.quantity, 1);
});

test("format MTGO : une ligne vide sépare principal et réserve", () => {
  const d = parseDecklist("4 Lightning Bolt\n4 Goblin Guide\n\n2 Smash to Smithereens\n");
  assert.equal(d.mainCount, 8);
  assert.equal(d.sideCount, 2);
});

test("préfixe SB: et fins de ligne Windows", () => {
  const d = parseDecklist("4 Lightning Bolt\r\nSB: 2 Smash to Smithereens\r\n");
  assert.equal(d.mainCount, 4);
  assert.equal(d.side[0].name, "Smash to Smithereens");
});

test("exports avec extension et numéro, marqueur foil, quantité en 4x", () => {
  const d = parseDecklist("4x Lightning Bolt (MH3) 123\n2 Ragavan, Nimble Pilferer *F*\n");
  assert.deepEqual(d.main, [
    { name: "Lightning Bolt", quantity: 4 },
    { name: "Ragavan, Nimble Pilferer", quantity: 2 },
  ]);
});

test("cartes dupliquées dans la même zone : quantités additionnées", () => {
  const d = parseDecklist("2 Lightning Bolt\n2 lightning bolt\n");
  assert.deepEqual(d.main, [{ name: "Lightning Bolt", quantity: 4 }]);
});

test("lignes illisibles : signalées sans bloquer le reste", () => {
  const d = parseDecklist("4 Lightning Bolt\nn'importe quoi\n0 Mountain\n");
  assert.equal(d.mainCount, 4);
  assert.equal(d.errors.length, 2);
  assert.equal(d.errors[0].line, 2);
});

test("avertissements : deck trop petit, réserve trop grande", () => {
  const d = parseDecklist("4 Lightning Bolt\n\n16 Mountain\n");
  assert.equal(d.warnings.length, 2);
});

test("cartes à deux faces : nom complet et première face", () => {
  assert.deepEqual(lookupKeys("Fable of the Mirror-Breaker // Reflection of Kiki-Jiki"), [
    "fable of the mirror-breaker // reflection of kiki-jiki",
    "fable of the mirror-breaker",
  ]);
  assert.deepEqual(lookupKeys("Lightning Bolt"), ["lightning bolt"]);
});

test("normalisation : accents et apostrophes typographiques", () => {
  assert.equal(normalizeName("Lim-Dûl’s Vault"), "lim-dul's vault");
});
