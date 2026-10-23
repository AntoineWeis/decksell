// Lecteur de decklists en texte (formats MTGO, Arena, Moxfield, MTGGoldfish).
// Fonction pure : ne touche ni à la base ni au réseau.

export type DeckEntry = { name: string; quantity: number };
export type ParseIssue = { line: number; text: string; reason: string };

export type ParsedDeck = {
  main: DeckEntry[];
  side: DeckEntry[];
  mainCount: number;
  sideCount: number;
  errors: ParseIssue[]; // lignes ignorées
  warnings: string[]; // remarques non bloquantes (ex. moins de 60 cartes)
};

const MAIN_HEADERS = new Set(["mainboard", "main", "maindeck", "main deck", "deck"]);
// La section « Companion » des exports Arena va dans la réserve, d'où se joue le compagnon.
const SIDE_HEADERS = new Set(["sideboard", "side", "side board", "sb", "companion", "compagnon"]);

// "4 Lightning Bolt", "4x Lightning Bolt", prefixe MTGO "SB: 2 Name"
const LINE_RE = /^(?:sb:\s*)?(\d{1,3})\s*x?\s+(.+)$/i;

/** Retire les ajouts des exports : "(MH3) 123", "*F*", "[MH3]" en fin de ligne. */
function cleanName(raw: string): string {
  return raw
    .replace(/\s+\*[A-Z]\*\s*$/i, "") // *F* foil, *E* etched
    .replace(/\s+\([A-Za-z0-9]{2,6}\)\s*\S*\s*$/, "") // (MH3) 123
    .replace(/\s+\[[A-Za-z0-9]{2,6}\]\s*$/, "") // [MH3]
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
  const errors: ParseIssue[] = [];
  const warnings: string[] = [];

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let board: "main" | "side" = "main";
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
    addEntry(isSideprefix || board === "side" ? side : main, name, quantity);
  });

  const mainCount = main.reduce((n, e) => n + e.quantity, 0);
  const sideCount = side.reduce((n, e) => n + e.quantity, 0);
  if (mainCount === 0) warnings.push("Aucune carte dans le deck principal.");
  else if (mainCount < 60) warnings.push(`Deck principal : ${mainCount} cartes (60 minimum en Modern).`);
  if (sideCount > 15) warnings.push(`Réserve : ${sideCount} cartes (15 maximum).`);

  return { main, side, mainCount, sideCount, errors, warnings };
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

/** Decklist propre au format MTGO (« 4 Nom », puis « Sideboard ») : importable partout. */
export function formatDecklist(deck: Pick<ParsedDeck, "main" | "side">): string {
  const lines = deck.main.map((e) => `${e.quantity} ${e.name}`);
  if (deck.side.length > 0) lines.push("", "Sideboard", ...deck.side.map((e) => `${e.quantity} ${e.name}`));
  return lines.join("\n") + "\n";
}
