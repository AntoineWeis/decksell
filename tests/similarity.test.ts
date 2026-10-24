import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDecklist } from "../src/lib/decklist.ts";
import {
  UNIFORM_WEIGHTS,
  boardSimilarity,
  buildWeights,
  compareDecks,
  diffBoards,
  validateDeck,
  verdictOf,
  type DeckCards,
} from "../src/lib/similarity.ts";
import { buildCorpus, deckCardsFromParsed, matchMeta, rankOf, type MetaDeck } from "../src/lib/meta-match.ts";

const deck = (text: string): DeckCards => deckCardsFromParsed(parseDecklist(text));

const BURN = `4 Lightning Bolt
4 Lava Spike
4 Rift Bolt
4 Boros Charm
4 Goblin Guide
4 Monastery Swiftspear
4 Eidolon of the Great Revel
4 Skewer the Critics
4 Lightning Helix
4 Searing Blaze
4 Inspiring Vantage
4 Sacred Foundry
4 Arid Mesa
4 Wooded Foothills
4 Mountain

Sideboard
4 Path to Exile
4 Kor Firewalker
4 Deflecting Palm
3 Smash to Smithereens`;

const TRON = `4 Expedition Map
4 Ancient Stirrings
4 Chromatic Sphere
4 Chromatic Star
4 Karn, the Great Creator
4 Wurmcoil Engine
4 Urza's Tower
4 Urza's Mine
4 Urza's Power Plant
4 Sylvan Scrying
4 Relic of Progenitus
4 Forest
4 Oblivion Stone
4 Ulamog, the Ceaseless Hunger
4 Ugin, the Spirit Dragon

Sideboard
4 Thragtusk
4 Nature's Claim
4 Dismember
3 Warping Wail`;

test("listes identiques : 100 ; listes sans carte commune : 0", () => {
  assert.equal(compareDecks(deck(BURN), deck(BURN), UNIFORM_WEIGHTS).score, 100);
  assert.equal(compareDecks(deck(BURN), deck(TRON), UNIFORM_WEIGHTS).score, 0);
});

test("la similarité tient compte des quantités, pas seulement des cartes présentes", () => {
  const a = new Map([["x", 4], ["y", 4]]);
  const b = new Map([["x", 1], ["y", 4]]);
  // min = 1 + 4 = 5 ; max = 4 + 4 = 8
  assert.equal(boardSimilarity(a, b, UNIFORM_WEIGHTS), 5 / 8);
  // Une carte en plus d'un côté éloigne aussi (le dénominateur grandit).
  const c = new Map([["x", 4], ["y", 4], ["z", 4]]);
  assert.equal(boardSimilarity(a, c, UNIFORM_WEIGHTS), 8 / 12);
});

test("le principal pèse plus que la réserve (0,8 / 0,2)", () => {
  const sameMainOtherSide = BURN.replace(/Sideboard[\s\S]*/, "Sideboard\n4 Thragtusk\n4 Nature's Claim\n4 Dismember\n3 Warping Wail");
  const sameSideOtherMain = TRON.replace(/Sideboard[\s\S]*/, BURN.match(/Sideboard[\s\S]*/)![0]);
  assert.equal(compareDecks(deck(BURN), deck(sameMainOtherSide), UNIFORM_WEIGHTS).score, 80);
  assert.equal(compareDecks(deck(BURN), deck(sameSideOtherMain), UNIFORM_WEIGHTS).score, 20);
});

test("réserve absente : score sur le principal seul, signalé", () => {
  const noSide = BURN.replace(/\n\nSideboard[\s\S]*/, "");
  const c = compareDecks(deck(BURN), deck(noSide), UNIFORM_WEIGHTS);
  assert.equal(c.score, 100);
  assert.equal(c.sideboard, "missing");
  assert.equal(c.side, null);
});

test("les cartes rares dans le méta pèsent plus que les cartes omniprésentes", () => {
  const corpus = [deck(BURN), deck(BURN.replace("4 Searing Blaze", "4 Light Up the Stage")), deck(TRON)];
  const w = buildWeights(corpus);
  assert.ok(w.get("searing blaze") > w.get("lightning bolt"), "carte d'une seule liste > carte de deux listes");
  assert.ok(w.get("mountain") < w.get("lightning bolt"), "terre de base réduite");
  assert.ok(w.get("carte absente du meta") >= w.get("searing blaze"), "carte inconnue : poids maximal");
});

test("les variantes d'écriture d'une même carte donnent la même clé", () => {
  const a = deck("4 Wear/Tear\n4 Fable of the Mirror-Breaker // Reflection of Kiki-Jiki\n4 Lim-Dûl's Vault");
  const b = deck("4 wear // tear\n4 Fable of the Mirror-Breaker\n4 Lim-Dul’s Vault");
  assert.equal(compareDecks(a, b, UNIFORM_WEIGHTS).score, 100);
});

