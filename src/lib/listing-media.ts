// Photos réelles et primer d'une annonce : limites partagées par le formulaire et le serveur.

export const MAX_PHOTOS = 6;
export const PRIMER_MAX = 6000;
/** Plus grand côté d'une photo après réduction dans le navigateur. */
export const PHOTO_MAX_SIDE = 1600;

/** Photos et primer d'une annonce (colonnes absentes tant que le schéma n'est pas à jour). */
export type ListingMedia = { photos: string[]; primer: string | null };

export const NO_MEDIA: ListingMedia = { photos: [], primer: null };

/** Ligne lue en base → médias propres (tolère les valeurs manquantes). */
export function mediaOf(row: { photos?: unknown; primer?: unknown } | null | undefined): ListingMedia {
  const photos = Array.isArray(row?.photos) ? row.photos.filter((p): p is string => typeof p === "string") : [];
  const primer = typeof row?.primer === "string" && row.primer.trim() !== "" ? row.primer : null;
  return { photos, primer };
}

/** Ce qui rend une annonce complète, du plus au moins rassurant pour un acheteur. */
export type CompletenessInput = {
  photos?: string[] | null;
  primer?: string | null;
  card_details?: unknown[] | null;
  archetype?: unknown;
  colors?: unknown[] | null;
};

const CHECKS: { key: string; todo: string; done: (l: CompletenessInput) => boolean }[] = [
  { key: "photos", todo: "ajoute des photos des cartes", done: (l) => (l.photos?.length ?? 0) > 0 },
  { key: "details", todo: "précise l'état et la langue carte par carte", done: (l) => (l.card_details?.length ?? 0) > 0 },
  { key: "archetype", todo: "choisis l'archétype", done: (l) => !!l.archetype },
  { key: "colors", todo: "indique les couleurs", done: (l) => (l.colors?.length ?? 0) > 0 },
  { key: "primer", todo: "écris un primer (comment jouer le deck)", done: (l) => !!l.primer?.trim() },
];

/** Complétude d'une annonce : pourcentage et ce qu'il reste à faire, dans l'ordre d'importance. */
export function completeness(l: CompletenessInput): { percent: number; todo: string[] } {
  const todo = CHECKS.filter((c) => !c.done(l)).map((c) => c.todo);
  return { percent: Math.round(((CHECKS.length - todo.length) / CHECKS.length) * 100), todo };
}
