import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDecklist, parseDecklist, withFormat } from "../src/lib/decklist.ts";
import { archidektToText } from "../src/lib/deck-import.ts";
import { buildEstimate, type CardPrice } from "../src/lib/pricing.ts";
import { canLeadDeck, checkDeckQuality } from "../src/lib/quality.ts";

// 99 cartes différentes : « Card 1 » à « Card 59 » et 40 Forest.
const BODY = [...Array.from({ length: 59 }, (_, i) => `1 Card ${i + 1}`), "40 Forest"].join("\n");

test("section Commander : deck Commander, commandant compté dans le deck", () => {
  const d = parseDecklist(`Commander\n1 Ezuri, Renegade Leader\n\nDeck\n${BODY}`);
  assert.equal(d.format, "commander");
  assert.deepEqual(d.commanders, ["Ezuri, Renegade Leader"]);
  assert.equal(d.mainCount, 100);
  assert.equal(d.sideCount, 0);
  assert.deepEqual(d.warnings, []);
});

test("export MTGO : 99 cartes puis le commandant à part, reconnu comme commandant", () => {
  const d = parseDecklist(`${BODY}\n\n1 Ezuri, Renegade Leader`);
  assert.equal(d.format, "commander");
  assert.deepEqual(d.commanders, ["Ezuri, Renegade Leader"]);
  assert.equal(d.mainCount, 100);
  assert.equal(d.sideCount, 0);
});

test("deux partenaires à part : deux commandants", () => {
  const body = [...Array.from({ length: 58 }, (_, i) => `1 Card ${i + 1}`), "40 Forest"].join("\n");
  const d = parseDecklist(`${body}\n\n1 Tymna the Weaver\n1 Thrasios, Triton Hero`);
  assert.equal(d.format, "commander");
  assert.equal(d.commanders.length, 2);
});

test("100 cartes en un exemplaire sans commandant : Commander, commandant à choisir", () => {
  const d = parseDecklist(`${BODY}\n1 Ezuri, Renegade Leader`);
  assert.equal(d.format, "commander");
  assert.deepEqual(d.commanders, []);
});

test("un deck Modern de 60 + 15 reste Modern", () => {
  const d = parseDecklist("4 Lightning Bolt\n56 Mountain\n\nSideboard\n15 Island");
  assert.equal(d.format, "modern");
  assert.deepEqual(d.commanders, []);
});

test("100 cartes avec des doublons : pas un deck Commander", () => {
  const d = parseDecklist("4 Lightning Bolt\n96 Mountain");
  assert.equal(d.format, "modern");
});

test("catégorie Commander d'Archidekt sur la ligne, étiquettes retirées", () => {
  const d = parseDecklist(`1x Ezuri, Renegade Leader (c18) 140 [Commander{top}]\n1x Sol Ring (c21) 263 [Ramp] ^Have,#37d67a^\n${BODY}`);
  assert.equal(d.format, "commander");
  assert.deepEqual(d.commanders, ["Ezuri, Renegade Leader"]);
  assert.ok(d.main.some((e) => e.name === "Sol Ring"));
});

test("import Archidekt : la catégorie Commander devient une section", () => {
  const text = archidektToText({
    cards: [
      { quantity: 1, categories: ["Commander"], card: { oracleCard: { name: "Ezuri, Renegade Leader" } } },
      { quantity: 1, categories: ["Ramp"], card: { oracleCard: { name: "Sol Ring" } } },
    ],
  });
  assert.equal(text, "Commander\n1 Ezuri, Renegade Leader\n\nDeck\n1 Sol Ring");
});

test("formatDecklist relit à l'identique un deck Commander", () => {
  const d = parseDecklist(`${BODY}\n\n1 Ezuri, Renegade Leader`);
  const again = parseDecklist(formatDecklist(d));
  assert.deepEqual(again.commanders, d.commanders);
  assert.equal(again.mainCount, 100);
  assert.match(formatDecklist(d), /^Commander\n1 Ezuri, Renegade Leader\n\nDeck\n/);
});

