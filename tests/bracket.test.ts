import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allowedBrackets,
  bracketReasons,
  factsFrom,
  fromStoredBracket,
  minBracket,
  normalizeBracket,
  toStoredBracket,
  type BracketFacts,
} from "../src/lib/bracket.ts";

const none: BracketFacts = { gameChangers: [], massLandDenial: [], extraTurns: [], combos: [], combosChecked: true };
const gc = (n: number) => Array.from({ length: n }, (_, i) => `GC ${i + 1}`);

test("rien de notable : niveau 2 au minimum, 1 ou plus autorisé", () => {
  assert.equal(minBracket(none), 2);
  assert.deepEqual(allowedBrackets(2), [1, 2, 3, 4, 5]);
});

test("Game Changers : 1 à 3 donnent le niveau 3, au-delà le niveau 4", () => {
  assert.equal(minBracket({ ...none, gameChangers: gc(1) }), 3);
  assert.equal(minBracket({ ...none, gameChangers: gc(3) }), 3);
  assert.equal(minBracket({ ...none, gameChangers: gc(4) }), 4);
  assert.deepEqual(allowedBrackets(3), [3, 4, 5]);
});

test("destruction massive de terrains et combo rapide : niveau 4 ; combo tardif : niveau 3", () => {
  assert.equal(minBracket({ ...none, massLandDenial: ["Armageddon"] }), 4);
  assert.equal(minBracket({ ...none, combos: [{ cards: ["A", "B"], result: null, early: true }] }), 4);
  assert.equal(minBracket({ ...none, combos: [{ cards: ["A", "B"], result: null, early: false }] }), 3);
});

test("tours supplémentaires : un seul toléré, quelques-uns niveau 3, beaucoup niveau 4", () => {
  assert.equal(minBracket({ ...none, extraTurns: ["Time Warp"] }), 2);
  assert.equal(minBracket({ ...none, extraTurns: gc(2) }), 3);
  assert.equal(minBracket({ ...none, extraTurns: gc(4) }), 4);
});

test("niveau annoncé : sous le minimum, on revient au minimum", () => {
  assert.equal(normalizeBracket("5", 3), 5);
  assert.equal(normalizeBracket("2", 3), 3);
  assert.equal(normalizeBracket("1", 2), 1);
  assert.equal(normalizeBracket("abc", 4), 4);
});

test("réponse Commander Spellbook : drapeaux par carte et combos à deux cartes retenus", () => {
  const facts = factsFrom({
    cards: [
      { card: { name: "Rhystic Study" }, gameChanger: true },
      { card: { name: "Armageddon" }, massLandDenial: true },
      { card: { name: "Time Warp" }, extraTurn: true },
      { card: { name: "Sol Ring" } },
    ],
    combos: [
      {
        combo: { uses: [{ card: { name: "Kiki-Jiki, Mirror Breaker" } }, { card: { name: "Zealous Conscripts" } }], produces: [{ feature: { name: "Infinite tokens" } }], bracketTag: "R" },
        definitelyTwoCard: true,
      },
      { combo: { uses: [{ card: { name: "A" } }, { card: { name: "B" } }], bracketTag: "P" }, definitelyTwoCard: true },
      { combo: { uses: [{ card: { name: "C" } }, { card: { name: "D" } }, { card: { name: "E" } }], bracketTag: "R" }, definitelyTwoCard: false },
      { combo: { uses: [{ card: { name: "F" } }, { card: { name: "G" } }], bracketTag: "C" }, definitelyTwoCard: true },
    ],
  });
  assert.deepEqual(facts.gameChangers, ["Rhystic Study"]);
  assert.deepEqual(facts.massLandDenial, ["Armageddon"]);
  assert.deepEqual(facts.extraTurns, ["Time Warp"]);
  assert.equal(facts.combos.length, 2);
  assert.deepEqual(facts.combos[0], { cards: ["Kiki-Jiki, Mirror Breaker", "Zealous Conscripts"], result: "Infinite tokens", early: true });
  assert.equal(facts.combos[1].early, false);
  assert.equal(minBracket(facts), 4);
});

test("détail enregistré relu à l'identique ; format inconnu ignoré", () => {
  const f: BracketFacts = { ...none, gameChangers: ["Cyclonic Rift"], combos: [{ cards: ["A", "B"], result: "x", early: false }] };
  assert.deepEqual(fromStoredBracket(JSON.parse(JSON.stringify(toStoredBracket(f)))), f);
  assert.equal(fromStoredBracket({ v: 2 }), null);
  assert.equal(fromStoredBracket(null), null);
});

test("explications : la plus déterminante d'abord, et l'avertissement si les combos n'ont pas été vérifiés", () => {
  const r = bracketReasons({ ...none, gameChangers: ["Cyclonic Rift"], massLandDenial: ["Armageddon"], combosChecked: false });
  assert.match(r[0], /Destruction massive/);
  assert.match(r[1], /1 Game Changer \(niveau 3\)/);
  assert.match(r.at(-1)!, /non vérifiés/);
  assert.match(bracketReasons(none)[0], /Aucun Game Changer/);
});
