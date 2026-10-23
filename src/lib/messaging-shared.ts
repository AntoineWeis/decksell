// Messagerie : règles partagées entre le navigateur et le serveur.

export const MESSAGE_MAX = 2000;
export const REPORT_MAX = 1000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

const EMAIL = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
// Numéros français (06 12 34 56 78, +33 6 12 34 56 78) et suites de 9 chiffres ou plus.
const PHONE = /(?:\+33\s?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b|\b\d{9,}\b/;

/** Vrai si le texte contient une adresse email ou un numéro de téléphone (avertissement seulement). */
export function containsContactInfo(text: string): boolean {
  return EMAIL.test(text) || PHONE.test(text);
}
