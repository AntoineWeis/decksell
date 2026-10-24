// Cartes types des archétypes Modern (table archetypes), pour nommer les listes de tournoi
// MTGO, qui ne portent pas de nom d'archétype. Données propres au site (aucune licence tierce).
// Le nom ne sert qu'à l'affichage : le score compare toujours les listes carte par carte.
// Une liste prend l'archétype dont elle joue le plus de cartes clés, si elle en joue au moins
// `min` et aucune carte `exclude`. Sinon, elle reste « non nommée ». Pure, testée.

import { cardKey, type DeckCards } from "./similarity.ts";

export type Signature = {
  slug: string;
  /** Cartes clés (principal ou réserve). */
  cards: string[];
  /** Nombre minimal de cartes clés pour reconnaître l'archétype. */
  min: number;
  /** Au moins une de ces cartes est requise (ex. la carte qui définit l'archétype). */
  requireAny?: string[];
  /** Cartes qui excluent l'archétype (ex. une couleur absente). */
  exclude?: string[];
};

const RED = ["Lightning Bolt", "Lightning Helix", "Galvanic Discharge"];

export const SIGNATURES: Signature[] = [
  { slug: "affinity", cards: ["Thought Monitor", "Frogmite", "Myr Enforcer", "Cranial Plating", "Thoughtcast", "Sojourner's Companion", "Springleaf Drum"], min: 3 },
  { slug: "amulet-titan", cards: ["Amulet of Vigor", "Primeval Titan", "Arboreal Grazer", "Dryad of the Ilysian Grove", "Spelunking", "Summoner's Pact"], min: 2, requireAny: ["Amulet of Vigor"] },
  { slug: "azorius-control", cards: ["Teferi, Hero of Dominaria", "Supreme Verdict", "Solitude", "Prismatic Ending", "Orim's Chant", "Day's Undoing", "Wrath of the Skies", "March of Otherworldly Light", "Force of Negation", "Narset, Parter of Veils"], min: 4, exclude: RED },
  { slug: "belcher", cards: ["Goblin Charbelcher", "Recross the Paths", "Manamorphose", "Simian Spirit Guide", "Tinder Wall"], min: 2, requireAny: ["Goblin Charbelcher"] },
  { slug: "boros-energy", cards: ["Guide of Souls", "Ocelot Pride", "Ajani, Nacatl Pariah", "Phlage, Titan of Fire's Fury", "Static Prison", "Galvanic Discharge", "Ranger-Captain of Eos", "Seasoned Pyromancer", "Arena of Glory"], min: 3 },
  { slug: "burn", cards: ["Lava Spike", "Rift Bolt", "Skewer the Critics", "Boros Charm", "Goblin Guide", "Eidolon of the Great Revel", "Searing Blaze"], min: 3 },
  { slug: "crashing-footfalls", cards: ["Crashing Footfalls", "Shardless Agent", "Violent Outburst", "Ardent Plea", "Fire // Ice"], min: 2, requireAny: ["Crashing Footfalls"] },
  { slug: "death-shadow", cards: ["Death's Shadow", "Street Wraith", "Thoughtseize", "Temur Battle Rage", "Scourge of the Skyclaves"], min: 2, requireAny: ["Death's Shadow"] },
  { slug: "dimir-control", cards: ["Psychic Frog", "Orcish Bowmasters", "Counterspell", "Fatal Push", "Snapcaster Mage", "Drown in the Loch", "Thoughtseize", "Subtlety"], min: 4, exclude: [...RED, "Murktide Regent"] },
  { slug: "domain-zoo", cards: ["Leyline Binding", "Territorial Kavu", "Tribal Flames", "Scion of Draco", "Wild Nacatl", "Leyline of the Guildpact", "Stubborn Denial"], min: 3 },
  { slug: "eldrazi-ramp", cards: ["Eldrazi Temple", "Devourer of Destiny", "Ugin's Labyrinth", "Basking Broodscale", "Ancient Stirrings", "Kozilek's Command", "Emrakul, the Promised End"], min: 3, exclude: ["Urza's Tower"] },
  { slug: "eldrazi-tron", cards: ["Thought-Knot Seer", "Reality Smasher", "Matter Reshaper", "Eldrazi Temple", "Urza's Tower", "Urza's Mine"], min: 3, requireAny: ["Urza's Tower"] },
  { slug: "elementals", cards: ["Fury", "Endurance", "Grief", "Subtlety", "Solitude", "Ephemerate", "Risen Reef", "Omnath, Locus of Creation"], min: 4 },
  { slug: "golgari-yawgmoth", cards: ["Yawgmoth, Thran Physician", "Young Wolf", "Strangleroot Geist", "Delighted Halfling", "Blood Artist", "Grist, the Hunger Tide"], min: 2, requireAny: ["Yawgmoth, Thran Physician"] },
  { slug: "hammer-time", cards: ["Colossus Hammer", "Sigarda's Aid", "Puresteel Paladin", "Stoneforge Mystic", "Esper Sentinel"], min: 2, requireAny: ["Colossus Hammer"] },
  { slug: "hardened-scales", cards: ["Hardened Scales", "Walking Ballista", "Arcbound Ravager", "Patchwork Automaton", "Ozolith, the Shattered Spire"], min: 2, requireAny: ["Hardened Scales"] },
  { slug: "izzet-murktide", cards: ["Murktide Regent", "Dragon's Rage Channeler", "Expressive Iteration", "Counterspell", "Lightning Bolt", "Unholy Heat"], min: 2, requireAny: ["Murktide Regent"] },
  { slug: "izzet-prowess", cards: ["Slickshot Show-Off", "Monastery Swiftspear", "Mutagenic Growth", "Lava Dart", "Cori-Steel Cutter", "Violent Urge", "Burst Lightning"], min: 3 },
  { slug: "jeskai-control", cards: ["Teferi, Hero of Dominaria", "Lightning Helix", "Lightning Bolt", "Teferi, Time Raveler", "Supreme Verdict", "Solitude", "Prismatic Ending", "Counterspell", "Force of Negation"], min: 4, requireAny: RED },
  { slug: "jund-midrange", cards: ["Bloodbraid Elf", "Liliana of the Veil", "Wrenn and Six", "Kolaghan's Command", "Fatal Push", "Tarmogoyf", "Ragavan, Nimble Pilferer"], min: 3, requireAny: ["Wrenn and Six", "Bloodbraid Elf", "Tarmogoyf"] },
  { slug: "living-end", cards: ["Living End", "Violent Outburst", "Shardless Agent", "Street Wraith", "Architects of Will", "Curator of Mysteries"], min: 2, requireAny: ["Living End"] },
  { slug: "merfolk", cards: ["Lord of Atlantis", "Master of the Pearl Trident", "Silvergill Adept", "Merfolk Trickster", "Kumena's Speaker", "Svyelun of Sea and Sky", "Coralhelm Commander"], min: 3 },
  { slug: "mill", cards: ["Hedron Crab", "Ruin Crab", "Archive Trap", "Tasha's Hideous Laughter", "Maddening Cacophony", "Glimpse the Unthinkable"], min: 2 },
  { slug: "neobrand", cards: ["Neoform", "Allosaurus Shepherd", "Griselbrand", "Eldritch Evolution", "Summoner's Pact", "Atraxa, Grand Unifier"], min: 2, requireAny: ["Neoform", "Eldritch Evolution"] },
  { slug: "rakdos-midrange", cards: ["Fable of the Mirror-Breaker", "Bloodtithe Harvester", "Thoughtseize", "Kolaghan's Command", "Orcish Bowmasters", "Fatal Push", "Ragavan, Nimble Pilferer"], min: 3, exclude: ["Wrenn and Six", "Bloodbraid Elf", "Tarmogoyf", "Murktide Regent"] },
  { slug: "reanimator", cards: ["Goryo's Vengeance", "Griselbrand", "Atraxa, Grand Unifier", "Persist", "Archon of Cruelty", "Unmarked Grave", "Ephemerate"], min: 2, requireAny: ["Goryo's Vengeance", "Persist"] },
  { slug: "ruby-storm", cards: ["Ruby Medallion", "Grapeshot", "Past in Flames", "Pyretic Ritual", "Desperate Ritual", "Manamorphose", "Wish", "Galvanic Relay"], min: 3 },
  { slug: "scam", cards: ["Grief", "Not Dead After All", "Undying Malice", "Feign Death", "Fury", "Ephemerate"], min: 2, requireAny: ["Not Dead After All", "Undying Malice", "Feign Death"] },
  { slug: "tron", cards: ["Urza's Tower", "Urza's Mine", "Urza's Power Plant", "Karn, the Great Creator", "Expedition Map", "Sylvan Scrying", "Chromatic Star", "Ugin, the Spirit Dragon"], min: 4, exclude: ["Thought-Knot Seer", "Reality Smasher"] },
  { slug: "urza-artifacts", cards: ["Urza, Lord High Artificer", "Emry, Lurker of the Loch", "Sai, Master Thopterist", "Saheeli, Sublime Artificer", "Retrofitter Foundry", "Teferi, Time Raveler"], min: 2, requireAny: ["Urza, Lord High Artificer", "Emry, Lurker of the Loch", "Sai, Master Thopterist"] },
];

