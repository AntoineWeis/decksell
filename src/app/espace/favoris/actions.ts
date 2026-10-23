"use server";

import { refresh } from "next/cache";
import { getUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { isUuid } from "@/lib/messaging-shared";

export type FavoriteResult = { status: "ok" } | { status: "error"; message: string };

const SQL_ERRORS: Record<string, string> = {
  not_authenticated: "Ta session a expiré. Reconnecte-toi.",
  listing_unavailable: "Cette annonce n'est plus en vente.",
  own_listing: "C'est ton annonce : tu ne peux pas la mettre en favori.",
  quota_favorites: "Tu as déjà 500 favoris. Retires-en quelques-uns pour en ajouter.",
};

/**
 * Enregistre ou retire une annonce des favoris. `refreshPage` recharge la page
 * (utile sur la liste des favoris, où l'annonce retirée doit disparaître).
 */
export async function setFavorite(listingId: string, saved: boolean, refreshPage = false): Promise<FavoriteResult> {
  const user = await getUser();
  if (!user) return { status: "error", message: SQL_ERRORS.not_authenticated };
  if (!isUuid(listingId)) return { status: "error", message: SQL_ERRORS.listing_unavailable };

  const supabase = await createSupabaseServer();
  const { error } = saved
    ? await supabase.rpc("add_favorite", { p_listing_id: listingId })
    : await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId);
  if (error) {
    const code = Object.keys(SQL_ERRORS).find((k) => error.message.includes(k));
    if (code) return { status: "error", message: SQL_ERRORS[code] };
    console.error("Favoris : enregistrement impossible", error.message);
    return { status: "error", message: "Enregistrement impossible. Réessaie." };
  }
  if (refreshPage) refresh();
  return { status: "ok" };
}
