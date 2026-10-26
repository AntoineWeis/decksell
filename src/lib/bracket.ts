// Niveau de puissance d'un deck Commander, selon les « brackets » officiels (bêta, Wizards of the
// Coast et Commander Format Panel, règles du 9 février 2026). Fonctions pures.
//
// Le niveau dépend en partie de l'intention du joueur : la liste ne donne qu'un niveau minimum.
// - Game Changers : aucun en niveaux 1 et 2, trois au plus en niveau 3, sans limite au-delà.
// - Destruction massive de terrains : seulement à partir du niveau 4.
// - Tours supplémentaires : rares en niveau 2, peu nombreux et jamais enchaînés en niveau 3.
// - Combos à deux cartes : aucun avant le niveau 3, et seulement tardifs (vers le tour 6) en niveau 3.
// Les niveaux 1 (thème avant tout) et 5 (cEDH, compétitif) relèvent de l'intention : c'est au
// vendeur de les annoncer.

export type BracketLevel = 1 | 2 | 3 | 4 | 5;

export const BRACKETS: Record<BracketLevel, { name: string; summary: string }> = {
  1: { name: "Exhibition", summary: "Deck à thème, pour le plaisir avant tout" },
  2: { name: "Core", summary: "Niveau d'un deck préconstruit récent" },
  3: { name: "Upgraded", summary: "Deck amélioré, quelques cartes fortes" },
  4: { name: "Optimized", summary: "Deck optimisé, sans restriction" },
  5: { name: "cEDH", summary: "Compétitif, pensé pour le méta des tournois" },
};

export const GAME_CHANGERS_MAX_UPGRADED = 3;

/** Combo repéré dans la liste (Commander Spellbook). */
export type BracketCombo = {
  cards: string[];
  /** Ce que produit le combo, en anglais (ex. « Infinite creature tokens with haste »). */
  result: string | null;
  /** Combo rapide et peu coûteux : réservé au niveau 4. Sinon, toléré en niveau 3. */
  early: boolean;
};

/** Ce qui, dans la liste, fixe le niveau minimum. */
export type BracketFacts = {
  gameChangers: string[];
  massLandDenial: string[];
  extraTurns: string[];
  combos: BracketCombo[];
  /** false : combos non vérifiés (service indisponible), seuls les Game Changers comptent. */
  combosChecked: boolean;
};

/** Niveau minimum imposé par le contenu de la liste (2, 3 ou 4). */
export function minBracket(f: BracketFacts): BracketLevel {
  let level: BracketLevel = 2;
  const raise = (to: BracketLevel) => {
    if (to > level) level = to;
  };
  if (f.gameChangers.length > GAME_CHANGERS_MAX_UPGRADED) raise(4);
  else if (f.gameChangers.length > 0) raise(3);
  if (f.massLandDenial.length > 0) raise(4);
  if (f.extraTurns.length > 3) raise(4);
  else if (f.extraTurns.length > 1) raise(3);
  if (f.combos.some((c) => c.early)) raise(4);
  else if (f.combos.length > 0) raise(3);
  return level;
}

/** Niveaux que le vendeur peut annoncer : le minimum ou plus, et 1 quand rien ne l'interdit. */
export function allowedBrackets(min: BracketLevel): BracketLevel[] {
  const all: BracketLevel[] = [1, 2, 3, 4, 5];
  return all.filter((b) => b >= min || (b === 1 && min === 2));
}