const keys = (names: string[] | undefined) => new Set((names ?? []).map(cardKey));
const compiled = SIGNATURES.map((s) => ({ ...s, keys: keys(s.cards), require: keys(s.requireAny), excluded: keys(s.exclude) }));

/**
 * Archétype d'une liste d'après ses cartes clés, ou null si aucun ne correspond assez.
 * Un archétype défini par une carte signature (requireAny : Goryo's Vengeance, Living End…)
 * passe avant un archétype « générique » (Azorius Control) dont la liste partagerait des
 * cartes de soutien (Solitude, Force of Negation) ; puis le plus de cartes clés l'emporte.
 */
export function classifyArchetype(deck: DeckCards): string | null {
  const has = (k: string) => deck.main.has(k) || deck.side.has(k);
  let best: { slug: string; signature: boolean; hits: number; ratio: number } | null = null;
  for (const s of compiled) {
    if ([...s.excluded].some(has)) continue;
    const signature = s.require.size > 0;
    if (signature && ![...s.require].some(has)) continue;
    const hits = [...s.keys].filter(has).length;
    if (hits < s.min) continue;
    const ratio = hits / s.keys.size;
    const better =
      !best ||
      (signature && !best.signature) ||
      (signature === best.signature && (hits > best.hits || (hits === best.hits && ratio > best.ratio)));
    if (better) best = { slug: s.slug, signature, hits, ratio };
  }
  return best?.slug ?? null;
}
