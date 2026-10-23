import "server-only";
import { cache } from "react";
import { getUser } from "./auth.ts";
import { createSupabaseServer } from "./supabase-auth.ts";
import type { ListingStatus, ManaColor } from "./listings.ts";

// Favoris du membre connecté, lus en son nom (RLS et fonctions SQL), jamais avec la clé secrète.

/** Une annonce suivie, avec son statut actuel (renvoyée par list_favorites). */
export type Favorite = {
  listing_id: string;
  title: string;
  status: ListingStatus;
  asking_cents: number;
  estimated_cents: number;
  card_count: number;
  colors: ManaColor[];
  cover_card_name: string | null;
  cover_image_url: string | null;
  archetype_name: string | null;
  seller_id: string;
  seller_name: string;
  seller_avatar_url: string | null;
  favorited_at: string;
};

/** État d'une étoile sur une annonce : enregistrée, à enregistrer, à la connexion, ou rien (sa propre annonce). */
export type FavoriteState = "saved" | "unsaved" | "login" | undefined;

/** Membre connecté et identifiants de ses favoris ; null si personne n'est connecté. */
export const getFavoriteIds = cache(async (): Promise<{ userId: string; ids: Set<string> } | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("favorites").select("listing_id").eq("user_id", user.id).limit(500);
  if (error) console.error("Favoris : lecture impossible", error.message);
  return { userId: user.id, ids: new Set((data ?? []).map((f) => f.listing_id as string)) };
});

/** État de l'étoile d'une annonce pour le visiteur, à partir de getFavoriteIds(). */
export function favoriteStateOf(
  favorites: { userId: string; ids: Set<string> } | null,
  listing: { id: string; seller: { id: string } | null },
): FavoriteState {
  if (!favorites) return "login";
  if (listing.seller?.id === favorites.userId) return undefined;
  return favorites.ids.has(listing.id) ? "saved" : "unsaved";
}

/** Favoris du membre connecté, le plus récent d'abord. Null si la lecture échoue. */
export async function listFavorites(): Promise<Favorite[] | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("list_favorites");
  if (error) {
    console.error("Favoris : lecture impossible", error.message);
    return null;
  }
  return (data ?? []) as Favorite[];
}