/** Niveau annoncé valide, sinon le minimum. */
export function normalizeBracket(raw: unknown, min: BracketLevel): BracketLevel {
  const n = Number(raw);
  return (allowedBrackets(min) as number[]).includes(n) ? (n as BracketLevel) : min;
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
const names = (list: string[]) => list.join(", ");

/** Explications en français, de la plus déterminante à la moins. */
export function bracketReasons(f: BracketFacts): string[] {
  const out: string[] = [];
  if (f.massLandDenial.length > 0) {
    out.push(`Destruction massive de terrains (niveau 4) : ${names(f.massLandDenial)}.`);
  }
  const early = f.combos.filter((c) => c.early);
  const late = f.combos.filter((c) => !c.early);
  if (early.length > 0) {
    out.push(
      `${plural(early.length, "combo rapide", "combos rapides")} à deux cartes (niveau 4) : ${early.map((c) => c.cards.join(" + ")).join(" ; ")}.`,
    );
  }
  if (f.gameChangers.length > 0) {
    const level = f.gameChangers.length > GAME_CHANGERS_MAX_UPGRADED ? 4 : 3;
    out.push(`${plural(f.gameChangers.length, "Game Changer", "Game Changers")} (niveau ${level}) : ${names(f.gameChangers)}.`);
  }
  if (f.extraTurns.length > 1) {
    const level = f.extraTurns.length > 3 ? 4 : 3;
    out.push(`${plural(f.extraTurns.length, "tour supplémentaire", "tours supplémentaires")} (niveau ${level}) : ${names(f.extraTurns)}.`);
  } else if (f.extraTurns.length === 1) {
    out.push(`Un tour supplémentaire, toléré dès le niveau 2 : ${names(f.extraTurns)}.`);
  }
  if (late.length > 0) {
    out.push(
      `${plural(late.length, "combo tardif", "combos tardifs")} à deux cartes (niveau 3) : ${late.map((c) => c.cards.join(" + ")).join(" ; ")}.`,
    );
  }
  if (out.length === 0) out.push("Aucun Game Changer, combo à deux cartes ni destruction massive de terrains.");
  if (!f.combosChecked) out.push("Combos non vérifiés pour l'instant : seuls les Game Changers ont été comptés.");
  return out;
}

/** Détail enregistré avec l'annonce (colonne bracket_detail). */
export type StoredBracket = BracketFacts & { v: 1 };

export function toStoredBracket(f: BracketFacts): StoredBracket {
  return { v: 1, ...f };
}

export function fromStoredBracket(raw: unknown): BracketFacts | null {
  if (!raw || typeof raw !== "object" || (raw as { v?: unknown }).v !== 1) return null;
  const r = raw as Partial<StoredBracket>;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    gameChangers: list(r.gameChangers),
    massLandDenial: list(r.massLandDenial),
    extraTurns: list(r.extraTurns),
    combos: Array.isArray(r.combos)
      ? r.combos
          .filter((c): c is BracketCombo => !!c && Array.isArray((c as BracketCombo).cards))
          .map((c) => ({ cards: list(c.cards), result: typeof c.result === "string" ? c.result : null, early: c.early === true }))
      : [],
    combosChecked: r.combosChecked !== false,
  };
}

// Réponse de Commander Spellbook (estimate-bracket), réduite à ce qui sert ici.
type SpellbookCard = { card?: { name?: string }; gameChanger?: boolean; massLandDenial?: boolean; extraTurn?: boolean };
type SpellbookCombo = {
  combo?: {
    uses?: { card?: { name?: string } }[];
    produces?: { feature?: { name?: string } }[];
    bracketTag?: string;
  };
  definitelyTwoCard?: boolean;
};
export type SpellbookResult = { cards?: SpellbookCard[]; combos?: SpellbookCombo[] };

/** Combos retenus : à deux cartes, et assez forts pour compter (Ruthless, Spicy, Powerful). */
export function combosFrom(result: SpellbookResult): BracketCombo[] {
  const out: BracketCombo[] = [];
  for (const c of result.combos ?? []) {
    const tag = c.combo?.bracketTag;
    if (!c.definitelyTwoCard || !tag || !["R", "S", "P"].includes(tag)) continue;
    const cards = (c.combo?.uses ?? []).map((u) => u.card?.name).filter((n): n is string => !!n);
    if (cards.length === 0) continue;
    out.push({ cards, result: c.combo?.produces?.[0]?.feature?.name ?? null, early: tag === "R" });
  }
  return out;
}

export function factsFrom(result: SpellbookResult): BracketFacts {
  const pick = (flag: keyof Pick<SpellbookCard, "gameChanger" | "massLandDenial" | "extraTurn">) =>
    [...new Set((result.cards ?? []).filter((c) => c[flag]).map((c) => c.card?.name).filter((n): n is string => !!n))];
  return {
    gameChangers: pick("gameChanger"),
    massLandDenial: pick("massLandDenial"),
    extraTurns: pick("extraTurn"),
    combos: combosFrom(result),
    combosChecked: true,
  };
}