test("validateDeck refuse une liste trop courte et signale les données douteuses", () => {
  assert.equal(validateDeck(deck("4 Lightning Bolt\n4 Mountain"), { unknownCards: 0, parseErrors: 0 }).status, "invalid");
  assert.equal(validateDeck(deck(""), { unknownCards: 0, parseErrors: 0 }).status, "invalid");
  assert.equal(validateDeck(deck(BURN), { unknownCards: 0, parseErrors: 0 }).status, "ok");
  const noSide = deck(BURN.replace(/\n\nSideboard[\s\S]*/, ""));
  assert.equal(validateDeck(noSide, { unknownCards: 0, parseErrors: 0 }).status, "partial");
  assert.equal(validateDeck(deck(BURN), { unknownCards: 30, parseErrors: 0 }).status, "unreliable");
  const withErrors = validateDeck(deck(BURN), { unknownCards: 0, parseErrors: 2 });
  assert.equal(withErrors.status, "partial");
});

test("verdictOf lit le score par paliers", () => {
  assert.equal(verdictOf(92).key, "meta");
  assert.equal(verdictOf(75).key, "meta");
  assert.equal(verdictOf(60).key, "close");
  assert.equal(verdictOf(40).key, "variant");
  assert.equal(verdictOf(10).key, "off");
});

test("diffBoards liste le commun, le en plus et le en moins", () => {
  const mine = new Map([["a", 4], ["b", 2]]);
  const theirs = new Map([["a", 3], ["c", 4]]);
  const d = diffBoards(mine, theirs, UNIFORM_WEIGHTS, (k) => k.toUpperCase());
  assert.deepEqual(d.shared, [{ name: "A", mine: 4, theirs: 3 }]);
  assert.deepEqual(d.extra.map((x) => x.name).sort(), ["A", "B"]);
  assert.deepEqual(d.missing, [{ name: "C", mine: 0, theirs: 4 }]);
});

const meta = (id: number, text: string, archetype: string | null, date = "2026-10-20", placement = "1"): MetaDeck => {
  const c = deckCardsFromParsed(parseDecklist(text));
  return {
    id,
    source: "mtgtop8",
    event_name: "Test",
    event_date: date,
    placement,
    player: null,
    archetype,
    source_url: null,
    main: Object.fromEntries(c.main),
    side: Object.fromEntries(c.side),
    names: Object.fromEntries(c.names),
  };
};

test("matchMeta retient la liste la plus proche, quel que soit l'archétype annoncé", () => {
  const burnVariant = BURN.replace("4 Searing Blaze", "4 Light Up the Stage");
  const corpus = buildCorpus([meta(1, TRON, "Tron"), meta(2, burnVariant, "Burn"), meta(3, BURN, null)]);
  const r = matchMeta(deck(BURN), { unknownCards: 0, parseErrors: 0 }, corpus);
  assert.equal(r.status, "ok");
  if (r.status !== "ok") return;
  assert.equal(r.best.deck.id, 3, "la liste identique, même sans archétype renseigné");
  assert.equal(r.score, 100);
  assert.equal(r.verdict.key, "meta");
  assert.deepEqual(r.alsoClose.map((m) => m.deck.archetype), ["Burn", "Tron"]);
});

test("matchMeta : liste invalide sans score, corpus vide signalé", () => {
  const corpus = buildCorpus([meta(1, BURN, "Burn")]);
  assert.equal(matchMeta(deck("4 Lightning Bolt"), { unknownCards: 0, parseErrors: 0 }, corpus).status, "invalid");
  assert.equal(matchMeta(deck(BURN), { unknownCards: 0, parseErrors: 0 }, buildCorpus([])).status, "empty");
});

test("rankOf ordonne les classements", () => {
  assert.deepEqual(["5-8", "1", "5-0", null, "2"].map(rankOf), [5, 1, 16, 99, 2]);
});

test("classifyArchetype nomme une liste d'après ses cartes clés, sinon rien", async () => {
  const { classifyArchetype } = await import("../src/lib/archetype-signatures.ts");
  assert.equal(classifyArchetype(deck(BURN)), "burn");
  assert.equal(classifyArchetype(deck(TRON)), "tron");
  assert.equal(classifyArchetype(deck("4 Island\n4 Opt\n4 Consider")), null);
  // Azorius ne joue pas rouge : avec des sorts rouges, c'est Jeskai.
  const control = "4 Teferi, Hero of Dominaria\n4 Supreme Verdict\n4 Solitude\n4 Prismatic Ending\n4 Counterspell";
  assert.equal(classifyArchetype(deck(control)), "azorius-control");
  assert.equal(classifyArchetype(deck(`${control}\n4 Lightning Helix`)), "jeskai-control");
});

test("classifyArchetype : une carte signature l'emporte sur un archétype générique", async () => {
  const { classifyArchetype } = await import("../src/lib/archetype-signatures.ts");
  const goryo = "4 Goryo's Vengeance\n2 Griselbrand\n2 Atraxa, Grand Unifier\n4 Solitude\n4 Prismatic Ending\n2 Force of Negation\n4 Ephemerate\n1 Teferi, Hero of Dominaria\n2 Supreme Verdict";
  assert.equal(classifyArchetype(deck(goryo)), "reanimator");
});
