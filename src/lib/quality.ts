// Contrôle qualité d'une annonce (F13). Fonctions pures, partagées entre le formulaire
// (affichage immédiat) et le serveur (qui revérifie avant d'enregistrer).

import type { Estimate } from "./pricing.ts";
import { COMMANDER_DECK_SIZE, commanderCopyLimit, normalizeName, type ParsedDeck } from "./decklist.ts";

export const MODERN_MIN_MAIN = 60;
export const MODERN_MAX_SIDE = 15;

/** Au-delà de ces écarts avec l'estimation, on prévient le vendeur (sans bloquer). */
export const PRICE_HIGH_PERCENT = 50;
export const PRICE_LOW_PERCENT = -40;

export type QualityReport = {
  /** Empêchent la publication. */
  blocking: string[];
  /** Simples remarques. */
  warnings: string[];
};

const listNames = (names: string[], max = 5) =>
  names.length <= max ? names.join(", ") : `${names.slice(0, max).join(", ")} et ${names.length - max} autre${names.length - max > 1 ? "s" : ""}`;

/** Format du deck et commandant(s), tels que lus dans la liste puis choisis par le vendeur. */
export type DeckShape = Pick<ParsedDeck, "format" | "commanders">;
const MODERN_SHAPE: DeckShape = { format: "modern", commanders: [] };

/** Règles du format du deck : Modern par défaut, Commander pour un deck à commandant. */
export function checkDeckQuality(estimate: Estimate, shape: DeckShape = MODERN_SHAPE): QualityReport {
  const report = shape.format === "commander" ? checkCommander(estimate, shape.commanders) : checkModern(estimate);
  const unknown = [...new Set(estimate.lines.filter((l) => l.status === "not_found").map((l) => l.name))];
  if (unknown.length > 0) {
    report.warnings.push(
      `${unknown.length > 1 ? "Cartes non reconnues" : "Carte non reconnue"} : ${listNames(unknown)}. Vérifie l'orthographe (en anglais) : leur légalité n'a pas pu être contrôlée.`,
    );
  }
  return report;
}

/** Modern : 60 cartes minimum, 15 en réserve maximum, aucune carte interdite ou hors format. */
function checkModern(estimate: Estimate): QualityReport {
  const blocking: string[] = [];
  const warnings: string[] = [];
  const count = (board: "main" | "side") =>
    estimate.lines.filter((l) => l.board === board).reduce((n, l) => n + l.quantity, 0);
  const main = count("main");
  const side = count("side");

  if (main < MODERN_MIN_MAIN) {
    blocking.push(`Le deck principal compte ${main} carte${main > 1 ? "s" : ""} : il en faut au moins ${MODERN_MIN_MAIN} en Modern.`);
  }
  if (side > MODERN_MAX_SIDE) {
    blocking.push(`La réserve compte ${side} cartes : ${MODERN_MAX_SIDE} au maximum en Modern.`);
  }

  // legalModern absent (base pas encore à jour) : on ne bloque pas.
  const illegal = [...new Set(estimate.lines.filter((l) => l.card?.legalModern === false).map((l) => l.card!.name))];
  if (illegal.length > 0) {
    blocking.push(
      `${illegal.length > 1 ? "Ces cartes ne sont pas légales" : "Cette carte n'est pas légale"} en Modern (interdite ou hors format) : ${listNames(illegal)}.`,
    );
  }

  return { blocking, warnings };
}

/** Type de carte qui peut mener un deck : créature ou planeswalker légendaire, ou « historique ». */
export function canLeadDeck(typeLine: string | null | undefined): boolean {
  if (!typeLine) return false;
  const front = typeLine.split(" // ")[0];
  return /\bLegendary\b/.test(front) && /\b(Creature|Planeswalker|Background)\b/.test(front);
}

/**
 * Commander : 100 cartes commandant compris, un ou deux commandants, un seul exemplaire de
 * chaque carte (hors terrains de base et exceptions), toutes légales et dans l'identité de
 * couleur du commandant. Légalité, type ou couleurs inconnus (base pas à jour) : on ne bloque pas.
 */