test("withFormat : le commandant choisi rejoint le deck ; Modern n'a pas de commandant", () => {
  const d = parseDecklist("4 Lightning Bolt\n56 Mountain\n\nSideboard\n1 Ezuri, Renegade Leader");
  const c = withFormat(d, "commander", ["ezuri, renegade leader"]);
  assert.deepEqual(c.commanders, ["Ezuri, Renegade Leader"]);
  assert.equal(c.sideCount, 0);
  assert.equal(c.mainCount, 61);
  assert.deepEqual(withFormat(c, "modern").commanders, []);
});

function card(name: string, extra: Partial<CardPrice> = {}): CardPrice {
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
    legalCommander: true,
    colorIdentity: ["G"],
    ...extra,
  };
}

const PRICES = [
  card("Ezuri, Renegade Leader", { typeLine: "Legendary Creature — Elf Warrior" }),
  card("Forest", { colorIdentity: [] }),
  card("Lightning Bolt", { colorIdentity: ["R"] }),
  card("Primeval Titan", { legalCommander: false }),
  ...Array.from({ length: 59 }, (_, i) => card(`Card ${i + 1}`)),
];
const check = (text: string) => {
  const d = parseDecklist(text);
  return checkDeckQuality(buildEstimate(d, PRICES), d);
};

test("un deck Commander valide passe", () => {
  assert.deepEqual(check(`Commander\n1 Ezuri, Renegade Leader\n\nDeck\n${BODY}`).blocking, []);
});

test("bloque sans commandant, hors des 100 cartes, en double, interdit ou hors couleurs", () => {
  assert.match(check(`${BODY}\n1 Card 60`).blocking.join(" "), /commandant/);
  const r = check(`Commander\n1 Ezuri, Renegade Leader\n\nDeck\n${BODY}\n2 Lightning Bolt\n1 Primeval Titan`);
  const all = r.blocking.join(" ");
  assert.match(all, /103 cartes/);
  assert.match(all, /Un seul exemplaire.*Lightning Bolt/);
  assert.match(all, /interdite.*Primeval Titan/);
  assert.match(all, /identité de couleur.*Lightning Bolt/);
});

test("couleurs inconnues (base pas à jour) : pas de blocage sur l'identité", () => {
  const d = parseDecklist(`Commander\n1 Ezuri, Renegade Leader\n\nDeck\n${BODY.replace("1 Card 1\n", "1 Lightning Bolt\n")}`);
  const prices = PRICES.map((p) => ({ ...p, colorIdentity: null }));
  assert.deepEqual(checkDeckQuality(buildEstimate(d, prices), d).blocking, []);
});

test("canLeadDeck : créature ou planeswalker légendaire, ou historique", () => {
  assert.equal(canLeadDeck("Legendary Creature — Elf Warrior"), true);
  assert.equal(canLeadDeck("Legendary Enchantment — Background"), true);
  assert.equal(canLeadDeck("Creature — Elf"), false);
  assert.equal(canLeadDeck("Legendary Artifact"), false);
});

test("image du deck : le commandant, sinon la carte la plus chère", async () => {
  const { coverCard } = await import("../src/lib/pricing.ts");
  const prices = PRICES.map((p) => ({ ...p, imageUrl: `img/${p.name}` }));
  prices.find((p) => p.name === "Card 1")!.priceEur = 50;
  const d = parseDecklist(`Commander\n1 Ezuri, Renegade Leader\n\nDeck\n${BODY}`);
  const e = buildEstimate(d, prices);
  assert.equal(coverCard(e, d.commanders)?.name, "Ezuri, Renegade Leader");
  assert.equal(coverCard(e)?.name, "Card 1");
});

test("archétypes proposés selon le format", async () => {
  const { archetypesFor } = await import("../src/lib/listings.ts");
  const list = [
    { id: 1, slug: "burn", name: "Burn", format: "modern" },
    { id: 2, slug: "edh-voltron", name: "Voltron", format: "commander" },
    { id: 3, slug: "old", name: "Ancien" },
  ];
  assert.deepEqual(archetypesFor(list, "commander").map((a) => a.id), [2]);
  assert.deepEqual(archetypesFor(list, "modern").map((a) => a.id), [1, 3]);
});
