"use server";

import { getUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getUnseenBadges } from "@/lib/badges-server";
import type { EarnedBadge } from "@/lib/badges";

/** Badges débloqués non encore vus par le membre connecté (vide si personne n'est connecté). */
export async function fetchUnseenBadges(): Promise<EarnedBadge[]> {
  const user = await getUser();
  if (!user) return [];
  return getUnseenBadges(user.id);
}

/** Marque un badge comme vu (l'animation ne se rejoue pas). Seulement pour le membre connecté. */
export async function markBadgeSeen(badge: string): Promise<void> {
  const user = await getUser();
  if (!user || typeof badge !== "string" || badge.length > 40) return;
  await getSupabaseAdmin()
    .from("user_badges")
    .update({ seen_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("badge", badge)
    .is("seen_at", null);
}
