// Lecteur de decklists en texte (formats MTGO, Arena, Moxfield, MTGGoldfish, Archidekt).
// Fonction pure : ne touche ni à la base ni au réseau.

export type DeckEntry = { name: string; quantity: number };
export type ParseIssue = { line: number; text: string; reason: string };

/** Format reconnu d'après la forme de la liste (voir detectFormat). */
export type DetectedFormat = "modern" | "commander";

export type ParsedDeck = {
  main: DeckEntry[];
  side: DeckEntry[];
  mainCount: number;
  sideCount: number;
  errors: ParseIssue[]; // lignes ignorées
  warnings: string[]; // remarques non bloquantes (ex. moins de 60 cartes)
  format: DetectedFormat;
  /** Commandant(s) d'un deck Commander, tels qu'écrits dans la liste ; ils comptent dans `main`. */
  commanders: string[];
};

export const COMMANDER_DECK_SIZE = 100;

const MAIN_HEADERS = new Set(["mainboard", "main", "maindeck", "main deck", "deck"]);
// La section « Companion » des exports Arena va dans la réserve, d'où se joue le compagnon.
const SIDE_HEADERS = new Set(["sideboard", "side", "side board", "sb", "companion", "compagnon"]);
// Section du commandant (exports Arena, Moxfield, Archidekt) : ses cartes comptent dans le deck.
const COMMANDER_HEADERS = new Set(["commander", "commanders", "commandant", "commandants"]);

// Terrains de base : autorisés en plusieurs exemplaires en Commander, comme les cartes dont
// le texte le permet (liste ci-dessous : sans limite, sauf nombre indiqué).
const BASIC_LANDS = new Set(
  ["plains", "island", "swamp", "mountain", "forest", "wastes"].flatMap((n) => [n, `snow-covered ${n}`]),
);
const ANY_NUMBER = new Map<string, number>([
  ["relentless rats", Infinity],
  ["shadowborn apostle", Infinity],
  ["rat colony", Infinity],
  ["persistent petitioners", Infinity],
  ["dragon's approach", Infinity],
  ["slime against humanity", Infinity],
  ["hare apparent", Infinity],
  ["templar knight", Infinity],
  ["tempest hawk", Infinity],
  ["cid, timeless artificer", Infinity],
  ["seven dwarves", 7],
  ["nazgul", 9],
]);

/** Exemplaires autorisés d'une carte dans un deck Commander. */
export function commanderCopyLimit(name: string): number {
  const key = normalizeName(name).split(" // ")[0];
  if (BASIC_LANDS.has(key)) return Infinity;
  return ANY_NUMBER.get(key) ?? 1;
}

// "4 Lightning Bolt", "4x Lightning Bolt", prefixe MTGO "SB: 2 Name"
const LINE_RE = /^(?:sb:\s*)?(\d{1,3})\s*x?\s+(.+)$/i;

/** Retire les ajouts des exports : "(MH3) 123", "*F*", "[MH3]", catégories Archidekt en fin de ligne. */
function cleanName(raw: string): string {
  return raw
    .replace(/\s*\^[^^]*\^\s*/g, " ") // ^Have,#37d67a^ : étiquette de couleur Archidekt
    .replace(/(?:\s+\[[^\]]*\])+\s*$/, "") // [Commander{top}], [Ramp] (Archidekt), [MH3]
    .replace(/\s+\*[A-Z]+\*\s*$/i, "") // *F* foil, *E* etched, *CMDR*
    .replace(/\s+\([A-Za-z0-9]{2,6}\)\s*\S*\s*$/, "") // (MH3) 123
    .replace(/\s+\/\/?\s+/, " // ") // "A / B" ou "A // B" -> "A // B"
    .replace(/\s+/g, " ")
    .trim();
}

function addEntry(list: DeckEntry[], name: string, quantity: number) {
  const key = normalizeName(name);
  const existing = list.find((e) => normalizeName(e.name) === key);
  if (existing) existing.quantity += quantity;
  else list.push({ name, quantity });
}

export function parseDecklist(text: string): ParsedDeck {
  const main: DeckEntry[] = [];
  const side: DeckEntry[] = [];
  const commanders: string[] = [];
  const errors: ParseIssue[] = [];

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let board: "main" | "side" | "commander" = "main";
  let sawHeader = false;

  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    const line = raw.trim().replace(/^﻿/, "");

    if (line === "") {
      // Format MTGO : une ligne vide sépare le principal de la réserve.
      if (!sawHeader && board === "main" && main.length > 0) board = "side";
      return;
    }
    if (line.startsWith("//") || line.startsWith("#")) return; // commentaires

    const header = line.replace(/:$/, "").trim().toLowerCase();
    if (MAIN_HEADERS.has(header)) {
      board = "main";
      sawHeader = true;
      return;
    }
    if (SIDE_HEADERS.has(header)) {
      board = "side";
      sawHeader = true;
      return;
    }
    if (COMMANDER_HEADERS.has(header)) {
      board = "commander";
      sawHeader = true;
      return;
    }

    const m = LINE_RE.exec(line);
    if (!m) {
      errors.push({ line: lineNo, text: raw, reason: "Ligne non reconnue (attendu : « 4 Nom de la carte »)" });
      return;
    }
    const quantity = Number(m[1]);
    const name = cleanName(m[2]);
    if (quantity < 1 || name === "") {
      errors.push({ line: lineNo, text: raw, reason: "Quantité ou nom invalide" });
      return;
    }
    const isSideprefix = /^sb:/i.test(line);
    // Catégorie « Commander » d'Archidekt, sur la ligne elle-même.
    const tagged = /\[[^\]]*\bcommander\b[^\]]*\]/i.test(line);
    if (board === "commander" || tagged) {
      addEntry(main, name, quantity);
      if (!commanders.some((c) => normalizeName(c) === normalizeName(name))) commanders.push(name);
    } else addEntry(isSideprefix || board === "side" ? side : main, name, quantity);
  });

  const deck = detectFormat({ main, side, commanders, errors });
  if (deck.mainCount === 0) deck.warnings.push("Aucune carte dans le deck principal.");
  else if (deck.format === "commander") {
    if (deck.mainCount !== COMMANDER_DECK_SIZE) {
      deck.warnings.push(`Deck : ${deck.mainCount} cartes (${COMMANDER_DECK_SIZE} en Commander, commandant compris).`);
    }
  } else {
    if (deck.mainCount < 60) deck.warnings.push(`Deck principal : ${deck.mainCount} cartes (60 minimum en Modern).`);
    if (deck.sideCount > 15) deck.warnings.push(`Réserve : ${deck.sideCount} cartes (15 maximum).`);
  }
  return deck;
}