function checkCommander(estimate: Estimate, commanders: string[]): QualityReport {
  const blocking: string[] = [];
  const warnings: string[] = [];
  const mainLines = estimate.lines.filter((l) => l.board === "main");
  const total = mainLines.reduce((n, l) => n + l.quantity, 0);
  const side = estimate.lines.filter((l) => l.board === "side").reduce((n, l) => n + l.quantity, 0);

  if (commanders.length === 0) {
    blocking.push("Indique le commandant du deck.");
  } else if (commanders.length > 2) {
    blocking.push("Un deck Commander a un ou deux commandants, pas plus.");
  }
  if (total !== COMMANDER_DECK_SIZE) {
    blocking.push(
      `Le deck compte ${total} carte${total > 1 ? "s" : ""} : il en faut exactement ${COMMANDER_DECK_SIZE} en Commander, commandant compris.`,
    );
  }
  if (side > 0) {
    warnings.push(
      `${side} carte${side > 1 ? "s" : ""} hors du deck (réserve) : elles seront vendues avec, mais ne comptent pas dans les ${COMMANDER_DECK_SIZE}.`,
    );
  }

  const copies = [...new Set(mainLines.filter((l) => l.quantity > commanderCopyLimit(l.name)).map((l) => l.name))];
  if (copies.length > 0) {
    blocking.push(`Un seul exemplaire par carte en Commander (hors terrains de base) : ${listNames(copies)}.`);
  }

  const illegal = [...new Set(mainLines.filter((l) => l.card?.legalCommander === false).map((l) => l.card!.name))];
  if (illegal.length > 0) {
    blocking.push(
      `${illegal.length > 1 ? "Ces cartes ne sont pas légales" : "Cette carte n'est pas légale"} en Commander (interdite) : ${listNames(illegal)}.`,
    );
  }

  const leaders = mainLines.filter((l) => commanders.some((c) => normalizeName(c) === normalizeName(l.name)));
  const notLeaders = leaders.filter((l) => l.card?.typeLine && !canLeadDeck(l.card.typeLine)).map((l) => l.card!.name);
  if (notLeaders.length > 0) {
    warnings.push(
      `${listNames(notLeaders)} n'${notLeaders.length > 1 ? "ont" : "a"} pas le type d'un commandant (créature légendaire). Vérifie que ${notLeaders.length > 1 ? "leur texte les autorise" : "son texte l'autorise"}.`,
    );
  }

  // Identité de couleur : seulement quand celle de chaque commandant est connue.
  const identities = leaders.map((l) => l.card?.colorIdentity);
  if (leaders.length > 0 && leaders.length === commanders.length && identities.every((i) => Array.isArray(i))) {
    const allowed = new Set(identities.flatMap((i) => i!));
    const outside = [
      ...new Set(
        mainLines
          .filter((l) => (l.card?.colorIdentity ?? []).some((c) => !allowed.has(c)))
          .map((l) => l.card!.name),
      ),
    ];
    if (outside.length > 0) {
      blocking.push(`Hors de l'identité de couleur du commandant : ${listNames(outside)}.`);
    }
  }

  return { blocking, warnings };
}

export type PriceGap = { percent: number; level: "ok" | "high" | "low"; message: string | null };

/** Écart entre le prix demandé et l'estimation, avec un message quand il est important. */
export function priceGap(askingCents: number | null, estimateCents: number): PriceGap {
  if (askingCents == null || askingCents <= 0 || estimateCents <= 0) return { percent: 0, level: "ok", message: null };
  const percent = Math.round(((askingCents - estimateCents) / estimateCents) * 100);
  if (percent >= PRICE_HIGH_PERCENT) {
    return {
      percent,
      level: "high",
      message: `Ton prix est ${percent} % au-dessus de la valeur estimée : les acheteurs risquent de passer leur chemin. Justifie-le dans la description (foils, éditions recherchées…) ou ajuste-le.`,
    };
  }
  if (percent <= PRICE_LOW_PERCENT) {
    return {
      percent,
      level: "low",
      message: `Ton prix est ${-percent} % sous la valeur estimée. Vérifie qu'il n'y a pas d'erreur de saisie avant de publier.`,
    };
  }
  return { percent, level: "ok", message: null };
}
