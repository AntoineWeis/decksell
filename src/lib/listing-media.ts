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