const countOf = (list: DeckEntry[]) => list.reduce((n, e) => n + e.quantity, 0);

function isSingleton(list: DeckEntry[]): boolean {
  return list.every((e) => e.quantity <= commanderCopyLimit(e.name));
}

/**
 * Reconnaît un deck Commander à sa forme, sans connaître les cartes :
 * - une section « Commander » (ou la catégorie Archidekt) ;
 * - sinon 100 cartes en un exemplaire, dont 1 ou 2 à part : la « réserve » des exports MTGO,
 *   où Moxfield et d'autres rangent le commandant ;
 * - sinon 100 cartes en un exemplaire sans commandant désigné (choisi à la mise en vente).
 * Tout le reste est lu comme un deck Modern.
 */
function detectFormat(input: Pick<ParsedDeck, "main" | "side" | "commanders" | "errors">): ParsedDeck {
  const { main, side, commanders, errors } = input;
  const build = (format: DetectedFormat, m: DeckEntry[], s: DeckEntry[], cmd: string[]): ParsedDeck => ({
    main: m,
    side: s,
    mainCount: countOf(m),
    sideCount: countOf(s),
    errors,
    warnings: [],
    format,
    commanders: cmd,
  });
  if (commanders.length > 0) return build("commander", main, side, commanders);

  const mainCount = countOf(main);
  const sideCount = countOf(side);
  if (
    sideCount >= 1 &&
    sideCount <= 2 &&
    mainCount + sideCount === COMMANDER_DECK_SIZE &&
    side.every((e) => e.quantity === 1) &&
    isSingleton(main)
  ) {
    const merged = [...main];
    for (const e of side) addEntry(merged, e.name, e.quantity);
    return build("commander", merged, [], side.map((e) => e.name));
  }
  if (sideCount === 0 && mainCount === COMMANDER_DECK_SIZE && isSingleton(main)) {
    return build("commander", main, side, []);
  }
  return build("modern", main, side, []);
}

/**
 * Applique le format et le(s) commandant(s) choisis par le vendeur. Un commandant rangé en
 * réserve rejoint le deck ; en Modern, il n'y a plus de commandant.
 */
export function withFormat(deck: ParsedDeck, format: DetectedFormat, chosen: string[] = []): ParsedDeck {
  if (format === "modern") return { ...deck, format, commanders: [] };
  const main = deck.main.map((e) => ({ ...e }));
  const side: DeckEntry[] = [];
  const wanted = new Set(chosen.map(normalizeName));
  for (const e of deck.side) {
    if (wanted.has(normalizeName(e.name))) addEntry(main, e.name, e.quantity);
    else side.push({ ...e });
  }
  const commanders = main.filter((e) => wanted.has(normalizeName(e.name))).slice(0, 2).map((e) => e.name);
  return { ...deck, main, side, mainCount: countOf(main), sideCount: countOf(side), format, commanders };
}

/** Le nom désigne-t-il un des commandants du deck ? */
export function isCommander(deck: Pick<ParsedDeck, "commanders">, name: string): boolean {
  const key = normalizeName(name);
  return deck.commanders.some((c) => normalizeName(c) === key);
}

/** Clé de comparaison : minuscules, sans accents, apostrophes et espaces normalisés. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Noms sous lesquels chercher une carte dans la base : le nom complet, et pour les
 * cartes à deux faces ("Front // Back") ou split, la première face seule.
 */
export function lookupKeys(name: string): string[] {
  const full = normalizeName(name);
  const front = full.split(" // ")[0];
  return front !== full ? [full, front] : [full];
}

/**
 * Decklist propre au format MTGO (« 4 Nom », puis « Sideboard ») : importable partout.
 * Deck Commander : section « Commander » en tête, puis « Deck » (comme Arena et Moxfield).
 */
export function formatDecklist(deck: Pick<ParsedDeck, "main" | "side"> & { commanders?: string[] }): string {
  const keys = new Set((deck.commanders ?? []).map(normalizeName));
  const line = (e: DeckEntry) => `${e.quantity} ${e.name}`;
  const lines: string[] = [];
  if (keys.size > 0) {
    lines.push("Commander", ...deck.main.filter((e) => keys.has(normalizeName(e.name))).map(line), "", "Deck");
    lines.push(...deck.main.filter((e) => !keys.has(normalizeName(e.name))).map(line));
  } else lines.push(...deck.main.map(line));
  if (deck.side.length > 0) lines.push("", "Sideboard", ...deck.side.map(line));
  return lines.join("\n") + "\n";
}
