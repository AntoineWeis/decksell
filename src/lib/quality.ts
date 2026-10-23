// Contrôle qualité d'une annonce (F13). Fonctions pures, partagées entre le formulaire
// (affichage immédiat) et le serveur (qui revérifie avant d'enregistrer).

import type { Estimate } from "./pricing.ts";

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

/** Règles Modern : 60 cartes minimum, 15 en réserve maximum, aucune carte interdite ou hors format. */
export function checkDeckQuality(estimate: Estimate): QualityReport {
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

  const unknown = [...new Set(estimate.lines.filter((l) => l.status === "not_found").map((l) => l.name))];
  if (unknown.length > 0) {
    warnings.push(
      `${unknown.length > 1 ? "Cartes non reconnues" : "Carte non reconnue"} : ${listNames(unknown)}. Vérifie l'orthographe (en anglais) : leur légalité n'a pas pu être contrôlée.`,
    );
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
