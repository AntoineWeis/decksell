import { favoriteStateOf, getFavoriteIds } from "@/lib/favorites";
import { FavoriteButton } from "./favorite-button";

/** Bouton favori sous le prix d'une annonce (rien sur sa propre annonce). */
export async function DeckFavorite({ listingId, sellerId }: { listingId: string; sellerId: string | null }) {
  const state = favoriteStateOf(await getFavoriteIds(), { id: listingId, seller: sellerId ? { id: sellerId } : null });
  if (!state) return null;
  return <FavoriteButton listingId={listingId} state={state} variant="full" />;
}
