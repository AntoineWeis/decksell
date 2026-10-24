import "server-only";
import { cache } from "react";
import { getSupabaseAdmin } from "./supabase-server.ts";
import { refreshBadges } from "./badge-stats.ts";
import type { EarnedBadge } from "./badges.ts";

/** Recalcule les badges d'un membre (clé secrète). Ne lève jamais : un badge ne bloque pas une action. */
export async function refreshUserBadges(userId: string): Promise<void> {
  try {
    await refreshBadges(getSupabaseAdmin(), userId);
  } catch (e) {
    console.error("Badges : recalcul impossible", e);
  }
}

/** Badges d'un membre, pour l'afficher (vendeur d'une annonce, page publique). */
export const getUserBadges = cache(async function getUserBadges(userId: string): Promise<EarnedBadge[]> {
  const { data, error } = await getSupabaseAdmin().from("user_badges").select("badge, level").eq("user_id", userId);
  if (error) return []; // table absente (schéma pas encore à jour)
  return (data ?? []).map((b) => ({ key: b.badge, level: b.level }));
});

/** Badges débloqués que le membre n'a pas encore vus (animation), du plus ancien au plus récent. */
export async function getUnseenBadges(userId: string): Promise<EarnedBadge[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("user_badges")
    .select("badge, level")
    .eq("user_id", userId)
    .is("seen_at", null)
    .order("earned_at");
  if (error) return [];
  return (data ?? []).map((b) => ({ key: b.badge, level: b.level }));
}
